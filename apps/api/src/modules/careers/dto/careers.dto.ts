import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";

export class IngestCareerApplicationDto {
  @ApiProperty({ description: "Supabase careers application UUID" })
  @IsUUID()
  applicationId!: string;

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

  @ApiProperty({ description: "Careers page position id (cna, rn, etc.)" })
  @IsString()
  position!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionLabel?: string;

  @ApiPropertyOptional({ description: "Supabase storage path (resumes/...)" })
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional({ description: "Original resume file name" })
  @IsOptional()
  @IsString()
  resumeFileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ description: "Worker referral code from ?ref=" })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class HireCareerApplicationDto {
  @ApiProperty({ description: "Supabase careers application UUID" })
  @IsUUID()
  applicationId!: string;
}

export class PlaceCareerApplicationDto {
  @ApiProperty({ description: "Supabase careers application UUID" })
  @IsUUID()
  applicationId!: string;
}
