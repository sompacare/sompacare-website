import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuditModule } from "../../common/audit/audit.module";
import { CareersModule } from "../careers/careers.module";
import { FacilityOnboardingModule } from "../facility-onboarding/facility-onboarding.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    ConfigModule,
    AuditModule,
    forwardRef(() => CareersModule),
    forwardRef(() => FacilityOnboardingModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
