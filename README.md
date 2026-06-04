# FastLedger

Plataforma web para importaciones inteligentes hacia Ecuador. FastLedger combina calculadoras de costos, asistencia basada en IA y trazabilidad tipo blockchain para ayudar a personas, PyMEs y emprendedores a estimar, organizar y documentar procesos de importacion.

## Propuesta

FastLedger busca reducir la incertidumbre del comercio internacional al Ecuador. La aplicacion permite estimar costos antes de comprar, orientar al usuario sobre impuestos y tramites, y centralizar informacion clave para el proceso de aduanizacion.

## Funcionalidades principales

- Calculadora de importacion para paquetes, vehiculos y carga.
- Estimacion de aranceles, IVA, flete, seguros y costos operativos.
- Asistente conversacional para dudas frecuentes sobre importacion.
- Flujo de contratacion con codigo de orden.
- Concepto de trazabilidad blockchain para registrar hitos logisticos y aduaneros.
- Material comercial y tecnico en PDF para presentar el proyecto.

## Estructura del repositorio

```text
FASTLEDGER/
|- index.html
|- styles.css
|- app.js
|- src/
|  |- calculator.js
|  |- database.js
|- tests/
|  |- calculator.test.js
|- docs/
|  |- formulas.md
|  |- database.md
|- Proyecto FastLedger - Propuesta Comercial y Tecnica.pdf
|- Whitepaper FastLedger V3 - Importacion Inteligente.pdf
|- Resumen Ejecutivo FastLedger.pdf
```

## Documentos

- `Proyecto FastLedger - Propuesta Comercial y Tecnica.pdf`: propuesta comercial y tecnica del proyecto.
- `Whitepaper FastLedger V3 - Importacion Inteligente.pdf`: documento conceptual y tecnico de la solucion.
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

La app registra usuarios y conversaciones mediante `src/database.js`.

- Sin configuracion externa, guarda datos localmente en el navegador para pruebas.
- Para base de datos real, configura Supabase siguiendo `docs/database.md`.
- No se deben guardar contrasenas directamente en tablas; para produccion usa un proveedor de autenticacion.

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

- Revisar textos visibles, datos de contacto y consistencia visual.
- Agregar validaciones mas completas para entradas de calculadora.
- Mantener sincronizados los supuestos de `src/calculator.js` y `docs/formulas.md`.

### Mediano plazo

- Crear una fuente de datos mantenible para aranceles, paises, categorias y tarifas.
- Ampliar pruebas para mas escenarios de calculo.
- Preparar un flujo de despliegue automatizado.

### Largo plazo

- Integrar servicios reales de cotizacion logistica.
- Conectar un backend para usuarios, ordenes y trazabilidad.
- Implementar registros verificables para hitos de importacion.
- Crear panel administrativo para operaciones y seguimiento.

## Recomendaciones de desarrollo

- Mantener `index.html` como punto de entrada principal.
- Evitar nombres genericos o con sufijos como `(1)` en archivos criticos.
- Documentar cualquier formula de calculo antes de usarla en produccion.
- Validar informacion aduanera contra fuentes oficiales antes de presentarla como definitiva.

## Equipo

Proyecto desarrollado para Hackathon 2026 en Quito, Ecuador, con enfoque en ODS 9: Industria, Innovacion e Infraestructura.
