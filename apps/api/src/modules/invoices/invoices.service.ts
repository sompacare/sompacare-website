import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@sompacare/database";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { PaymentSettlementService } from "../payments/payment-settlement.service";
import { StripeService } from "../payments/stripe.service";

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private settlement: PaymentSettlementService
  ) {}

  async findAll(query: {
    facilityId?: string;
    organizationId?: string;
    status?: InvoiceStatus;
    page?: number;
    limit?: number;
  }) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.InvoiceWhereInput = {};
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { lineItems: true, facility: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: paginationMeta(total, query.page ?? 1, take),
    };
  }

  async createFromTimecard(timecard: {
    id: string;
    grossAmount: Prisma.Decimal | number;
    billAmount: Prisma.Decimal | number;
    regularHours: Prisma.Decimal | number;
    payRate: Prisma.Decimal | number;
    billRate: Prisma.Decimal | number;
    assignment: {
      shift: {
        title: string;
        facilityId: string;
        facility: {
          id: string;
          name: string;
          organizationId: string;
          email?: string | null;
          stripeCustomerId?: string | null;
        };
      };
    };
  }) {
    const facility = timecard.assignment.shift.facility;
    const billTotal = Number(timecard.billAmount);
    const hours = Number(timecard.regularHours);
    const payRate = Number(timecard.payRate);
    const billRate = Number(timecard.billRate);
    const payTotal = Number(timecard.grossAmount);
    const platformMargin = Math.round((billTotal - payTotal) * 100) / 100;
    const invoiceNumber = `INV-${Date.now()}-${timecard.id.slice(-6)}`;

    const existing = await this.prisma.invoiceLineItem.findUnique({
      where: { timecardId: timecard.id },
      include: { invoice: true },
    });
    if (existing?.invoice) {
      if (!existing.invoice.paidAt) {
        await this.prisma.timecard.update({
          where: { id: timecard.id },
          data: { invoiceId: existing.invoice.id },
        });
      }
      return existing.invoice;
    }

    const customerId = await this.stripe.ensureFacilityCustomer({
      facilityId: facility.id,
      name: facility.name,
      email: facility.email,
      existingCustomerId: facility.stripeCustomerId,
    });

    if (!facility.stripeCustomerId) {
      await this.prisma.facility.update({
        where: { id: facility.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId: facility.organizationId,
        facilityId: facility.id,
        invoiceNumber,
        status: InvoiceStatus.SENT,
        subtotal: billTotal,
        tax: 0,
        total: billTotal,
        dueDate,
        lineItems: {
          create: {
            timecardId: timecard.id,
            description: `${timecard.assignment.shift.title} — ${hours}h @ $${billRate}/hr bill (pay $${payRate}/hr, margin $${platformMargin})`,
            quantity: hours,
            unitPrice: billRate,
            amount: billTotal,
          },
        },
      },
      include: { lineItems: true },
    });

    await this.prisma.timecard.update({
      where: { id: timecard.id },
      data: { invoiceId: invoice.id },
    });

    return invoice;
  }

  async payInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { facility: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException("Invoice already paid");
    }

    const customerId = await this.stripe.ensureFacilityCustomer({
      facilityId: invoice.facilityId!,
      name: invoice.facility?.name ?? "Facility",
      email: invoice.facility?.email,
      existingCustomerId: invoice.facility?.stripeCustomerId,
    });

    const { clientSecret, paymentIntentId } =
      await this.stripe.createInvoicePaymentIntent({
        customerId,
        amountCents: Math.round(Number(invoice.total) * 100),
        invoiceId,
      });

    if (this.stripe.isDevBypass()) {
      await this.settlement.settleInvoicePayment({
        invoiceId,
        paymentIntentId,
        amount: Number(invoice.total),
        method: "dev",
      });
    }

    return {
      clientSecret,
      paymentIntentId,
      devPaid: this.stripe.isDevBypass(),
      amount: Number(invoice.total),
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  async confirmPayment(invoiceId: string, paymentIntentId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === InvoiceStatus.PAID) {
      return { status: "PAID", invoice };
    }

    if (this.stripe.isDevBypass()) {
      const result = await this.settlement.settleInvoicePayment({
        invoiceId,
        paymentIntentId,
        amount: Number(invoice.total),
        method: "dev",
      });
      return { status: result.status, invoice: result.invoice };
    }

    const intent = await this.stripe.retrievePaymentIntent(paymentIntentId);
    const linkedInvoiceId = intent.metadata?.sompacare_invoice_id;
    if (linkedInvoiceId && linkedInvoiceId !== invoiceId) {
      throw new BadRequestException("Payment intent does not match this invoice");
    }
    if (intent.status !== "succeeded") {
      throw new BadRequestException(`Payment not completed (status: ${intent.status})`);
    }

    const result = await this.settlement.settleInvoicePayment({
      invoiceId,
      paymentIntentId: intent.id,
      amount: intent.amount_received / 100,
      method: "stripe",
    });

    return { status: result.status, invoice: result.invoice };
  }
}
