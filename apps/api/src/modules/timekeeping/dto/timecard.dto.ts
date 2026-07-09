import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { TimecardStatus } from "@sompacare/database";
import { PaginationQueryDto } from "../../../common/decorators";

export class TimecardQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({ enum: TimecardStatus })
  @IsOptional()
  @IsEnum(TimecardStatus)
  status?: TimecardStatus;
}
