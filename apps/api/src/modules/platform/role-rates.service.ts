import { Injectable, OnModuleInit } from "@nestjs/common";
import { ShiftStatus, ClinicalRole } from "@sompacare/database";
import {
  ROLE_STANDARD_RATES,
  type RoleRateMap,
  normalizeRoleRateMap,
} from "@sompacare/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
export const PLATFORM_ROLE_RATES_KEY = "platform_role_rates";

@Injectable()
export class RoleRatesService implements OnModuleInit {
  private cache: RoleRateMap | null = null;
  private cacheAt = 0;
  private readonly cacheTtlMs = 30_000;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeed();
    } catch (err) {
      console.warn("Platform role rates seed skipped:", err);
    }
  }

  async ensureSeed() {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: PLATFORM_ROLE_RATES_KEY },
    });
    if (!existing) {
      await this.prisma.featureFlag.create({
        data: {
          key: PLATFORM_ROLE_RATES_KEY,
          description: "Platform-wide clinician pay and facility bill rates by role",
          isEnabled: true,
          rules: ROLE_STANDARD_RATES,
        },
      });
    }
  }

  async getAll(force = false): Promise<RoleRateMap> {
    const now = Date.now();
    if (!force && this.cache && now - this.cacheAt < this.cacheTtlMs) {
      return this.cache;
    }

    await this.ensureSeed();
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: PLATFORM_ROLE_RATES_KEY },
    });

    const rates = normalizeRoleRateMap(flag?.rules);
    this.cache = rates;
    this.cacheAt = now;
    return rates;
  }

  async getForRole(role: string) {
    const all = await this.getAll();
    return all[role] ?? all.CNA;
  }

  async updateAll(rates: RoleRateMap) {
    const normalized = normalizeRoleRateMap(rates);
    await this.ensureSeed();
    await this.prisma.featureFlag.update({
      where: { key: PLATFORM_ROLE_RATES_KEY },
      data: { rules: normalized, isEnabled: true },
    });
    this.cache = normalized;
    this.cacheAt = Date.now();

    await Promise.all(
      Object.entries(normalized).map(([role, rate]) => {
        if (!(role in ClinicalRole)) return Promise.resolve({ count: 0 });
        return this.prisma.shift.updateMany({
          where: { role: role as ClinicalRole, status: ShiftStatus.PUBLISHED },
          data: {
            payRate: rate.payRate,
            billRate: rate.billRate,
            hourlyRate: rate.payRate,
          },
        });
      })
    );

    return normalized;
  }
  clearCache() {
    this.cache = null;
    this.cacheAt = 0;
  }
}
