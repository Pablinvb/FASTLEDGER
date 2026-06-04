/* Gemini connector for Ledger.
 *
 * Production architecture:
 * GitHub Pages -> Vercel Function /api/asesor -> Gemini API.
 *
 * Configure in a public config.js loaded before this file:
 * window.FASTLEDGER_GEMINI = {
 *   endpoint: "https://tu-proyecto.vercel.app/api/asesor"
 * };
 */
(function(root){
  const cfg = root.FASTLEDGER_GEMINI || {};

  function configured(){
    return Boolean(cfg.endpoint);
  }

  function extractText(data){
    if(!data) return "";
    if(typeof data === "string") return data;
    if(data.text) return data.text;
    if(data.respuesta) return data.respuesta;
    if(data.message) return data.message;
    if(data.response) return data.response;
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts.map(part => part.text || "").join("").trim();
  }

  async function generateLedgerResponse(payload){
    if(!configured()) return payload.localResponse;
    try{
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          mensaje: payload.message,
          estado: payload.state || {},
          respuestaLocal: payload.localResponse || ""
        })
      });
      if(!res.ok) throw new Error(`Asesor endpoint failed: ${res.status}`);
      const data = await res.json();
      const text = extractText(data);
      return text && text.length > 5 ? text : payload.localResponse;
    }catch(err){
      console.warn("Gemini/Vercel no disponible, usando respuesta local", err);
      return payload.localResponse;
    }
  }

  root.FastLedgerAI = {
    configured,
    generateLedgerResponse
  };
})(window);
