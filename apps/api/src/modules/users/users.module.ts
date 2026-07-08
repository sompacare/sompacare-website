import { Controller, Get, Module, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequirePermissions, paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";

@ApiTags("users")
@ApiBearerAuth()
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions("users:read")
  @ApiOperation({ summary: "List users" })
  async findAll(@Query("page") page = 1, @Query("limit") limit = 20) {
    const { take, skip } = paginate(Number(page), Number(limit));
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        take,
        skip,
        include: { roles: { include: { role: true } }, profile: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
    ]);
    return { data, meta: paginationMeta(total, Number(page), take) };
  }

  @Get(":id")
  @RequirePermissions("users:read")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } }, profile: true },
    });
    return { data: user };
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
