import {
  LegalDocumentView,
  legalPageMetadata,
} from "@/components/legal/LegalDocumentView";
import { LegalDocumentType, getLegalDocument } from "@sompacare/shared";

const document = getLegalDocument(LegalDocumentType.TERMS_OF_SERVICE);

export const metadata = legalPageMetadata(document, "/terms");

export default function TermsPage() {
  return <LegalDocumentView document={document} path="/terms" />;
}
