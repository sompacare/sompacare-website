export enum LegalDocumentType {
  PRIVACY_POLICY = "PRIVACY_POLICY",
  TERMS_OF_SERVICE = "TERMS_OF_SERVICE",
  BACKGROUND_CHECK_DISCLOSURE = "BACKGROUND_CHECK_DISCLOSURE",
}

export const LEGAL_DOCUMENT_VERSION = "2026.07";

export type LegalSection = {
  id: string;
  title: string;
  body: string;
};

export type LegalDocumentContent = {
  type: LegalDocumentType;
  version: string;
  title: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
};
