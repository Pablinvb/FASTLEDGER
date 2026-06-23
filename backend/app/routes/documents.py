import hashlib
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ..auth import CurrentUser
from ..config import Settings, get_settings
from ..models import DocumentHashResponse, DocumentRecord
from ..services.supabase import SupabaseRepository

router = APIRouter(prefix="/documents", tags=["documents"])
MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.post("/hash", response_model=DocumentHashResponse)
async def hash_document(file: UploadFile = File(...)) -> DocumentHashResponse:
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 15 MB")
    return DocumentHashResponse(
        name=file.filename or "document",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        sha256=hashlib.sha256(content).hexdigest(),
    )


@router.post("", response_model=DocumentRecord, status_code=status.HTTP_201_CREATED)
async def register_document(
    user: CurrentUser,
    operation_id: UUID = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported document type")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 15 MB")

    repo = SupabaseRepository(settings)
    operation = await repo.get_owned("operations", str(operation_id), str(user.id))
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    row = {
        "operation_id": str(operation_id),
        "user_id": str(user.id),
        "name": file.filename or "document",
        "document_type": document_type,
        "mime_type": file.content_type,
        "size_bytes": len(content),
        "sha256": hashlib.sha256(content).hexdigest(),
        "storage_path": None,
        "status": "hashed",
        "created_at": datetime.now(UTC).isoformat(),
    }
    return await repo.insert("documents", row)


@router.get("/operation/{operation_id}", response_model=list[DocumentRecord])
async def list_documents(
    operation_id: UUID,
    user: CurrentUser,
    settings: Settings = Depends(get_settings),
) -> list[dict]:
    return await SupabaseRepository(settings).list_owned(
        "documents",
        str(user.id),
        extra={"operation_id": f"eq.{operation_id}"},
    )
