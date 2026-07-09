import { IsDateString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationQueryDto } from "../../../common/decorators";

export class PayRunQueryDto extends PaginationQueryDto {}

export class CreatePayRunDto {
  @ApiPropertyOptional({ example: "2026-07-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ example: "2026-07-14T23:59:59.999Z" })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
