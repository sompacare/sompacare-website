import { Injectable, NotFoundException } from "@nestjs/common";
import { LegalDocumentType } from "@sompacare/database";
import {
  BACKGROUND_CHECK_DISCLOSURE,
  LEGAL_DOCUMENT_VERSION,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  getLegalDocument,
} from "@sompacare/shared";
import { PrismaService } from "../../common/prisma/prisma.module";

const STATIC_BY_TYPE = {
  [LegalDocumentType.PRIVACY_POLICY]: PRIVACY_POLICY,
  [LegalDocumentType.TERMS_OF_SERVICE]: TERMS_OF_SERVICE,
  [LegalDocumentType.BACKGROUND_CHECK_DISCLOSURE]: BACKGROUND_CHECK_DISCLOSURE,
} as const;

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  async ensureSeeded() {
    for (const type of Object.values(LegalDocumentType)) {
      const existing = await this.prisma.legalDocument.findUnique({
        where: {
          type_version: { type, version: LEGAL_DOCUMENT_VERSION },
        },
      });
      if (existing) continue;

      const content = STATIC_BY_TYPE[type];
      await this.prisma.legalDocument.updateMany({
        where: { type, isCurrent: true },
        data: { isCurrent: false },
      });
      await this.prisma.legalDocument.create({
        data: {
          type,
          version: LEGAL_DOCUMENT_VERSION,
          title: content.title,
          summary: content.summary,
          content: content as object,
          effectiveAt: new Date(content.effectiveDate),
          isCurrent: true,
        },
      });
    }
  }

  async getCurrentDocument(type: LegalDocumentType) {
    await this.ensureSeeded();
    const doc = await this.prisma.legalDocument.findFirst({
      where: { type, isCurrent: true },
      orderBy: { effectiveAt: "desc" },
    });
    if (!doc) {
      return { data: getLegalDocument(type as never) };
    }
    return { data: doc };
  }

  async recordConsent(input: {
    userId?: string;
    email?: string;
    documentTypes: LegalDocumentType[];
    context: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.ensureSeeded();
    const email = input.email?.toLowerCase();
    if (!input.userId && !email) {
      throw new NotFoundException("email or authenticated user required");
    }

    const records = [];
    for (const documentType of input.documentTypes) {
      const doc = await this.prisma.legalDocument.findFirst({
        where: { type: documentType, isCurrent: true },
      });
      const version = doc?.version ?? LEGAL_DOCUMENT_VERSION;
      const record = await this.prisma.userConsent.create({
        data: {
          userId: input.userId,
          email,
          documentType,
          documentVersion: version,
          context: input.context,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
      records.push(record);
    }

    return { recorded: records.length, consents: records };
  }

  async hasConsent(input: {
    userId?: string;
    email?: string;
    documentType: LegalDocumentType;
    context?: string;
  }) {
    const where = {
      documentType: input.documentType,
      ...(input.context ? { context: input.context } : {}),
      ...(input.userId
        ? { userId: input.userId }
        : { email: input.email?.toLowerCase() }),
    };
    const found = await this.prisma.userConsent.findFirst({
      where,
      orderBy: { acceptedAt: "desc" },
    });
    return Boolean(found);
  }

  async listConsentsForUser(userId: string) {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { acceptedAt: "desc" },
    });
    return { data: consents };
  }

  async getPortalConsentStatus(userId: string) {
    const required = [
      LegalDocumentType.PRIVACY_POLICY,
      LegalDocumentType.TERMS_OF_SERVICE,
    ];
    const missing: LegalDocumentType[] = [];
    for (const documentType of required) {
      const ok = await this.hasConsent({
        userId,
        documentType,
        context: "portal_access",
      });
      if (!ok) missing.push(documentType);
    }
    return {
      complete: missing.length === 0,
      missing,
      marketingUrl: process.env.SITE_URL ?? "https://www.sompacare.com",
    };
  }
}
