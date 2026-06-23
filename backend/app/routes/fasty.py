from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..auth import CurrentUser
from ..config import Settings, get_settings
from ..models import FastyAnalysis, FastyAnalyzeRequest
from ..services.gemini import GeminiService
from ..services.supabase import SupabaseRepository

router = APIRouter(prefix="/fasty", tags=["fasty"])
MAX_MULTIMODAL_SIZE = 15 * 1024 * 1024
ALLOWED_MULTIMODAL_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
}


@router.post("/analyze", response_model=FastyAnalysis)
async def analyze(
    payload: FastyAnalyzeRequest,
    user: CurrentUser,
    settings: Settings = Depends(get_settings),
) -> FastyAnalysis:
    analysis = await GeminiService(settings).analyze(payload.message)
    repo = SupabaseRepository(settings)

    await repo.insert(
        "ai_consultations",
        {
            "user_id": str(user.id),
            "operation_id": str(payload.operation_id) if payload.operation_id else None,
            "request": payload.message,
            "response": analysis.model_dump(mode="json"),
            "model": settings.gemini_model if settings.gemini_api_key else "fallback",
            "created_at": datetime.now(UTC).isoformat(),
        },
    )

    if payload.operation_id:
        updated = await repo.update_owned(
            "operations",
            str(payload.operation_id),
            str(user.id),
            {
                "status": "analysis",
                "title": analysis.title,
                "analysis": analysis.model_dump(mode="json"),
                "risk_score": analysis.risk_score,
                "estimated_total": analysis.estimated_total,
                "estimated_days": analysis.estimated_days_max,
                "updated_at": datetime.now(UTC).isoformat(),
            },
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Operation not found")

    return analysis


@router.post("/analyze-file", response_model=FastyAnalysis)
async def analyze_file(
    user: CurrentUser,
    message: str = Form(..., min_length=5, max_length=8000),
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> FastyAnalysis:
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MULTIMODAL_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported multimodal file type")
    content = await file.read(MAX_MULTIMODAL_SIZE + 1)
    if len(content) > MAX_MULTIMODAL_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 15 MB")

    analysis = await GeminiService(settings).analyze_file(
        message=message,
        content=content,
        mime_type=mime_type,
    )
    await SupabaseRepository(settings).insert(
        "ai_consultations",
        {
            "user_id": str(user.id),
            "operation_id": None,
            "request": f"{message}\nAttachment: {file.filename or 'file'}",
            "response": analysis.model_dump(mode="json"),
            "model": settings.gemini_model if settings.gemini_api_key else "fallback",
            "created_at": datetime.now(UTC).isoformat(),
        },
    )
    return analysis
