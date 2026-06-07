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
      throw new Error(data.error_description || data.msg || data.message || `Error de autenticacion (${res.status})`);
    }
    return data;
  }

  function saveSession(session){
    if(session && session.access_token){
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
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

    const data = await authFetch("signup", {
      email: emailCheck.email,
      password,
      data: {name: cleanName},
      options: {
        emailRedirectTo: `${location.origin}${location.pathname}`
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
    saveSession(data);
    const user = userFromAuth(data.user);
    if(!user?.email_verified){
      throw new Error("Revisa tu correo y confirma la cuenta antes de iniciar sesion.");
    }
    return user;
  }

  async function currentUser(){
    if(!configured()) return null;
    const session = readSession();
    if(!session) return null;
    const res = await fetch(authUrl("user"), {
      headers: {
        "apikey": cfg.anonKey,
        "Authorization": `Bearer ${session.access_token}`
      }
    });
    if(!res.ok){
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return userFromAuth(await res.json());
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
    currentUser,
    signOut
  };
})(window);
