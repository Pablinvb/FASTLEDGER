/* ══════════════════════════════════
   ESTADO DE SESIÓN
══════════════════════════════════ */
let currentUser = null;
let lastCalcTotal = 0;
let lastCalcData  = {};
let selectedPayMethod = 0;
let generatedOrderCode = '';

function goPg(id){
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(b=>b.classList.remove('on'));
  document.getElementById('pg-'+id)?.classList.add('on');
  document.getElementById('nt-'+id)?.classList.add('on');
  if(id==='calc') calcular();
}

/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
function openAuth(){
  if(currentUser){ showUserMenu(); return; }
  document.getElementById('auth-modal').classList.add('on');
}
function closeModal(id){ document.getElementById(id).classList.remove('on'); }
function switchAuthTab(t){
  document.getElementById('mt-login').classList.toggle('on',t==='login');
  document.getElementById('mt-reg').classList.toggle('on',t==='reg');
  document.getElementById('mf-login').classList.toggle('on',t==='login');
  document.getElementById('mf-reg').classList.toggle('on',t==='reg');
}
function doLogin(){
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if(!email||!pass){alert('Por favor completa todos los campos.');return;}
  currentUser = {name: email.split('@')[0], email};
  afterLogin();
}
function doRegister(){
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if(!name||!email||!pass){alert('Por favor completa todos los campos.');return;}
  if(pass.length<6){alert('La contraseña debe tener al menos 6 caracteres.');return;}
  currentUser = {name, email};
  afterLogin();
}
function afterLogin(){
  closeModal('auth-modal');
  document.getElementById('nav-user-label').textContent = currentUser.name;
  document.getElementById('nav-user-btn').innerHTML = `<div class="av">${currentUser.name[0].toUpperCase()}</div><span>${currentUser.name}</span><i class="fas fa-chevron-down" style="font-size:.65rem"></i>`;
  setEl('ctx-user', currentUser.name);
  appendMsg('a', `¡Bienvenido/a, <strong>${currentUser.name}</strong>! 🎉 Me alegra tenerte en FastLedger. Ya puedes cotizar y proceder con tus importaciones. ¿En qué te ayudo hoy?`);
}
function showUserMenu(){
  if(confirm(`¿Cerrar sesión? (${currentUser.email})`)){
    currentUser=null;
    document.getElementById('nav-user-label').textContent='Iniciar sesión';
    document.getElementById('nav-user-btn').innerHTML=`<i class="fas fa-user-circle" style="font-size:.95rem"></i><span>Iniciar sesión</span>`;
    setEl('ctx-user','Invitado');
  }
}
document.getElementById('auth-modal').addEventListener('click',function(e){if(e.target===this)closeModal('auth-modal');});
document.getElementById('checkout-modal').addEventListener('click',function(e){if(e.target===this)closeModal('checkout-modal');});

/* ══════════════════════════════════
   CHECKOUT
══════════════════════════════════ */
function openCheckout(){
  if(!currentUser){
    alert('Debes iniciar sesión para continuar con la contratación del servicio.');
    openAuth(); return;
  }
  // Llenar resumen
  const tipo = document.getElementById('s-tipo')?.value||'';
  const pais = document.getElementById('s-pais')?.value||'';
  document.getElementById('co-summary-box').innerHTML =
    `<strong>Servicio:</strong> Importación FastLedger<br>`+
    `<strong>Mercancía:</strong> ${TIPO_NAMES[tipo]||tipo}<br>`+
    `<strong>Origen:</strong> ${PAIS_NAMES[pais]||pais}<br>`+
    `<strong>FOB:</strong> ${document.getElementById('r-fob')?.textContent||'—'}<br>`+
    `<strong>CIF total:</strong> ${document.getElementById('r-cif')?.textContent||'—'}<br>`+
    `<strong style="color:var(--sky)">Costo total estimado: ${document.getElementById('r-total')?.textContent||'—'}</strong>`;
  // Pre-fill contact if logged in
  document.getElementById('co-nombre').value = currentUser.name||'';
  document.getElementById('co-email').value  = currentUser.email||'';
  coNext(1);
  document.getElementById('checkout-modal').classList.add('on');
}

function coNext(n){
  [1,2,3,4].forEach(i=>{
    document.getElementById('cop'+i).classList.toggle('on',i===n);
    const s=document.getElementById('cos'+i);
    if(s){
      s.className='cstep'+(i<n?' done':i===n?' on':'');
    }
  });
  if(n===4) generateOrderCode();
}

function generateOrderCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='FL-';
  for(let i=0;i<6;i++) code+=chars[Math.floor(Math.random()*chars.length)];
  generatedOrderCode=code;
  document.getElementById('order-code-display').textContent=code;
}

function copyOrderCode(){
  if(navigator.clipboard&&generatedOrderCode){
    navigator.clipboard.writeText(generatedOrderCode).then(()=>{
      alert(`✅ Código ${generatedOrderCode} copiado. Envíalo por WhatsApp al 0978775005 o a FastLedger010@gmail.com`);
    }).catch(()=>{
      alert(`Tu código de orden es: ${generatedOrderCode}\nGuárdalo y envíalo a 0978775005 o FastLedger010@gmail.com`);
    });
  }
}

let selectedPay = 0;
function selPay(n){
  [1,2,3,4].forEach(i=>{
    const el=document.getElementById('pm'+i);
    if(el) el.style.borderColor = i===n?'var(--sky)':'var(--bdr)';
  });
  selectedPay=n;
  document.getElementById('pay-form').style.display = n===1?'block':'none';
}

/* ══════════════════════════════════
   CALC — Cargas Grandes
══════════════════════════════════ */
let curStep=1;
function goStep(n){
  curStep=n;
  [1,2,3].forEach(i=>{
    document.getElementById('sp'+i).classList.toggle('on',i===n);
    const s=document.getElementById('st'+i);
    s.className='stab'+(i<n?' done':i===n?' now':'');
  });
  if(n===3) renderSum();
}

function renderSum(){
  const tipo=document.getElementById('s-tipo')?.value||'';
  const fob=parseInt(document.getElementById('s-fob')?.value)||0;
  const lbs=parseFloat(document.getElementById('s-peso')?.value)||0;
  const pais=document.getElementById('s-pais')?.value||'';
  const modal=document.getElementById('s-modal')?.value||'';
  const mNm={'maritimo':'Marítimo FCL','lcl':'Marítimo LCL','aereo':'Aéreo'}[modal]||modal;
  document.getElementById('sum-body').innerHTML=
    `<strong>Mercancía:</strong> ${TIPO_NAMES[tipo]||'—'}<br>`+
    `<strong>FOB:</strong> $${fob.toLocaleString()} &nbsp;·&nbsp; <strong>Peso:</strong> ${lbs.toLocaleString()} lb<br>`+
    `<strong>Origen:</strong> ${PAIS_NAMES[pais]||pais} &nbsp;·&nbsp; <strong>Modo:</strong> ${mNm}`;
}

function onTipoChange(){
  const t=document.getElementById('s-tipo').value;
  const isV=['auto','moto','camion'].includes(t);
  document.getElementById('v-block').style.display=isV?'block':'none';
  calcular();
}
function checkUsado(){
  const c=document.getElementById('v-cond').value;
  document.getElementById('al-usado').classList.toggle('on',c==='usado');
  document.getElementById('v-new-fields').style.display=c==='usado'?'none':'block';
  calcular();
}

/* Cost data — ONLY big items */
const CARGO={
  auto:{
    tipo:'vehiculo', arancel:0.20, iva:0.15,
    agente:550, almacen_r:0.012, transp:420, docs:300, rodaje:180,
    ia:'Vehículo combustión: arancel según cilindraje (15–35%) + IVA 15%. Flete por contenedor desde país de origen. Solo 0 km nuevos. EUR.1 desde UE ahorra 5%.'
  },
  moto:{
    tipo:'vehiculo', arancel:0.10, iva:0.15,
    agente:320, almacen_r:0.007, transp:200, docs:160, rodaje:75,
    ia:'Moto nueva 0 km: arancel 10% + IVA 15%. Flete por contenedor (más económico en LCL compartido). Prohibidas las motos usadas.'
  },
  camion:{
    tipo:'vehiculo', arancel:0.05, iva:0.15,
    agente:680, almacen_r:0.016, transp:700, docs:380, rodaje:420,
    ia:'Vehículo pesado/bus: arancel preferencial 5% (actividad productiva). Flete por contenedor de gran tamaño. Requiere permiso ANT.'
  },
  maquinaria:{
    tipo:'carga_pesada', arancel:0.05, iva:0.12,
    agente:520, almacen_r:0.011, transp:550, docs:310,
    ia:'Maquinaria industrial: arancel 5% + IVA 12% (posible exoneración como bien de capital). Flete proporcional al peso en libras.'
  },
  electrodomestico_g:{
    tipo:'carga_pesada', arancel:0.15, iva:0.15,
    agente:450, almacen_r:0.01, transp:400, docs:280,
    ia:'Equipos industriales grandes: arancel 15% + IVA 15%. Flete proporcional al peso. Certificaciones técnicas pueden ser requeridas.'
  },
  acero:{
    tipo:'carga_pesada', arancel:0.05, iva:0.15,
    agente:510, almacen_r:0.015, transp:520, docs:285,
    ia:'Acero y metales: arancel 5% (insumo productivo). IVA 15%. Flete proporcional al peso (los metales son muy pesados). Posibles medidas antidumping.'
  }
};

/* Flete por contenedor para vehículos (varía por país, precio real de mercado) */
const FLETE_VEH={
  US:{auto:1750,moto:780,camion:3100},  MX:{auto:1900,moto:860,camion:3400},
  BR:{auto:1400,moto:640,camion:2600},  ES:{auto:2100,moto:940,camion:3800},
  FR:{auto:2200,moto:980,camion:3900},  IT:{auto:2300,moto:1000,camion:4000},
  DE:{auto:2800,moto:1250,camion:4800}, KR:{auto:4000,moto:1650,camion:6000},
  JP:{auto:4500,moto:1800,camion:6500}, CN:{auto:3400,moto:1400,camion:5500},
};

/* Flete carga pesada: $5/lb ajustado por distancia al puerto de origen */
const TARIFA_LB_CARGA=5;
const DIST={US:.55,MX:.60,BR:.70,ES:.85,FR:.88,IT:.90,DE:.95,KR:1.60,JP:1.65,CN:1.45};

const TIPO_NAMES={auto:'🚗 Automóvil',moto:'🏍️ Motocicleta',camion:'🚚 Camión/Bus',maquinaria:'⚙️ Maquinaria Industrial',electrodomestico_g:'🏗️ Equipos Industriales',acero:'🔩 Acero/Metales'};
const PAIS_NAMES={DE:'🇩🇪 Alemania',JP:'🇯🇵 Japón',US:'🇺🇸 EE.UU.',CN:'🇨🇳 China',ES:'🇪🇸 España',KR:'🇰🇷 Corea del Sur',IT:'🇮🇹 Italia',FR:'🇫🇷 Francia',BR:'🇧🇷 Brasil',MX:'🇲🇽 México'};

function fmt(n){return '$'+Math.round(n).toLocaleString('en-US');}
function setEl(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function showRow(id,show){const e=document.getElementById(id);if(e)e.style.display=show?'flex':'none';}

function calcular(){
  const tipo =document.getElementById('s-tipo')?.value||'';
  const pais =document.getElementById('s-pais')?.value||'DE';
  const fob  =parseFloat(document.getElementById('s-fob')?.value)||0;
  const lbs  =parseFloat(document.getElementById('s-peso')?.value)||10;
  const modal=document.getElementById('s-modal')?.value||'maritimo';
  const isV  =['auto','moto','camion'].includes(tipo);

  setEl('ctx-tipo',TIPO_NAMES[tipo]||'—');
  setEl('r-badge', TIPO_NAMES[tipo]||'— Selecciona tipo —');

  if(!tipo){setEl('r-ia','Selecciona el tipo de mercancía para ver el análisis.');setEl('r-total','$0');document.getElementById('checkout-cta').style.display='none';return;}

  if(isV){
    const cond=document.getElementById('v-cond')?.value||'nuevo';
    if(cond==='usado'){
      document.getElementById('r-blocked').style.display='block';
      document.getElementById('r-content').style.display='none';
      document.getElementById('checkout-cta').style.display='none';
      return;
    }
  }
  document.getElementById('r-blocked').style.display='none';
  document.getElementById('r-content').style.display='block';

  const D=CARGO[tipo]||CARGO.maquinaria;
  let pctAran=D.arancel, ivaRate=D.iva, tags=[], eur1Desc=0, rodaje=D.rodaje||0, inenCosto=0;

  if(tipo==='auto'){
    const motor=document.getElementById('v-motor')?.value||'gasolina';
    const cc   =parseInt(document.getElementById('v-cc')?.value)||2000;
    const uso  =document.getElementById('v-uso')?.value||'particular';
    const eur1 =document.getElementById('v-eur1')?.value||'no';
    const inen =document.getElementById('v-inen')?.value||'si';
    if(motor==='electrico'){pctAran=0;ivaRate=0.05;document.getElementById('al-electrico')?.classList.add('on');tags.push({t:'⚡ Arancel 0%',c:'var(--green)',b:'rgba(52,211,153,.35)'});tags.push({t:'💚 IVA 5%',c:'var(--green)',b:'rgba(52,211,153,.35)'});}
    else if(motor==='hibrido'){pctAran=0.05;ivaRate=0.05;document.getElementById('al-electrico')?.classList.add('on');tags.push({t:'🔋 Arancel 5%',c:'var(--green)',b:'rgba(52,211,153,.35)'});tags.push({t:'💚 IVA 5%',c:'var(--green)',b:'rgba(52,211,153,.35)'});}
    else{
      document.getElementById('al-electrico')?.classList.remove('on');
      if(cc<=1500)pctAran=0.15;else if(cc<=2000)pctAran=0.20;else if(cc<=3000)pctAran=0.30;
      else{pctAran=0.35;tags.push({t:'⚠️ Recargo lujo +3.000cc',c:'var(--red)',b:'rgba(248,113,113,.35)'});}
    }
    if(uso==='diplomatico'){pctAran=0;ivaRate=0;tags.push({t:'🏛️ Exoneración diplomática',c:'var(--purple)',b:'rgba(167,139,250,.35)'});}
    const UE=['DE','ES','IT','FR'];
    if(eur1==='si'&&UE.includes(pais)&&motor!=='electrico'){showRow('row-eur1',true);eur1Desc=1;tags.push({t:'🤝 EUR.1 –5%',c:'var(--sky)',b:'var(--bdr-hi)'});}
    else showRow('row-eur1',false);
    if(inen==='no')inenCosto=850;
  } else {showRow('row-eur1',false);document.getElementById('al-electrico')?.classList.remove('on');}

  /* FLETE:
     Vehículos → tabla fija por contenedor (no varía con el peso del usuario)
     Carga pesada → $5/lb × factor distancia país (la distancia SÍ importa en carga masiva) */
  let flete, fleteLabel;
  if(D.tipo==='vehiculo'){
    const tbl=FLETE_VEH[pais]||FLETE_VEH['DE'];
    flete=tbl[tipo]||tbl['auto'];
    if(modal==='aereo')flete*=2.0; else if(modal==='lcl')flete*=0.65;
    fleteLabel=`${fmt(flete)} (contenedor · ${PAIS_NAMES[pais]||pais})`;
    tags.push({t:'🚢 Flete contenedor',c:'var(--sky)',b:'var(--bdr-hi)'});
  } else {
    // Carga industrial/acero: precio real proporcional al peso y distancia
    const df=DIST[pais]||1.0;
    const mf=modal==='aereo'?1.80:modal==='lcl'?0.60:1.00;
    flete=Math.max(20, lbs * TARIFA_LB_CARGA * df * mf);
    fleteLabel=`${fmt(flete)} (${lbs} lb × $${TARIFA_LB_CARGA} × factor distancia)`;
    tags.push({t:`📦 $${TARIFA_LB_CARGA}/lb · ${lbs} lb`,c:'var(--sky)',b:'var(--bdr-hi)'});
  }

  const seguro=fob*0.015;
  const cif=fob+flete+seguro;
  if(eur1Desc===1)eur1Desc=cif*0.05;
  const aranBruto=cif*pctAran, aranNeto=aranBruto-eur1Desc;
  const fodinfa=cif*0.005;
  const iva=(cif+aranNeto+fodinfa)*ivaRate;
  const salv=(D.salv_r||0)*cif;
  const agente=D.agente, almacen=Math.round(cif*(D.almacen_r||0.01));
  const transp=D.transp, docs=D.docs;
  const total=cif+aranNeto+fodinfa+iva+salv+rodaje+agente+almacen+transp+inenCosto+docs;
  lastCalcTotal=total;

  const fleteEl=document.getElementById('r-flete');if(fleteEl)fleteEl.textContent=fleteLabel;
  setEl('r-fob',fmt(fob));setEl('r-seg',fmt(seguro));setEl('r-cif',fmt(cif));
  setEl('r-aran-pct','('+(pctAran*100).toFixed(0)+'%)');setEl('r-aran',fmt(aranBruto));
  setEl('r-eur1',eur1Desc>0?'–'+fmt(eur1Desc):'–$0');
  setEl('r-fodinfa',fmt(fodinfa));setEl('r-iva-pct','('+(ivaRate*100).toFixed(0)+'%)');
  setEl('r-iva',fmt(iva));setEl('r-salv',salv>0?fmt(salv):'$0');
  setEl('r-agente',fmt(agente));setEl('r-almacen',fmt(almacen));
  setEl('r-transp',fmt(transp));setEl('r-inen',inenCosto>0?fmt(inenCosto):'$0');
  setEl('r-docs',fmt(docs));setEl('r-total',fmt(total));
  setEl('r-saving','✅ Ahorro estimado vs. agencia tradicional: '+fmt(Math.round(total*0.03))+' con FastLedger');
  setEl('r-ia',D.ia||'');
  showRow('row-rodaje',isV);setEl('r-rodaje',fmt(rodaje));
  showRow('row-inen',isV&&inenCosto>0);
  showRow('row-salv',salv>0);
  if(inenCosto>0)tags.push({t:'⚙️ Homologación INEN',c:'var(--amber)',b:'rgba(251,191,36,.35)'});
  if(ivaRate===0)tags.push({t:'🎁 IVA 0% exonerado',c:'var(--green)',b:'rgba(52,211,153,.35)'});
  if(pctAran===0&&!isV)tags.push({t:'🎁 Arancel 0%',c:'var(--green)',b:'rgba(52,211,153,.35)'});
  const tagsEl=document.getElementById('r-tags');
  if(tagsEl)tagsEl.innerHTML=tags.map(t=>`<span class="tag" style="color:${t.c};border-color:${t.b};background:${t.b.replace('.35','.08')}">${t.t}</span>`).join('');
  const totImp=aranNeto+fodinfa+iva+salv,totFlt=flete+seguro,totTrm=agente+almacen+transp+inenCosto+docs+rodaje,grand=Math.max(1,fob+totImp+totFlt+totTrm);
  const ch=document.getElementById('r-bar')?.children;
  if(ch&&ch.length>=4){ch[0].style.flex=Math.max(2,Math.round(totImp/grand*100));ch[1].style.flex=Math.max(2,Math.round(totFlt/grand*100));ch[2].style.flex=Math.max(2,Math.round(fob/grand*100));ch[3].style.flex=Math.max(2,Math.round(totTrm/grand*100));}
  document.getElementById('checkout-cta').style.display = total>0 ? 'block' : 'none';
}

/* ══════════════════════════════════
   LEDGER — Motor local (paquetes pequeños)
══════════════════════════════════ */
const TARIFA_LEDGER=5;
const KB=[
  {k:['contacto','teléfono','telefono','número','numero','llamar','whatsapp','correo','email','escribir','atención','atencion','soporte','comunicar'],
   r:`¡Por supuesto! 😊 Nuestro equipo te espera:\n\n📞 <strong>WhatsApp:</strong> <strong style="color:var(--sky)">0978775005</strong>\n📧 <strong>Email:</strong> <a href="mailto:FastLedger010@gmail.com" style="color:var(--sky)">FastLedger010@gmail.com</a>\n🕐 <strong>Horario:</strong> Lunes–Viernes, 8:00–18:00 (Ecuador)\n\n¡WhatsApp es lo más rápido! 🚀 ¿Hay algo más en lo que te pueda ayudar?`},
  {k:['código de orden','codigo de orden','order code','qué es el código','que es el codigo','cómo comprar','como comprar','proceso de compra','cómo funciona el pago','como funciona el pago'],
   r:`¡Excelente pregunta! Así funciona el proceso de compra en FastLedger: 🛒\n\n<strong>Paso 1:</strong> Calcula tu importación (Presupuesto IA o aquí con Ledger)\n<strong>Paso 2:</strong> Inicia sesión y haz clic en "Proceder a contratación"\n<strong>Paso 3:</strong> Completa tus datos de contacto\n<strong>Paso 4:</strong> Selecciona tu método de pago\n<strong>Paso 5:</strong> Recibes tu <strong style="color:var(--sky)">Código de Orden</strong> (ej: FL-AB3X7K)\n<strong>Paso 6:</strong> Envía ese código a nuestro equipo:\n\n📞 <strong>WhatsApp: 0978775005</strong>\n📧 <strong>FastLedger010@gmail.com</strong>\n\n⚠️ <strong>Sin el código de orden tu importación no puede procesarse.</strong>\n\n¿Tienes alguna duda sobre el proceso?`},
  {k:['hola','buenos días','buenas tardes','buenas noches','saludos','hey','buenas'],
   r:`¡Hola! Qué gusto saludarte 👋 Soy <strong>Ledger</strong>, tu asesor de <strong>FastLedger</strong> 🚀\n\nSoy especialista en <strong>paquetes pequeños</strong>: ropa, zapatos, cosméticos, electrónicos y más.\n\n💰 Mi tarifa: <strong>$5 USD/libra</strong> — simple y transparente\n📞 Contacto: <strong>0978775005</strong>\n\n¿Qué quieres importar hoy? Dime el producto y el peso 😊`},
  {k:['cuánto cuesta','cuanto cuesta','precio','tarifa','costo del envío','costo de envio','cuánto cobran','cuanto cobran'],
   r:`¡Fácil! 💰 En FastLedger manejamos una tarifa transparente:\n\n📦 <strong>$5 USD por libra</strong> para paquetes estándar\n\n🧮 Ejemplos:\n• 1 lb → $5\n• 3 lbs → $15\n• 5 lbs → $25\n• 10 lbs → $50\n\nTarifa fija, sin sorpresas. ✅\n\n¿Cuánto pesa tu paquete?`},
  {k:['qué es fastledger','que es fastledger','cómo funciona','como funciona','para qué sirve','para que sirve','qué ofrecen','que ofrecen'],
   r:`¡Claro! 🎉 <strong>FastLedger</strong> es la plataforma #1 de importaciones al Ecuador.\n\n🛠️ <strong>Servicios:</strong>\n• 📦 Paquetes pequeños: $5/lb (Ledger te cotiza aquí)\n• 🚗 Vehículos y carga grande: Presupuesto IA completo\n• 🔗 Rastreo blockchain en aduana\n• 🛒 Proceso de compra con código de orden\n\n📞 Contacto: <strong>0978775005</strong> | FastLedger010@gmail.com\n\n¿En qué te ayudo?`},
  {k:['zapato','zapatilla','tenis','calzado','sneaker','shoe'],
   r:`¡Traer zapatos es facilísimo con FastLedger! 👟\n\nTarifa: <strong>$5 USD/libra</strong>\n\nUn par pesa normalmente entre 2 y 4 libras:\n• 2 lbs → <strong>$10</strong>\n• 3 lbs → <strong>$15</strong>\n• 4 lbs → <strong>$20</strong>\n\n📦 ¿Cuánto pesan los tuyos y desde qué país los envías?`},
  {k:['ropa','camiseta','pantalón','pantalon','vestido','camisa','chaqueta','abrigo','textil'],
   r:`¡La ropa es uno de los envíos más comunes! 👕\n\nTarifa: <strong>$5 USD/libra</strong>\n\nEjemplo: 5 libras de ropa = <strong>$25 USD</strong> de envío 🎉\n\n¿Cuánto pesa tu envío y desde qué país? 😊`},
  {k:['cosmético','cosmetico','maquillaje','perfume','crema','shampoo','belleza','beauty'],
   r:`¡Los cosméticos son muy populares en FastLedger! 💄\n\nTarifa: <strong>$5 USD/libra</strong>\n\nEjemplos:\n• Set de maquillaje 1 lb → <strong>$5</strong>\n• Cremas y perfumes 2 lbs → <strong>$10</strong>\n• Caja de productos 4 lbs → <strong>$20</strong>\n\n¿Cuánto pesa tu pedido y desde qué país? 💋`},
  {k:['teléfono','telefono','celular','iphone','samsung','laptop','tablet','electrónico','electronico'],
   r:`¡Los electrónicos son súper populares! 📱💻\n\nTarifa: <strong>$5 USD/libra</strong>\n\nEjemplos:\n• Teléfono 0.5 lb → <strong>$2.50</strong>\n• Laptop 5 lbs → <strong>$25</strong>\n• Tablet 1 lb → <strong>$5</strong>\n\n💡 Los electrónicos tienen arancel 0% en Ecuador. ¡Ventaja! ✅\n\n¿Cuánto pesa y desde qué país lo traes?`},
  {k:['carro','coche','auto','vehículo','vehiculo','moto','camion','camión'],
   r:`Para vehículos, motos y carga pesada tenemos nuestra <strong>Calculadora IA</strong> especializada con aranceles completos. 🚗\n\nYo me enfoco en paquetes pequeños (ropa, cosméticos, electrónicos, etc.) a <strong>$5/lb</strong>.\n\n👉 Ve a la pestaña <strong>"Presupuesto IA"</strong> para cotizar tu vehículo con todos los impuestos, flete por contenedor y trámites SENAE.\n\n¿Puedo ayudarte con algo más? 😊`},
  {k:['carro usado','auto usado','vehículo usado','vehiculo usado','segunda mano'],
   r:`⚠️ Importante que sepas:\n\n🚫 <strong>Ecuador prohíbe totalmente la importación de vehículos usados.</strong>\n\nLey: <strong>Art. 73 COPCI</strong> + <strong>Resolución COMEX N° 116</strong>. Sin excepciones.\n\n✅ Solo se permiten vehículos <strong>0 km nuevos de fábrica</strong>.\n\n¿Puedo ayudarte con algo más? 😊`},
  {k:['cuánto tiempo','cuanto tiempo','demora','días','tarda','llega','tiempo'],
   r:`⏱️ Tiempos estimados:\n\n✈️ <strong>Aéreo:</strong>\n• EE.UU. → Ecuador: 5–10 días hábiles\n• Europa → Ecuador: 7–14 días\n• Asia → Ecuador: 10–18 días\n\n🚢 <strong>Marítimo:</strong>\n• EE.UU.: 15–25 días\n• Europa: 20–35 días\n\n🏛️ Aduana: 1–10 días según canal (verde es inmediato)\n\n¿Desde qué país viene tu envío?`},
  {k:['gracias','muchas gracias','perfecto','excelente','genial','ok gracias','listo','chao','adiós','adios'],
   r:`¡Con mucho gusto! 😊 Es un placer ayudarte.\n\n📞 <strong>WhatsApp: 0978775005</strong>\n📧 <strong>FastLedger010@gmail.com</strong>\n\n¡Que tengas un excelente día y mucho éxito con tu importación! 🚀✨\n\n¿Hay algo más en lo que te pueda ayudar?`},
];

function detectarLibras(msg){
  const m=msg.match(/(\d+(?:[.,]\d+)?)\s*(libras?|lbs?)\b/i);
  return m?parseFloat(m[1].replace(',','.')):null;
}

function ledgerResponde(msg){
  const m=msg.toLowerCase().trim();
  const lbs=detectarLibras(msg);
  if(lbs!==null){
    const cost=(lbs*TARIFA_LEDGER).toFixed(2);
    const prodMatch=msg.match(/(?:de|traer|importar|enviar|son)\s+(?:unos?|unas?)?\s*([a-záéíóúñ ]{3,25}?)(?:\s+que|\s+de|,|\.|$)/i);
    const prod=prodMatch?` de <strong>${prodMatch[1].trim()}</strong>`:'';
    setEl('ctx-total',`$${cost}`);
    return `¡Al instante! 🧮\n\n<strong>${lbs} libra${lbs!==1?'s':''}${prod}</strong> × $${TARIFA_LEDGER}/lb = <strong style="color:var(--sky);font-size:1.1em">$${cost} USD</strong> 🎉\n\n✅ Tarifa fija y transparente. Sin sorpresas.\n\nPara proceder, comunícate con nosotros:\n📞 <strong>WhatsApp: 0978775005</strong>\n📧 <strong>FastLedger010@gmail.com</strong>\n\n¿Desde qué país lo envías? 🌎`;
  }
  for(const e of KB){if(e.k.some(kw=>m.includes(kw.toLowerCase())))return e.r;}
  return `¡Gracias por escribir! 😊 Soy <strong>Ledger</strong> y me especializo en paquetes pequeños a <strong>$5 USD/lb</strong>.\n\nPara más ayuda:\n📞 <strong>0978775005</strong>\n📧 <strong>FastLedger010@gmail.com</strong>\n\n¿Me dices qué producto quieres importar y cuánto pesa? 📦`;
}

function sendChat(){
  const inp=document.getElementById('chat-in');
  const msg=inp.value.trim();
  if(!msg)return;
  inp.value='';
  appendMsg('u',msg);
  const typing=appendTyping();
  setTimeout(()=>{typing.remove();appendMsg('a',ledgerResponde(msg));},500+Math.random()*700);
}
function quickQ(text){goPg('chat');setTimeout(()=>{document.getElementById('chat-in').value=text;sendChat();},120);}
function appendMsg(role,text){
  const c=document.getElementById('chat-msgs');
  const d=document.createElement('div');
  d.className='msg '+role;
  const f=text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  d.innerHTML=`<div class="mb">${f}</div><div class="mt">${new Date().toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit'})}</div>`;
  c.appendChild(d);c.scrollTop=c.scrollHeight;return d;
}
function appendTyping(){
  const c=document.getElementById('chat-msgs');
  const d=document.createElement('div');
  d.className='msg a';
  d.innerHTML=`<div class="mb"><div class="typing-dots"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>`;
  c.appendChild(d);c.scrollTop=c.scrollHeight;return d;
}

calcular();
