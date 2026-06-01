# Formulas de calculo FastLedger

Este documento describe los supuestos usados por la calculadora de importacion. Las cifras son referenciales y deben validarse con fuentes oficiales o asesoria aduanera antes de usarse en produccion.

## Variables base

- FOB: valor del producto en origen.
- Flete: costo de transporte internacional.
- Seguro: `FOB * 0.015`.
- CIF: `FOB + flete + seguro`.
- FODINFA: `CIF * 0.005`.
- Arancel bruto: `CIF * porcentaje_arancel`.
- Descuento EUR.1: `CIF * 0.05` cuando aplica.
- Arancel neto: `arancel_bruto - descuento_EUR1`.
- IVA: `(CIF + arancel_neto + FODINFA) * porcentaje_IVA`.
- Total: `CIF + arancel_neto + FODINFA + IVA + salvaguardia + rodaje + agente + almacen + transporte + INEN + documentos`.

## Flete

### Vehiculos

El flete usa una tabla fija por pais de origen y tipo de vehiculo. Si el modo es aereo se multiplica por `2.0`; si es LCL se multiplica por `0.65`.

### Carga pesada

El flete se calcula con:

```text
max(20, peso_lb * 5 * factor_distancia * factor_modal)
```

Factores de modo:

- Maritimo: `1.00`
- Aereo: `1.80`
- LCL: `0.60`

## Vehiculos

- Auto a gasolina hasta 1500 cc: arancel 15%.
- Auto a gasolina hasta 2000 cc: arancel 20%.
- Auto a gasolina hasta 3000 cc: arancel 30%.
- Auto a gasolina sobre 3000 cc: arancel 35%.
- Auto hibrido: arancel 5%, IVA 5%.
- Auto electrico: arancel 0%, IVA 5%.
- Uso diplomatico: arancel 0%, IVA 0%.
- INEN no incluido: agrega USD 850.

## Paquetes pequenos con Ledger

El asistente de paquetes pequenos usa una tarifa plana:

```text
costo = peso_lb * 5
```

## Notas de riesgo

- Los porcentajes y valores son aproximaciones para prototipo.
- La informacion aduanera puede cambiar por resoluciones oficiales.
- Los calculos deben validarse contra SENAE, COMEX y normativa vigente antes de operaciones reales.
