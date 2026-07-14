import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ClinicalRole, JobPostingStatus } from "@sompacare/database";
import { PaginationQueryDto } from "../../../common/decorators";

export class JobPostingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: JobPostingStatus })
  @IsOptional()
  @IsEnum(JobPostingStatus)
  status?: JobPostingStatus;
}

export class CreateJobPostingDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  employment!: string;

  @ApiProperty()
  @IsString()
  locations!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  requirements!: string[];

  @ApiProperty({ enum: ClinicalRole })
  @IsEnum(ClinicalRole)
  clinicalRole!: ClinicalRole;
}

export class UpdateJobPostingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ enum: ClinicalRole })
  @IsOptional()
  @IsEnum(ClinicalRole)
  clinicalRole?: ClinicalRole;

  @ApiPropertyOptional({ enum: JobPostingStatus })
  @IsOptional()
  @IsEnum(JobPostingStatus)
  status?: JobPostingStatus;
}
