#!/usr/bin/env python3
"""Prepare public PDFs, the site manifest and a private server import bundle."""

import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IDS = {
    "01": "privacy", "02": "terms", "03": "casting", "04": "partner",
    "05": "press", "06": "buyers", "07": "newsletter", "08": "advertising",
    "09": "cookies",
}
PDF_HREF = re.compile(r"/documents/files/([a-z]+)-([a-f0-9]{64})\.pdf")


def convert_docx(source, temp):
    profile = (temp / "profile").as_uri()
    subprocess.run([
        "soffice", f"-env:UserInstallation={profile}", "--headless",
        "--convert-to", "pdf", "--outdir", str(temp), str(source),
    ], check=True, timeout=120, capture_output=True)
    return temp / source.with_suffix(".pdf").name


def extract_text(pdf):
    result = subprocess.run(
        ["pdftotext", "-enc", "UTF-8", str(pdf), "-"],
        check=True, capture_output=True, timeout=60,
    )
    body = result.stdout.decode("utf-8").strip()
    if not body or len(body.encode("utf-8")) > 1_000_000:
        raise ValueError(f"{pdf.name}: нужен PDF с текстовым слоем до 1 МБ текста")
    return body


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Папка с утверждёнными файлами 01–09 в PDF или DOCX")
    args = parser.parse_args()
    folder = args.folder.resolve()
    sources = {}
    for file in sorted(folder.iterdir()):
        match = re.match(r"^(0[1-9])(?!\d)", file.name)
        if not match or not file.is_file() or file.suffix.lower() not in {".pdf", ".docx"}:
            continue
        doc_id = IDS[match.group(1)]
        if doc_id in sources:
            raise ValueError(f"Для документа {match.group(1)} оставьте один файл PDF или DOCX")
        sources[doc_id] = file
    if not sources:
        raise ValueError("В папке нет файлов 01–09 с расширением PDF или DOCX")

    manifest_path = ROOT / "src/content/legal-approved.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    pending_pdfs = {}
    with tempfile.TemporaryDirectory(prefix="status-legal-") as tmp:
        temp = Path(tmp)
        for doc_id, source in sources.items():
            pdf = convert_docx(source, temp) if source.suffix.lower() == ".docx" else source
            data = pdf.read_bytes()
            if not data.startswith(b"%PDF-"):
                raise ValueError(f"{source.name}: не удалось получить PDF")
            version = hashlib.sha256(data).hexdigest()
            href = f"/documents/files/{doc_id}-{version}.pdf"
            manifest[doc_id] = {"href": href, "version": version}
            pending_pdfs[doc_id] = (pdf, data)

        bundle = []
        for doc_id, publication in sorted(manifest.items()):
            match = PDF_HREF.fullmatch(publication["href"])
            if doc_id not in IDS.values() or not match or match.groups() != (doc_id, publication["version"]):
                raise ValueError(f"Некорректный путь или редакция в реестре: {doc_id}")
            target = ROOT / "public" / publication["href"].lstrip("/")
            pdf = pending_pdfs[doc_id][0] if doc_id in pending_pdfs else target
            if hashlib.sha256(pdf.read_bytes()).hexdigest() != publication["version"]:
                raise ValueError(f"PDF не соответствует редакции: {doc_id}")
            body = extract_text(pdf)
            if doc_id == "terms":
                heading = re.compile(r"^\s*7\.\s+(?:Покупка|Продажа)\b", re.IGNORECASE | re.MULTILINE)
                page = next((n for n, text in enumerate(body.split("\f"), 1) if heading.search(text)), None)
                if page is None:
                    publication.pop("section7Page", None)
                else:
                    publication["section7Page"] = page
            bundle.append({"id": doc_id, "href": publication["href"], "version": publication["version"], "body": body})

    for doc_id, (_, data) in pending_pdfs.items():
        target = ROOT / "public" / manifest[doc_id]["href"].lstrip("/")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    output = ROOT / "output/legal-documents.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Подготовлено файлов: {len(sources)}. В реестре: {len(bundle)}.")
    print("Проверьте PDF перед публикацией. Пакет для серверного импорта: output/legal-documents.json")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        raise SystemExit(f"Импорт остановлен: {exc}") from exc
