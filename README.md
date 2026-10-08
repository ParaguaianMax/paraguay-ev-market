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
pages/mercado.html   # participación, comparación anual, unidades
pages/marcas.html    # marcas, modelos y ranking BEV
pages/carga.html     # mapa, barras por red, historial
pages/datos.html     # archivos, definiciones, tabla mensual
pages/share.html     # redirige a mercado
pages/volumes.html   # redirige a mercado
pages/chargers.html  # redirige a carga
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

## Resumen de Inicio (`data/summary.json`)

La página de Inicio lee solo `data/summary.json` (un único fetch). Las demás páginas siguen leyendo los CSV.
Después de cualquier cambio en `data/models/`, `data/Paraguay.csv` o `data/chargers-dc.csv`, regenerarlo y commitearlo:

```bash
python3 scripts/build-summary.py
```

Contiene, para 0 km y para nuevos y usados: acumulado del año (BEV, PHEV, HEV, mild, ICE), los mismos meses del año anterior, la serie mensual BEV/PHEV de los últimos 12 meses, el Top 5 BEV y el Top 5 híbridos no enchufables; además los conteos de cargadores y el último mes con datos. Si no hay cambios en los datos, el archivo no se modifica.

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
