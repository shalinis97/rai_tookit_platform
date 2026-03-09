"""
File upload endpoint — extracts text from PDF/Word/txt, stores metadata,
returns base64 + extracted text for use in workflow inputs.
"""
import base64
import io
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["Files"])

SUPPORTED = {
    "application/pdf":                                              "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword":                                           "doc",
    "text/plain":                                                   "txt",
    "text/markdown":                                                "txt",
    "text/csv":                                                     "txt",
}


class FileResult(BaseModel):
    file_id:   str
    name:      str
    mime_type: str
    size:      int
    text:      str          # extracted plain text (empty if binary/unsupported)
    base64:    str          # raw base64 for function nodes
    truncated: bool = False


def _extract_pdf(data: bytes) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(data))
        pages  = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages).strip()
    except ImportError:
        return "[PDF extraction unavailable — install PyPDF2]"
    except Exception as e:
        return f"[PDF extraction error: {e}]"


def _extract_docx(data: bytes) -> str:
    try:
        from docx import Document
        doc  = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text).strip()
    except ImportError:
        return "[DOCX extraction unavailable — install python-docx]"
    except Exception as e:
        return f"[DOCX extraction error: {e}]"


def _extract_text(data: bytes, mime: str) -> tuple[str, bool]:
    MAX_CHARS = 12_000
    kind      = SUPPORTED.get(mime, "unknown")
    text      = ""

    if kind == "pdf":
        text = _extract_pdf(data)
    elif kind in ("docx", "doc"):
        text = _extract_docx(data)
    elif kind == "txt":
        text = data.decode("utf-8", errors="replace")

    truncated = len(text) > MAX_CHARS
    return text[:MAX_CHARS], truncated


@router.post("/upload", response_model=list[FileResult])
async def upload_files(files: list[UploadFile] = File(...)):
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Max 5 files per upload")

    results = []
    for f in files:
        data = await f.read()
        if len(data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail=f"{f.filename} exceeds 10MB limit")

        mime      = f.content_type or "application/octet-stream"
        text, trunc = _extract_text(data, mime)
        b64       = base64.b64encode(data).decode("utf-8")

        result = FileResult(
            file_id=   str(uuid.uuid4()),
            name=      f.filename or "unnamed",
            mime_type= mime,
            size=      len(data),
            text=      text,
            base64=    b64,
            truncated= trunc,
        )
        results.append(result)
        logger.info(f"[FILES] Uploaded {f.filename} ({mime}, {len(data)} bytes, text={len(text)} chars)")

    return results
