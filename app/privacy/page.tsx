import {
  LegalDocumentView,
  legalPageMetadata,
} from "@/components/legal/LegalDocumentView";
import { LegalDocumentType, getLegalDocument } from "@sompacare/shared";

const document = getLegalDocument(LegalDocumentType.PRIVACY_POLICY);

export const metadata = legalPageMetadata(document, "/privacy");

export default function PrivacyPage() {
  return <LegalDocumentView document={document} path="/privacy" />;
}
