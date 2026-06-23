from typing import Any
from urllib.parse import quote

import httpx
from fastapi import HTTPException, status

from ..config import Settings


class SupabaseRepository:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = f"{settings.supabase_url.rstrip('/')}/rest/v1"

    @property
    def configured(self) -> bool:
        return bool(self.settings.supabase_url and self.settings.supabase_secret_key)

    def _headers(self, prefer: str | None = None) -> dict[str, str]:
        headers = {
            "apikey": self.settings.supabase_secret_key,
            "Authorization": f"Bearer {self.settings.supabase_secret_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    async def _request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        if not self.configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase database is not configured",
            )
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.request(
                    method,
                    f"{self.base_url}/{quote(table, safe='')}",
                    headers=self._headers(prefer),
                    params=params,
                    json=json,
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service unavailable",
            ) from exc

        if response.status_code >= 400:
            message = response.text[:500]
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Database request failed: {message}",
            )
        if not response.content:
            return None
        return response.json()

    async def list_owned(
        self,
        table: str,
        user_id: str,
        *,
        select: str = "*",
        extra: dict[str, str] | None = None,
        order: str = "created_at.desc",
    ) -> list[dict[str, Any]]:
        params = {"select": select, "user_id": f"eq.{user_id}", "order": order}
        if extra:
            params.update(extra)
        return await self._request("GET", table, params=params)

    async def get_owned(
        self, table: str, record_id: str, user_id: str
    ) -> dict[str, Any] | None:
        rows = await self._request(
            "GET",
            table,
            params={
                "select": "*",
                "id": f"eq.{record_id}",
                "user_id": f"eq.{user_id}",
                "limit": "1",
            },
        )
        return rows[0] if rows else None

    async def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        rows = await self._request(
            "POST", table, json=row, prefer="return=representation"
        )
        return rows[0]

    async def update_owned(
        self, table: str, record_id: str, user_id: str, changes: dict[str, Any]
    ) -> dict[str, Any] | None:
        rows = await self._request(
            "PATCH",
            table,
            params={"id": f"eq.{record_id}", "user_id": f"eq.{user_id}"},
            json=changes,
            prefer="return=representation",
        )
        return rows[0] if rows else None

    async def delete_owned(self, table: str, record_id: str, user_id: str) -> bool:
        rows = await self._request(
            "DELETE",
            table,
            params={"id": f"eq.{record_id}", "user_id": f"eq.{user_id}"},
            prefer="return=representation",
        )
        return bool(rows)

    async def list_public(
        self,
        table: str,
        *,
        select: str = "*",
        extra: dict[str, str] | None = None,
        order: str = "rating.desc",
    ) -> list[dict[str, Any]]:
        params = {"select": select, "order": order}
        if extra:
            params.update(extra)
        return await self._request("GET", table, params=params)
