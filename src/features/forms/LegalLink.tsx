import type { ReactNode } from "react";
import { LEGAL_DOCUMENTS, type LegalDocumentId } from "@/content/legal";

export default function LegalLink({ document, children }: {
  document: LegalDocumentId;
  children?: ReactNode;
}) {
  const doc = LEGAL_DOCUMENTS[document];
  return (
    <a href={doc.href || `/documents/${document}/`} target="_blank" rel="noopener noreferrer">
      {children ?? doc.title}
    </a>
  );
}
