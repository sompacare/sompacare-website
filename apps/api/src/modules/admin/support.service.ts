import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SupportTicketStatus } from "@sompacare/database";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { CreateSupportTicketDto, UpdateSupportTicketDto } from "./dto/admin.dto";

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: SupportTicketStatus, page = 1, limit = 20) {
    const { take, skip } = paginate(page, limit);
    const where: Prisma.SupportTicketWhereInput = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take,
        skip,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, page, take) };
  }

  async create(userId: string, dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority ?? "MEDIUM",
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateSupportTicketDto) {
    const existing = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Ticket not found");

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: dto.status,
        priority: dto.priority,
        assignedTo: dto.assignedTo,
        resolvedAt:
          dto.status === "RESOLVED" || dto.status === "CLOSED"
            ? new Date()
            : undefined,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
