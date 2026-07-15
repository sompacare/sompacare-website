import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ClinicalRole, ShiftType } from "@sompacare/database";
import { PaginationQueryDto } from "../../../common/decorators";
import { FacilityLocationInputDto } from "../../facility-onboarding/dto/facility-onboarding.dto";

export class CreateShiftDto {
  @ApiProperty()
  @IsString()
  facilityId!: string;

  @ApiPropertyOptional({ description: "Existing location ID — omit when providing location inline" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: "Create a one-off visit location at post time (homecare / ad-hoc sites)",
    type: FacilityLocationInputDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FacilityLocationInputDto)
  location?: FacilityLocationInputDto;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ClinicalRole })
  @IsEnum(ClinicalRole)
  role!: ClinicalRole;

  @ApiProperty({ enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType!: ShiftType;

  @ApiPropertyOptional({ description: "Facility bill rate (defaults by role when omitted)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  billRate?: number;

  @ApiPropertyOptional({ description: "Clinician pay rate — internal/admin only; facilities use billRate" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  payRate?: number;

  @ApiPropertyOptional({ description: "Legacy alias for payRate" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bonusRate?: number;

  @ApiProperty()
  @IsDateString()
  startTime!: string;

  @ApiProperty()
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  slotsTotal?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;
}

export class UpdateShiftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  payRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  billRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

export class ShiftQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ClinicalRole })
  @IsOptional()
  @IsEnum(ClinicalRole)
  role?: ClinicalRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;
}

export class ApplyShiftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
