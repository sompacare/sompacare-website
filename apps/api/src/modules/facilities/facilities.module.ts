import { Body, Controller, Get, Module, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RequirePermissions, paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";

class CreateFacilityDto {
  @ApiProperty()
  @IsString()
  organizationId!: string;

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

class CreateLocationDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  zipCode!: string;

  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @IsNumber()
  longitude!: number;
}

@ApiTags("facilities")
@ApiBearerAuth()
@Controller({ path: "facilities", version: "1" })
export class FacilitiesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions("facilities:read")
  @ApiOperation({ summary: "List facilities" })
  async findAll(@Query("page") page = 1, @Query("limit") limit = 20) {
    const { take, skip } = paginate(Number(page), Number(limit));
    const [data, total] = await Promise.all([
      this.prisma.facility.findMany({
        take,
        skip,
        include: { locations: true, organization: { select: { id: true, name: true } } },
      }),
      this.prisma.facility.count(),
    ]);
    return { data, meta: paginationMeta(total, Number(page), take) };
  }

  @Get(":id")
  @RequirePermissions("facilities:read")
  @ApiOperation({ summary: "Get facility by ID" })
  async findOne(@Param("id") id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: { locations: true, organization: true },
    });
    return { data: facility };
  }

  @Post()
  @RequirePermissions("facilities:write")
  @ApiOperation({ summary: "Create facility" })
  async create(@Body() dto: CreateFacilityDto) {
    const facility = await this.prisma.facility.create({ data: dto });
    return { data: facility };
  }

  @Post(":id/locations")
  @RequirePermissions("facilities:write")
  @ApiOperation({ summary: "Add facility location" })
  async addLocation(@Param("id") id: string, @Body() dto: CreateLocationDto) {
    const location = await this.prisma.facilityLocation.create({
      data: { ...dto, facilityId: id },
    });
    return { data: location };
  }
}

@Module({ controllers: [FacilitiesController] })
export class FacilitiesModule {}
