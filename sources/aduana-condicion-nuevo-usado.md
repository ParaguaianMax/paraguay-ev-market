# Aduana — condición nuevo / usado

## Canonical field

| Aduana field | Meaning | Notes |
|--------------|---------|-------|
| **USO** | `NUEVO` or `USADO` | **Canonical** for vehicle condition |
| AÑO | Declaration / filing year of the despacho | **Not** model year |
| MES | Declaration month | Period filter for the month file |

Do **not** use `AÑO` as model year. Model year may appear in `MERCADERIA` text but is incomplete; it is not used for `condicion`.

## Export mapping (`data/models/*.csv`)

| USO (Aduana) | `condicion` (export) |
|--------------|----------------------|
| `NUEVO` | `nuevo` |
| `USADO` | `usado` |
| empty / other | `desconocido` |

Header (site models):

```
period,variant,segmento,marca,modelo,powertrain,condicion,units,source,notes
```

Aggregation key includes `condicion`, so **nuevo and usado are never merged** under the same marca/modelo/powertrain row.

`Paraguay.csv` aggregates are unchanged (totals still mix nuevo+usado). Condition split is **models-only** until the UI selector is wired.

## QA

On each month build, `entregas/YYYY-MM/qa_complete_vehicles.json` notes that `condicion` comes from `USO`. Spot-check: sum of `units` where `condicion=nuevo` + `usado` (+ `desconocido`) for a period/variant/segmento should equal the prior unsplit model total for that slice.

## Pipeline

Implemented in `/workspace/ev-paraguay/dados/build_report_month.py` (`map_condicion`, `export_model_level`, `write_site_models_csv`). Future months (including 2025 backfill) inherit the schema automatically.
