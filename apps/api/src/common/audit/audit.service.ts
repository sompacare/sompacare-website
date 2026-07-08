import { Injectable } from "@nestjs/common";
import { Prisma } from "@sompacare/database";
import { PrismaService } from "../prisma/prisma.module";

export type AuditLogInput = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}
