# Paraguay EV Market

Sitio estático (GitHub Pages) con el mercado de **híbridos y eléctricos** en Paraguay frente al **total** y a **ICE**, a partir de importaciones HS 8703 (Aduana PY — datos abiertos).

**Live:** https://paraguaianmax.github.io/paraguay-ev-market/

Inspirado en el espíritu de [LeRaffl Gallery](https://leraffl.github.io/LeRaffl-Gallery/) (gráficos legibles, CSV abiertos) — no es un clon.

## Estructura

```
.nojekyll
index.html          # KPIs + enlaces
css/style.css
js/load-csv.js      # parsea data/Paraguay.csv
js/charts.js        # Plotly: share + volumes
js/chargers.js      # mapa Leaflet + tabla DC
pages/share.html    # participación % apilada
pages/volumes.html  # volúmenes + TOTAL
pages/chargers.html # mapa + tabla cargadores DC
data/Paraguay.csv
data/chargers-dc.csv
sources/paraguay.md
sources/chargers.md
```

## Datos mercado

Solo meses reales. Schema:

`period,time_interval,variant,source,BEV,PHEV,HEV,ICE,OTHERS,TOTAL,notes`

Fuente: https://datosabiertos.aduana.gov.py (CSV Nivel Item mensuales).

## Cargadores DC

Inventario PlugShare deduplicado (corte 2026-10-02): **73 locais / 147 plugs DC** (CCS2/CHAdeMO/GB/T; sin NACS; sin AC-only). Potencia casi siempre estimada — ver `kw_source`.

## Activar GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / **folder:** `/ (root)`
4. Save → en ~1 min: `https://paraguaianmax.github.io/paraguay-ev-market/`

## Desarrollo local

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

## Licencia

Código del sitio: uso libre. Datos mercado: Aduana Nacional del Paraguay. Inventario cargadores: agregado independiente desde PlugShare.
