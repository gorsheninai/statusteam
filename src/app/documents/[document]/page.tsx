import { notFound } from "next/navigation";
import Link from "next/link";
import { LEGAL_DOCUMENTS, documentsPublished, type LegalDocumentId } from "@/content/legal";

export const dynamicParams = false;
export const metadata = { robots: { index: false, follow: true } };

export function generateStaticParams() {
  return [...Object.keys(LEGAL_DOCUMENTS), "offer", "guardian"].map(document => ({ document }));
}

export default async function DocumentPage({ params }: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  const canonical = document === "offer" ? "terms" : document === "guardian" ? "casting" : document;
  if (!Object.hasOwn(LEGAL_DOCUMENTS, canonical)) notFound();
  const id = canonical as LegalDocumentId;
  const doc = LEGAL_DOCUMENTS[id];
  const published = documentsPublished([id]);
  const pdfHref = id === "terms" && doc.section7Page ? `${doc.href}#page=${doc.section7Page}` : doc.href;

  return (
    <main id="statusteam" className="shell legal-page">
      <p className="legal-back"><Link href="/">STATUS TEAM — на главную</Link></p>
      <h1>{doc.title}</h1>
      <section className="legal-text" id={id === "terms" ? "section-7" : undefined} aria-label={doc.title}>
        {id === "terms" && <h2>Покупка и возврат билетов · раздел 7</h2>}
        {published ? (
          <p><a href={pdfHref}>Открыть утверждённый документ (PDF)</a></p>
        ) : (
          <p className="legal-pending" role="status">Документ готовится к публикации. До размещения окончательной редакции отправка соответствующей формы или переход к покупке недоступны.</p>
        )}
      </section>
      <nav className="legal-doc-nav" aria-label="Документы сайта">
        {Object.entries(LEGAL_DOCUMENTS).map(([key, item]) => (
          <Link key={key} href={`/documents/${key}/`} aria-current={key === id ? "page" : undefined}>{item.title}</Link>
        ))}
      </nav>
    </main>
  );
}
