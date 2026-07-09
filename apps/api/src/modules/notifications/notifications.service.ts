import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
  UserStatus,
} from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";
import { RealtimeService } from "../realtime/realtime.service";
import { PushService } from "./push.service";
import { SmsService } from "./sms.service";
import type { ReminderJobData } from "../jobs/jobs.service";

type NotifyInput = {
  userId: string;
  title: string;
  body: string;
  email?: string;
  phone?: string;
  data?: Prisma.InputJsonValue;
  sendEmail?: boolean;
  sendSms?: boolean;
  sendPush?: boolean;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private realtime: RealtimeService,
    private sms: SmsService,
    private push: PushService
  ) {}

  async findForUser(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId, channel: NotificationChannel.IN_APP },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: { not: NotificationStatus.READ },
      },
    });
    return { count };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: { not: NotificationStatus.READ },
      },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) return null;

    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async getOrgFacilityManagers(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationMembers: { some: { organizationId } },
        roles: { some: { role: { name: "FACILITY_MANAGER" } } },
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  async deliverReminder(data: ReminderJobData) {
    await this.notify({
      userId: data.userId,
      email: data.email,
      title: data.title,
      body: data.body,
      data: data.data as Prisma.InputJsonValue,
    });

    if (data.sendSms && data.phone) {
      await this.sms.sendSms(data.phone, `${data.title}: ${data.body}`);
    }
    if (data.sendPush) {
      await this.push.sendPush(data.userId, data.title, data.body);
    }
  }

  async notifyUrgentShift(shift: {
    id: string;
    title: string;
    facility: { id: string; name: string };
    role: string;
    startTime: Date;
  }) {
    const workers = await this.prisma.user.findMany({
      where: {
        profile: { clinicalRole: shift.role as never },
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true, phone: true },
      take: 50,
    });

    const nurseUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");

    await Promise.all(
      workers.map((worker) =>
        this.notify({
          userId: worker.id,
          email: worker.email,
          title: "Urgent shift available",
          body: `${shift.title} at ${shift.facility.name} needs coverage ASAP.`,
          data: {
            type: "shift.urgent",
            shiftId: shift.id,
            url: `${nurseUrl}/shifts`,
          },
          sendSms: true,
          phone: worker.phone ?? undefined,
          sendPush: true,
        })
      )
    );
  }

  async notifyApplicationReceived(
    application: {
      id: string;
      applicant: { firstName: string; lastName: string };
      shift: {
        id: string;
        title: string;
        facility: { name: string; organizationId: string };
      };
    }
  ) {
    const managers = await this.getOrgFacilityManagers(
      application.shift.facility.organizationId
    );
    const facilityUrl = this.config.get("FACILITY_PORTAL_URL", "http://localhost:3002");
    const applicantName = `${application.applicant.firstName} ${application.applicant.lastName}`;

    await Promise.all(
      managers.map((manager) =>
        this.notify({
          userId: manager.id,
          email: manager.email,
          title: "New shift application",
          body: `${applicantName} applied for ${application.shift.title} at ${application.shift.facility.name}.`,
          data: {
            type: "application.received",
            applicationId: application.id,
            shiftId: application.shift.id,
            url: `${facilityUrl}/shifts/${application.shift.id}`,
          },
        })
      )
    );
  }

  async notifyApplicationApproved(
    application: {
      id: string;
      applicantId: string;
      applicant: { email: string; firstName: string };
      shift: { id: string; title: string; facility: { name: string } };
    },
    assignmentId: string
  ) {
    const nurseUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");

    await this.notify({
      userId: application.applicantId,
      email: application.applicant.email,
      title: "You were approved for a shift",
      body: `You're approved for ${application.shift.title} at ${application.shift.facility.name}. Confirm your assignment in the app.`,
      data: {
        type: "application.approved",
        applicationId: application.id,
        assignmentId,
        shiftId: application.shift.id,
        url: `${nurseUrl}/assignments`,
      },
    });
  }

  async notifyTimecardApproved(
    workerId: string,
    email: string,
    amount: number,
    shiftTitle: string,
    timecardId: string
  ) {
    const nurseUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");
    await this.notify({
      userId: workerId,
      email,
      title: "Timecard approved",
      body: `Your ${shiftTitle} timecard ($${amount.toFixed(2)}) was approved and is queued for the next pay run.`,
      data: {
        type: "timecard.approved",
        timecardId,
        amount,
        url: `${nurseUrl}/wallet`,
      },
    });
  }

  async notifyWalletCredited(
    workerId: string,
    email: string,
    amount: number,
    shiftTitle: string,
    timecardId: string
  ) {
    const nurseUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");
    await this.notify({
      userId: workerId,
      email,
      title: "Shift earnings added to wallet",
      body: `$${amount.toFixed(2)} from ${shiftTitle} is now in your wallet.`,
      data: {
        type: "wallet.credited",
        timecardId,
        amount,
        url: `${nurseUrl}/wallet`,
      },
    });
  }

  async notifyComplianceExpiring(
    workerId: string,
    email: string | null | undefined,
    credentialName: string,
    daysRemaining: number,
    entityId: string
  ) {
    const nurseUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");
    await this.notify({
      userId: workerId,
      email: email ?? undefined,
      title: "Credential expiring soon",
      body: `Your ${credentialName} expires in ${daysRemaining} day(s). Upload a renewal to stay eligible for shifts.`,
      data: {
        type: "compliance.expiring",
        entityId,
        daysRemaining,
        url: `${nurseUrl}/credentials`,
      },
    });
  }

  async notifyComplianceRejected(
    workerId: string,
    email: string | null | undefined,
    credentialName: string,
    reason?: string
  ) {
    const nurseUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");
    await this.notify({
      userId: workerId,
      email: email ?? undefined,
      title: "Credential verification failed",
      body: reason
        ? `Your ${credentialName} was not approved: ${reason}`
        : `Your ${credentialName} was not approved. Please resubmit with updated documentation.`,
      data: {
        type: "compliance.rejected",
        url: `${nurseUrl}/credentials`,
      },
    });
  }

  async notifyInterviewScheduled(
    recruiterId: string,
    email: string,
    candidateName: string,
    scheduledAt: string,
    candidateId: string
  ) {
    await this.notify({
      userId: recruiterId,
      email,
      title: "Interview scheduled",
      body: `Interview scheduled for ${candidateName} on ${new Date(scheduledAt).toLocaleString()}.`,
      data: { type: "recruiter.interview_scheduled", candidateId },
    });
  }

  async notifyOfferSent(
    recruiterId: string,
    email: string,
    candidateName: string,
    candidateId: string
  ) {
    await this.notify({
      userId: recruiterId,
      email,
      title: "Offer sent",
      body: `Offer letter sent to ${candidateName}.`,
      data: { type: "recruiter.offer_sent", candidateId },
    });
  }

  async notifyOnboardingPackage(
    recruiterId: string,
    email: string,
    candidateName: string,
    candidateId: string
  ) {
    await this.notify({
      userId: recruiterId,
      email,
      title: "Onboarding package sent",
      body: `Onboarding package sent to ${candidateName}.`,
      data: { type: "recruiter.onboarding_sent", candidateId },
    });
  }

  private async notify(input: NotifyInput) {
    const notification = await this.createInApp(input);

    if (input.sendEmail !== false && input.email) {
      void this.sendEmail(input.userId, input.email, input.title, input.body, input.data);
    }
    if (input.sendSms && input.phone) {
      void this.sms.sendSms(input.phone, `${input.title}: ${input.body}`);
    }
    if (input.sendPush) {
      void this.push.sendPush(input.userId, input.title, input.body);
    }

    return notification;
  }

  private async createInApp(input: NotifyInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: input.title,
        body: input.body,
        data: input.data,
        sentAt: new Date(),
      },
    });

    this.realtime.emitToUser(input.userId, "notification:new", {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  private async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
    data?: Prisma.InputJsonValue
  ) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    const from =
      this.config.get<string>("RESEND_FROM_EMAIL") ??
      "Sompacare <onboarding@resend.dev>";

    if (!apiKey) {
      this.logger.warn(`Email skipped (no RESEND_API_KEY): ${subject} → ${to}`);
      return;
    }

    const url =
      data && typeof data === "object" && data !== null && "url" in data
        ? String((data as { url: string }).url)
        : null;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a;margin:0 0 12px">${subject}</h2>
        <p style="color:#334155;line-height:1.5">${body}</p>
        ${url ? `<p><a href="${url}" style="color:#2563eb;font-weight:600">Open in Sompacare</a></p>` : ""}
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sompacare shift notifications</p>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, html, text: body }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.warn(`Resend failed (${res.status}): ${err}`);
        return;
      }

      await this.prisma.notification.create({
        data: {
          userId,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.SENT,
          title: subject,
          body,
          data,
          sentAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Email delivery error: ${(err as Error).message}`);
    }
  }
}
