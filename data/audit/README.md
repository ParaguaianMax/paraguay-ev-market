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

## Segunda ronda — 2026-10-07 (noche)
6. **Limpieza de marcas** (`data/marca_aliases.json` v4). Se corrigieron:
   - errores de tipeo y puntuación/números pegados a la marca (`MITSUBISHI21.496,52` es el FOB
     cargado en el campo MARCA ITEM de la Aduana; el resto de la línea está bien);
   - modelos pegados a la marca (VITZ → TOYOTA/VITZ, HYUNDAI I 20 → HYUNDAI/I20, etc.);
   - sufijos de carroceros (IVECO FACCHINI → IVECO; MERCEDES BENZ TRIELHT → MERCEDES-BENZ).

   Valores basura (`*`, colores, números, palabras genéricas) toman la marca de la descripción
   solo si la nombra; si no, quedan como SIN MARCA. Todos los cambios están en
   `marca_cleanup_2026-10-07.csv`.
7. **Kits para ensamble excluidos:** 18 líneas, 1.350 unidades, 2022–2025 (TAIGA/KENTON triciclos,
   JMC kits incompletos); ver `excluded_kit_lines.csv`.
8. **HS 8704.60:** si la descripción dice REEV/PHEV/plug-in pasa a PHEV, y si dice híbrido/HEV
   pasa a HEV; sin palabra clave sigue siendo BEV. 75 líneas de camiones, triciclos y carritos
   salen de `leve`:
   - 65 van a `pesado`;
   - 10 van a `recreativo`.

   Ver `hs8704_60_lines.csv`: `segmento_after` y `segment_doubtful` (casos dudosos).
9. **Filas duplicadas exactas en el archivo de Aduana** (mismo despacho+ítem, todos los campos
   iguales) se cuentan una vez; ver `duplicate_rows_removed.csv` (2 líneas, 2024-08 y 2024-09).
10. **Overrides de motorización por línea:** RIDDARA RD6 'HIBRIDO PLUG-IN' de 2026-07 → PHEV
    (además del de 2026-09).

## Tercera ronda — 2026-10-08
La motorización (powertrain) no cambia en ninguna línea: la Aduana manda. Aprobado por Max el
2026-10-08.

9. **Marcas** (`data/marca_aliases.json` v5):
   - SSANGYONG/SSANGYOUNG/SSANG YONG → **KGM**. Es la misma marca (KG Mobility es el nuevo nombre
     de SsangYong). Se usa KGM porque es el nombre más frecuente en los datos: 735 unidades
     contra 146, 2022-01..2026-09.
   - SAMSUNG → RENAULT SAMSUNG.
   - LI XIANG → LI AUTO.
   - Se mantienen separadas: GEELY RADAR/RIDDARA, HUMMER/GMC, KAIYUN/PICKMAN.
10. **Modelos `(sin modelo)` y años como modelo:** el modelo se toma de MERCADERIA solo cuando el
    texto lo nombra; nunca se adivina. Se busca en este orden: `MODELO`/`MOD.`, `TIPO`,
    `MARCA <marca> <modelo>` y `<marca> <modelo>`. Después pasa por la división
    modelo base/edición. Ver `model_cleanup_2026-10-08.csv`.
11. **Dígito final sobrante:** `TERA 1` → `TERA`, `RANGER 2` → `RANGER`, etc. Solo se quita cuando
    el texto muestra que el dígito es la cilindrada (`TERA 1.0`). Los números reales de modelo
    (SEALION 7, CX 5, RAV 4…) se mantienen.
12. **Segmentos:**
    - Mitsubishi / Mitsubishi Fuso CANTER → `pesado`.
    - FOTON BJ10xx/BJ11xx (camiones, incluida la línea Aumark) → `pesado`.
    - FOTON BJ5039/BJ5048 (furgones de carga) → `pesado`, salvo que el texto diga liviano.
    - La Tunland sigue en `leve`.
    - Cuadriciclos/cuatrimotos/triciclos/motocarros/go-karts (8703) y UTV/ATV (8704) →
      `recreativo`. Incluye los 601 KENTON 0 km de 2026 (todos CUACICLON; ningún kit).

    Ver `segment_moves_2026-10-08.csv`.
13. **FOTON:**
    - Los códigos se unifican: BJ1128VGJED-A TIPO = BJ1128VGJED A TIPO = BJ1128VGJED-A.
    - Las 70 líneas BEV se revisaron en `foton_bev_check_2026-10-08.csv`.
    - BJ1108EVJA2 (2025-01, 8704.60, el texto dice "MOTOR DIESEL") sigue BEV y queda listado
      para Max.
14. **Audi e-tron y Tesla** (solo BEV; un Q6/Q7 que no sea BEV no se renombra):
    - Audi: E-TRON/ETRON → un modelo base (`Q6 E-TRON`, `Q8 E-TRON`, `E-TRON`, `Q4 E-TRON`),
      con la versión en `edicion`.
    - Las líneas "Q6 PERFORMANCE"/"Q6 QUATTRO" BEV con VIN WAUZZZGF (código del Q6 e-tron) pasan
      a `Q6 E-TRON`.
    - Q6L (versión china) y E-TRON vs Q8 E-TRON quedan separados.
    - Tesla: `Model 3/Y/X/S` + versión del texto.
15. **Ediciones estándar** (`data/edicion_aliases.json`, versionado):
    - abreviaturas y typos de la misma versión (SB → SPORTBACK, SLINE → S LINE, LUX → LUXURY,
      SR/LR/PAWD de Tesla, X-Trail e-POWER 4X4 = E-4ORCE);
    - los pares dudosos están en `doubtful` y no se unen;
    - después, las filas con la misma clave (period, variant, segmento, marca, modelo, edicion,
      powertrain, condicion) se suman. **La motorización es parte de la clave**: nunca se suman
      motorizaciones distintas.

    Ver `edicion_aliases_applied_2026-10-08.csv`.
16. **Control:**
    - `multi_powertrain_models_2026-10-08.csv` lista los marca+modelo con más de una motorización
      (el sitio debe rankear por marca+modelo+powertrain).
    - `suspicious_powertrain_2026-10-08.csv` lista combinaciones 2026 dudosas (Vitz PHEV,
      etc.). No se corrigen; son para Max.
