from pathlib import Path

import fitz  # PyMuPDF


def parse_pdf(file_path: str | Path) -> str:
    doc = fitz.open(str(file_path))
    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()
    return "\n\n".join(pages)
