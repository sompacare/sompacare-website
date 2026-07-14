import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { SelfServiceFacilityOnboardingDto } from "../apps/api/src/modules/facility-onboarding/dto/facility-onboarding.dto.ts";

class OldSelfServiceDto {
  organizationName;
  facilityName;
  facilityType;
  location;
}

// Simulate OLD DTO without ValidateNested by using plain import hack
import { Type } from "class-transformer";
import { IsIn, IsString, MinLength, MaxLength, IsOptional, IsEmail, IsNumber } from "class-validator";
import { FACILITY_TYPES, FacilityLocationInputDto } from "../apps/api/src/modules/facility-onboarding/dto/facility-onboarding.dto.ts";

class OldDto {
  @IsString() @MinLength(2) @MaxLength(120) organizationName;
  @IsString() @MinLength(2) @MaxLength(120) facilityName;
  @IsIn(FACILITY_TYPES) facilityType;
  @Type(() => FacilityLocationInputDto) location;
}

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

const body = {
  organizationName: "Sompacare Solutions LLC",
  facilityName: "Sompacare",
  facilityType: "skilled_nursing",
  location: {
    name: "Main campus",
    addressLine1: "15604 Marathon Circle",
    city: "Gaithersburg",
    state: "MD",
    zipCode: "20878",
    latitude: 39.1125622,
    longitude: -77.1956754,
  },
};

for (const [label, metatype] of [
  ["OLD (no ValidateNested)", OldDto],
  ["NEW", SelfServiceFacilityOnboardingDto],
]) {
  try {
    await pipe.transform(body, { type: "body", metatype });
    console.log(label, "=> VALID");
  } catch (e) {
    console.log(label, "=>", JSON.stringify(e.response?.message));
  }
}

// Also test without lat/lng on OLD dto
const bodyNoCoords = {
  ...body,
  location: { ...body.location, latitude: undefined, longitude: undefined },
};
delete bodyNoCoords.location.latitude;
delete bodyNoCoords.location.longitude;

try {
  await pipe.transform(bodyNoCoords, { type: "body", metatype: OldDto });
  console.log("OLD no coords => VALID", JSON.stringify(bodyNoCoords.location));
} catch (e) {
  console.log("OLD no coords =>", JSON.stringify(e.response?.message));
}
