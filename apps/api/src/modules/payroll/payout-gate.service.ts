import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { InvoiceStatus } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class PayoutGateService {
  constructor(private prisma: PrismaService) {}

  async assertTimecardsInvoicesPaid(timecardIds: string[]) {
    if (timecardIds.length === 0) return;

    const timecards = await this.prisma.timecard.findMany({
      where: { id: { in: timecardIds } },
      select: {
        id: true,
        invoiceId: true,
        invoice: { select: { id: true, status: true, invoiceNumber: true } },
        assignment: {
          select: { shift: { select: { title: true } } },
        },
      },
    });

    const unpaid: string[] = [];

    for (const tc of timecards) {
      if (!tc.invoiceId || !tc.invoice) {
        unpaid.push(
          `${tc.assignment.shift.title} (timecard ${tc.id.slice(-6)}): no invoice`
        );
        continue;
      }
      if (tc.invoice.status !== InvoiceStatus.PAID) {
        unpaid.push(
          `${tc.assignment.shift.title}: invoice ${tc.invoice.invoiceNumber} is ${tc.invoice.status}`
        );
      }
    }

    if (unpaid.length > 0) {
      throw new BadRequestException(
        `Cannot pay workers until facility invoices are paid. Outstanding: ${unpaid.join("; ")}`
      );
    }
  }

  async assertPayRunInvoicesPaid(payRunId: string) {
    const timecards = await this.prisma.timecard.findMany({
      where: { payRunId },
      select: { id: true },
    });
    await this.assertTimecardsInvoicesPaid(timecards.map((t) => t.id));
  }
}
