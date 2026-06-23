# FastLedger

Trade Operating System para coordinar importaciones, exportaciones, aduanas,
seguros, pagos internacionales, financiamiento, certificaciones y logistica.
FastLedger combina automatizacion basada en IA, control operativo y
trazabilidad documental.

## Propuesta

FastLedger busca reducir la incertidumbre del comercio internacional al Ecuador. La aplicacion permite estimar costos antes de comprar, orientar al usuario sobre impuestos y tramites, y centralizar informacion clave para el proceso de aduanizacion.

## Funcionalidades principales

- Calculadora de importacion para paquetes, vehiculos y carga.
- Estimacion de aranceles, IVA, flete, seguros y costos operativos.
- Asistente conversacional para dudas frecuentes sobre importacion.
- Flujo de contratacion con codigo de orden.
- Concepto de trazabilidad blockchain para registrar hitos logisticos y aduaneros.
- Material comercial y tecnico en PDF para presentar el proyecto.
- FASTY Trade AI con entrada demostrativa por texto, imagen, PDF y audio.
- Dashboard ejecutivo y gemelo digital de operaciones.
- Marketplace B2B de proveedores internacionales verificados.
- Risk Score y bóveda documental con verificación de hashes.

## Estructura del repositorio

```text
FASTLEDGER/
|- index.html
|- config.js
|- styles.css
|- app.js
|- src/
|  |- calculator.js
|  |- auth.js
|  |- database.js
|  |- gemini.js
|  |- config.example.js
|  |- trade-os.js
|  |- backend.js
|- backend/
|  |- app/
|  |- supabase/
|  |- tests/
|  |- Dockerfile
|  |- requirements.txt
|- tests/
|  |- calculator.test.js
|- docs/
|  |- formulas.md
|  |- database.md
|  |- gemini.md
|  |- trade-os.md
|  |- backend-deployment.md
|- Proyecto FastLedger - Propuesta Comercial y Tecnica.pdf
|- Whitepaper FastLedger V4 - Trade Operating System.pdf
|- Whitepaper FastLedger V4 - Trade Operating System.docx
|- Resumen Ejecutivo FastLedger.pdf
```

## Documentos

- `Proyecto FastLedger - Propuesta Comercial y Tecnica.pdf`: propuesta comercial y tecnica del proyecto.
- `Whitepaper FastLedger V4 - Trade Operating System.pdf`: whitepaper actualizado del Trade Operating System, FASTY Trade AI, backend profesional, digital twin, trazabilidad documental, marketplace, risk score y roadmap.
- `Whitepaper FastLedger V4 - Trade Operating System.docx`: fuente editable del whitepaper V4.
- `Resumen Ejecutivo FastLedger.pdf`: resumen breve para presentaciones y revision rapida.

## Ejecutar localmente

Este proyecto funciona como una pagina HTML estatica.

1. Clona el repositorio:

```bash
git clone https://github.com/Pablinvb/FASTLEDGER.git
cd FASTLEDGER
```

2. Abre `index.html` directamente en el navegador.

3. Opcionalmente, levanta un servidor local:

```bash
python -m http.server 8000
```

Luego visita:

```text
http://localhost:8000
```

## Ejecutar pruebas

Las pruebas cubren escenarios base de la calculadora y la tarifa de paquetes pequenos.

```bash
node tests/calculator.test.js
```

## Formulas y supuestos

Las formulas estan documentadas en `docs/formulas.md`. Los valores son referenciales para prototipo y deben validarse con fuentes oficiales antes de usarse en operaciones reales.

## Usuarios y consultas

La app registra usuarios y conversaciones mediante `src/auth.js` y `src/database.js`.

- Sin configuracion externa, guarda consultas localmente en el navegador para pruebas.
- El registro e inicio de sesion quedan bloqueados hasta configurar Supabase Auth; asi no se aceptan correos ficticios como cuentas verificadas.
- Para base de datos real y verificacion por correo, configura Supabase siguiendo `docs/database.md`.
- No se deben guardar contrasenas directamente en tablas; usa Supabase Auth u otro proveedor de autenticacion.

## Gemini para Ledger

Ledger puede usar Gemini como motor de razonamiento conversacional mediante `src/gemini.js`.

- Sin configuracion, usa el motor local seguro.
- Con un proxy backend, Gemini mejora la redaccion y continuidad.
- No publiques API keys reales en GitHub Pages.
- La guia esta en `docs/gemini.md`.

## Backend profesional

La carpeta `backend/` contiene una API FastAPI preparada para Render:

- Supabase Auth y PostgreSQL con RLS.
- Operaciones e historial por usuario.
- FASTY con Gemini y análisis multimodal.
- Registro de documentos y hashes SHA-256.
- Risk Score.
- Marketplace de proveedores.
- Correos transaccionales mediante Resend.

La configuración completa está en `docs/backend-deployment.md`.

## Despliegue con GitHub Pages

1. En GitHub, entra a `Settings`.
2. Abre la seccion `Pages`.
3. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Guarda los cambios.
5. GitHub publicara el sitio usando `index.html`.

## Hoja de ruta

### Corto plazo

- Activar el backend en Render con Supabase, Gemini y Resend.
- Validar usuarios reales con Supabase Auth y confirmacion por correo.
- Persistir operaciones, consultas, documentos y proveedores por usuario.

### Mediano plazo

- Conectar fuentes arancelarias, OCR de facturas y analisis multimodal.
- Lanzar el primer flujo completo de FASTY Trade AI para importacion y exportacion.
- Medir Risk Score, costos, tiempos y trazabilidad documental en operaciones piloto.

### Largo plazo

- Integrar navieras, aseguradoras, bancos, courier y verificadores externos.
- Desarrollar marketplace B2B de proveedores verificados.
- Implementar digital twin operativo y trazabilidad blockchain empresarial.

## Recomendaciones de desarrollo

- Mantener `index.html` como punto de entrada principal.
- Evitar nombres genericos o con sufijos como `(1)` en archivos criticos.
- Documentar cualquier formula de calculo antes de usarla en produccion.
- Validar informacion aduanera contra fuentes oficiales antes de presentarla como definitiva.

## Equipo

Proyecto desarrollado para Hackathon 2026 en Quito, Ecuador, con enfoque en ODS 9: Industria, Innovacion e Infraestructura.
