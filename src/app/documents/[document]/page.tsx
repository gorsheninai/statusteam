import { notFound } from "next/navigation";
import Link from "next/link";
import { LEGAL_DOCUMENTS, type LegalDocumentId } from "@/content/legal";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCUMENTS).map((document) => ({ document }));
}

export default async function DocumentPage({ params }: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  if (!Object.hasOwn(LEGAL_DOCUMENTS, document)) notFound();
  const doc = LEGAL_DOCUMENTS[document as LegalDocumentId];
  return (
    <main className="shell legal-page">
      <h1>{doc.title}</h1>
      {doc.href ? (
        <p><a href={doc.href}>Открыть документ</a></p>
      ) : (
        <p>Документ готовится к публикации. До его размещения отправка соответствующей формы или переход к покупке недоступны.</p>
      )}
      <p><Link href="/">Вернуться на сайт STATUS TEAM</Link></p>
    </main>
  );
}
