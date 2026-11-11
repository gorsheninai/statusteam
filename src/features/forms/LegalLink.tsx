import type { ReactNode } from "react";
import { LEGAL_DOCUMENTS, type LegalDocumentId } from "@/content/legal";

export default function LegalLink({ document, section, children }: {
  document: LegalDocumentId;
  section?: "section-7";
  children?: ReactNode;
}) {
  const doc = LEGAL_DOCUMENTS[document];
  const page = `/documents/${document}/`;
  const href = section ? `${page}#${section}` : doc.href || page;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children ?? doc.title}
    </a>
  );
}
