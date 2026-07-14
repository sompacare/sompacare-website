import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ReferralStatus, TransactionType } from "@sompacare/database";
import {
  DEFAULT_REFERRAL_BONUS,
  buildCareersReferralUrl,
  buildReferralCode,
  normalizeReferralCode,
} from "@sompacare/shared";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class ReferralsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private wallet: WalletService
  ) {}

  async getOrCreateReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    if (user.referralCode) {
      return this.buildReferralSummary(user);
    }

    let code = buildReferralCode(user.firstName, user.lastName, user.id);
    let attempt = 0;
    while (attempt < 5) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
        });
        return this.buildReferralSummary(updated);
      } catch {
        attempt += 1;
        code = buildReferralCode(user.firstName, user.lastName, `${user.id}${attempt}`);
      }
    }
    throw new BadRequestException("Could not generate referral code");
  }

  async validateCode(code: string) {
    const normalized = normalizeReferralCode(code);
    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: normalized },
      select: { id: true, firstName: true, lastName: true, referralCode: true },
    });
    if (!referrer) return { valid: false };
    return {
      valid: true,
      referrerName: `${referrer.firstName} ${referrer.lastName}`.trim(),
      code: referrer.referralCode,
    };
  }

  async listMine(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        referee: { select: { id: true, firstName: true, lastName: true, email: true } },
        candidate: { select: { id: true, stage: true, clinicalRole: true } },
      },
    });

    const summary = await this.getOrCreateReferralCode(userId);
    return { ...summary, referrals };
  }

  async invite(userId: string, email: string) {
    const summary = await this.getOrCreateReferralCode(userId);
    const refereeEmail = email.trim().toLowerCase();

    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId, refereeEmail },
    });
    if (existing) {
      return { referral: existing, created: false, ...summary };
    }

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: userId,
        refereeEmail,
        referralCode: summary.code,
        bonusAmount: DEFAULT_REFERRAL_BONUS,
      },
    });

    const careersUrl = buildCareersReferralUrl(
      this.config.get("SITE_URL") ?? "https://sompacare.com",
      summary.code
    );

    void this.notifications.notifyUser({
      userId,
      email: refereeEmail,
      title: "You're invited to join Sompacare",
      body: `${summary.referrerName} invited you to apply for healthcare shifts at Sompacare. Use their referral link when you apply.`,
      data: { type: "referral.invite", url: careersUrl, referralCode: summary.code },
    });

    await this.audit.log({
      userId,
      action: "referral.invited",
      entityType: "Referral",
      entityId: referral.id,
    });

    return { referral, created: true, ...summary, careersUrl };
  }

  async recordFromCareers(input: {
    referralCode: string;
    refereeEmail: string;
    candidateId: string;
  }) {
    const normalized = normalizeReferralCode(input.referralCode);
    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: normalized },
    });
    if (!referrer) return { recorded: false, reason: "invalid_code" as const };

    const refereeEmail = input.refereeEmail.trim().toLowerCase();
    if (referrer.email.toLowerCase() === refereeEmail) {
      return { recorded: false, reason: "self_referral" as const };
    }

    const existing = await this.prisma.referral.findFirst({
      where: {
        OR: [
          { candidateId: input.candidateId },
          { referrerId: referrer.id, refereeEmail },
        ],
      },
    });
    if (existing) return { recorded: false, referral: existing, reason: "duplicate" as const };

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeEmail,
        referralCode: normalized,
        candidateId: input.candidateId,
        bonusAmount: DEFAULT_REFERRAL_BONUS,
      },
    });

    await this.prisma.candidate.update({
      where: { id: input.candidateId },
      data: { referralCode: normalized },
    });

    return { recorded: true, referral };
  }

  async linkReferee(refereeId: string, email: string) {
    const refereeEmail = email.trim().toLowerCase();
    const referral = await this.prisma.referral.findFirst({
      where: {
        refereeEmail: { equals: refereeEmail, mode: "insensitive" },
        refereeId: null,
        status: ReferralStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!referral) return { linked: false };

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { refereeId },
    });

    return { linked: true, referralId: referral.id };
  }

  /** Qualify + pay bonus after referee completes their first shift */
  async qualifyOnFirstShift(workerId: string) {
    const referral = await this.prisma.referral.findFirst({
      where: { refereeId: workerId, status: ReferralStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });
    if (!referral) return { qualified: false };

    const bonus = Number(referral.bonusAmount ?? DEFAULT_REFERRAL_BONUS);
    const updated = await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: ReferralStatus.QUALIFIED,
        qualifiedAt: new Date(),
      },
    });

    await this.wallet.creditReferralBonus(referral.referrerId, referral.id, bonus);

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { status: ReferralStatus.PAID, paidAt: new Date() },
    });

    void this.notifications.notifyUser({
      userId: referral.referrerId,
      title: "Referral bonus earned",
      body: `Your referral completed their first shift. $${bonus} was added to your wallet.`,
      data: { type: "referral.paid", referralId: referral.id, amount: bonus },
      sendEmail: false,
    });

    return { qualified: true, referral: updated, bonus };
  }

  private buildReferralSummary(user: {
    id: string;
    firstName: string;
    lastName: string;
    referralCode: string | null;
  }) {
    const siteUrl = this.config.get("SITE_URL") ?? "https://sompacare.com";
    const code = user.referralCode ?? "";
    return {
      code,
      referrerName: `${user.firstName} ${user.lastName}`.trim(),
      careersUrl: code ? buildCareersReferralUrl(siteUrl, code) : null,
      bonusAmount: DEFAULT_REFERRAL_BONUS,
    };
  }
}
