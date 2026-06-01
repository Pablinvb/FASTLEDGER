const assert = require("node:assert");
const {
  calculateImportEstimate,
  calculateLedgerPackage
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
  assert.equal(round(result.cif), 23100);
  assert.equal(round(result.eur1Desc), 1155);
  assert.equal(round(result.total), 32600);
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
  assert.equal(round(result.cif), 5800);
  assert.equal(round(result.total), 8427);
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

assert.equal(calculateLedgerPackage(4), 20);
assert.equal(calculateLedgerPackage(0.5), 2.5);

console.log("Calculator tests passed");
