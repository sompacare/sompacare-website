import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UpdateFeatureFlagDto } from "./dto/admin.dto";

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async update(key: string, dto: UpdateFeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException("Feature flag not found");

    return this.prisma.featureFlag.update({
      where: { key },
      data: {
        isEnabled: dto.isEnabled,
        description: dto.description,
      },
    });
  }
}
