import { Body, Controller, Headers, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";
import { CareersFunnelService } from "./careers-funnel.service";
import { IngestCareerApplicationDto } from "./dto/careers.dto";

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
}
