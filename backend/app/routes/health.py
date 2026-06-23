from fastapi import APIRouter, Depends

from ..config import Settings, get_settings

router = APIRouter(tags=["system"])


@router.get("/health")
async def health(settings: Settings = Depends(get_settings)) -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "integrations": {
            "supabase": bool(settings.supabase_url and settings.supabase_secret_key),
            "gemini": bool(settings.gemini_api_key),
            "resend": bool(settings.resend_api_key),
        },
    }
