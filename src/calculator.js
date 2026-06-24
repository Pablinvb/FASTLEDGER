/* FastLedger reusable calculation engine.
 * The browser app and tests can use this pure function without depending on DOM state.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FastLedgerCalculator = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CARGO = {
    auto: { tipo: "vehiculo", arancel: 0.2, iva: 0.15, rodaje: 320, agente: 620, almacen_r: 0.012, transp: 420, docs: 280 },
    moto: { tipo: "vehiculo", arancel: 0.1, iva: 0.15, rodaje: 120, agente: 480, almacen_r: 0.01, transp: 280, docs: 230 },
    camion: { tipo: "vehiculo", arancel: 0.05, iva: 0.15, rodaje: 520, agente: 780, almacen_r: 0.015, transp: 760, docs: 360 },
    maquinaria: { tipo: "carga_pesada", arancel: 0.05, iva: 0.12, agente: 540, almacen_r: 0.018, transp: 620, docs: 310 },
    electrodomestico_g: { tipo: "carga_pesada", arancel: 0.15, iva: 0.15, agente: 460, almacen_r: 0.014, transp: 380, docs: 250 },
    acero: { tipo: "carga_pesada", arancel: 0.05, iva: 0.15, agente: 510, almacen_r: 0.015, transp: 520, docs: 285 }
  };

  const FLETE_VEH = {
    US: { auto: 1750, moto: 780, camion: 3100 }, MX: { auto: 1900, moto: 860, camion: 3400 },
    BR: { auto: 1400, moto: 640, camion: 2600 }, ES: { auto: 2100, moto: 940, camion: 3800 },
    FR: { auto: 2200, moto: 980, camion: 3900 }, IT: { auto: 2300, moto: 1000, camion: 4000 },
    DE: { auto: 2800, moto: 1250, camion: 4800 }, KR: { auto: 4000, moto: 1650, camion: 6000 },
    JP: { auto: 4500, moto: 1800, camion: 6500 }, CN: { auto: 3400, moto: 1400, camion: 5500 }
  };

  const DIST = { US: 0.55, MX: 0.60, BR: 0.70, ES: 0.85, FR: 0.88, IT: 0.90, DE: 0.95, KR: 1.60, JP: 1.65, CN: 1.45 };
  const TARIFA_LB_CARGA = 5;
  const UE = ["DE", "ES", "IT", "FR"];

  function calculateImportEstimate(input) {
    const tipo = input.tipo || "maquinaria";
    const pais = input.pais || "DE";
    const fob = Number(input.fob || 0);
    const lbs = Number(input.lbs || 10);
    const modal = input.modal || "maritimo";
    const incoterm = String(input.incoterm || "FOB").toUpperCase();
    const motor = input.motor || "gasolina";
    const cc = Number(input.cc || 2000);
    const uso = input.uso || "particular";
    const eur1 = input.eur1 || "no";
    const inen = input.inen || "si";

    const D = CARGO[tipo] || CARGO.maquinaria;
    let pctAran = D.arancel;
    let ivaRate = D.iva;
    let eur1Desc = 0;
    const rodaje = D.rodaje || 0;
    let inenCosto = 0;

    if (tipo === "auto") {
      if (motor === "electrico") {
        pctAran = 0;
        ivaRate = 0.05;
      } else if (motor === "hibrido") {
        pctAran = 0.05;
        ivaRate = 0.05;
      } else if (cc <= 1500) {
        pctAran = 0.15;
      } else if (cc <= 2000) {
        pctAran = 0.20;
      } else if (cc <= 3000) {
        pctAran = 0.30;
      } else {
        pctAran = 0.35;
      }

      if (uso === "diplomatico") {
        pctAran = 0;
        ivaRate = 0;
      }

      if (inen === "no") {
        inenCosto = 850;
      }
    }

    let flete;
    if (D.tipo === "vehiculo") {
      const tbl = FLETE_VEH[pais] || FLETE_VEH.DE;
      flete = tbl[tipo] || tbl.auto;
      if (modal === "aereo") flete *= 2.0;
      else if (modal === "lcl") flete *= 0.65;
    } else {
      const df = DIST[pais] || 1.0;
      const mf = modal === "aereo" ? 1.80 : modal === "lcl" ? 0.60 : 1.00;
      flete = Math.max(20, lbs * TARIFA_LB_CARGA * df * mf);
    }

    const originCharges =
      incoterm === "EXW" ? Math.max(120, fob * 0.04) :
      incoterm === "FOB" ? Math.max(60, fob * 0.01) : 0;
    const insuredBase = fob + flete + originCharges;
    const seguro = insuredBase * 0.015;
    const cif = fob + originCharges + flete + seguro;
    if (tipo === "auto" && eur1 === "si" && UE.includes(pais) && motor !== "electrico") {
      eur1Desc = cif * 0.05;
    }

    const aranBruto = cif * pctAran;
    const aranNeto = aranBruto - eur1Desc;
    const fodinfa = cif * 0.005;
    const iva = (cif + aranNeto + fodinfa) * ivaRate;
    const salv = (D.salv_r || 0) * cif;
    const regimen = D.tipo === "vehiculo" || D.tipo === "carga_pesada"
      ? "Importacion a consumo - Regimen 10"
      : "Courier / trafico postal";
    const intermediario = D.tipo === "vehiculo" || D.tipo === "carga_pesada"
      ? "Agente de aduana"
      : "Courier autorizado";
    const agente = D.tipo === "vehiculo" || D.tipo === "carga_pesada" ? D.agente : 0;
    const almacen = Math.round(cif * (D.almacen_r || 0.01));
    const localCharges = Math.max(90, Math.round(cif * 0.006));
    const transp = D.transp;
    const docs = D.docs;
    const total = cif + aranNeto + fodinfa + iva + salv + rodaje + agente + almacen + localCharges + transp + inenCosto + docs;

    return {
      tipo,
      pais,
      fob,
      lbs,
      modal,
      incoterm,
      pctAran,
      ivaRate,
      originCharges,
      flete,
      seguro,
      cif,
      eur1Desc,
      aranBruto,
      aranNeto,
      fodinfa,
      iva,
      salv,
      rodaje,
      agente,
      regimen,
      intermediario,
      almacen,
      localCharges,
      transp,
      inenCosto,
      docs,
      total
    };
  }

  function calculateLedgerPackage(lbs, ratePerLb = 5) {
    return Number(lbs || 0) * ratePerLb;
  }

  return {
    CARGO,
    FLETE_VEH,
    DIST,
    TARIFA_LB_CARGA,
    calculateImportEstimate,
    calculateLedgerPackage
  };
});
