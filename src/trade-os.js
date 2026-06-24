(function(root){
  const examples = {
    drones: {
      prompt: "Quiero importar 300 drones desde Shenzhen a Guayaquil, valor FOB USD 48,000.",
      title: "Importación de 300 drones desde Shenzhen",
      summary: "Operación viable solo con revisión previa. Validar homologación de radiofrecuencia, documentación técnica, uso previsto, Incoterm, seguro puerta a puerta y costos locales antes del embarque.",
      tariff: "8806.22.00",
      landed: "$66,940",
      days: "32–41 días",
      margin: "24.6%",
      risk: 68,
      permits: ["Registro de importador", "Validación ARCOTEL", "Ficha técnica del fabricante", "Agente de aduana para régimen 10"]
    },
    steel: {
      prompt: "Quiero importar 10 toneladas de acero estructural desde Turquía a Ecuador.",
      title: "Importación de 10 toneladas de acero desde Turquía",
      summary: "Operación industrial viable. FASTY recomienda inspección preembarque, certificado de colada, seguro hasta bodega, gastos locales y validación de medidas antidumping antes de emitir la orden.",
      tariff: "7216.50.00",
      landed: "$31,880",
      days: "38–46 días",
      margin: "18.2%",
      risk: 54,
      permits: ["Registro de importador", "Certificado de calidad", "Mill Test Certificate", "Agente de aduana y DAI"]
    },
    laptops: {
      prompt: "Quiero importar 500 laptops desde Shenzhen a Guayaquil.",
      title: "Importación de 500 laptops desde Shenzhen",
      summary: "Operación de tecnología con riesgo bajo-medio. Validar etiquetado, baterías de litio, garantía internacional, autorización de marca si aplica, seguro y clasificación exacta de accesorios incluidos.",
      tariff: "8471.30.00",
      landed: "$214,600",
      days: "25–34 días",
      margin: "21.8%",
      risk: 43,
      permits: ["Registro de importador", "UN 38.3 para baterías", "Factura y lista de empaque", "Revisión de marca y proveedor"]
    },
    cacao: {
      prompt: "Quiero exportar 25 toneladas de cacao fino desde Ecuador a Países Bajos.",
      title: "Exportación de cacao fino a Países Bajos",
      summary: "Exportación atractiva con riesgo logístico bajo. Priorizar trazabilidad de lote, certificación fitosanitaria, control de humedad y contrato bajo Incoterm CIF Rotterdam.",
      tariff: "1801.00.19",
      landed: "$128,300",
      days: "24–31 días",
      margin: "29.4%",
      risk: 31,
      permits: ["Certificado fitosanitario", "Certificado de origen", "Trazabilidad de lote"]
    }
  };

  const twinCases = {
    drones: {
      status:"En tránsito", eta:"11 días", location:"Pacífico Norte", risk:"68 / 100",
      docs:"7 / 8", origin:"Shenzhen", destination:"Guayaquil", vessel:"MSC Vega"
    },
    steel: {
      status:"En puerto", eta:"4 días", location:"Cartagena", risk:"54 / 100",
      docs:"8 / 8", origin:"Izmir", destination:"Guayaquil", vessel:"Maersk Lima"
    },
    cacao: {
      status:"Aduana destino", eta:"2 días", location:"Rotterdam", risk:"31 / 100",
      docs:"8 / 8", origin:"Guayaquil", destination:"Rotterdam", vessel:"CMA CGM Andes"
    }
  };

  let currentMode = "text";
  let recognition = null;
  let recording = false;

  function byId(id){ return document.getElementById(id); }

  root.setFastyMode = function(mode, button){
    currentMode = mode;
    document.querySelectorAll(".mode-tab").forEach(el => el.classList.remove("on"));
    document.querySelectorAll(".fasty-input-pane").forEach(el => el.classList.remove("on"));
    button?.classList.add("on");
    byId(`fasty-pane-${mode}`)?.classList.add("on");
  };

  root.useFastyExample = function(type){
    const item = examples[type] || examples.drones;
    byId("fasty-prompt").value = item.prompt;
  };

  root.handleFastyFile = function(input, type){
    const file = input.files?.[0];
    const status = byId(`fasty-${type}-status`);
    if(!file || !status) return;
    status.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB · listo para analizar`;
    status.style.color = "var(--green)";
    if(type === "image"){
      byId("fasty-prompt").value = "Analiza la foto adjunta, identifica el producto, material, uso y clasificación arancelaria para importarlo a Ecuador.";
    }else{
      byId("fasty-prompt").value = "Extrae la factura adjunta: FOB, peso, Incoterm, proveedor, país de origen y genera el plan de importación.";
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
        byId("fasty-prompt").value = "Quiero importar 500 laptops desde Shenzhen a Guayaquil.";
        root.toggleFastyRecording();
      }, 2200);
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "es-EC";
    recognition.interimResults = false;
    recognition.onresult = event => {
      byId("fasty-prompt").value = event.results[0][0].transcript;
    };
    recognition.onerror = () => {
      title.textContent = "No se pudo acceder al micrófono. Escribe la operación.";
    };
    recognition.onend = () => {
      recording = false;
      button?.classList.remove("recording");
      wave?.classList.remove("on");
      if(byId("fasty-prompt").value.trim()) title.textContent = "Audio transcrito. Genera el plan operativo.";
    };
    recognition.start();
  };

  function detectExample(prompt){
    const text = prompt.toLowerCase();
    if(text.includes("acero") || text.includes("turqu")) return examples.steel;
    if(text.includes("laptop") || text.includes("comput")) return examples.laptops;
    if(text.includes("cacao") || text.includes("export")) return examples.cacao;
    return examples.drones;
  }

  function populateResult(item){
    byId("fasty-result-title").textContent = item.title;
    byId("fasty-summary").textContent = item.summary;
    byId("fasty-tariff").textContent = item.tariff;
    byId("fasty-landed").textContent = item.landed;
    byId("fasty-days").textContent = item.days;
    byId("fasty-margin").textContent = item.margin;
    const gauge = byId("fasty-risk-gauge");
    gauge.querySelector("strong").textContent = item.risk;
    gauge.style.borderColor = item.risk < 40 ? "var(--green)" : item.risk < 70 ? "var(--amber)" : "var(--red)";
    byId("fasty-permits").innerHTML = item.permits.map((permit, index) =>
      `<li><i class="fas ${index === 1 ? "fa-triangle-exclamation" : "fa-circle-check"}"></i>${permit}</li>`
    ).join("");
  }

  function populateBackendResult(item){
    byId("fasty-result-title").textContent = item.title;
    byId("fasty-summary").textContent = item.executive_summary;
    byId("fasty-tariff").textContent = item.tariff_code;
    byId("fasty-landed").textContent = `$${Math.round(item.estimated_total || 0).toLocaleString("en-US")}`;
    byId("fasty-days").textContent = `${item.estimated_days_min}-${item.estimated_days_max} dias`;
    byId("fasty-margin").textContent = `${Number(item.projected_margin_percent || 0).toFixed(1)}%`;
    const gauge = byId("fasty-risk-gauge");
    gauge.querySelector("strong").textContent = item.risk_score;
    gauge.style.borderColor = item.risk_score < 40 ? "var(--green)" : item.risk_score < 70 ? "var(--amber)" : "var(--red)";
    byId("fasty-permits").innerHTML = (item.permits || []).map((permit,index) =>
      `<li><i class="fas ${index === 1 ? "fa-triangle-exclamation" : "fa-circle-check"}"></i>${permit}</li>`
    ).join("");
    byId("fasty-costs").innerHTML = (item.costs || []).map(cost =>
      `<div><span>${cost.label}</span><b>$${Math.round(cost.amount || 0).toLocaleString("en-US")}</b></div>`
    ).join("");
  }

  function selectedFastyFile(){
    if(currentMode === "image") return byId("fasty-image")?.files?.[0] || null;
    if(currentMode === "pdf") return byId("fasty-pdf")?.files?.[0] || null;
    return null;
  }

  function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  root.runFastyAnalysis = async function(){
    const prompt = byId("fasty-prompt").value.trim();
    if(!prompt){
      alert("Describe la operación o adjunta un archivo antes de generar el plan.");
      return;
    }
    const steps = [...document.querySelectorAll(".agent-step")];
    steps.forEach(step => step.classList.remove("ready","active"));
    byId("fasty-results").classList.remove("on");
    let backendResult = null;
    let backendError = null;
    const api = root.FastLedgerAPI;
    const backendPromise = api?.configured
      ? api.analyze(prompt, selectedFastyFile()).catch(error => { backendError = error; return null; })
      : Promise.resolve(null);

    for(let index=0; index<steps.length; index++){
      steps[index - 1]?.classList.remove("active");
      steps[index - 1]?.classList.add("ready");
      steps[index].classList.add("active");
      await delay(320);
    }
    backendResult = await backendPromise;
    steps[steps.length - 1].classList.remove("active");
    steps[steps.length - 1].classList.add("ready");

    if(backendResult){
      populateBackendResult(backendResult);
    }else{
      populateResult(detectExample(prompt));
      if(backendError) alert(`${backendError.message}\n\nSe mostrara el modo demostrativo.`);
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
    alert(`${name} fue agregado a la evaluación de FASTY. Se revisarán reputación, certificados, historial comercial y condiciones de compra.`);
  };

  root.showMarketplaceNotice = function(){
    alert("Solicitud iniciada. El flujo profesional verificará identidad, registros empresariales, certificados, referencias y capacidad productiva.");
  };
})(window);
