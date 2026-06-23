from fastapi import APIRouter

from ..auth import CurrentUser
from ..models import UserIdentity

router = APIRouter(prefix="/me", tags=["users"])


@router.get("", response_model=UserIdentity)
async def me(user: CurrentUser) -> UserIdentity:
    return user
