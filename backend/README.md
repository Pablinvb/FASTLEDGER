# FastLedger API

Backend FastAPI para el Trade Operating System de FastLedger.

## Funciones

- Valida sesiones mediante Supabase Auth.
- Registra operaciones por usuario.
- Ejecuta FASTY Trade AI con Gemini y salida JSON estructurada.
- Analiza texto, imagen, PDF y audio.
- Calcula un Risk Score determinista como control adicional.
- Registra documentos y hashes SHA-256.
- Expone proveedores verificados.
- Envia correos transaccionales con Resend.

## Desarrollo local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

API:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/health
```

## Pruebas

```bash
pytest -q
```

## Supabase

Ejecuta en SQL Editor:

```text
supabase/migrations/001_trade_os.sql
```

El script reemplaza el trigger `on_auth_user_created` por uno idempotente y
crea perfiles, operaciones, consultas IA, documentos, eventos, proveedores y
politicas RLS.

## Variables de Render

Configura todas las variables de `.env.example` en Render. Nunca publiques
`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY` ni `RESEND_API_KEY` en GitHub Pages.

## Conectar el frontend

Cuando Render entregue la URL del servicio, actualiza `config.js`:

```js
window.FASTLEDGER_BACKEND_URL = "https://fastledger-api.onrender.com";
```
