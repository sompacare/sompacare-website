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
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ClinicalRole, ShiftType } from "@sompacare/database";

export class CreateShiftDto {
  @ApiProperty()
  @IsString()
  facilityId!: string;

  @ApiProperty()
  @IsString()
  locationId!: string;

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

  @ApiProperty()
  @IsNumber()
  @Min(0)
  hourlyRate!: number;

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

export class ShiftQueryDto {
  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class ApplyShiftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
