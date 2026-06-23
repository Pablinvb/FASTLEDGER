import asyncio

from app.config import Settings
from app.services.gemini import GeminiService


def test_fallback_creates_structured_analysis_without_key():
    settings = Settings(gemini_api_key="")
    analysis = asyncio.run(
        GeminiService(settings).analyze(
            "Quiero importar 300 drones desde Shenzhen a Ecuador"
        )
    )
    assert analysis.product == "Drones"
    assert analysis.tariff_code == "8806.22.00"
    assert analysis.risk_score > 0
