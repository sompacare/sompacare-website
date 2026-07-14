import { Body, Controller, Get, Module, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequirePermissions, paginate, paginationMeta } from "../../common/decorators";
import { AuditModule } from "../../common/audit/audit.module";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UpdateUserStatusDto } from "./dto/users.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService
  ) {}

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

  @Patch(":id/status")
  @RequirePermissions("users:write")
  @ApiOperation({ summary: "Update user access status (terminate or reactivate)" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto.status);
  }
}

@Module({
  imports: [AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
