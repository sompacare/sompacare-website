import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60000, limit: 100 },
      { name: "public", ttl: 60000, limit: 20 },
    ]),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    FacilitiesModule,
    ComplianceModule,
    ShiftsModule,
    ApplicationsModule,
    AssignmentsModule,
    WorkersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
