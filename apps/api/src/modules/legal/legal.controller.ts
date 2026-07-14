import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { LegalDocumentType } from "@sompacare/database";
import { AuthenticatedUser, CurrentUser, Public } from "../../common/decorators";
import { RecordConsentDto } from "./dto/legal.dto";
import { LegalService } from "./legal.service";

@ApiTags("legal")
@Controller({ path: "legal", version: "1" })
export class LegalController {
  constructor(private legalService: LegalService) {}

  @Get("documents/:type")
  @Public()
  @ApiOperation({ summary: "Get current legal document by type" })
  getDocument(@Param("type") type: LegalDocumentType) {
    return this.legalService.getCurrentDocument(type);
  }

  @Post("consent")
  @ApiOperation({ summary: "Record authenticated user consent" })
  recordConsent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordConsentDto,
    @Req() req: Request
  ) {
    return this.legalService.recordConsent({
      userId: user.id,
      email: user.email,
      documentTypes: dto.documentTypes,
      context: dto.context,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Post("consent/public")
  @Public()
  @ApiOperation({ summary: "Record consent for unauthenticated flows (e.g. careers apply)" })
  recordPublicConsent(@Body() dto: RecordConsentDto, @Req() req: Request) {
    return this.legalService.recordConsent({
      email: dto.email,
      documentTypes: dto.documentTypes,
      context: dto.context,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Get("consent/status")
  @ApiOperation({ summary: "Check whether current user accepted required portal legal terms" })
  consentStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.legalService.getPortalConsentStatus(user.id);
  }

  @Get("consent/me")
  @ApiOperation({ summary: "List consent records for current user" })
  myConsents(@CurrentUser() user: AuthenticatedUser) {
    return this.legalService.listConsentsForUser(user.id);
  }
}
