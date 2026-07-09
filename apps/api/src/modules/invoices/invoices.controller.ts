import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InvoiceStatus } from "@sompacare/database";
import { RequirePermissions } from "../../common/decorators";
import { PaginationQueryDto } from "../../common/decorators";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";

class InvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

@ApiTags("invoices")
@ApiBearerAuth()
@Controller({ path: "invoices", version: "1" })
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions("invoices:read")
  @ApiOperation({ summary: "List invoices" })
  findAll(@Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Post(":id/pay")
  @RequirePermissions("payments:write")
  @ApiOperation({ summary: "Pay invoice via Stripe" })
  pay(@Param("id") id: string) {
    return this.invoicesService.payInvoice(id);
  }
}
