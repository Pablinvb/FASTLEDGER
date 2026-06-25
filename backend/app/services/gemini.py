import base64
import json
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import HTTPException, status

from ..config import Settings
from ..models import FastyAnalysis
from .risk import deterministic_risk_score


SYSTEM_PROMPT = """
Actua como FASTY Trade AI, agente profesional de comercio exterior para
Latinoamerica con foco inicial en Ecuador. Convierte la solicitud en un plan
operativo estructurado. No inventes leyes, permisos, tasas, proveedores ni
datos en tiempo real. Cuando un dato deba validarse, incluyelo como supuesto o
riesgo. Los proveedores sugeridos son candidatos de investigacion, no
recomendaciones verificadas. Devuelve exclusivamente JSON valido conforme al
schema solicitado.

Integra siempre estos criterios operativos:
- Usa primero los datos estructurados enviados por el frontend y el contenido
  real del archivo adjunto. No asumas drones, China, Shenzhen ni Guayaquil si
  no aparecen en el mensaje, campos estructurados o documento.
- Si el usuario sube una factura, identifica producto, proveedor, pais de
  origen, destino, Incoterm, FOB, moneda, peso y cantidades. Si no puedes
  extraer un dato, marcalo como supuesto o pendiente.
- Diferencia courier/paquete pequeno de importacion a consumo o regimen 10.
- Si es carga comercial, vehiculos, maquinaria o contenedor, menciona agente de
  aduana, DAI, bodegaje, gastos locales, transporte interno y seguro.
- Desglosa costos con FOB, gastos en origen segun Incoterm, flete, seguro,
  CIF, ad-valorem, FODINFA, IVA, agente, bodegaje, gastos locales y margen.
- Recomienda seguro desde origen hasta bodega/destino final del cliente.
- Antes de importar, exige revision previa de producto, partida arancelaria,
  restricciones, documentos de control previo, pais de origen, proveedor y
  autorizacion de distribucion cuando exista marca.
- Para exportacion desde Ecuador, aclara que normalmente no se liquidan
  tributos de importacion en Ecuador, pero si aplican documentos, certificados,
  logistica, seguro e Incoterm.

Incluye siempre un descargo indicando que la clasificacion arancelaria y
normativa deben validarse con un agente y fuentes oficiales.
""".strip()


def _analysis_schema() -> dict[str, Any]:
    return FastyAnalysis.model_json_schema()


class GeminiService:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def configured(self) -> bool:
        return bool(self.settings.gemini_api_key)

    async def analyze(self, message: str) -> FastyAnalysis:
        if not self.configured:
            return self._fallback(message)

        return await self._generate([{"text": message}])

    async def analyze_file(
        self, *, message: str, content: bytes, mime_type: str
    ) -> FastyAnalysis:
        if not self.configured:
            return self._fallback(message)
        parts = [
            {
                "inlineData": {
                    "mimeType": mime_type,
                    "data": base64.b64encode(content).decode("ascii"),
                }
            },
            {"text": message},
        ]
        return await self._generate(parts)

    async def _generate(self, parts: list[dict[str, Any]]) -> FastyAnalysis:
        model = quote(self.settings.gemini_model, safe="")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )
        body = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
                "responseSchema": _analysis_schema(),
            },
        }
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    url,
                    params={"key": self.settings.gemini_api_key},
                    json=body,
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini service unavailable",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini request failed: {response.text[:500]}",
            )

        data = response.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(text)
            analysis = FastyAnalysis.model_validate(parsed)
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini returned an invalid structured response",
            ) from exc

        if analysis.risk_score == 0:
            analysis.risk_score = deterministic_risk_score(
                analysis.product,
                analysis.origin_country,
                permits_count=len(analysis.permits),
            )
        return analysis

    def _fallback(self, message: str) -> FastyAnalysis:
        lower = message.lower()
        product = "mercancia"
        origin = "Por confirmar"
        tariff = "Por clasificar"
        if "drone" in lower:
            product, origin, tariff = "Drones", "China", "8806.22.00"
        elif "flor" in lower or "flower" in lower or "rosa" in lower:
            product, origin, tariff = "Flores frescas", "Colombia" if "colombia" in lower else "Por confirmar", "0603.19.00"
        elif "acero" in lower:
            product, origin, tariff = "Acero estructural", "Turquia", "7216.50.00"
        elif "laptop" in lower:
            product, origin, tariff = "Computadores portatiles", "China", "8471.30.00"
        elif "cacao" in lower:
            product, origin, tariff = "Cacao", "Ecuador", "1801.00.19"

        risk = deterministic_risk_score(product, origin, permits_count=2)
        return FastyAnalysis(
            title=f"Operacion de {product}",
            direction="export" if "export" in lower else "import",
            product=product,
            origin_country=origin,
            destination_country="Ecuador" if "export" not in lower else "Por confirmar",
            tariff_code=tariff,
            executive_summary=(
                "Analisis preliminar generado sin Gemini. Configura GEMINI_API_KEY "
                "para obtener un expediente detallado."
            ),
            permits=[
                "Registro del operador",
                "Revision previa de restricciones y documentos de control",
                "Agente de aduana o courier segun regimen",
            ],
            regulatory_risks=["Clasificacion y permisos pendientes de validacion oficial"],
            risk_score=risk,
            estimated_days_min=25,
            estimated_days_max=45,
            estimated_total=0,
            projected_margin_percent=0,
            route=[origin, "Puerto por confirmar", "Destino por confirmar"],
            costs=[
                {"label": "FOB pendiente de confirmar", "amount": 0},
                {"label": "Flete internacional pendiente", "amount": 0},
                {"label": "Seguro puerta a puerta pendiente", "amount": 0},
                {"label": "Gastos locales, bodegaje y agente pendientes", "amount": 0},
            ],
            suppliers=[],
            carriers=[],
            financing_options=["Evaluacion de credito comercial"],
            timeline=[
                "Validar producto, proveedor y marca",
                "Confirmar partida, restricciones y permisos",
                "Cotizar flete, seguro, bodegaje, agente y transporte interno",
            ],
            assumptions=[
                "No se recibieron datos completos de FOB, peso e Incoterm",
                "La viabilidad depende de revision previa con agente de aduana y fuentes oficiales",
            ],
            disclaimer=(
                "Estimacion preliminar. Valida clasificacion, tributos y permisos "
                "con SENAE, autoridades competentes y un agente de aduana."
            ),
        )
