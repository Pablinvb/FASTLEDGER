/* FastLedger secure backend client.
 * The browser sends the Supabase user access token to FastAPI. Secret keys
 * remain in Render environment variables.
 */
(function(root){
  const baseUrl = String(root.FASTLEDGER_BACKEND_URL || "").replace(/\/$/,"");
  const SESSION_KEY = "fastledger_auth_session_v1";

  function session(){
    try{
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    }catch(_){
      return null;
    }
  }

  function token(){
    return session()?.access_token || "";
  }

  async function request(path, options){
    if(!baseUrl) throw new Error("El backend de FastLedger aun no esta configurado.");
    const accessToken = token();
    if(!accessToken) throw new Error("Inicia sesion para usar FASTY con datos reales.");
    const headers = new Headers(options?.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if(options?.body && !(options.body instanceof FormData)){
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${baseUrl}${path}`, {...options, headers});
    const data = await response.json().catch(() => ({}));
    if(!response.ok){
      throw new Error(data.detail || data.message || `Error del backend (${response.status})`);
    }
    return data;
  }

  async function analyze(message, file){
    if(file){
      const form = new FormData();
      form.append("message", message);
      form.append("file", file);
      return request("/v1/fasty/analyze-file", {method:"POST", body:form});
    }
    return request("/v1/fasty/analyze", {
      method:"POST",
      body:JSON.stringify({message})
    });
  }

  async function createOperation(payload){
    return request("/v1/operations", {
      method:"POST",
      body:JSON.stringify(payload)
    });
  }

  async function listOperations(){
    return request("/v1/operations", {method:"GET"});
  }

  async function listSuppliers(){
    if(!baseUrl) return [];
    const response = await fetch(`${baseUrl}/v1/suppliers`);
    if(!response.ok) return [];
    return response.json();
  }

  root.FastLedgerAPI = {
    configured: Boolean(baseUrl),
    baseUrl,
    analyze,
    createOperation,
    listOperations,
    listSuppliers
  };
})(window);
