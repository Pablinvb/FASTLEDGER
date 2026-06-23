from fastapi import APIRouter, Depends, Query

from ..config import Settings, get_settings
from ..models import Supplier
from ..services.supabase import SupabaseRepository

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[Supplier])
async def list_suppliers(
    country: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=100),
    verified: bool = True,
    settings: Settings = Depends(get_settings),
) -> list[dict]:
    filters: dict[str, str] = {"verified": f"eq.{str(verified).lower()}"}
    if country:
        filters["country"] = f"ilike.{country}"
    if category:
        filters["categories"] = f"cs.{{{category}}}"
    return await SupabaseRepository(settings).list_public(
        "suppliers", extra=filters
    )
