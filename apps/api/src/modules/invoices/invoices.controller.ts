import { Controller, Get, Param, Post, Query, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InvoiceStatus } from "@sompacare/database";
import { AuthenticatedUser, CurrentUser, RequirePermissions } from "../../common/decorators";
import { PaginationQueryDto } from "../../common/decorators";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { ConfirmInvoicePaymentDto } from "./dto/confirm-invoice-payment.dto";

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
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(user, query);
  }

  @Post(":id/pay")
  @RequirePermissions("payments:write")
  @ApiOperation({ summary: "Create Stripe PaymentIntent for invoice checkout" })
  pay(@Param("id") id: string) {
    return this.invoicesService.payInvoice(id);
  }

  @Post(":id/confirm")
  @RequirePermissions("payments:write")
  @ApiOperation({ summary: "Confirm invoice payment after Stripe checkout" })
  confirm(@Param("id") id: string, @Body() dto: ConfirmInvoicePaymentDto) {
    return this.invoicesService.confirmPayment(id, dto.paymentIntentId);
  }
}
