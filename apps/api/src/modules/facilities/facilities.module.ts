import { Body, Controller, Get, Module, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GeocodingModule } from "../../common/geocoding/geocoding.module";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { FacilitiesService } from "./facilities.service";

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

  @ApiPropertyOptional({ description: "Optional — geocoded from address when omitted" })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: "Optional — geocoded from address when omitted" })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

@ApiTags("facilities")
@ApiBearerAuth()
@Controller({ path: "facilities", version: "1" })
export class FacilitiesController {
  constructor(private facilitiesService: FacilitiesService) {}

  @Get()
  @RequirePermissions("facilities:read")
  @ApiOperation({ summary: "List facilities (tenant-scoped)" })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("internal") internal?: string
  ) {
    return this.facilitiesService.findAll(
      user,
      Number(page),
      Number(limit),
      internal === "true"
    );
  }

  @Get("internal/homecare")
  @RequirePermissions("facilities:read")
  @ApiOperation({ summary: "Sompacare-owned home care facility for internal shift posting" })
  findInternalHomecare() {
    return this.facilitiesService.findInternalHomecareFacility();
  }

  @Get(":id")
  @RequirePermissions("facilities:read")
  @ApiOperation({ summary: "Get facility by ID" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.facilitiesService.findOne(user, id);
  }

  @Post()
  @RequirePermissions("facilities:write")
  @ApiOperation({ summary: "Create facility" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFacilityDto) {
    return this.facilitiesService.create(user, dto);
  }

  @Post(":id/locations")
  @RequirePermissions("facilities:write")
  @ApiOperation({ summary: "Add facility location" })
  addLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateLocationDto
  ) {
    return this.facilitiesService.addLocation(user, id, dto);
  }
}

@Module({
  imports: [GeocodingModule],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
