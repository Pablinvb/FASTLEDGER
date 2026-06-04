# Gemini para el asesor Ledger

FastLedger puede usar Gemini para mejorar el razonamiento conversacional de Ledger.

## Recomendado para produccion

No publiques una API key real en GitHub Pages. Usa un backend o proxy propio:

```js
window.FASTLEDGER_GEMINI = {
  endpoint: "https://tu-backend.com/api/ledger"
};
```

El backend debe recibir:

```json
{
  "message": "mensaje del cliente",
  "localResponse": "respuesta local segura",
  "state": {
    "producto": "ropa",
    "peso": 5,
    "pais": "Francia",
    "lastQuote": {}
  }
}
```

Y devolver:

```json
{
  "text": "respuesta final para mostrar al cliente"
}
```

## Solo para pruebas locales

Puedes usar una key directa, sabiendo que en una web publica quedara visible:

```js
window.FASTLEDGER_GEMINI = {
  apiKey: "TU_GEMINI_API_KEY",
  model: "gemini-3.5-flash"
};
```

## Comportamiento

Ledger siempre calcula primero una respuesta local segura. Gemini solo puede mejorar la redaccion y continuidad, pero no debe cambiar precios, peso, producto, pais ni reglas operativas.
