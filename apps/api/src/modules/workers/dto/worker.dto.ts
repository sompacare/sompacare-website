import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ClinicalRole, ShiftType } from "@sompacare/database";

export class UpdateWorkerProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ enum: ClinicalRole })
  @IsOptional()
  @IsEnum(ClinicalRole)
  clinicalRole?: ClinicalRole;

  @ApiPropertyOptional({ type: [String], enum: ShiftType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ShiftType, { each: true })
  preferredShiftTypes?: ShiftType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minHourlyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxTravelMiles?: number;
}
