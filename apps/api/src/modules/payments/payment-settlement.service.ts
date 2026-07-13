import { Injectable } from "@nestjs/common";
import { InvoiceStatus, PaymentStatus, Prisma } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class PaymentSettlementService {
  constructor(private prisma: PrismaService) {}

  async settleInvoicePayment(input: {
    invoiceId: string;
    paymentIntentId: string;
    amount: number;
    method: string;
  }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoiceId },
    });
    if (!invoice) return { status: "NOT_FOUND" as const };
    if (invoice.status === InvoiceStatus.PAID) {
      return { status: "PAID" as const, invoice };
    }

    const existing = await this.prisma.payment.findFirst({
      where: { stripePaymentId: input.paymentIntentId },
    });
    if (existing) {
      await this.prisma.invoice.update({
        where: { id: input.invoiceId },
        data: { status: InvoiceStatus.PAID, paidAt: invoice.paidAt ?? new Date() },
      });
      return { status: "PAID" as const, invoice };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: input.invoiceId,
          amount: input.amount,
          status: PaymentStatus.COMPLETED,
          method: input.method,
          stripePaymentId: input.paymentIntentId,
          processedAt: new Date(),
        },
      });
      return tx.invoice.update({
        where: { id: input.invoiceId },
        data: { status: InvoiceStatus.PAID, paidAt: new Date() },
      });
    });

    return { status: "PAID" as const, invoice: updated };
  }
}
