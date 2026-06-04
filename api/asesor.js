export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ text: "Metodo no permitido." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      text: "El asesor IA aun no tiene configurada la variable GEMINI_API_KEY en Vercel."
    });
  }

  const { mensaje = "", estado = {}, respuestaLocal = "" } = req.body || {};

  const prompt = `
Actua como Ledger, asesor experto de FastLedger en calculos de importacion para Ecuador.

Objetivo:
Ayudar al cliente a estimar costos, aranceles, impuestos, margen y precio final de una importacion.

Debes razonar con estos campos:
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

Reglas:
1. Responde en espanol claro, profesional y conversacional.
2. Si faltan datos, pide solo los datos faltantes y ofrece un ejemplo concreto.
3. No inventes partida arancelaria exacta ni valores legales definitivos si no estan disponibles.
4. Puedes dar una estimacion referencial si el cliente da FOB, pais, producto y flete o peso.
5. Explica que los valores son referenciales y deben validarse con SENAE/COMEX o un agente aduanero.
6. Si el usuario pregunta por vehiculos usados, indica que Ecuador no permite importarlos como regla general.
7. Si el usuario da informacion parcial, continua la conversacion sin reiniciar.
8. No uses markdown pesado. Usa HTML simple: <strong>, <br>, listas numeradas si ayudan.
9. Nunca digas que eres Gemini. Eres Ledger de FastLedger.

Formula referencial cuando existan datos:
- Seguro = FOB * 0.015 si el cliente no da seguro.
- CIF = FOB + flete + seguro.
- FODINFA = CIF * 0.005.
- Ad-valorem = CIF * porcentaje_ad_valorem.
- IVA = (CIF + ad_valorem + FODINFA) * porcentaje_IVA.
- Costos logisticos = agente + almacenaje + transporte interno + documentos, si se conocen.
- Precio final estimado = CIF + ad_valorem + FODINFA + IVA + costos_logisticos.
- Precio sugerido de venta = precio_final_estimado * (1 + margen_ganancia).

Estado actual detectado por FastLedger:
${JSON.stringify(estado, null, 2)}

Respuesta local de seguridad, si existe:
${respuestaLocal}

Pregunta del cliente:
${mensaje}
`;

  try {
    const respuesta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 900
          }
        })
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return res.status(respuesta.status).json({
        text: "No pude conectar con Gemini en este momento. Intenta nuevamente o completa producto, pais, FOB y flete para una estimacion local.",
        error: data
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim() || "";
    return res.status(200).json({ text, raw: data });
  } catch (error) {
    return res.status(500).json({
      text: "Hubo un problema con el asesor IA. Intenta nuevamente en unos segundos.",
      error: String(error?.message || error)
    });
  }
}
