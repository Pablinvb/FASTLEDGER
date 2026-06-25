const assert = require("node:assert");
const {
  calculateImportEstimate,
  calculateLedgerPackage,
  calculateFourByFourEstimate
} = require("../src/calculator.js");

function round(value) {
  return Math.round(value);
}

{
  const result = calculateImportEstimate({
    tipo: "auto",
    pais: "DE",
    fob: 20000,
    lbs: 10,
    modal: "maritimo",
    motor: "gasolina",
    cc: 2000,
    eur1: "si",
    inen: "si"
  });

  assert.equal(round(result.flete), 2800);
  assert.equal(round(result.originCharges), 200);
  assert.equal(round(result.cif), 23345);
  assert.equal(round(result.eur1Desc), 1167);
  assert.equal(round(result.localCharges), 140);
  assert.equal(round(result.total), 33068);
  assert.equal(result.intermediario, "Agente de aduana");
}

{
  const result = calculateImportEstimate({
    tipo: "maquinaria",
    pais: "CN",
    fob: 5000,
    lbs: 100,
    modal: "maritimo"
  });

  assert.equal(round(result.flete), 725);
  assert.equal(round(result.originCharges), 60);
  assert.equal(round(result.cif), 5872);
  assert.equal(round(result.localCharges), 90);
  assert.equal(round(result.total), 8604);
  assert.equal(result.regimen, "Importacion a consumo - Regimen 10");
}

{
  const result = calculateImportEstimate({
    tipo: "auto",
    pais: "US",
    fob: 30000,
    modal: "lcl",
    motor: "electrico",
    cc: 0,
    inen: "no"
  });

  assert.equal(round(result.flete), 1138);
  assert.equal(result.pctAran, 0);
  assert.equal(result.ivaRate, 0.05);
  assert.equal(result.inenCosto, 850);
}

{
  const exw = calculateImportEstimate({
    tipo: "maquinaria",
    pais: "CN",
    fob: 5000,
    lbs: 100,
    modal: "maritimo",
    incoterm: "EXW"
  });
  const cif = calculateImportEstimate({
    tipo: "maquinaria",
    pais: "CN",
    fob: 5000,
    lbs: 100,
    modal: "maritimo",
    incoterm: "CIF"
  });

  assert.equal(round(exw.originCharges), 200);
  assert.equal(round(cif.originCharges), 0);
  assert.ok(exw.total > cif.total);
}

assert.equal(calculateLedgerPackage(4), 20);
assert.equal(calculateLedgerPackage(0.5), 2.5);

{
  const result = calculateFourByFourEstimate({ lbs: 3, fob: 90 });
  assert.equal(result.eligible, true);
  assert.equal(result.customsFee, 20);
  assert.equal(result.estimatedServiceTotal, 35);
}

{
  const overweight = calculateFourByFourEstimate({ lbs: 10, fob: 90 });
  const expensive = calculateFourByFourEstimate({ lbs: 3, fob: 450 });
  assert.equal(overweight.eligible, false);
  assert.ok(overweight.reasons.includes("supera 4 kg / 8.82 lb"));
  assert.equal(expensive.eligible, false);
  assert.ok(expensive.reasons.includes("supera USD 400 FOB"));
}

console.log("Calculator tests passed");
