from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


TradeDirection = Literal["import", "export"]
OperationStatus = Literal[
    "draft", "analysis", "planned", "in_transit", "customs", "delivered", "cancelled"
]


class UserIdentity(BaseModel):
    id: UUID
    email: str
    name: str = "Usuario"
    email_verified: bool = False


class OperationCreate(BaseModel):
    direction: TradeDirection = "import"
    product: str = Field(min_length=2, max_length=200)
    origin_country: str = Field(min_length=2, max_length=100)
    destination_country: str = Field(default="Ecuador", min_length=2, max_length=100)
    quantity: float | None = Field(default=None, ge=0)
    quantity_unit: str | None = Field(default=None, max_length=40)
    fob_value: float | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    incoterm: str | None = Field(default=None, max_length=10)
    notes: str | None = Field(default=None, max_length=3000)


class OperationUpdate(BaseModel):
    status: OperationStatus | None = None
    title: str | None = Field(default=None, max_length=240)
    analysis: dict[str, Any] | None = None
    risk_score: int | None = Field(default=None, ge=0, le=100)
    estimated_total: float | None = Field(default=None, ge=0)
    estimated_days: int | None = Field(default=None, ge=0)


class Operation(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    direction: TradeDirection
    status: OperationStatus
    product: str
    origin_country: str
    destination_country: str
    quantity: float | None = None
    quantity_unit: str | None = None
    fob_value: float | None = None
    currency: str = "USD"
    incoterm: str | None = None
    notes: str | None = None
    risk_score: int = 0
    estimated_total: float | None = None
    estimated_days: int | None = None
    analysis: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class FastyAnalyzeRequest(BaseModel):
    message: str = Field(min_length=5, max_length=8000)
    operation_id: UUID | None = None


class CostItem(BaseModel):
    label: str
    amount: float


class SupplierSuggestion(BaseModel):
    name: str
    country: str
    rating: float = Field(ge=0, le=5)
    reason: str


class FastyAnalysis(BaseModel):
    title: str
    direction: TradeDirection
    product: str
    origin_country: str
    destination_country: str
    tariff_code: str
    executive_summary: str
    permits: list[str]
    regulatory_risks: list[str]
    risk_score: int = Field(ge=0, le=100)
    estimated_days_min: int = Field(ge=0)
    estimated_days_max: int = Field(ge=0)
    estimated_total: float = Field(ge=0)
    projected_margin_percent: float
    route: list[str]
    costs: list[CostItem]
    suppliers: list[SupplierSuggestion]
    carriers: list[str]
    financing_options: list[str]
    timeline: list[str]
    assumptions: list[str]
    disclaimer: str


class DocumentRecord(BaseModel):
    id: UUID
    operation_id: UUID
    user_id: UUID
    name: str
    document_type: str
    mime_type: str
    size_bytes: int
    sha256: str
    storage_path: str | None = None
    status: str
    created_at: datetime


class DocumentHashResponse(BaseModel):
    name: str
    mime_type: str
    size_bytes: int
    sha256: str


class Supplier(BaseModel):
    id: UUID
    name: str
    country: str
    city: str | None = None
    categories: list[str] = Field(default_factory=list)
    rating: float = 0
    risk_score: int = 50
    verified: bool = False
    certifications: list[str] = Field(default_factory=list)
    minimum_order: str | None = None
    lead_time_days: int | None = None
