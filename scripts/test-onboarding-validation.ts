import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import {
  FACILITY_TYPES,
  FacilityLocationInputDto,
  SelfServiceFacilityOnboardingDto,
} from "../apps/api/src/modules/facility-onboarding/dto/facility-onboarding.dto";

class OldSelfServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organizationName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  facilityName!: string;

  @IsIn(FACILITY_TYPES)
  facilityType!: string;

  @Type(() => FacilityLocationInputDto)
  location!: FacilityLocationInputDto;
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

async function run() {
  for (const [label, metatype] of [
    ["OLD (no ValidateNested)", OldSelfServiceDto],
    ["NEW", SelfServiceFacilityOnboardingDto],
  ] as const) {
    try {
      await pipe.transform(body, { type: "body", metatype });
      console.log(label, "=> VALID");
    } catch (e: unknown) {
      const err = e as { response?: { message?: unknown } };
      console.log(label, "=>", JSON.stringify(err.response?.message));
    }
  }

  const bodyNoCoords = {
    organizationName: body.organizationName,
    facilityName: body.facilityName,
    facilityType: body.facilityType,
    location: {
      name: body.location.name,
      addressLine1: body.location.addressLine1,
      city: body.location.city,
      state: body.location.state,
      zipCode: body.location.zipCode,
    },
  };

  try {
    await pipe.transform(bodyNoCoords, { type: "body", metatype: OldSelfServiceDto });
    console.log("OLD no coords => VALID");
  } catch (e: unknown) {
    const err = e as { response?: { message?: unknown } };
    console.log("OLD no coords =>", JSON.stringify(err.response?.message));
  }
}

run();
