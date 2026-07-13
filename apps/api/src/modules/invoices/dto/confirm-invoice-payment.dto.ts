import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ConfirmInvoicePaymentDto {
  @ApiProperty()
  @IsString()
  paymentIntentId!: string;
}
