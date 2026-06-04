/* Optional Gemini connector for Ledger.
 *
 * Recommended production setup:
 *   window.FASTLEDGER_GEMINI = { endpoint: "https://your-backend.example.com/gemini" }
 *
 * Demo-only setup for local tests:
 *   window.FASTLEDGER_GEMINI = { apiKey: "...", model: "gemini-3.5-flash" }
 *
 * Do not expose real production keys in GitHub Pages.
 */
(function(root){
  const cfg = root.FASTLEDGER_GEMINI || {};
  const DEFAULT_MODEL = "gemini-3.5-flash";

  function configured(){
    return Boolean(cfg.endpoint || cfg.apiKey);
  }

  function buildPrompt(payload){
    return [
      "Eres Ledger, asesor virtual de FastLedger para importaciones hacia Ecuador.",
      "Responde en español, con tono claro, comercial y breve.",
      "Tu especialidad en este chat son paquetes pequeños con tarifa fija de $5 USD por libra.",
      "No cambies montos, pesos, país, producto ni reglas si ya vienen en la respuesta local.",
      "Si faltan datos, pide solo lo que falta: producto, peso o país de origen.",
      "Si preguntan por vehículos, motos, camiones o maquinaria grande, redirige a Presupuesto IA.",
      "No inventes regulaciones. Usa la respuesta local como fuente de verdad.",
      "",
      "Estado de la conversación:",
      JSON.stringify(payload.state || {}, null, 2),
      "",
      "Mensaje del cliente:",
      payload.message,
      "",
      "Respuesta local aprobada por FastLedger:",
      payload.localResponse,
      "",
      "Mejora la respuesta para que fluya como conversación natural. Devuelve solo el texto final en HTML simple."
    ].join("\n");
  }

  async function callProxy(payload){
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error(`Gemini proxy failed: ${res.status}`);
    const data = await res.json();
    return data.text || data.response || data.message || "";
  }

  async function callDirect(payload){
    const model = cfg.model || DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": cfg.apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(payload) }] }]
      })
    });
    if(!res.ok) throw new Error(`Gemini API failed: ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim() || "";
  }

  async function generateLedgerResponse(payload){
    if(!configured()) return payload.localResponse;
    try{
      const text = cfg.endpoint ? await callProxy(payload) : await callDirect(payload);
      return text && text.length > 5 ? text : payload.localResponse;
    }catch(err){
      console.warn("Gemini no disponible, usando respuesta local", err);
      return payload.localResponse;
    }
  }

  root.FastLedgerAI = {
    configured,
    generateLedgerResponse
  };
})(window);
