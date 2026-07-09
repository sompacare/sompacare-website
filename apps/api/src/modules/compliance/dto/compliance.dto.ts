import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { PaginationQueryDto } from "../../../common/decorators";

export class ComplianceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AlertsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;
}

export class SubmitLicenseDto {
  @ApiProperty({ example: "RN" })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  type!: string;

  @ApiProperty({ example: "RN-MD-987654" })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  number!: string;

  @ApiProperty({ example: "MD" })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state!: string;

  @ApiProperty({ example: "2027-12-31T00:00:00.000Z" })
  @IsDateString()
  expiresAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({ description: "URL to uploaded license document" })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class SubmitCertificationDto {
  @ApiProperty({ example: "BLS/CPR" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "American Heart Association" })
  @IsOptional()
  @IsString()
  issuer?: string;

  @ApiPropertyOptional({ example: "2027-06-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class VerifyCredentialDto {
  @ApiProperty({ enum: ["approve", "reject"] })
  @IsIn(["approve", "reject"])
  action!: "approve" | "reject";

  @ApiPropertyOptional({ description: "Reason when rejecting" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
