# Despliegue del backend FastLedger

Stack:

- Render: FastAPI.
- Supabase: Auth, PostgreSQL y RLS.
- Gemini: razonamiento y análisis multimodal.
- Resend: correo transaccional.

## 1. Supabase

En `SQL Editor`, ejecuta:

```text
backend/supabase/migrations/001_trade_os.sql
```

Después ejecuta:

```text
backend/supabase/verify_auth.sql
```

El primer script reemplaza el trigger de registro de usuario que puede producir
`Database error finding user`, crea las tablas y activa RLS.

Obtén estas variables desde Supabase:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY` puede ser la nueva secret key de Supabase o la antigua
service role key. Solo debe existir en Render.

## 2. Gemini

En Google AI Studio crea una API key y guárdala como:

```text
GEMINI_API_KEY
```

El modelo predeterminado es:

```text
gemini-2.5-flash
```

FASTY usa salidas JSON estructuradas y acepta texto, imágenes, PDF y audio.

## 3. Resend

1. Crea una cuenta en Resend.
2. Agrega un dominio propio.
3. Configura los registros DNS solicitados.
4. Espera a que el dominio aparezca como verificado.
5. Crea una API key.

Variables:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL=FastLedger <operaciones@tu-dominio.com>
OPERATIONS_EMAIL=tu-correo-operativo@tu-dominio.com
```

## 4. Render

1. En Render selecciona `New` > `Blueprint`.
2. Conecta el repositorio `Pablinvb/FASTLEDGER`.
3. Render detectará `render.yaml`.
4. Completa las variables secretas solicitadas.
5. Despliega el servicio.
6. Verifica:

```text
https://TU-SERVICIO.onrender.com/health
https://TU-SERVICIO.onrender.com/docs
```

## 5. Conectar GitHub Pages

Edita `config.js`:

```js
window.FASTLEDGER_BACKEND_URL = "https://TU-SERVICIO.onrender.com";
```

Después publica el cambio. FASTY dejará de usar los escenarios demostrativos y
consultará el backend cuando el usuario haya iniciado sesión.

## Variables completas de Render

```text
ENVIRONMENT=production
ALLOWED_ORIGINS=https://pablinvb.github.io
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=...
RESEND_FROM_EMAIL=FastLedger <operaciones@tu-dominio.com>
OPERATIONS_EMAIL=...
```

Nunca agregues las claves secretas a `config.js`, GitHub Pages o archivos
versionados.
