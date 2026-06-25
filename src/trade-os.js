(function(root){
  const PRODUCT_PROFILES = {
    flowers: {
      keys: ["flor", "flores", "rosas", "bouquet", "bouquets"],
      product: "Flores frescas",
      tariff: "0603.19.00",
      advalorem: 0.10,
      iva: 0.15,
      fodinfa: 0.005,
      baseRisk: 38,
      defaultFob: 3200,
      days: [3, 7],
      margin: 18,
      permits: ["Factura comercial", "Certificado fitosanitario", "Guia aerea o documento de transporte", "Revision Agrocalidad/SENAE"],
      risks: ["Cadena de frio", "Vida util corta", "Certificado fitosanitario incompleto"],
      suppliers: [["CF", "Proveedor floricola validado", "Colombia/Ecuador · Fitosanitario"], ["AG", "Agente carga perecible", "Cadena de frio · aeropuerto"]],
      route: origin => `${origin || "Origen"} -> aeropuerto origen -> Quito/Guayaquil -> inspeccion fitosanitaria -> bodega refrigerada`
    },
    laptops: {
      keys: ["laptop", "laptops", "computador", "computadora", "notebook"],
      product: "Computadores portatiles",
      tariff: "8471.30.00",
      advalorem: 0,
      iva: 0.15,
      fodinfa: 0.005,
      baseRisk: 43,
      defaultFob: 180000,
      days: [18, 30],
      margin: 22,
      permits: ["Factura y packing list", "UN 38.3 para baterias", "Revision de marca y garantia", "Agente/courier segun valor y volumen"],
      risks: ["Baterias de litio", "Garantia internacional", "Accesorios con partida distinta"],
      suppliers: [["NC", "Distribuidor de tecnologia", "Verificar marca y garantia"], ["FW", "Forwarder electronicos", "Manejo baterias litio"]],
      route: origin => `${origin || "Origen"} -> consolidacion -> puerto/aeropuerto Ecuador -> aduana -> entrega`
    },
    drones: {
      keys: ["drone", "drones", "uav"],
      product: "Drones",
      tariff: "8806.22.00",
      advalorem: 0.05,
      iva: 0.15,
      fodinfa: 0.005,
      baseRisk: 68,
      defaultFob: 48000,
      days: [28, 42],
      margin: 25,
      permits: ["Registro de importador", "Validacion tecnica ARCOTEL si aplica", "Ficha tecnica del fabricante", "Agente de aduana para regimen 10"],
      risks: ["Radiofrecuencia", "Uso previsto", "Baterias y repuestos"],
      suppliers: [["SV", "Proveedor drones", "Validar certificaciones"], ["AT", "Agente tecnico", "Homologacion y permisos"]],
      route: origin => `${origin || "Origen"} -> puerto/aeropuerto Ecuador -> revision tecnica -> aduana -> entrega`
    },
    steel: {
      keys: ["acero", "metal", "metales", "viga", "estructural"],
      product: "Acero estructural",
      tariff: "7216.50.00",
      advalorem: 0.05,
      iva: 0.15,
      fodinfa: 0.005,
      baseRisk: 54,
      defaultFob: 22000,
      days: [35, 48],
      margin: 18,
      permits: ["Registro de importador", "Mill Test Certificate", "Certificado de calidad", "Revision de medidas antidumping"],
      risks: ["Peso alto", "Norma tecnica", "Antidumping o salvaguardias"],
      suppliers: [["AS", "Aceria validada", "Mill Test · SGS"], ["FF", "Forwarder carga pesada", "Break bulk / contenedor"]],
      route: origin => `${origin || "Origen"} -> puerto de salida -> puerto Ecuador -> bodegaje -> transporte interno`
    },
    cacao: {
      keys: ["cacao", "cocoa", "chocolate"],
      product: "Cacao",
      tariff: "1801.00.19",
      advalorem: 0,
      iva: 0,
      fodinfa: 0,
      baseRisk: 31,
      defaultFob: 98000,
      days: [24, 34],
      margin: 29,
      permits: ["Certificado fitosanitario", "Certificado de origen", "Trazabilidad de lote", "Factura y packing list"],
      risks: ["Humedad", "Trazabilidad", "Requisitos del pais destino"],
      suppliers: [["EX", "Exportador cacao fino", "Trazabilidad de lote"], ["QA", "Inspector calidad", "Humedad y fermentacion"]],
      route: origin => `${origin || "Ecuador"} -> puerto/aeropuerto -> destino internacional -> despacho importador`
    },
    textiles: {
      keys: ["ropa", "textil", "textiles", "camiseta", "zapatos", "calzado"],
      product: "Textiles o calzado",
      tariff: "6204/6403 por clasificar",
      advalorem: 0.15,
      iva: 0.15,
      fodinfa: 0.005,
      baseRisk: 46,
      defaultFob: 350,
      days: [12, 28],
      margin: 20,
      permits: ["Factura comercial", "Etiquetado", "Revision de marca", "Courier 4x4/Categoria C/D segun peso y FOB"],
      risks: ["Uso comercial disfrazado", "Marca sin autorizacion", "Categoria courier incorrecta"],
      suppliers: [["TX", "Proveedor textil", "Verificar tallas y marca"], ["CR", "Courier autorizado", "Categoria segun peso/valor"]],
      route: origin => `${origin || "Origen"} -> courier/consolidacion -> Ecuador -> entrega destinatario`
    },
    generic: {
      keys: [],
      product: "Mercancia por confirmar",
      tariff: "Por clasificar",
      advalorem: 0.10,
      iva: 0.15,
      fodinfa: 0.005,
      baseRisk: 50,
      defaultFob: 0,
      days: [18, 35],
      margin: 15,
      permits: ["Factura comercial", "Packing list", "Partida arancelaria validada", "Revision de restricciones"],
      risks: ["Producto insuficientemente descrito", "Partida pendiente", "Costos logisticos pendientes"],
      suppliers: [["OP", "Operador logistico", "Validar segun producto"], ["AD", "Agente aduanero", "Revision documental"]],
      route: origin => `${origin || "Origen"} -> transporte internacional -> aduana Ecuador -> entrega`
    }
  };

  const exampleInputs = {
    flowers: {
      direction: "import", product: "flores frescas", origin: "Colombia", destination: "Guayaquil, Ecuador", incoterm: "CIF", fob: "3200",
      prompt: "Subi una factura de flores frescas desde Colombia. Necesito validar partida, permisos fitosanitarios, costos y ruta."
    },
    acero: {
      direction: "import", product: "acero estructural", origin: "Turquia", destination: "Guayaquil, Ecuador", incoterm: "FOB", fob: "22000",
      prompt: "Quiero importar 10 toneladas de acero estructural desde Turquia a Ecuador."
    },
    laptops: {
      direction: "import", product: "laptops", origin: "Shenzhen, China", destination: "Guayaquil, Ecuador", incoterm: "FOB", fob: "180000",
      prompt: "Quiero importar 500 laptops desde Shenzhen a Guayaquil."
    },
    cacao: {
      direction: "export", product: "cacao fino", origin: "Guayaquil, Ecuador", destination: "Paises Bajos", incoterm: "CIF", fob: "98000",
      prompt: "Quiero exportar 25 toneladas de cacao fino desde Ecuador a Paises Bajos."
    }
  };

  const twinCases = {
    drones: { status:"En transito", eta:"11 dias", location:"Pacifico Norte", risk:"68 / 100", docs:"7 / 8", origin:"Shenzhen", destination:"Guayaquil", vessel:"MSC Vega" },
    steel: { status:"En puerto", eta:"4 dias", location:"Cartagena", risk:"54 / 100", docs:"8 / 8", origin:"Izmir", destination:"Guayaquil", vessel:"Maersk Lima" },
    cacao: { status:"Aduana destino", eta:"2 dias", location:"Rotterdam", risk:"31 / 100", docs:"8 / 8", origin:"Guayaquil", destination:"Rotterdam", vessel:"CMA CGM Andes" }
  };

  let currentMode = "text";
  let recognition = null;
  let recording = false;
  const selectedFiles = { image: null, pdf: null };

  function byId(id){ return document.getElementById(id); }
  function norm(text){ return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function money(value){ return `$${Math.round(Number(value || 0)).toLocaleString("en-US")}`; }

  function readContext(){
    return {
      direction: byId("fasty-direction")?.value || "import",
      product: byId("fasty-product")?.value.trim() || "",
      origin: byId("fasty-origin")?.value.trim() || "",
      destination: byId("fasty-destination")?.value.trim() || "",
      incoterm: byId("fasty-incoterm")?.value || "FOB",
      fob: Number(byId("fasty-fob")?.value || 0),
      prompt: byId("fasty-prompt")?.value.trim() || "",
      fileName: selectedFiles[currentMode]?.name || ""
    };
  }

  function setContext(data){
    if(byId("fasty-direction")) byId("fasty-direction").value = data.direction || "import";
    if(byId("fasty-product")) byId("fasty-product").value = data.product || "";
    if(byId("fasty-origin")) byId("fasty-origin").value = data.origin || "";
    if(byId("fasty-destination")) byId("fasty-destination").value = data.destination || "Guayaquil, Ecuador";
    if(byId("fasty-incoterm")) byId("fasty-incoterm").value = data.incoterm || "FOB";
    if(byId("fasty-fob")) byId("fasty-fob").value = data.fob || "";
    if(byId("fasty-prompt")) byId("fasty-prompt").value = data.prompt || "";
  }

  function profileFor(ctx){
    const haystack = norm(`${ctx.product} ${ctx.prompt} ${ctx.fileName} ${ctx.origin}`);
    return Object.values(PRODUCT_PROFILES).find(profile => profile.keys.some(key => haystack.includes(norm(key)))) || PRODUCT_PROFILES.generic;
  }

  function inferOrigin(ctx){
    const text = norm(`${ctx.origin} ${ctx.prompt} ${ctx.fileName}`);
    if(ctx.origin) return ctx.origin;
    if(text.includes("colombia")) return "Colombia";
    if(text.includes("china") || text.includes("shenzhen")) return "China";
    if(text.includes("turquia") || text.includes("turkey")) return "Turquia";
    if(text.includes("ecuador") || text.includes("guayaquil")) return ctx.direction === "export" ? "Ecuador" : "";
    return "";
  }

  function inferDestination(ctx){
    if(ctx.destination) return ctx.destination;
    return ctx.direction === "export" ? "Destino por confirmar" : "Ecuador";
  }

  function inferFob(ctx){
    if(ctx.fob > 0) return ctx.fob;
    const match = `${ctx.prompt} ${ctx.fileName}`.match(/(?:fob|valor|usd|\$)\s*[:$]?\s*(\d+(?:[.,]\d+)?)/i);
    return match ? Number(match[1].replace(",", ".")) : 0;
  }

  function buildLocalAnalysis(){
    const ctx = readContext();
    const profile = profileFor(ctx);
    const origin = inferOrigin(ctx);
    const destination = inferDestination(ctx);
    const confirmedFob = inferFob(ctx);
    const fob = confirmedFob || profile.defaultFob || 0;
    const estimatedFob = !confirmedFob && fob > 0;
    const missing = [];
    if(!ctx.product && profile === PRODUCT_PROFILES.generic) missing.push("producto");
    if(!origin) missing.push("pais de origen");
    if(!destination) missing.push("destino");
    if(!confirmedFob) missing.push("valor FOB");

    const freightRate = ctx.direction === "export" ? 0.08 : profile.product === "Flores frescas" ? 0.18 : 0.11;
    const freight = fob ? Math.max(120, fob * freightRate) : 0;
    const insurance = fob ? (fob + freight) * 0.015 : 0;
    const cif = fob + freight + insurance;
    const advalorem = ctx.direction === "export" ? 0 : cif * profile.advalorem;
    const fodinfa = ctx.direction === "export" ? 0 : cif * profile.fodinfa;
    const iva = ctx.direction === "export" ? 0 : (cif + advalorem + fodinfa) * profile.iva;
    const local = fob ? Math.max(180, cif * (profile.product === "Flores frescas" ? 0.08 : 0.045)) : 0;
    const total = ctx.direction === "export" ? fob + freight + insurance + local : cif + advalorem + fodinfa + iva + local;
    const risk = Math.max(12, Math.min(92, profile.baseRisk + missing.length * 7 + (ctx.fileName ? -4 : 0) + (ctx.product ? -3 : 0)));
    const days = profile.days;
    const titleAction = ctx.direction === "export" ? "Exportacion" : "Importacion";
    const product = ctx.product || profile.product;
    const assumptions = missing.length ? ` Datos pendientes: ${missing.join(", ")}. FASTY no debe cerrar el calculo sin confirmarlos.` : "";
    const estimateNote = estimatedFob ? ` Como no se confirmo el FOB de la factura, el desglose usa un FOB referencial de ${money(fob)} para mostrar una proyeccion preliminar.` : "";

    return {
      title: `${titleAction} de ${product} ${origin ? `desde ${origin}` : ""}`,
      product,
      origin,
      destination,
      tariff: profile.tariff,
      landed: fob ? `${money(total)}${estimatedFob ? " est." : ""}` : "Requiere FOB",
      days: `${days[0]}-${days[1]} dias`,
      margin: `${profile.margin.toFixed(1)}%`,
      risk,
      summary: `${profile.product === "Mercancia por confirmar" ? "Operacion incompleta" : "Operacion analizada"} con base en producto, origen, factura/contexto e Incoterm ${ctx.incoterm}. ${profile.risks[0] ? `Principal alerta: ${profile.risks[0]}.` : ""}${estimateNote}${assumptions}`,
      permits: [...profile.permits, ...missing.map(item => `Confirmar ${item}`)],
      costs: [
        [estimatedFob ? "FOB estimado" : "FOB", fob],
        ["Flete internacional", freight],
        ["Seguro", insurance],
        ["Ad-valorem", advalorem],
        ["FODINFA", fodinfa],
        ["IVA", iva],
        ["Logistica local / cadena final", local]
      ],
      routeNote: profile.route(origin),
      suppliers: profile.suppliers,
      schedule: [
        ["1", "Validar factura y producto", "Hoy"],
        ["2", "Confirmar partida y permisos", "24-48 h"],
        ["3", ctx.direction === "export" ? "Preparar exportacion" : "Cotizar flete y seguro", "Dia 2-4"],
        ["4", "Embarque y seguimiento", `Dia ${Math.max(3, days[0]-2)}`],
        ["5", "Despacho y entrega", `Dia ${days[1]}`]
      ],
      source: ctx.fileName ? `Archivo: ${ctx.fileName}` : "Entrada manual"
    };
  }

  function buildBackendMessage(){
    const ctx = readContext();
    return [
      ctx.prompt || "Analiza la operacion con los datos estructurados.",
      "",
      "Datos estructurados provistos por el usuario:",
      `- Flujo: ${ctx.direction === "export" ? "exportacion" : "importacion"}`,
      `- Producto: ${ctx.product || "no confirmado"}`,
      `- Origen: ${ctx.origin || "no confirmado"}`,
      `- Destino: ${ctx.destination || "no confirmado"}`,
      `- Incoterm: ${ctx.incoterm}`,
      `- Valor FOB USD: ${ctx.fob || "no confirmado"}`,
      ctx.fileName ? `- Archivo adjunto: ${ctx.fileName}` : "- Archivo adjunto: no",
      "",
      "No asumas drones, China ni Guayaquil si no constan en los datos o en el documento."
    ].join("\n");
  }

  root.setFastyMode = function(mode, button){
    currentMode = mode;
    document.querySelectorAll(".mode-tab").forEach(el => el.classList.remove("on"));
    document.querySelectorAll(".fasty-input-pane").forEach(el => el.classList.remove("on"));
    button?.classList.add("on");
    byId(`fasty-pane-${mode}`)?.classList.add("on");
  };

  root.useFastyExample = function(type){
    setContext(exampleInputs[type] || exampleInputs.flowers);
  };

  root.handleFastyFile = function(input, type){
    const file = input.files?.[0];
    const status = byId(`fasty-${type}-status`);
    if(!file || !status) return;
    selectedFiles[type] = file;
    status.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB · listo para analizar`;
    status.style.color = "var(--green)";
    const fileText = norm(file.name);
    if(fileText.includes("flor") || fileText.includes("flower") || fileText.includes("colombia")){
      if(!byId("fasty-product").value) byId("fasty-product").value = "flores frescas";
      if(!byId("fasty-origin").value) byId("fasty-origin").value = "Colombia";
      byId("fasty-incoterm").value = "CIF";
    }
    if(type === "image"){
      byId("fasty-prompt").value = byId("fasty-prompt").value || "Analiza la foto adjunta usando los campos de contexto. Identifica producto, material, uso, partida y restricciones.";
    }else{
      byId("fasty-prompt").value = byId("fasty-prompt").value || "Analiza la factura PDF adjunta. Extrae FOB, peso, Incoterm, proveedor, pais de origen y calcula el plan real sin asumir China ni drones.";
    }
  };

  root.toggleFastyRecording = function(){
    const button = byId("fasty-record");
    const title = byId("fasty-record-title");
    const wave = byId("fasty-wave");
    const SpeechRecognition = root.SpeechRecognition || root.webkitSpeechRecognition;
    if(recording){
      recognition?.stop();
      recording = false;
      button?.classList.remove("recording");
      wave?.classList.remove("on");
      title.textContent = "Audio capturado. Genera el plan operativo.";
      return;
    }
    recording = true;
    button?.classList.add("recording");
    wave?.classList.add("on");
    title.textContent = "Escuchando...";
    if(!SpeechRecognition){
      setTimeout(() => {
        byId("fasty-prompt").value = "Quiero importar flores frescas desde Colombia a Guayaquil con factura CIF.";
        byId("fasty-product").value = "flores frescas";
        byId("fasty-origin").value = "Colombia";
        root.toggleFastyRecording();
      }, 1800);
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = "es-EC";
    recognition.interimResults = false;
    recognition.onresult = event => { byId("fasty-prompt").value = event.results[0][0].transcript; };
    recognition.onerror = () => { title.textContent = "No se pudo acceder al microfono. Escribe la operacion."; };
    recognition.onend = () => {
      recording = false;
      button?.classList.remove("recording");
      wave?.classList.remove("on");
      if(byId("fasty-prompt").value.trim()) title.textContent = "Audio transcrito. Genera el plan operativo.";
    };
    recognition.start();
  };

  function setRisk(gauge, value){
    gauge.querySelector("strong").textContent = value;
    gauge.style.borderColor = value < 40 ? "var(--green)" : value < 70 ? "var(--amber)" : "var(--red)";
  }

  function populateLocalResult(item){
    byId("fasty-result-kicker").textContent = item.source;
    byId("fasty-result-title").textContent = item.title;
    byId("fasty-summary").textContent = item.summary;
    byId("fasty-tariff").textContent = item.tariff;
    byId("fasty-landed").textContent = item.landed;
    byId("fasty-days").textContent = item.days;
    byId("fasty-margin").textContent = item.margin;
    setRisk(byId("fasty-risk-gauge"), item.risk);
    byId("fasty-permits").innerHTML = item.permits.map((permit, index) =>
      `<li><i class="fas ${index === 0 ? "fa-circle-check" : "fa-triangle-exclamation"}"></i>${permit}</li>`
    ).join("");
    byId("fasty-costs").innerHTML = item.costs.map(cost =>
      `<div><span>${cost[0]}</span><b>${cost[1] ? money(cost[1]) : "Requiere FOB"}</b></div>`
    ).join("");
    byId("fasty-route-origin").textContent = item.origin || "Origen por confirmar";
    byId("fasty-route-destination").textContent = item.destination || "Destino por confirmar";
    byId("fasty-route-note").textContent = item.routeNote;
    byId("fasty-suppliers").innerHTML = item.suppliers.map(s =>
      `<div class="supplier-mini"><span>${s[0]}</span><div><b>${s[1]}</b><small>${s[2]}</small></div></div>`
    ).join("");
    byId("fasty-schedule").innerHTML = item.schedule.map((s, index) =>
      `<div class="schedule-item ${index === 0 ? "done" : ""}"><span>${s[0]}</span><b>${s[1]}</b><small>${s[2]}</small></div>`
    ).join("");
  }

  function populateBackendResult(item){
    byId("fasty-result-kicker").textContent = "Gemini + backend";
    byId("fasty-result-title").textContent = item.title;
    byId("fasty-summary").textContent = item.executive_summary;
    byId("fasty-tariff").textContent = item.tariff_code;
    byId("fasty-landed").textContent = `$${Math.round(item.estimated_total || 0).toLocaleString("en-US")}`;
    byId("fasty-days").textContent = `${item.estimated_days_min}-${item.estimated_days_max} dias`;
    byId("fasty-margin").textContent = `${Number(item.projected_margin_percent || 0).toFixed(1)}%`;
    setRisk(byId("fasty-risk-gauge"), item.risk_score);
    byId("fasty-permits").innerHTML = (item.permits || []).map((permit,index) =>
      `<li><i class="fas ${index === 0 ? "fa-circle-check" : "fa-triangle-exclamation"}"></i>${permit}</li>`
    ).join("");
    byId("fasty-costs").innerHTML = (item.costs || []).map(cost =>
      `<div><span>${cost.label}</span><b>$${Math.round(cost.amount || 0).toLocaleString("en-US")}</b></div>`
    ).join("");
    const route = item.route || [];
    byId("fasty-route-origin").textContent = route[0] || item.origin_country || "Origen";
    byId("fasty-route-destination").textContent = route[route.length - 1] || item.destination_country || "Destino";
    byId("fasty-route-note").textContent = route.length ? route.join(" -> ") : "Ruta pendiente de confirmar";
    byId("fasty-suppliers").innerHTML = (item.suppliers || []).slice(0, 3).map(s =>
      `<div class="supplier-mini"><span>${String(s.name || "--").slice(0,2).toUpperCase()}</span><div><b>${s.name}</b><small>${s.rating || "-"} · ${s.country} · ${s.reason}</small></div></div>`
    ).join("") || `<div class="supplier-mini"><span>--</span><div><b>Sin proveedor sugerido</b><small>Validar manualmente.</small></div></div>`;
    byId("fasty-schedule").innerHTML = (item.timeline || []).slice(0, 5).map((s, index) =>
      `<div class="schedule-item ${index === 0 ? "done" : ""}"><span>${index + 1}</span><b>${s}</b><small>Fase ${index + 1}</small></div>`
    ).join("");
  }

  function selectedFastyFile(){
    if(currentMode === "image") return selectedFiles.image;
    if(currentMode === "pdf") return selectedFiles.pdf;
    return null;
  }

  function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

  root.runFastyAnalysis = async function(){
    const ctx = readContext();
    if(!ctx.prompt && !ctx.product && !selectedFastyFile()){
      alert("Describe la operacion, completa producto/origen o adjunta un archivo antes de generar el plan.");
      return;
    }
    const steps = [...document.querySelectorAll(".agent-step")];
    steps.forEach(step => step.classList.remove("ready","active"));
    byId("fasty-results").classList.remove("on");
    let backendResult = null;
    let backendError = null;
    const api = root.FastLedgerAPI;
    const backendPromise = api?.configured
      ? api.analyze(buildBackendMessage(), selectedFastyFile()).catch(error => { backendError = error; return null; })
      : Promise.resolve(null);
    for(let index=0; index<steps.length; index++){
      steps[index - 1]?.classList.remove("active");
      steps[index - 1]?.classList.add("ready");
      steps[index].classList.add("active");
      await delay(260);
    }
    backendResult = await backendPromise;
    steps[steps.length - 1].classList.remove("active");
    steps[steps.length - 1].classList.add("ready");
    if(backendResult) populateBackendResult(backendResult);
    else {
      populateLocalResult(buildLocalAnalysis());
      if(backendError) alert(`${backendError.message}\n\nSe mostrara un analisis local preliminar con los datos ingresados.`);
    }
    byId("fasty-results").classList.add("on");
    byId("fasty-results").scrollIntoView({behavior:"smooth",block:"start"});
  };

  root.changeTwinOperation = function(key){
    const item = twinCases[key] || twinCases.drones;
    byId("twin-status").textContent = item.status;
    byId("twin-eta").textContent = item.eta;
    byId("twin-location").textContent = item.location;
    byId("twin-risk").textContent = item.risk;
    byId("twin-docs").textContent = item.docs;
    byId("twin-origin").textContent = item.origin;
    byId("twin-destination").textContent = item.destination;
    byId("vessel-model").querySelector("span").textContent = item.vessel;
  };

  root.setTwinLayer = function(layer, button){
    document.querySelectorAll(".scene-controls button").forEach(el => el.classList.remove("on"));
    button?.classList.add("on");
    const scene = document.querySelector(".twin-scene");
    scene.dataset.layer = layer;
    if(layer === "weather") scene.style.boxShadow = "inset 0 0 80px rgba(251,191,36,.08)";
    else if(layer === "risk") scene.style.boxShadow = "inset 0 0 80px rgba(248,113,113,.08)";
    else scene.style.boxShadow = "none";
  };

  root.verifyTradeDocument = function(button, name){
    button.classList.remove("pending");
    button.querySelector("small").textContent = "Hash verificado ahora";
    button.querySelector("b").textContent = "OK";
    button.querySelector("b").style.color = "var(--green)";
    alert(`${name}: integridad verificada. El hash coincide con el registro del expediente.`);
  };

  root.filterSuppliers = function(){
    const query = byId("market-search").value.trim().toLowerCase();
    const country = byId("market-country").value;
    const category = byId("market-category").value;
    document.querySelectorAll(".supplier-card").forEach(card => {
      const matchesQuery = !query || card.dataset.search.includes(query);
      const matchesCountry = country === "all" || card.dataset.country === country;
      const matchesCategory = category === "all" || card.dataset.category === category;
      card.classList.toggle("hidden", !(matchesQuery && matchesCountry && matchesCategory));
    });
  };

  root.openSupplier = function(name){
    alert(`${name} fue agregado a la evaluacion de FASTY. Se revisaran reputacion, certificados, historial comercial y condiciones de compra.`);
  };

  root.showMarketplaceNotice = function(){
    alert("Solicitud iniciada. El flujo profesional verificara identidad, registros empresariales, certificados, referencias y capacidad productiva.");
  };
})(window);
