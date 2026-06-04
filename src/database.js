/* FastLedger client data layer.
 * Uses Supabase when window.FASTLEDGER_SUPABASE is configured; otherwise
 * persists demo data locally in the browser.
 */
(function(root){
  const LOCAL_KEY = "fastledger_local_db_v1";
  const cfg = root.FASTLEDGER_SUPABASE || null;

  function readLocal(){
    try{
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {users:[],consultations:[]};
    }catch(_){
      return {users:[],consultations:[]};
    }
  }
  function writeLocal(db){
    localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
  }
  function id(prefix){
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  }
  function now(){
    return new Date().toISOString();
  }

  async function supabaseInsert(table, row){
    const res = await fetch(`${cfg.url.replace(/\/$/,"")}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "apikey": cfg.anonKey,
        "Authorization": `Bearer ${cfg.anonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(row)
    });
    if(!res.ok) throw new Error(`Supabase insert failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  }

  async function upsertUser(user){
    const clean = {
      id: user.id || id("usr"),
      name: user.name || "",
      email: (user.email || "").toLowerCase(),
      created_at: user.created_at || now(),
      last_seen_at: now()
    };

    if(cfg && cfg.url && cfg.anonKey){
      return supabaseInsert("users", clean);
    }

    const db = readLocal();
    const existing = db.users.find(u => u.email === clean.email);
    if(existing){
      Object.assign(existing, clean, {id: existing.id, created_at: existing.created_at});
      writeLocal(db);
      return existing;
    }
    db.users.push(clean);
    writeLocal(db);
    return clean;
  }

  async function saveConsultation(entry){
    const row = {
      id: entry.id || id("con"),
      user_email: (entry.user_email || "invitado").toLowerCase(),
      user_name: entry.user_name || "Invitado",
      role: entry.role,
      message: entry.message,
      quote: entry.quote || null,
      created_at: now()
    };

    if(cfg && cfg.url && cfg.anonKey){
      return supabaseInsert("consultations", row);
    }

    const db = readLocal();
    db.consultations.push(row);
    writeLocal(db);
    return row;
  }

  async function listConsultations(email){
    const db = readLocal();
    return db.consultations.filter(c => c.user_email === (email || "invitado").toLowerCase());
  }

  root.FastLedgerDB = {
    mode: cfg && cfg.url && cfg.anonKey ? "supabase" : "local",
    upsertUser,
    saveConsultation,
    listConsultations
  };
})(window);
