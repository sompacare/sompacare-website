import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClerkClient } from "@clerk/backend";
import { UserStatus } from "@sompacare/database";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService
  ) {}

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        deletedAt: status === UserStatus.INACTIVE ? new Date() : null,
      },
      include: { roles: { include: { role: true } }, profile: true },
    });

    await this.syncClerkAccess(user.clerkId, status);

    await this.audit.log({
      userId: id,
      action: status === UserStatus.ACTIVE ? "user.reactivated" : "user.terminated",
      entityType: "User",
      entityId: id,
      changes: { status },
    });

    return { data: updated };
  }

  private async syncClerkAccess(clerkId: string, status: UserStatus) {
    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) {
      this.logger.warn("CLERK_SECRET_KEY missing — skipping Clerk ban/unban");
      return;
    }

    try {
      const clerk = createClerkClient({ secretKey });
      if (status === UserStatus.ACTIVE) {
        await clerk.users.unbanUser(clerkId);
      } else if (status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED) {
        await clerk.users.banUser(clerkId);
      }
    } catch (error) {
      this.logger.warn(
        `Clerk access sync failed for ${clerkId}: ${(error as Error).message}`
      );
    }
  }
}
