import { Body, Controller, Get, Module, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsObject, Min, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RequirePermissions } from "../../common/decorators";
import { RoleRatesService } from "./role-rates.service";

class RoleRateDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  payRate!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  billRate!: number;
}

class UpdateRoleRatesDto {
  @ApiProperty({ type: Object })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RoleRateDto)
  rates!: Record<string, RoleRateDto>;
}

@ApiTags("platform")
@ApiBearerAuth()
@Controller({ path: "platform", version: "1" })
export class PlatformController {
  constructor(private roleRates: RoleRatesService) {}

  @Get("role-rates")
  @RequirePermissions("facilities:read", "shifts:read", "admin:dashboard")
  @ApiOperation({ summary: "Platform default pay and bill rates by clinical role" })
  getRoleRates() {
    return this.roleRates.getAll().then((rates) => ({ data: rates }));
  }

  @Patch("role-rates")
  @RequirePermissions("admin:dashboard")
  @ApiOperation({ summary: "Update platform default role rates (command center)" })
  updateRoleRates(@Body() dto: UpdateRoleRatesDto) {
    return this.roleRates.updateAll(dto.rates).then((rates) => ({ data: rates }));
  }
}

@Module({
  controllers: [PlatformController],
  providers: [RoleRatesService],
  exports: [RoleRatesService],
})
export class PlatformModule {}
