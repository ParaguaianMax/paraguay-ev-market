# Paraguay EV Market

Sitio estático (GitHub Pages) con el mercado de **híbridos y eléctricos** en Paraguay frente al **total** y a **ICE**, a partir de importaciones HS 8703 (Aduana PY — datos abiertos).

**Live (cuando Pages esté activo):** https://paraguaianmax.github.io/paraguay-ev-market/

Inspirado en el espíritu de [LeRaffl Gallery](https://leraffl.github.io/LeRaffl-Gallery/) (gráficos legibles, CSV abiertos) — no es un clon.

## Estructura

```
.nojekyll
index.html          # KPIs + enlaces
css/style.css
js/load-csv.js      # parsea data/Paraguay.csv
js/charts.js        # Plotly: share + volumes
pages/share.html    # participación % apilada
pages/volumes.html  # volúmenes + TOTAL
pages/chargers.html # mapa + tabla cargadores DC
data/Paraguay.csv
data/chargers-dc.csv
sources/paraguay.md
sources/chargers.md
```

## Datos

Solo meses reales. Schema:

`period,time_interval,variant,source,BEV,PHEV,HEV,ICE,OTHERS,TOTAL,notes`

Variantes:

- `Whole` — HS 8703 limpio (sin golf/ATV)
- `LightVehicles` — una fila/mes con totales combinados: 8703 limpio + pickups livianos 8704

El sitio filtra por variante (selector en Inicio / Participación / Volúmenes). Detalle en [`sources/paraguay.md`](sources/paraguay.md).

Fuente: https://datosabiertos.aduana.gov.py (CSV Nivel Item mensuales).

## Activar GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / **folder:** `/ (root)`
4. Save → en ~1 min: `https://paraguaianmax.github.io/paraguay-ev-market/`

## Desarrollo local

Abrir con un servidor estático (fetch de CSV no funciona con `file://`):

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

## Licencia

Código del sitio: uso libre. Datos: Aduana Nacional del Paraguay (datos abiertos).
