import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JobPostingStatus, Prisma } from "@sompacare/database";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { CreateJobPostingDto, UpdateJobPostingDto } from "./dto/job-postings.dto";

@Injectable()
export class JobPostingsService {
  constructor(private prisma: PrismaService) {}

  async listPublic() {
    const postings = await this.prisma.jobPosting.findMany({
      where: { status: JobPostingStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    });

    return {
      data: postings.map((p) => this.toPublicShape(p)),
    };
  }

  async findAll(query: { status?: JobPostingStatus; page?: number; limit?: number }) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.JobPostingWhereInput = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      data: data.map((p) => this.toPublicShape(p)),
      meta: paginationMeta(total, query.page ?? 1, take),
    };
  }

  async findOne(idOrSlug: string) {
    const posting = await this.prisma.jobPosting.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!posting) throw new NotFoundException("Job posting not found");
    return this.toPublicShape(posting);
  }

  async create(dto: CreateJobPostingDto, createdById: string) {
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.prisma.jobPosting.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException("Slug already in use");

    const posting = await this.prisma.jobPosting.create({
      data: {
        slug,
        title: dto.title,
        category: dto.category,
        employment: dto.employment,
        locations: dto.locations,
        description: dto.description,
        requirements: dto.requirements,
        clinicalRole: dto.clinicalRole,
        createdById,
      },
    });

    return this.toPublicShape(posting);
  }

  async update(idOrSlug: string, dto: UpdateJobPostingDto) {
    const existing = await this.prisma.jobPosting.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!existing) throw new NotFoundException("Job posting not found");

    const data: Prisma.JobPostingUpdateInput = { ...dto };
    if (dto.status === JobPostingStatus.PUBLISHED && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
    if (dto.status === JobPostingStatus.CLOSED) {
      data.publishedAt = existing.publishedAt;
    }

    const posting = await this.prisma.jobPosting.update({
      where: { id: existing.id },
      data,
    });

    return this.toPublicShape(posting);
  }

  private toPublicShape(posting: {
    id: string;
    slug: string;
    title: string;
    category: string;
    employment: string;
    locations: string;
    description: string;
    requirements: string[];
    clinicalRole: string;
    status: JobPostingStatus;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: posting.slug,
      slug: posting.slug,
      title: posting.title,
      category: posting.category,
      employment: posting.employment,
      locations: posting.locations,
      description: posting.description,
      requirements: posting.requirements,
      clinicalRole: posting.clinicalRole,
      status: posting.status,
      publishedAt: posting.publishedAt,
      updatedAt: posting.updatedAt,
    };
  }
}
