import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ApplicationStatus } from "@sompacare/database";
import { PaginationQueryDto } from "../../../common/decorators";

export class ApplicationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

export class RejectApplicationDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  reason!: string;
}
