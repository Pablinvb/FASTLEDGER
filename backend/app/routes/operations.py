from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status

from ..auth import CurrentUser
from ..config import Settings, get_settings
from ..models import Operation, OperationCreate, OperationUpdate
from ..services.resend import ResendService
from ..services.risk import deterministic_risk_score
from ..services.supabase import SupabaseRepository

router = APIRouter(prefix="/operations", tags=["operations"])


def _title(payload: OperationCreate) -> str:
    action = "Exportacion" if payload.direction == "export" else "Importacion"
    return f"{action} de {payload.product} desde {payload.origin_country}"


@router.get("", response_model=list[Operation])
async def list_operations(
    user: CurrentUser, settings: Settings = Depends(get_settings)
) -> list[dict]:
    repo = SupabaseRepository(settings)
    return await repo.list_owned("operations", str(user.id))


@router.post("", response_model=Operation, status_code=status.HTTP_201_CREATED)
async def create_operation(
    payload: OperationCreate,
    background_tasks: BackgroundTasks,
    user: CurrentUser,
    settings: Settings = Depends(get_settings),
) -> dict:
    repo = SupabaseRepository(settings)
    now = datetime.now(UTC).isoformat()
    row = {
        "user_id": str(user.id),
        "title": _title(payload),
        "direction": payload.direction,
        "status": "draft",
        "product": payload.product,
        "origin_country": payload.origin_country,
        "destination_country": payload.destination_country,
        "quantity": payload.quantity,
        "quantity_unit": payload.quantity_unit,
        "fob_value": payload.fob_value,
        "currency": payload.currency.upper(),
        "incoterm": payload.incoterm,
        "notes": payload.notes,
        "risk_score": deterministic_risk_score(
            payload.product,
            payload.origin_country,
            fob_value=payload.fob_value,
        ),
        "analysis": {},
        "created_at": now,
        "updated_at": now,
    }
    operation = await repo.insert("operations", row)
    background_tasks.add_task(
        ResendService(settings).send_operation_created,
        recipient=user.email,
        user_name=user.name,
        title=operation["title"],
        operation_id=operation["id"],
    )
    return operation


@router.get("/{operation_id}", response_model=Operation)
async def get_operation(
    operation_id: UUID,
    user: CurrentUser,
    settings: Settings = Depends(get_settings),
) -> dict:
    row = await SupabaseRepository(settings).get_owned(
        "operations", str(operation_id), str(user.id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Operation not found")
    return row


@router.patch("/{operation_id}", response_model=Operation)
async def update_operation(
    operation_id: UUID,
    payload: OperationUpdate,
    user: CurrentUser,
    settings: Settings = Depends(get_settings),
) -> dict:
    changes = payload.model_dump(exclude_none=True)
    changes["updated_at"] = datetime.now(UTC).isoformat()
    row = await SupabaseRepository(settings).update_owned(
        "operations", str(operation_id), str(user.id), changes
    )
    if not row:
        raise HTTPException(status_code=404, detail="Operation not found")
    return row


@router.delete("/{operation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_operation(
    operation_id: UUID,
    user: CurrentUser,
    settings: Settings = Depends(get_settings),
) -> Response:
    deleted = await SupabaseRepository(settings).delete_owned(
        "operations", str(operation_id), str(user.id)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Operation not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
