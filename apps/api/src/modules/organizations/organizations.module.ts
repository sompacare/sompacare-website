import { Body, Controller, Get, Module, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RequirePermissions, paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";

class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  type!: string;
}

@ApiTags("organizations")
@ApiBearerAuth()
@Controller({ path: "organizations", version: "1" })
export class OrganizationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions("organizations:read")
  @ApiOperation({ summary: "List organizations" })
  async findAll(@Query("page") page = 1, @Query("limit") limit = 20) {
    const { take, skip } = paginate(Number(page), Number(limit));
    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({ take, skip, include: { facilities: true } }),
      this.prisma.organization.count(),
    ]);
    return { data, meta: paginationMeta(total, Number(page), take) };
  }

  @Post()
  @RequirePermissions("organizations:write")
  @ApiOperation({ summary: "Create organization" })
  async create(@Body() dto: CreateOrganizationDto) {
    const org = await this.prisma.organization.create({ data: dto });
    return { data: org };
  }
}

@Module({ controllers: [OrganizationsController] })
export class OrganizationsModule {}
