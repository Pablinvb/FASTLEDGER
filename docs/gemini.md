# Gemini + Vercel para Ledger

FastLedger usa la arquitectura:

```text
GitHub Pages
  -> Chat del asesor Ledger
  -> Vercel Function: /api/asesor
  -> Gemini API gemini-2.5-flash
  -> Respuesta del asesor
```

## 1. Desplegar backend en Vercel

Importa este repositorio en Vercel. La funcion esta en:

```text
api/asesor.js
```

En Vercel configura la variable de entorno:

```text
GEMINI_API_KEY=tu_api_key_de_gemini
```

La funcion usa:

```text
gemini-2.5-flash
```

## 2. Conectar GitHub Pages con Vercel

Crea un archivo `config.js` en la raiz del sitio con:

```js
window.FASTLEDGER_GEMINI = {
  endpoint: "https://tu-proyecto.vercel.app/api/asesor"
};
```

Luego carga `config.js` antes de `src/gemini.js` en `index.html`:

```html
<script src="config.js"></script>
<script src="src/gemini.js"></script>
```

## 3. Datos que Ledger debe razonar

El asesor debe pedir o usar:

- Tipo de producto
- Pais de origen
- Valor FOB
- Flete
- Seguro
- Partida arancelaria
- IVA
- Ad-valorem
- FODINFA
- Costos logisticos
- Margen de ganancia
- Precio final estimado

## 4. Seguridad

No publiques `GEMINI_API_KEY` en GitHub Pages. La clave debe vivir solo en Vercel como variable de entorno.

## 5. Respuesta esperada del backend

El backend puede devolver:

```json
{
  "text": "respuesta HTML simple para el cliente"
}
```

Tambien se acepta el JSON crudo de Gemini; `src/gemini.js` extrae el texto automaticamente.
