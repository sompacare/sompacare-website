import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InvoiceStatus, PaymentStatus, Prisma } from "@sompacare/database";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { StripeService } from "../payments/stripe.service";

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService
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
    regularHours: Prisma.Decimal | number;
    hourlyRate: Prisma.Decimal | number;
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
    const gross = Number(timecard.grossAmount);
    const hours = Number(timecard.regularHours);
    const rate = Number(timecard.hourlyRate);
    const invoiceNumber = `INV-${Date.now()}-${timecard.id.slice(-6)}`;

    const existing = await this.prisma.invoice.findFirst({
      where: {
        facilityId: facility.id,
        lineItems: {
          some: { description: { contains: timecard.id } },
        },
      },
    });
    if (existing) return existing;

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

    return this.prisma.invoice.create({
      data: {
        organizationId: facility.organizationId,
        facilityId: facility.id,
        invoiceNumber,
        status: InvoiceStatus.SENT,
        subtotal: gross,
        tax: 0,
        total: gross,
        dueDate,
        lineItems: {
          create: {
            description: `${timecard.assignment.shift.title} — ${hours}h @ $${rate}/hr (tc:${timecard.id})`,
            quantity: hours,
            unitPrice: rate,
            amount: gross,
          },
        },
      },
      include: { lineItems: true },
    });
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
      await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            invoiceId,
            amount: invoice.total,
            status: PaymentStatus.COMPLETED,
            method: "dev",
            stripePaymentId: paymentIntentId,
            processedAt: new Date(),
          },
        }),
        this.prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: InvoiceStatus.PAID, paidAt: new Date() },
        }),
      ]);
    }

    return { clientSecret, paymentIntentId, devPaid: this.stripe.isDevBypass() };
  }
}
