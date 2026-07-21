import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CLINICAL_ROLES, type ClinicalRoleValue } from "@sompacare/shared";
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class QuickInviteWorkerDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: CLINICAL_ROLES, default: "RN" })
  @IsOptional()
  @IsIn([...CLINICAL_ROLES])
  clinicalRole?: ClinicalRoleValue;
}

export class CreateWorkerEmployeeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: CLINICAL_ROLES })
  @IsIn([...CLINICAL_ROLES])
  clinicalRole!: ClinicalRoleValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  licenseState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
