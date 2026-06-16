/* FastLedger authentication layer.
 * Uses Supabase Auth when window.FASTLEDGER_SUPABASE is configured.
 * Without a real auth provider, registration/login are blocked so the app
 * does not pretend to verify emails from a static page.
 */
(function(root){
  const cfg = root.FASTLEDGER_SUPABASE || null;
  const SESSION_KEY = "fastledger_auth_session_v1";
  const disposableDomains = new Set([
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "tempmail.com",
    "temp-mail.org",
    "yopmail.com"
  ]);

  function configured(){
    return Boolean(cfg && cfg.url && cfg.anonKey);
  }

  function cleanEmail(email){
    return String(email || "").trim().toLowerCase();
  }

  function validateEmail(email){
    const value = cleanEmail(email);
    const basic = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    if(!basic.test(value)){
      return {ok:false, message:"Ingresa un correo valido, por ejemplo nombre@empresa.com."};
    }
    const [local, domain] = value.split("@");
    if(!local || local.length > 64 || value.length > 254){
      return {ok:false, message:"El correo ingresado es demasiado largo o incompleto."};
    }
    if(domain.includes("..") || domain.startsWith("-") || domain.endsWith("-")){
      return {ok:false, message:"El dominio del correo no parece valido."};
    }
    if(disposableDomains.has(domain)){
      return {ok:false, message:"Usa un correo permanente. No aceptamos correos temporales."};
    }
    if(["example.com","test.com","fake.com","correo.com"].includes(domain)){
      return {ok:false, message:"Usa un correo real para poder verificar tu cuenta."};
    }
    return {ok:true, email:value};
  }

  function validatePassword(pass){
    const value = String(pass || "");
    if(value.length < 8){
      return {ok:false, message:"La contrasena debe tener al menos 8 caracteres."};
    }
    if(!/[A-Za-z]/.test(value) || !/\d/.test(value)){
      return {ok:false, message:"La contrasena debe combinar letras y numeros."};
    }
    return {ok:true};
  }

  function authUrl(path){
    return `${cfg.url.replace(/\/$/,"")}/auth/v1/${path}`;
  }

  function appRedirectUrl(){
    return `${location.origin}${location.pathname}`;
  }

  async function authFetch(path, body, accessToken){
    const headers = {
      "apikey": cfg.anonKey,
      "Content-Type": "application/json"
    };
    headers.Authorization = `Bearer ${accessToken || cfg.anonKey}`;
    const res = await fetch(authUrl(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body || {})
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok){
      if(res.status >= 500 && /database error/i.test(data.msg || data.message || "")){
        throw new Error("Supabase no pudo completar el registro por un error interno de base de datos. Revisa Auth Logs y triggers de auth.users.");
      }
      throw new Error(data.error_description || data.msg || data.message || `Error de autenticacion (${res.status})`);
    }
    return data;
  }

  async function authGet(path, accessToken){
    const headers = {
      "apikey": cfg.anonKey,
      "Authorization": `Bearer ${accessToken || cfg.anonKey}`
    };
    const res = await fetch(authUrl(path), {headers});
    const data = await res.json().catch(() => ({}));
    if(!res.ok){
      throw new Error(data.error_description || data.msg || data.message || `Error de autenticacion (${res.status})`);
    }
    return data;
  }

  function saveSession(session){
    if(session && session.access_token){
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  function saveSessionFromUrl(){
    const query = new URLSearchParams(location.search);
    const queryAccessToken = query.get("access_token");
    if(queryAccessToken){
      saveSession({
        access_token: queryAccessToken,
        refresh_token: query.get("refresh_token"),
        expires_at: Math.floor(Date.now() / 1000) + Number(query.get("expires_in") || 3600),
        token_type: query.get("token_type") || "bearer"
      });
      history.replaceState(null, "", `${location.origin}${location.pathname}`);
      return true;
    }

    const hash = new URLSearchParams(location.hash.replace(/^#/,""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if(accessToken){
      saveSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + Number(hash.get("expires_in") || 3600),
        token_type: hash.get("token_type") || "bearer"
      });
      history.replaceState(null, "", `${location.origin}${location.pathname}${location.search}`);
      return true;
    }
    return false;
  }

  async function verifyTokenHashFromUrl(){
    const params = new URLSearchParams(location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") || "email";
    if(!tokenHash) return false;

    const data = await authFetch("verify", {
      token_hash: tokenHash,
      type
    });
    if(data.session) saveSession(data.session);
    history.replaceState(null, "", `${location.origin}${location.pathname}`);
    return true;
  }

  function readSession(){
    try{
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if(session && session.access_token && (!session.expires_at || session.expires_at * 1000 > Date.now())){
        return session;
      }
    }catch(_){}
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  function userFromAuth(user){
    if(!user) return null;
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      email: cleanEmail(user.email),
      email_verified: Boolean(user.email_confirmed_at || user.confirmed_at)
    };
  }

  async function signUp(name, email, password){
    if(!configured()){
      throw new Error("Para crear cuentas verificadas debes configurar Supabase Auth.");
    }
    const emailCheck = validateEmail(email);
    if(!emailCheck.ok) throw new Error(emailCheck.message);
    const passCheck = validatePassword(password);
    if(!passCheck.ok) throw new Error(passCheck.message);
    const cleanName = String(name || "").trim();
    if(cleanName.length < 3) throw new Error("Ingresa tu nombre completo.");

    const redirectTo = encodeURIComponent(appRedirectUrl());
    const data = await authFetch(`signup?redirect_to=${redirectTo}`, {
      email: emailCheck.email,
      password,
      data: {name: cleanName},
      options: {
        email_redirect_to: appRedirectUrl()
      }
    });
    if(data.session) saveSession(data.session);
    return {
      user: userFromAuth(data.user),
      needsEmailConfirmation: !data.session || !data.user?.email_confirmed_at
    };
  }

  async function signIn(email, password){
    if(!configured()){
      throw new Error("El inicio de sesion seguro requiere Supabase Auth configurado.");
    }
    const emailCheck = validateEmail(email);
    if(!emailCheck.ok) throw new Error(emailCheck.message);
    const data = await authFetch("token?grant_type=password", {
      email: emailCheck.email,
      password
    });
    const user = userFromAuth(data.user);
    if(!user?.email_verified){
      throw new Error("Revisa tu correo y confirma la cuenta antes de iniciar sesion.");
    }
    saveSession(data);
    return user;
  }

  async function resendConfirmation(email){
    if(!configured()){
      throw new Error("El reenvio requiere Supabase Auth configurado.");
    }
    const emailCheck = validateEmail(email);
    if(!emailCheck.ok) throw new Error(emailCheck.message);
    return authFetch("resend", {
      type: "signup",
      email: emailCheck.email,
      options: {
        email_redirect_to: appRedirectUrl()
      }
    });
  }

  async function currentUser(){
    if(!configured()) return null;
    saveSessionFromUrl();
    await verifyTokenHashFromUrl();
    const session = readSession();
    if(!session) return null;
    try{
      return userFromAuth(await authGet("user", session.access_token));
    }catch(_){
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async function signOut(){
    const session = readSession();
    localStorage.removeItem(SESSION_KEY);
    if(configured() && session){
      try{ await authFetch("logout", {}, session.access_token); }catch(_){}
    }
  }

  root.FastLedgerAuth = {
    mode: configured() ? "supabase" : "disabled",
    validateEmail,
    validatePassword,
    signUp,
    signIn,
    resendConfirmation,
    currentUser,
    signOut
  };
})(window);
