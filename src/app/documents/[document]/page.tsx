import { notFound } from "next/navigation";
import Link from "next/link";
import { LEGAL_DOCUMENTS, documentsPublished, type LegalDocumentId } from "@/content/legal";
import drafts from "@/content/legal-drafts.json";

export const dynamicParams = false;
export const metadata = { robots: { index: false, follow: true } };

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCUMENTS).map((document) => ({ document }));
}

export default async function DocumentPage({ params }: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  if (!Object.hasOwn(LEGAL_DOCUMENTS, document)) notFound();
  const id = document as LegalDocumentId;
  const doc = LEGAL_DOCUMENTS[id];
  // Section 7 of the model consent also covers the legal representative.
  const contentId = id === "guardian" ? "casting" : id;
  const draft = Object.hasOwn(drafts, contentId) ? drafts[contentId as keyof typeof drafts] : null;
  const published = documentsPublished([id]);
  const section7 = draft?.text.search(/(?:^|\n)7\. /) ?? -1;
  return (
    <main id="statusteam" className="shell legal-page">
      <p className="legal-back"><Link href="/">STATUS TEAM — на главную</Link></p>
      <h1>{doc.title}</h1>
      {published && draft ? (
        <>
          <p className="legal-version">Редакция: {doc.version}</p>
          {id === "terms" && section7 >= 0 && <p><a href="#section-7">Покупка и возврат билетов — раздел 7</a></p>}
          <article className="legal-text" aria-label={doc.title}>
            {id === "terms" && section7 >= 0 ? <>
              {draft.text.slice(0, section7)}
              <div id="section-7">{draft.text.slice(section7)}</div>
            </> : draft.text}
          </article>
        </>
      ) : (
        <div className="legal-pending" role="status">
          <p>Документ готовится к публикации. До размещения окончательной редакции отправка соответствующей формы или переход к покупке недоступны.</p>
        </div>
      )}
      <nav className="legal-doc-nav" aria-label="Документы сайта">
        {Object.entries(LEGAL_DOCUMENTS).filter(([key]) => key !== "guardian").map(([key, item]) => (
          <Link key={key} href={`/documents/${key}/`} aria-current={key === id ? "page" : undefined}>{item.title}</Link>
        ))}
      </nav>
    </main>
  );
}
