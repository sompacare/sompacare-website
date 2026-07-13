import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { InvoiceStatus } from "@sompacare/database";
import { getUnpaidTimecardBlockers } from "@sompacare/shared";
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

    const unpaid = getUnpaidTimecardBlockers(
      timecards.map((tc) => ({
        id: tc.id,
        shiftTitle: tc.assignment.shift.title,
        invoiceId: tc.invoiceId,
        invoiceStatus: tc.invoice?.status ?? null,
        invoiceNumber: tc.invoice?.invoiceNumber ?? null,
      })),
      InvoiceStatus.PAID
    );

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
