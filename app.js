/* ══════════════════════════════════
   ESTADO DE SESIÓN
══════════════════════════════════ */
let currentUser = null;
let lastCalcTotal = 0;
let lastCalcData  = {};
let selectedPayMethod = 0;
let generatedOrderCode = '';
const DB = window.FastLedgerDB || null;

async function persistUser(user){
  if(!DB || !user || !user.email)return;
  try{ await DB.upsertUser(user); }catch(err){ console.warn('No se pudo guardar usuario', err); }
}
async function persistConsultation(role,message,quote){
  if(!DB)return;
  const user=currentUser||{name:'Invitado',email:'invitado'};
  try{
    await DB.saveConsultation({
      user_name:user.name||'Invitado',
      user_email:user.email||'invitado',
      role,
      message,
      quote:quote||null
    });
  }catch(err){ console.warn('No se pudo guardar consulta', err); }
}

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
async function doLogin(){
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if(!email||!pass){alert('Por favor completa todos los campos.');return;}
  currentUser = {name: email.split('@')[0], email};
  await persistUser(currentUser);
  afterLogin();
}
async function doRegister(){
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if(!name||!email||!pass){alert('Por favor completa todos los campos.');return;}
  if(pass.length<6){alert('La contraseña debe tener al menos 6 caracteres.');return;}
  currentUser = {name, email};
  await persistUser(currentUser);
  afterLogin();
}
function afterLogin(){
  closeModal('auth-modal');
  document.getElementById('nav-user-label').textContent = currentUser.name;
  document.getElementById('nav-user-btn').innerHTML = `<div class="av">${currentUser.name[0].toUpperCase()}</div><span>${currentUser.name}</span><i class="fas fa-chevron-down" style="font-size:.65rem"></i>`;
  setEl('ctx-user', currentUser.name);
  const welcome=`¡Bienvenido/a, <strong>${currentUser.name}</strong>! 🎉 Me alegra tenerte en FastLedger. Ya puedes cotizar y proceder con tus importaciones. ¿En qué te ayudo hoy?`;
  appendMsg('a', welcome);
  persistConsultation('assistant', welcome, null);
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
const ledgerState={producto:null,peso:null,pais:null,lastQuote:null};
const COUNTRY_ALIASES={
  'estados unidos':'Estados Unidos','eeuu':'Estados Unidos','usa':'Estados Unidos','us':'Estados Unidos','miami':'Estados Unidos','new york':'Estados Unidos',
  'china':'China','cn':'China','espana':'Espana','españa':'Espana','spain':'Espana','alemania':'Alemania','germany':'Alemania','de':'Alemania',
  'mexico':'Mexico','méxico':'Mexico','mx':'Mexico','brasil':'Brasil','brazil':'Brasil','corea':'Corea del Sur','corea del sur':'Corea del Sur',
  'japon':'Japon','japón':'Japon','italia':'Italia','francia':'Francia','ecuador':'Ecuador'
};
const PRODUCT_KEYWORDS={
  'zapatos':'zapatos','zapato':'zapatos','zapatillas':'zapatos','tenis':'zapatos','sneakers':'zapatos','calzado':'zapatos',
  'ropa':'ropa','camiseta':'ropa','camisetas':'ropa','pantalon':'ropa','pantalones':'ropa','pantalón':'ropa','vestido':'ropa','chaqueta':'ropa',
  'cosmeticos':'cosmeticos','cosmetico':'cosmeticos','cosméticos':'cosmeticos','cosmético':'cosmeticos','maquillaje':'cosmeticos','perfume':'cosmeticos','cremas':'cosmeticos',
  'telefono':'electronicos','teléfono':'electronicos','celular':'electronicos','iphone':'electronicos','laptop':'electronicos','tablet':'electronicos','electronico':'electronicos','electrónico':'electronicos',
  'reloj':'relojes','relojes':'relojes','juguete':'juguetes','juguetes':'juguetes','repuesto':'repuestos','repuestos':'repuestos'
};
const VEHICLE_WORDS=['carro','coche','auto','vehiculo','vehículo','moto','camion','camión','bus','maquinaria'];
const USED_WORDS=['usado','usada','segunda mano','de segunda'];

function normText(text){
  return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function fmtMoney(n){return '$'+Number(n).toFixed(2)+' USD';}
function detectarLibras(msg){
  const m=String(msg).match(/(\d+(?:[.,]\d+)?)\s*(libras?|lbs?|lb)\b/i);
  if(m)return parseFloat(m[1].replace(',','.'));
  const kg=String(msg).match(/(\d+(?:[.,]\d+)?)\s*(kilos?|kg)\b/i);
  if(kg)return parseFloat(kg[1].replace(',','.'))*2.20462;
  return null;
}
function detectarPais(msg){
  const n=normText(msg);
  const keys=Object.keys(COUNTRY_ALIASES).sort((a,b)=>normText(b).length-normText(a).length);
  for(const key of keys){
    const nk=normText(key);
    if(nk.length<=2){
      if(n===nk)return COUNTRY_ALIASES[key];
      continue;
    }
    if(new RegExp(`(^|\\s)${nk.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(\\s|$)`).test(n)){
      return COUNTRY_ALIASES[key];
    }
  }
  return null;
}
function detectarProducto(msg){
  const n=normText(msg);
  for(const key of Object.keys(PRODUCT_KEYWORDS)){
    if(n.includes(normText(key)))return PRODUCT_KEYWORDS[key];
  }
  const direct=String(msg).match(/(?:quiero|quisiera|traer|importar|enviar|comprar)\s+(?:unos?|unas?|el|la|los|las)?\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ ]{3,32}?)(?:\s+de\s+|\s+desde\s+|\s+que\s+|\s+con\s+|,|\.|$)/i);
  if(direct)return direct[1].trim().toLowerCase();
  return null;
}
function isVehicleRequest(msg){
  const n=normText(msg);
  return VEHICLE_WORDS.some(w=>n.includes(normText(w)));
}
function isUsedVehicleRequest(msg){
  const n=normText(msg);
  return isVehicleRequest(msg)&&USED_WORDS.some(w=>n.includes(normText(w)));
}
function resetLedgerState(){
  ledgerState.producto=null;ledgerState.peso=null;ledgerState.pais=null;ledgerState.lastQuote=null;
}
function updateLedgerState(msg){
  const producto=detectarProducto(msg), peso=detectarLibras(msg), pais=detectarPais(msg);
  if(producto)ledgerState.producto=producto;
  if(peso!==null)ledgerState.peso=peso;
  if(pais)ledgerState.pais=pais;
}
function quoteLedger(){
  const cost=ledgerState.peso*TARIFA_LEDGER;
  ledgerState.lastQuote={...ledgerState,cost};
  setEl('ctx-total',`$${cost.toFixed(2)}`);
  return `Listo, ya tengo los datos:\n\nProducto: <strong>${ledgerState.producto}</strong>\nPeso: <strong>${ledgerState.peso.toFixed(2)} lb</strong>\nOrigen: <strong>${ledgerState.pais}</strong>\n\nTarifa FastLedger: <strong>$${TARIFA_LEDGER} USD/lb</strong>\nTotal estimado: <strong style="color:var(--sky);font-size:1.1em">${fmtMoney(cost)}</strong>\n\nEste valor es referencial para paquete pequeno. Para continuar, puedes enviar esta cotizacion por WhatsApp al <strong>0978775005</strong> o escribirnos a <strong>FastLedger010@gmail.com</strong>.\n\nQuieres que te indique los pasos para generar tu codigo de orden?`;
}
function missingQuestion(){
  const miss=[];
  if(!ledgerState.producto)miss.push('que producto quieres importar');
  if(!ledgerState.peso)miss.push('cuanto pesa en libras');
  if(!ledgerState.pais)miss.push('desde que pais lo envias');
  if(miss.length===3)return 'Para cotizarte necesito 3 datos: <strong>producto</strong>, <strong>peso en libras</strong> y <strong>pais de origen</strong>.\n\nEjemplo: "quiero traer zapatos, pesan 3 lb, desde Estados Unidos".';
  if(miss.length===2)return `Perfecto, me falta saber <strong>${miss[0]}</strong> y <strong>${miss[1]}</strong>.`;
  return `Perfecto, me falta saber <strong>${miss[0]}</strong>.`;
}
function processSteps(){
  return `Claro. Para continuar con FastLedger:\n\n1. Confirma tu cotizacion.\n2. Envia tus datos de contacto.\n3. Recibe tu codigo de orden FastLedger.\n4. Envia el codigo por WhatsApp al <strong>0978775005</strong>.\n\nTambien puedes escribir a <strong>FastLedger010@gmail.com</strong>.`;
}
const KB=[
  {k:['contacto','telefono','numero','llamar','whatsapp','correo','email','escribir','atencion','soporte','comunicar'],r:`Por supuesto. Nuestro equipo te atiende por:\n\nWhatsApp: <strong>0978775005</strong>\nEmail: <strong>FastLedger010@gmail.com</strong>\nHorario: <strong>Lunes a viernes, 8:00 a 18:00 Ecuador</strong>\n\nSi quieres, tambien puedo cotizarte aqui. Dime producto, peso y pais de origen.`},
  {k:['codigo de orden','order code','como comprar','proceso de compra','pago','proceder','continuar','contratar'],r:processSteps},
  {k:['hola','buenos dias','buenas tardes','buenas noches','saludos','hey','buenas'],r:`Hola. Soy <strong>Ledger</strong>, tu asesor de FastLedger.\n\nPuedo cotizar paquetes pequenos con tarifa de <strong>$5 USD por libra</strong>.\n\nDime que producto quieres importar, cuanto pesa y desde que pais viene.`},
  {k:['precio','tarifa','costo','cuanto cuesta','cuanto cobran'],r:`La tarifa para paquetes pequenos es <strong>$5 USD por libra</strong>.\n\nPara darte un total exacto necesito producto, peso y pais de origen. Ejemplo: "ropa, 5 lb, desde China".`},
  {k:['tiempo','demora','dias','tarda','llega'],r:`Tiempos estimados:\n\nAereo: 5 a 18 dias habiles segun origen.\nMaritimo: 15 a 35 dias segun origen.\nAduana: 1 a 10 dias segun canal.\n\nSi me dices pais de origen, producto y peso, te cotizo el paquete.`},
  {k:['gracias','perfecto','excelente','genial','ok gracias','listo','chao','adios'],r:`Con gusto. Si quieres hacer otra cotizacion, dime producto, peso y pais de origen.`}
];

function ledgerResponde(msg){
  const m=normText(msg);
  if(!m)return missingQuestion();
  if(m.includes('nueva cotizacion')||m.includes('otra cotizacion')||m==='reiniciar'||m==='nuevo'){
    resetLedgerState();
    return 'Listo, empecemos una nueva cotizacion. Dime producto, peso en libras y pais de origen.';
  }
  if(isUsedVehicleRequest(msg)){
    return 'Importante: Ecuador no permite importar vehiculos usados. Solo se permiten vehiculos nuevos 0 km de fabrica. Para vehiculos nuevos usa la pestana <strong>Presupuesto IA</strong>.';
  }
  if(isVehicleRequest(msg)){
    return 'Para vehiculos, motos, camiones o maquinaria grande usa la pestana <strong>Presupuesto IA</strong>, porque requiere aranceles, flete por contenedor y tramites SENAE. Yo aqui cotizo paquetes pequenos a $5 USD/lb.';
  }

  updateLedgerState(msg);

  if((m.includes('si')||m.includes('sí')||m.includes('quiero')||m.includes('continuar')||m.includes('proceder'))&&ledgerState.lastQuote){
    return processSteps();
  }
  if(ledgerState.producto&&ledgerState.peso&&ledgerState.pais){
    return quoteLedger();
  }

  for(const e of KB){
    if(e.k.some(kw=>m.includes(normText(kw)))){
      return typeof e.r==='function'?e.r():e.r;
    }
  }
  return missingQuestion();
}

async function ledgerRespondeConIA(msg){
  const localResponse=ledgerResponde(msg);
  if(!window.FastLedgerAI || !window.FastLedgerAI.configured()){
    return localResponse;
  }
  return window.FastLedgerAI.generateLedgerResponse({
    message: msg,
    localResponse,
    state: {
      producto: ledgerState.producto,
      peso: ledgerState.peso,
      pais: ledgerState.pais,
      lastQuote: ledgerState.lastQuote
    }
  });
}

function sendChat(){
  const inp=document.getElementById('chat-in');
  const msg=inp.value.trim();
  if(!msg)return;
  inp.value='';
  appendMsg('u',msg);
  persistConsultation('user', msg, null);
  const typing=appendTyping();
  setTimeout(async ()=>{
    typing.remove();
    const response=await ledgerRespondeConIA(msg);
    appendMsg('a',response);
    persistConsultation('assistant', response, ledgerState.lastQuote||null);
  },450+Math.random()*500);
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
