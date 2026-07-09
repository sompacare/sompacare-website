import { IsNumber, IsOptional, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationQueryDto } from "../../../common/decorators";

export class WalletTransactionsQueryDto extends PaginationQueryDto {}

export class InstantPayDto {
  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
