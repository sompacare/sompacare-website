import { Body, Controller, Headers, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";
import { CareersFunnelService } from "./careers-funnel.service";
import { HireCareerApplicationDto, IngestCareerApplicationDto, PlaceCareerApplicationDto } from "./dto/careers.dto";

@ApiTags("careers")
@Controller({ path: "careers", version: "1" })
export class CareersController {
  constructor(private funnel: CareersFunnelService) {}

  @Post("ingest")
  @Public()
  @ApiOperation({
    summary: "Ingest a careers page application into the recruiter pipeline",
  })
  ingest(
    @Headers("x-careers-ingest-secret") secret: string | undefined,
    @Body() dto: IngestCareerApplicationDto
  ) {
    this.funnel.assertIngestSecret(secret);
    return this.funnel.ingestFromCareers(dto);
  }

  @Post("place")
  @Public()
  @ApiOperation({
    summary: "Mark a careers applicant as placed — sends offer letter and onboarding package",
  })
  place(
    @Headers("x-careers-ingest-secret") secret: string | undefined,
    @Body() dto: PlaceCareerApplicationDto
  ) {
    this.funnel.assertIngestSecret(secret);
    return this.funnel.placeByApplicationId(dto.applicationId);
  }

  @Post("hire")
  @Public()
  @ApiOperation({
    summary: "Mark a careers applicant as hired and email their employee number",
  })
  hire(
    @Headers("x-careers-ingest-secret") secret: string | undefined,
    @Body() dto: HireCareerApplicationDto
  ) {
    this.funnel.assertIngestSecret(secret);
    return this.funnel.hireByApplicationId(dto.applicationId);
  }
}
