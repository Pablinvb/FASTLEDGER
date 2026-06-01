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
â”œâ”€â”€ index.html
â”œâ”€â”€ README.md
â”œâ”€â”€ Proyecto FastLedger - Propuesta Comercial y TÃ©cnica.pdf
â”œâ”€â”€ Whitepaper FastLedger V3 - ImportaciÃ³n Inteligente.pdf
â””â”€â”€ Resumen Ejecutivo FastLedger.pdf
```

## Ejecutar localmente

Este proyecto funciona como una pagina HTML estatica.

1. Clona el repositorio:

```bash
git clone https://github.com/Pablinvb/FASTLEDGER.git
cd FASTLEDGER
```

2. Abre `index.html` directamente en el navegador.

3. Opcionalmente, levanta un servidor local para evitar problemas con rutas o recursos externos:

```bash
python -m http.server 8000
```

Luego visita:

```text
http://localhost:8000
```

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

- Renombrar archivos para que el sitio pueda publicarse correctamente en GitHub Pages.
- Separar HTML, CSS y JavaScript en archivos independientes.
- Revisar textos visibles, datos de contacto y consistencia visual.
- Agregar validaciones para entradas de calculadora.

### Mediano plazo

- Crear una fuente de datos mantenible para aranceles, paises, categorias y tarifas.
- Agregar pruebas basicas para calculos principales.
- Documentar supuestos legales, tributarios y logisticos usados en las estimaciones.
- Preparar un flujo de despliegue automatizado.

### Largo plazo

- Integrar servicios reales de cotizacion logistica.
- Conectar un backend para usuarios, ordenes y trazabilidad.
- Implementar registros verificables para hitos de importacion.
- Crear panel administrativo para operaciones y seguimiento.

## Recomendaciones de desarrollo

- Mantener `index.html` como punto de entrada principal.
- Evitar nombres con espacios innecesarios o sufijos como `(1)` en archivos criticos.
- Documentar cualquier formula de calculo antes de usarla en produccion.
- Validar informacion aduanera contra fuentes oficiales antes de presentarla como definitiva.

## Equipo

Proyecto desarrollado para Hackathon 2026 en Quito, Ecuador, con enfoque en ODS 9: Industria, Innovacion e Infraestructura.