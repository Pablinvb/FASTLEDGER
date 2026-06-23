import html

import httpx

from ..config import Settings


class ResendService:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def configured(self) -> bool:
        return bool(self.settings.resend_api_key)

    async def send_operation_created(
        self, *, recipient: str, user_name: str, title: str, operation_id: str
    ) -> bool:
        if not self.configured or not recipient:
            return False
        body = {
            "from": self.settings.resend_from_email,
            "to": [recipient],
            "subject": f"FastLedger recibio tu operacion: {title}",
            "html": (
                f"<h2>Hola, {html.escape(user_name)}</h2>"
                f"<p>Tu operacion <strong>{html.escape(title)}</strong> fue creada.</p>"
                f"<p>Referencia: <code>{html.escape(operation_id)}</code></p>"
                "<p>FASTY puede continuar con clasificacion, riesgo, costos y ruta.</p>"
            ),
        }
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {self.settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
        return response.status_code < 300
