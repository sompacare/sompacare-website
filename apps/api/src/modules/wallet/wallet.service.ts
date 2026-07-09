import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  TimecardStatus,
  TransactionType,
} from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async ensureWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    });
  }

  async getWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      updatedAt: wallet.updatedAt,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.ensureWallet(userId);
    const take = Math.min(limit, 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      data: data.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        balanceAfter: Number(tx.balanceAfter),
        description: tx.description,
        referenceId: tx.referenceId,
        createdAt: tx.createdAt,
      })),
      meta: { page, limit: take, total, totalPages: Math.ceil(total / take) },
    };
  }

  async creditFromPayRunEntry(
    workerId: string,
    amount: number,
    entryId: string,
    payRunId: string
  ) {
    if (amount <= 0) {
      return { alreadyCredited: true, newBalance: 0 };
    }

    const existing = await this.prisma.walletTransaction.findFirst({
      where: { referenceId: entryId, type: TransactionType.EARNING },
    });
    if (existing) return { alreadyCredited: true, transaction: existing };

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: workerId },
        update: {},
        create: { userId: workerId, balance: 0 },
      });

      const newBalance = Number(wallet.balance) + amount;

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.EARNING,
          amount,
          balanceAfter: newBalance,
          description: `Pay run ${payRunId.slice(-8)}`,
          referenceId: entryId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return { alreadyCredited: false, transaction, newBalance };
    });
  }

  async creditFromTimecard(timecardId: string) {
    const timecard = await this.prisma.timecard.findUnique({
      where: { id: timecardId },
      include: {
        assignment: {
          include: {
            shift: {
              include: {
                facility: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!timecard) throw new NotFoundException("Timecard not found");
    if (timecard.status !== TimecardStatus.APPROVED) {
      throw new BadRequestException("Timecard must be approved before crediting wallet");
    }

    const existing = await this.prisma.walletTransaction.findFirst({
      where: { referenceId: timecardId, type: TransactionType.EARNING },
    });
    if (existing) return { alreadyCredited: true, transaction: existing };

    const amount = Number(timecard.grossAmount);
    if (amount <= 0) {
      throw new BadRequestException("Timecard gross amount must be positive");
    }

    const shiftTitle = timecard.assignment.shift.title;
    const facilityName = timecard.assignment.shift.facility.name;

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: timecard.workerId },
        update: {},
        create: { userId: timecard.workerId, balance: 0 },
      });

      const newBalance = Number(wallet.balance) + amount;

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.EARNING,
          amount,
          balanceAfter: newBalance,
          description: `${shiftTitle} at ${facilityName}`,
          referenceId: timecardId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.timecard.update({
        where: { id: timecardId },
        data: { status: TimecardStatus.PAID },
      });

      return { alreadyCredited: false, transaction, newBalance };
    });
  }

  async instantPay(userId: string, amount: number, transferId?: string) {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile?.stripeOnboarded) {
      throw new BadRequestException("Complete Stripe payout setup before instant pay");
    }
    if (!profile.instantPayEnabled) {
      throw new BadRequestException("Instant pay is not enabled on your account");
    }

    const wallet = await this.ensureWallet(userId);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const newBalance = Number(current.balance) - amount;

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: current.id,
          type: TransactionType.INSTANT_PAY,
          amount: -amount,
          balanceAfter: newBalance,
          description: transferId
            ? `Instant payout (${transferId})`
            : "Instant payout",
          referenceId: transferId,
        },
      });

      await tx.wallet.update({
        where: { id: current.id },
        data: { balance: newBalance },
      });

      return { transaction, newBalance };
    });
  }
}
