import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AssignmentStatus,
  ClockEventType,
  ShiftStatus,
  TimecardStatus,
} from "@sompacare/database";
import { calculateTimecardTotals, isWithinGeofence } from "@sompacare/shared";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { ReferralsService } from "../referrals/referrals.service";
import { ClockLocationDto } from "./dto/clock.dto";

const CLOCK_WINDOW_MS = 30 * 60 * 1000; // 30 min before shift start

@Injectable()
export class TimekeepingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
    private referrals: ReferralsService
  ) {}

  private async getAssignmentForWorker(id: string, workerId: string) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id },
      include: {
        shift: {
          include: {
            facility: true,
            location: true,
          },
        },
        clockEvents: { orderBy: { timestamp: "asc" } },
        timecard: true,
      },
    });

    if (!assignment) throw new NotFoundException("Assignment not found");
    if (assignment.workerId !== workerId) {
      throw new ForbiddenException("Only the assigned worker can clock in/out");
    }
    return assignment;
  }

  private verifyGeofence(
    dto: ClockLocationDto,
    facilityLat: number,
    facilityLon: number,
    radiusMeters: number
  ): boolean {
    const devBypass = this.config.get("GEOFENCE_DEV_BYPASS", "true") === "true";
    if (devBypass) return true;

    const lat = Number(facilityLat);
    const lon = Number(facilityLon);
    return isWithinGeofence(dto.latitude, dto.longitude, lat, lon, radiusMeters);
  }

  private assertWithinShiftWindow(startTime: Date, endTime: Date) {
    const devBypass = this.config.get("GEOFENCE_DEV_BYPASS", "true") === "true";
    if (devBypass) return;

    const now = Date.now();
    const windowStart = startTime.getTime() - CLOCK_WINDOW_MS;
    const windowEnd = endTime.getTime() + CLOCK_WINDOW_MS;

    if (now < windowStart) {
      throw new BadRequestException("Too early to clock in for this shift");
    }
    if (now > windowEnd) {
      throw new BadRequestException("Shift window has ended");
    }
  }

  async clockIn(assignmentId: string, workerId: string, dto: ClockLocationDto) {
    const assignment = await this.getAssignmentForWorker(assignmentId, workerId);

    if (assignment.status !== AssignmentStatus.CONFIRMED) {
      throw new BadRequestException("Assignment must be confirmed before clock-in");
    }

    const existingIn = assignment.clockEvents.find((e) => e.type === ClockEventType.CLOCK_IN);
    if (existingIn) {
      throw new BadRequestException("Already clocked in for this shift");
    }

    const location = assignment.shift.location;
    if (!location?.latitude || !location?.longitude) {
      throw new BadRequestException("Shift location is missing GPS coordinates");
    }

    this.assertWithinShiftWindow(assignment.shift.startTime, assignment.shift.endTime);

    const verified = this.verifyGeofence(
      dto,
      Number(location.latitude),
      Number(location.longitude),
      location.geofenceRadiusMeters
    );

    if (!verified) {
      throw new BadRequestException(
        "You must be at the facility to clock in. Move closer and try again."
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.clockEvent.create({
        data: {
          assignmentId,
          workerId,
          type: ClockEventType.CLOCK_IN,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracyMeters: dto.accuracyMeters,
          isVerified: verified,
        },
      });

      const updatedAssignment = await tx.shiftAssignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.CHECKED_IN },
        include: {
          shift: { include: { facility: true, location: true } },
        },
      });

      await tx.shift.update({
        where: { id: assignment.shiftId },
        data: { status: ShiftStatus.IN_PROGRESS },
      });

      return { event, assignment: updatedAssignment };
    });

    await this.audit.log({
      userId: workerId,
      action: "clock.in",
      entityType: "ShiftAssignment",
      entityId: assignmentId,
      changes: { verified, latitude: dto.latitude, longitude: dto.longitude },
    });

    return result;
  }

  async clockOut(assignmentId: string, workerId: string, dto: ClockLocationDto) {
    const assignment = await this.getAssignmentForWorker(assignmentId, workerId);

    if (
      assignment.status !== AssignmentStatus.CHECKED_IN &&
      assignment.status !== AssignmentStatus.IN_PROGRESS
    ) {
      throw new BadRequestException("Must clock in before clocking out");
    }

    const clockIn = assignment.clockEvents.find((e) => e.type === ClockEventType.CLOCK_IN);
    if (!clockIn) {
      throw new BadRequestException("No clock-in event found");
    }

    const existingOut = assignment.clockEvents.find((e) => e.type === ClockEventType.CLOCK_OUT);
    if (existingOut) {
      throw new BadRequestException("Already clocked out for this shift");
    }

    const location = assignment.shift.location;
    const verified = this.verifyGeofence(
      dto,
      Number(location.latitude),
      Number(location.longitude),
      location.geofenceRadiusMeters
    );

    const clockOutTime = new Date();
    const msWorked = clockOutTime.getTime() - clockIn.timestamp.getTime();
    const breakMinutes = assignment.shift.breakMinutes ?? 0;
    const workedHours = Math.max(0, msWorked / 3_600_000 - breakMinutes / 60);
    const payRate = Number(assignment.shift.payRate ?? assignment.shift.hourlyRate);
    const billRate = Number(assignment.shift.billRate ?? assignment.shift.hourlyRate);
    const totals = calculateTimecardTotals(workedHours, payRate, billRate);

    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.clockEvent.create({
        data: {
          assignmentId,
          workerId,
          type: ClockEventType.CLOCK_OUT,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracyMeters: dto.accuracyMeters,
          isVerified: verified,
          timestamp: clockOutTime,
        },
      });

      const updatedAssignment = await tx.shiftAssignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.COMPLETED },
        include: {
          shift: { include: { facility: true, location: true } },
        },
      });

      const timecard = await tx.timecard.upsert({
        where: { assignmentId },
        update: {
          regularHours: totals.regularHours,
          overtimeHours: totals.overtimeHours,
          breakMinutes,
          payRate,
          billRate,
          hourlyRate: payRate,
          grossAmount: totals.grossAmount,
          billAmount: totals.billAmount,
          status: TimecardStatus.SUBMITTED,
        },
        create: {
          assignmentId,
          workerId,
          regularHours: totals.regularHours,
          overtimeHours: totals.overtimeHours,
          breakMinutes,
          payRate,
          billRate,
          hourlyRate: payRate,
          grossAmount: totals.grossAmount,
          billAmount: totals.billAmount,
          status: TimecardStatus.SUBMITTED,
        },
      });

      await tx.shift.update({
        where: { id: assignment.shiftId },
        data: { status: ShiftStatus.COMPLETED },
      });

      return { event, assignment: updatedAssignment, timecard };
    });

    await this.audit.log({
      userId: workerId,
      action: "clock.out",
      entityType: "ShiftAssignment",
      entityId: assignmentId,
      changes: {
        regularHours: totals.regularHours,
        overtimeHours: totals.overtimeHours,
        grossAmount: totals.grossAmount,
        billAmount: totals.billAmount,
      },
    });

    void this.referrals.qualifyOnFirstShift(workerId);

    return result;
  }
}
