import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export const FACILITY_TYPES = [
  "skilled_nursing",
  "assisted_living",
  "hospital",
  "rehab",
  "home_health",
  "clinic",
  "other",
] as const;

export class FacilityLocationInputDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(10)
  zipCode!: string;

  @ApiPropertyOptional({ description: "Optional — geocoded from address when omitted" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: "Optional — geocoded from address when omitted" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}

export class GeocodeAddressDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(10)
  zipCode!: string;
}

export class SelfServiceFacilityOnboardingDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organizationName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  facilityName!: string;

  @ApiProperty({ enum: FACILITY_TYPES })
  @IsIn(FACILITY_TYPES)
  facilityType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  facilityEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  facilityPhone?: string;

  @ApiProperty({ type: FacilityLocationInputDto })
  @ValidateNested()
  @Type(() => FacilityLocationInputDto)
  location!: FacilityLocationInputDto;
}

export class AdminInviteFacilityManagerDto extends SelfServiceFacilityOnboardingDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class AcceptFacilityInviteDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  token!: string;
}
