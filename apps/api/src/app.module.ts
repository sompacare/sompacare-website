import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditModule } from "./common/audit/audit.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { FacilitiesModule } from "./modules/facilities/facilities.module";
import { ShiftsModule } from "./modules/shifts/shifts.module";
import { ApplicationsModule } from "./modules/applications/applications.module";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { WorkersModule } from "./modules/workers/workers.module";
import { TimekeepingModule } from "./modules/timekeeping/timekeeping.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { RecruitersModule } from "./modules/recruiters/recruiters.module";
import { CareersModule } from "./modules/careers/careers.module";
import { StorageModule } from "./common/storage/storage.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { JobPostingsModule } from "./modules/job-postings/job-postings.module";
import { AiModule } from "./modules/ai/ai.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { AdminModule } from "./modules/admin/admin.module";
import { MobileModule } from "./modules/mobile/mobile.module";
import { ObservabilityModule } from "./modules/observability/observability.module";
import { TenantModule } from "./common/tenant/tenant.module";
import { GeocodingModule } from "./common/geocoding/geocoding.module";
import { LegalModule } from "./modules/legal/legal.module";
import { FacilityOnboardingModule } from "./modules/facility-onboarding/facility-onboarding.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), ".env"),
        join(process.cwd(), "../../.env"),
        join(process.cwd(), ".env.platform"),
        join(process.cwd(), "../../.env.platform"),
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const loadTest = config.get("LOAD_TEST_MODE", "false") === "true";
        return [
          { name: "default", ttl: 60000, limit: loadTest ? 100_000 : 100 },
          { name: "public", ttl: 60000, limit: loadTest ? 10_000 : 20 },
        ];
      },
    }),
    PrismaModule,
    AuditModule,
    TenantModule,
    GeocodingModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    FacilitiesModule,
    ComplianceModule,
    LegalModule,
    FacilityOnboardingModule,
    ShiftsModule,
    ApplicationsModule,
    AssignmentsModule,
    WorkersModule,
    TimekeepingModule,
    NotificationsModule,
    PaymentsModule,
    WalletModule,
    InvoicesModule,
    PayrollModule,
    RecruitersModule,
    CareersModule,
    StorageModule,
    ReferralsModule,
    JobPostingsModule,
    AiModule,
    RealtimeModule,
    JobsModule,
    AdminModule,
    MobileModule,
    ObservabilityModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
