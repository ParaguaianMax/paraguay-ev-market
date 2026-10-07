# Auditoría de correcciones — 2026-10-07

Correcciones aplicadas a toda la serie 2022-01..2026-09 (`data/Paraguay.csv`, `data/models/*.csv`).
Los encabezados de `Paraguay.csv` y de `data/models/*.csv` no cambian. La cantidad original
declarada en Aduana queda registrada en esta carpeta.

## Reglas
1. **Cantidad 7 = 1 vehículo por línea.** Desde 2025-07, la Aduana usa CANTIDAD = 7 en líneas de
   un solo vehículo (un chasis por línea). Cada una de esas líneas cuenta como 1 unidad. Hay dos
   excepciones:
   - si la descripción trae más de un chasis, se cuentan los chasis;
   - si dice "N UNIDADES", se cuentan N.
   Las demás cantidades (≠1 y ≠7) no se modifican.
2. **Mes = fecha de cancelación** (el mes del archivo de Aduana). Ya no se descartan las líneas
   cuya oficialización cae en otro mes.
3. **Marcas.** Cambios aplicados:
   - AION → GAC AION;
   - GAC con modelo AION* → GAC AION;
   - VOYAH DREAMER → VOYAH (modelo DREAMER);
   - SIN MARCA → LATAMMO solo cuando la descripción dice "MARCA LATAMMO".
4. **e-Power.** El patrón acepta E-POWER, E- POWER, E POWER, EPOWER y POWERE. Los Nissan X-Trail
   e-Power son HEV.
5. **HS 8704.60 (solo motor eléctrico) = BEV**, sin cambiar el segmento.

## Archivos
- `by_period.csv`: por período × segmento (variant LightVehicles). Columnas:
  - líneas, unidades declaradas (`units_aduana`) y unidades contadas (`units_counted`, igual a
    `Paraguay.csv` TOTAL);
  - líneas y unidades con cantidad 7;
  - líneas con oficialización en otro mes (recuperadas por la regla 2);
  - líneas HS 8704.60.
- `qty7_by_model.csv`: por modelo (mismas claves que `data/models`), con la cantidad declarada en
  Aduana y la contada, para las líneas afectadas por la regla 1.
- `qty_exceptions_lines.csv`: líneas con cantidad ≠1 que no siguen la regla 7 = 1. Incluye:
  - 3 go-karts en una sola línea (2026-06);
  - las líneas 8704 con cantidad ≠1 y ≠7 (kits de triciclos TAIGA/KENTON y kits JMC), que se
    mantienen sin cambios.
- `hs8704_60_lines.csv`: todas las líneas HS 8704.60, con la motorización antes y después.
  `not_a_pickup_hint = 1` marca descripciones de camión, triciclo o carrito que hoy cuentan como
  `leve`.
