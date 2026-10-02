# Complete vehicles only — Volume models QA

**Rule:** publish only finished vehicles (unidades), never parts.

- NCM: `8703` (clean) + `8704` light pickups per `light_vehicle_rules.py`. **Never 8708** or other parts chapters.
- Quantity: `CANTIDAD ESTADISTICA` with `UNIDAD MEDIDA ESTADISTICA = UNIDAD` (vehicle count). Not kg / FOB.
- Exclude description lines that are clearly parts/repuesto/CKD/SKD/desarmado **without** vehicle-unit language. Vehicle lines that say “con sus correspondientes accesorios/piezas” stay in.
- Each monthly build writes `entregas/YYYY-MM/qa_complete_vehicles.json` with excluded sample.

## Republish 2026-01 … 2026-08

All `data/models/YYYY-MM.csv` for these months are **`variant=LightVehicles` only** (leve/pesado/recreativo rows).  
`sum(models units | LightVehicles+leve) == Paraguay.csv TOTAL` for the same period (verified delta 0).

2026-09 remains `Whole` until 8704 filter finishes; site Volume Top marcas filters `LightVehicles`+`leve` and omits Whole (no double count).

```json
{
  "title": "Complete vehicles QA — models republish",
  "rule": "NCM 8703 clean + 8704 light only; qty=CANTIDAD ESTADISTICA (UNIDAD); exclude parts/CKD/repuesto without vehicle language; never 8708",
  "months": [
    {
      "period": "2026-01",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 6
    },
    {
      "period": "2026-02",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 4
    },
    {
      "period": "2026-03",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 8
    },
    {
      "period": "2026-04",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 3
    },
    {
      "period": "2026-05",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 10
    },
    {
      "period": "2026-06",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 5
    },
    {
      "period": "2026-07",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 13
    },
    {
      "period": "2026-08",
      "variant": "LightVehicles",
      "ncms": [
        "8703",
        "8704"
      ],
      "excluded_parts": 7
    }
  ],
  "excluded_parts_total_rows": 56,
  "excluded_sample": [
    {
      "posicion": "8704.31.90.000G",
      "qty": 120.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "LOS DEMAS EN: KITS INCOMPLETOS CKD P FABRICACION Y ENSAMBLE DE TRICICLOS P EL TRANSPORTE DE MERCADERIAS"
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 120.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "LOS DEMAS EN: KITS INCOMPLETOS CKD P/ FABRICACION Y ENSAMBLE DE TRICICLOS DE CARGA"
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 24.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "KITS INCOMPLETOS CKD PARA FABRICACI¿N Y/O ENSAMBLAJE DE VEH¿CULOS AUTOMOTORES PARA EL TRANSPORTE DE MERCANC¿AS DE PESO TOTAL CON CARGA M¿X. INFERIOR O IGUAL A 5"
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 120.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "KITS CKD PARA ENSAMBLE DE TRICICLO"
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 120.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "LOS DEMAS EN: KITS INCOMPLETOS EN CKD PARA FABRICACION Y ENSAMBLE DE TRICICLOS DE CARGA HASTA 5 TONELADAS"
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 120.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "LOS DEMAS EN: KITS INCOMPLETOS EN CKD PARA FABRICACION Y ENSAMBLE DE TRICICLOS DE CARGA HASTA 5 TONELADAS"
    },
    {
      "posicion": "8704.21.10.000P",
      "qty": 20.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "KITS INCOMPLETOS CKD PARA FABRICACION Y/O ENSAMBLE DE VEHICULOS AUTOMOTORES PARA EL TRANSPORTE DE MERCANCIAS DE PESO TOTAL MAX. INFERIOR O IGUAL A 5 TON (MOTOR "
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 20.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "KITS INCOMPLETOS CKD PARA FABRICACI¿N Y/O ENSAMBLAJE DE VEH¿CULOS AUTOMOTORES PARA EL TRANSPORTE DE MERCANC¿AS DE PESO TOTAL CON CARGA M¿X. INFERIOR O IGUAL A 5"
    },
    {
      "posicion": "8704.21.10.000P",
      "qty": 20.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "CHASIS CON MOTOR Y CABINA EN: KITS INCOMPLETOS CKD P/ FABRICACION Y ENSAMBLE DE VEHICULOS P/ EL TRANSPORTE DE MERCADERIAS"
    },
    {
      "posicion": "8704.31.90.000G",
      "qty": 60.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "60 UNIDADES. KITS INCOMPLETOS CKD PARA ENSAMBLE DE TRICICLOS"
    },
    {
      "posicion": "8704.21.10.000P",
      "qty": 20.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "CHASIS CON MOTOR Y CABINA EN: KITS INCOMPLETOS CKD P/ FABRICACION Y ENSAMBLE DE VEHICULOS P/ EL TRANSPORTE DE MERCADERIAS"
    },
    {
      "posicion": "8704.21.90.000T",
      "qty": 20.0,
      "unidad": "UNIDAD",
      "reason": "parts/repuesto keyword without vehicle unit language",
      "mercaderia": "KITS INCOMPLETOS CKD P/ FABRICACION Y/O ENSAMBLE DE VEHICULOS AUTOMOTORES P/ EL TRANSPORTE DE MERCANCIAS DE PESO TOTAL MAX. INFERIOR O IGUAL A 5 TON (MOTOR DIES"
    }
  ],
  "models_match_paraguay_csv": true,
  "note_sep": "2026-09 still Whole until 8704 meta; Volume Top marcas uses LightVehicles+leve only (omits Whole)"
}
```
