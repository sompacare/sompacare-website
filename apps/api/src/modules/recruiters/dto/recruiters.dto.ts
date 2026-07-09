import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { CandidatePipelineStage, ClinicalRole } from "@sompacare/database";
import { PaginationQueryDto } from "../../../common/decorators";

export class CandidateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CandidatePipelineStage })
  @IsOptional()
  @IsEnum(CandidatePipelineStage)
  stage?: CandidatePipelineStage;
}

export class CreateCandidateDto {
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

  @ApiProperty({ enum: ClinicalRole })
  @IsEnum(ClinicalRole)
  clinicalRole!: ClinicalRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;
}

export class UpdateCandidateStageDto {
  @ApiProperty({ enum: CandidatePipelineStage })
  @IsEnum(CandidatePipelineStage)
  stage!: CandidatePipelineStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ScheduleInterviewDto {
  @ApiProperty()
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ enum: ["video", "phone", "in_person"] })
  @IsOptional()
  @IsIn(["video", "phone", "in_person"])
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SendOfferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class ParseResumeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resumeText?: string;
}

export class UpdateChecklistDto {
  @ApiProperty()
  @IsIn(["pending", "in_progress", "cleared", "failed"])
  backgroundCheckStatus!: string;

  @ApiProperty()
  @IsIn(["pending", "in_progress", "cleared", "failed"])
  referenceStatus!: string;
}
