/**
 * Brand/model detail for Volume/Marcas page.
 * Prefers data/models/YYYY-MM.csv (or manifest.json); falls back to Paraguay_models.csv.
 * Header: period,variant,segmento,marca,modelo,powertrain,units[,condicion][,edicion],source,notes
 * Optional condicion: nuevo|usado|desconocido (when absent, UI hides the new/used filter).
 * Optional edicion: trim; blank means no edition. Absent column → ranking unchanged.
 */
(function (global) {
  const POWERTRAINS = ["BEV", "PHEV", "HEV", "ICE", "OTHERS"];
  const PILL = {
    BEV: "pill-bev",
    PHEV: "pill-phev",
    HEV: "pill-hev",
    ICE: "pill-ice",
    OTHERS: "pill-others",
  };
  const MIN_ROWS = 50;

  function inPages() {
    return (
      /\/pages\//.test(location.pathname) ||
      /\/(share|volumes|trajectories|chargers|models)\.html$/.test(location.pathname)
    );
  }

  function dataBase() {
    return inPages() ? "../data" : "data";
  }

  function resolveModelsUrl() {
    return dataBase() + "/Paraguay_models.csv";
  }

  function resolveModelsDir() {
    return dataBase() + "/models";
  }

  function resolveParaguayUrl() {
    return dataBase() + "/Paraguay.csv";
  }

  function splitCSVLine(line) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out;
  }

  function normalizePowertrain(v) {
    const e = String(v || "").trim().toUpperCase();
    return POWERTRAINS.includes(e) ? e : "OTHERS";
  }

  /** Normalize to nuevo|usado|desconocido|"" (blank/absent → ""). */
  function normalizeCondicion(v) {
    const e = String(v || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!e) return "";
    if (
      e === "nuevo" ||
      e === "new" ||
      e === "nova" ||
      e === "0km" ||
      e === "0 km" ||
      e === "zero km"
    ) {
      return "nuevo";
    }
    if (e === "usado" || e === "used" || e === "usada" || e === "segunda") {
      return "usado";
    }
    return "desconocido";
  }

  // Presence of the column is enough to enable the chips. Unknown values
  // remain in the default Todos view and are intentionally not dropped.
  function hasCondicion(rows) {
    return (rows || []).some(
      (r) => Object.prototype.hasOwnProperty.call(r, "condicion") && r.condicion !== ""
    );
  }

  /** True only when the CSV header included edicion (blank cells still count). */
  function hasEdicion(rows) {
    return (rows || []).some((r) => Object.prototype.hasOwnProperty.call(r, "edicion"));
  }

  function editionList(map) {
    const named = [];
    let blank = 0;
    Object.keys(map).forEach((name) => {
      if (!name) blank += map[name];
      else named.push({ name, units: map[name], blank: false });
    });
    named.sort((a, b) => b.units - a.units || a.name.localeCompare(b.name));
    if (blank > 0) named.push({ name: "", units: blank, blank: true });
    return named;
  }

  function editionJoinKey(r, withModelo) {
    const parts = [
      r.period,
      r.variant,
      r.segmento,
      r.marca,
      r.powertrain,
      r.condicion || "",
      String(r.units),
    ];
    if (withModelo) parts.push(r.modelo);
    return parts.join("\0");
  }

  /**
   * Assembled Paraguay_models.csv drops `edicion` (and sometimes folds the
   * edition into `modelo`). Copy edicion from monthly rows that match
   * period, variant, segmento, marca, powertrain, condicion and units.
   * Exact modelo wins; otherwise a single monthly base-name prefix match.
   * Rows that already have the column are left untouched.
   */
  function joinEdicion(baseRows, monthlyRows) {
    const base = baseRows || [];
    if (!base.length || hasEdicion(base)) return base;
    const detail = monthlyRows || [];
    if (!hasEdicion(detail)) return base;
    const exact = new Map();
    const loose = new Map();
    detail.forEach((r) => {
      const ek = editionJoinKey(r, true);
      const lk = editionJoinKey(r, false);
      if (!exact.has(ek)) exact.set(ek, []);
      exact.get(ek).push(r);
      if (!loose.has(lk)) loose.set(lk, []);
      loose.get(lk).push(r);
    });
    return base.map((row) => {
      const exactHits = exact.get(editionJoinKey(row, true)) || [];
      let src = exactHits.length === 1 ? exactHits[0] : null;
      if (!src) {
        const hits = (loose.get(editionJoinKey(row, false)) || []).filter((r) => {
          if (r.modelo === row.modelo) return true;
          return (
            row.modelo === r.modelo ||
            (r.modelo &&
              (row.modelo.startsWith(r.modelo + " ") || row.modelo.startsWith(r.modelo + "/")))
          );
        });
        if (hits.length === 1) src = hits[0];
      }
      if (!src) return row;
      const next = Object.assign({}, row);
      next.edicion = String(src.edicion || "").trim();
      if (src.modelo) next.modelo = src.modelo;
      return next;
    });
  }

  function parseModelsCSV(text) {
    const lines = String(text || "").trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const rawHeaders = splitCSVLine(lines[0]).map((h) => h.trim());
    const alias = {
      motorizacion: "powertrain",
      unidades: "units",
      powertrain: "powertrain",
      units: "units",
      condicion: "condicion",
      condition: "condicion",
      estado: "condicion",
      edicion: "edicion",
      edición: "edicion",
      edition: "edicion",
    };
    const headers = rawHeaders.map((h) => alias[h.toLowerCase()] || h);
    return lines
      .slice(1)
      .filter(Boolean)
      .map((line) => {
        const cols = splitCSVLine(line);
        const row = {};
        headers.forEach((h, i) => {
          row[h] = cols[i] ?? "";
        });
        row.period = String(row.period || "").trim();
        row.variant = String(row.variant || "Whole").trim() || "Whole";
        let seg = String(row.segmento || "").trim().toLowerCase();
        if (seg !== "leve" && seg !== "recreativo" && seg !== "pesado") seg = "leve";
        row.segmento = seg;
        row.marca = String(row.marca || "").trim();
        row.modelo = String(row.modelo || "").trim();
        row.powertrain = normalizePowertrain(row.powertrain);
        row.units = Number(row.units) || 0;
        row.condicion = normalizeCondicion(
          row.condicion != null && row.condicion !== ""
            ? row.condicion
            : row.condition != null
              ? row.condition
              : ""
        );
        if (Object.prototype.hasOwnProperty.call(row, "edicion")) {
          row.edicion = String(row.edicion || "").trim();
        }
        row.source = String(row.source || "").trim();
        row.notes = String(row.notes || "").trim();
        return row;
      })
      .filter((r) => r.period && r.units > 0);
  }

  function sortModelRows(rows) {
    rows.sort((a, b) => {
      if (a.period < b.period) return -1;
      if (a.period > b.period) return 1;
      if (a.marca < b.marca) return -1;
      if (a.marca > b.marca) return 1;
      if (a.modelo < b.modelo) return -1;
      if (a.modelo > b.modelo) return 1;
      if (a.powertrain < b.powertrain) return -1;
      if (a.powertrain > b.powertrain) return 1;
      return 0;
    });
    return rows;
  }

  async function fetchText(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const text = await res.text();
      if (!text || !text.trim()) return null;
      return text;
    } catch (e) {
      return null;
    }
  }

  /** periods from aggregated Paraguay.csv */
  async function periodsFromParaguay() {
    const text = await fetchText(resolveParaguayUrl());
    if (!text) return [];
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]).map((h) => h.trim());
    const pi = headers.indexOf("period");
    if (pi < 0) return [];
    const set = new Set();
    lines.slice(1).forEach((line) => {
      if (!line) return;
      const cols = splitCSVLine(line);
      const p = String(cols[pi] || "").trim();
      if (/^\d{4}-\d{2}$/.test(p)) set.add(p);
    });
    return [...set].sort();
  }

  /**
   * Discover monthly files:
   * 1) data/models/manifest.json — { "files": ["2026-01.csv", ...] } or string[]
   * 2) data/models/index.json — same shapes
   * 3) periods from Paraguay.csv → try data/models/YYYY-MM.csv
   */
  async function discoverMonthlyFiles() {
    const dir = resolveModelsDir();
    const tryManifest = async (name) => {
      const text = await fetchText(dir + "/" + name);
      if (!text) return null;
      try {
        const j = JSON.parse(text);
        let files = null;
        if (Array.isArray(j)) files = j;
        else if (j && Array.isArray(j.files)) files = j.files;
        else if (j && Array.isArray(j.months)) {
          files = j.months.map((m) =>
            String(m).endsWith(".csv") ? String(m) : String(m) + ".csv"
          );
        }
        if (!files || !files.length) return null;
        return files.map((f) => {
          const name = String(f).replace(/^.*\//, "");
          return name.endsWith(".csv") ? name : name + ".csv";
        });
      } catch (e) {
        return null;
      }
    };

    let files = await tryManifest("manifest.json");
    if (!files) files = await tryManifest("index.json");
    if (files && files.length) {
      return files.map((f) => dir + "/" + f);
    }

    const periods = await periodsFromParaguay();
    return periods.map((p) => dir + "/" + p + ".csv");
  }

  async function loadMonthlyModels() {
    const urls = await discoverMonthlyFiles();
    if (!urls.length) return { rows: [], sources: [] };
    const results = await Promise.all(
      urls.map(async (url) => {
        const text = await fetchText(url);
        if (!text) return null;
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return null;
        const rows = parseModelsCSV(text);
        if (!rows.length) return null;
        return { url, rows };
      })
    );
    const ok = results.filter(Boolean);
    const rows = [];
    const sources = [];
    ok.forEach((r) => {
      rows.push(...r.rows);
      sources.push(r.url);
    });
    return { rows, sources };
  }

  async function loadAssembledFallback() {
    const url = resolveModelsUrl();
    const text = await fetchText(url);
    if (!text) return { rows: [], missing: true, url };
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { rows: [], missing: true, url };
    const rows = parseModelsCSV(text);
    // Placeholder / header-only / tiny stub → treat as missing
    if (rows.length < MIN_ROWS) return { rows: [], missing: true, url, stub: true };
    return { rows, missing: false, url };
  }

  async function loadParaguayModels(explicitUrl) {
    // Explicit URL (tests / overrides) → single file only
    if (explicitUrl) {
      const text = await fetchText(explicitUrl);
      if (!text) return { rows: [], missing: true, url: explicitUrl };
      const rows = sortModelRows(parseModelsCSV(text));
      return { rows, missing: rows.length < MIN_ROWS, url: explicitUrl };
    }

    try {
      const monthly = await loadMonthlyModels();
      if (monthly.rows.length >= MIN_ROWS || monthly.sources.length > 0) {
        const rows = sortModelRows(monthly.rows);
        return {
          rows,
          missing: !rows.length,
          url: monthly.sources.join(",") || resolveModelsDir(),
          sources: monthly.sources,
          mode: "monthly",
        };
      }

      const fallback = await loadAssembledFallback();
      let rows = sortModelRows(fallback.rows || []);
      if (rows.length && !hasEdicion(rows) && monthly.rows.length) {
        rows = sortModelRows(joinEdicion(rows, monthly.rows));
      }
      return {
        rows,
        missing: fallback.missing || rows.length < MIN_ROWS,
        url: fallback.url,
        mode: "assembled",
      };
    } catch (err) {
      if (err && /Failed to fetch|NetworkError|404/i.test(String(err.message || err))) {
        return { rows: [], missing: true, url: resolveModelsUrl(), error: err };
      }
      throw err;
    }
  }

  function sumUnits(rows) {
    return (rows || []).reduce((a, r) => a + (r.units || 0), 0);
  }

  function byPowertrain(rows) {
    const e = {};
    POWERTRAINS.forEach((p) => (e[p] = 0));
    (rows || []).forEach((r) => {
      e[r.powertrain] = (e[r.powertrain] || 0) + r.units;
    });
    return POWERTRAINS.map((p) => ({ powertrain: p, units: e[p] || 0 })).filter(
      (x) => x.units > 0
    );
  }

  function byBrand(rows, topN) {
    const e = {};
    (rows || []).forEach((r) => {
      if (!e[r.marca]) e[r.marca] = { marca: r.marca, total: 0, byPt: {} };
      e[r.marca].total += r.units;
      e[r.marca].byPt[r.powertrain] = (e[r.marca].byPt[r.powertrain] || 0) + r.units;
    });
    let a = Object.values(e).sort((x, y) => y.total - x.total);
    if (topN && a.length > topN) {
      const keep = a.slice(0, topN);
      const rest = a.slice(topN);
      const other = { marca: "…", total: 0, byPt: {}, isOther: true };
      rest.forEach((r) => {
        other.total += r.total;
        Object.keys(r.byPt).forEach((pt) => {
          other.byPt[pt] = (other.byPt[pt] || 0) + r.byPt[pt];
        });
      });
      if (other.total) keep.push(other);
      a = keep;
    }
    return a;
  }

  function byModel(rows, topN) {
    const e = {};
    (rows || []).forEach((r) => {
      const k = r.marca + "\0" + r.modelo + "\0" + r.powertrain;
      if (!e[k]) {
        e[k] = {
          marca: r.marca,
          modelo: r.modelo,
          powertrain: r.powertrain,
          units: 0,
          label: r.marca + " " + r.modelo,
        };
      }
      e[k].units += r.units;
    });
    let a = Object.values(e).sort((x, y) => y.units - x.units);
    if (topN) a = a.slice(0, topN);
    return a;
  }

  /**
   * Group by marca + base modelo (not edition) with powertrain breakdown.
   * When the source rows carry `edicion`, each group also gets `editions`
   * (named editions by units, blank bucket last, only if it has units).
   * Without that column the objects match the previous shape exactly.
   */
  function byModelStacked(rows, topN) {
    const editionAware = hasEdicion(rows);
    const e = {};
    (rows || []).forEach((r) => {
      const k = r.marca + "\0" + r.modelo;
      if (!e[k]) {
        e[k] = {
          marca: r.marca,
          modelo: r.modelo,
          label: r.marca + " " + r.modelo,
          total: 0,
          byPt: {},
        };
        if (editionAware) e[k].editionMap = {};
      }
      e[k].total += r.units;
      e[k].byPt[r.powertrain] = (e[k].byPt[r.powertrain] || 0) + r.units;
      if (editionAware) {
        const name = Object.prototype.hasOwnProperty.call(r, "edicion")
          ? String(r.edicion || "").trim()
          : "";
        e[k].editionMap[name] = (e[k].editionMap[name] || 0) + r.units;
      }
    });
    let a = Object.values(e).sort((x, y) => y.total - x.total);
    if (topN && a.length > topN) a = a.slice(0, topN);
    if (editionAware) {
      a.forEach((m) => {
        m.editions = editionList(m.editionMap);
        delete m.editionMap;
      });
    }
    return a;
  }

  /**
   * LightVehicles + leve only (cars + light pickups). Never falls back to Whole:
   * months without LV model detail are omitted (caller shows empty note).
   */

  /**
   * Aggregate model-level rows into Paraguay.csv-shaped monthly market rows
   * (BEV/PHEV/HEV/ICE/OTHERS/TOTAL + share). Used when Nuevos filter is ON.
   */
  function aggregateToMarketRows(rows) {
    const map = {};
    (rows || []).forEach((r) => {
      if (!r.period) return;
      if (!map[r.period]) {
        map[r.period] = {
          period: r.period,
          time_interval: "monthly",
          variant: r.variant || "LightVehicles",
          segmento: r.segmento || "leve",
          source: "Aduana PY · models (condicion=nuevo)",
          BEV: 0,
          PHEV: 0,
          HEV: 0,
          ICE: 0,
          OTHERS: 0,
          TOTAL: 0,
          notes: "derivado de Paraguay_models.csv",
        };
      }
      const m = map[r.period];
      const u = Number(r.units) || 0;
      const pt = r.powertrain;
      if (pt === "BEV" || pt === "PHEV" || pt === "HEV" || pt === "ICE") m[pt] += u;
      else m.OTHERS += u;
      m.TOTAL += u;
    });
    return Object.keys(map)
      .sort()
      .map((p) => {
        const row = map[p];
        row.electrified = row.BEV + row.PHEV + row.HEV + row.OTHERS;
        row.electrified_pct = row.TOTAL ? (100 * row.electrified) / row.TOTAL : 0;
        const pct = (n) => (row.TOTAL ? (100 * n) / row.TOTAL : 0);
        row.share = {
          BEV: pct(row.BEV),
          PHEV: pct(row.PHEV),
          HEV: pct(row.HEV),
          OTHERS: pct(row.OTHERS),
          ICE: pct(row.ICE),
        };
        return row;
      });
  }

  function marketSeriesRows(rows) {
    return (rows || []).filter(
      (r) => r.period && r.variant === "LightVehicles" && r.segmento === "leve"
    );
  }

  function periodsOfRows(rows) {
    return [...new Set((rows || []).map((r) => r.period).filter(Boolean))].sort();
  }

  /**
   * scope: { mode: "month"|"year"|"ytd", month?: "YYYY-MM", year?: "YYYY" }
   * Default month = latest available period.
   */
  function filterByPeriodScope(rows, scope) {
    const periods = periodsOfRows(rows);
    if (!periods.length) return [];
    scope = scope || {};
    const latest = periods[periods.length - 1];
    const mode = scope.mode || "month";
    if (mode === "month") {
      const m = scope.month && periods.includes(scope.month) ? scope.month : latest;
      return (rows || []).filter((r) => r.period === m);
    }
    const year = String(scope.year || latest.slice(0, 4));
    const yearPeriods = periods.filter((p) => p.startsWith(year + "-"));
    if (!yearPeriods.length) return [];
    if (mode === "year") {
      return (rows || []).filter((r) => r.period.startsWith(year + "-"));
    }
    // ytd: Jan through latest available month of that year
    const end = yearPeriods[yearPeriods.length - 1];
    return (rows || []).filter(
      (r) => r.period.startsWith(year + "-") && r.period <= end
    );
  }

  function matchQuery(hay, q) {
    if (!q) return true;
    return String(hay || "")
      .toLowerCase()
      .includes(String(q).toLowerCase());
  }

  function rankBrands(rows, opts) {
    opts = opts || {};
    const topN = opts.topN == null ? 100 : opts.topN;
    const q = String(opts.query || "").trim().toLowerCase();
    let brands = byBrand(rows, null);
    if (q) brands = brands.filter((b) => matchQuery(b.marca, q));
    if (topN) brands = brands.slice(0, topN);
    return brands;
  }

  function rankModels(rows, opts) {
    opts = opts || {};
    const topN = opts.topN == null ? 100 : opts.topN;
    const q = String(opts.query || "").trim().toLowerCase();
    let models = byModelStacked(rows, null);
    if (q) {
      models = models.filter(
        (m) => matchQuery(m.marca, q) || matchQuery(m.modelo, q) || matchQuery(m.label, q)
      );
    }
    if (topN) models = models.slice(0, topN);
    return models;
  }

  function isNarrowChart() {
    try {
      return !!(
        global.matchMedia && global.matchMedia("(max-width: 640px)").matches
      );
    } catch (e) {
      return false;
    }
  }

  function fitTick(s, max) {
    s = String(s);
    if (s.length <= max) return s;
    return s.slice(0, Math.max(1, max - 1)) + "…";
  }

  function renderStackedHBar(el, items, labelFn) {
    if (!el || !global.Plotly) return null;
    if (!items || !items.length) {
      el.innerHTML = '<div class="status">' + t("models_empty_filter") + "</div>";
      return null;
    }
    const c = colors();
    const narrow = isNarrowChart();
    const n = items.length;
    const full = items.map((it, i) => {
      const name = labelFn(it);
      const rank = it.rank || i + 1;
      return { name, rank, tick: rank + ". " + name };
    });
    const yLabels = full
      .map((f) => (narrow ? fitTick(f.tick, 18) : f.tick))
      .reverse();
    const fullNames = full.map((f) => f.tick).reverse();
    const traces = POWERTRAINS.map((pt) => ({
      type: "bar",
      orientation: "h",
      name: pt,
      y: yLabels,
      x: items.map((it) => it.byPt[pt] || 0).reverse(),
      customdata: fullNames,
      marker: { color: c[pt] },
      hovertemplate: "%{customdata} · " + pt + ": %{x:,}<extra></extra>",
    })).filter((tr) => tr.x.some((v) => v > 0));
    const rowH = narrow ? 28 : n > 40 ? 20 : n > 20 ? 22 : 26;
    const longest = full.reduce((m, f) => Math.max(m, (narrow ? fitTick(f.tick, 18) : f.tick).length), 0);
    const left = narrow
      ? Math.min(128, Math.max(84, Math.round(longest * 6.8)))
      : Math.min(220, Math.max(128, Math.round(longest * 7)));
    const chrome = narrow ? 36 : 78;
    const height = narrow ? rowH * n + chrome : Math.max(420, rowH * n + chrome);
    return Plotly.newPlot(
      el,
      traces,
      chartLayout({
        barmode: "stack",
        bargap: narrow ? 0.22 : 0.28,
        height,
        showlegend: !narrow,
        margin: narrow
          ? { t: 6, r: 8, b: 22, l: left }
          : { t: 32, r: 16, b: 36, l: left },
        legend: {
          orientation: "h",
          y: 1.02,
          x: 0,
          font: { size: 11 },
          bgcolor: "rgba(0,0,0,0)",
        },
        xaxis: Object.assign({}, chartLayout().xaxis, {
          title: narrow ? "" : { text: t("units") },
          rangemode: "tozero",
          automargin: false,
          tickfont: { size: narrow ? 10 : 12 },
        }),
        yaxis: Object.assign({}, chartLayout().yaxis, {
          title: "",
          automargin: !narrow,
          tickfont: { size: narrow ? 11 : n > 40 ? 10 : 12 },
        }),
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function renderTopBrandChart(el, brands) {
    return renderStackedHBar(el, brands, (b) => b.marca);
  }

  function renderTopModelChart(el, models) {
    return renderStackedHBar(el, models, (m) => m.label);
  }

  function renderTopBrandTable(el, brands, opts) {
    if (!el) return;
    if (!brands || !brands.length) {
      el.innerHTML = "";
      return;
    }
    opts = opts || {};
    const showGroupTotals = !!opts.showGroupTotals;
    let html =
      '<div class="data-table-wrap table-fit"><table class="data rank-brands"><thead><tr><th>#</th><th>' +
      t("models_col_brand") +
      "</th><th>" +
      t("models_col_pt") +
      "</th><th class='num'>" +
      t("units") +
      "</th><th class='num'>%</th></tr></thead><tbody>";
    const grand = brands.reduce((a, b) => a + b.total, 0);
    brands.forEach((b, i) => {
      const pts = POWERTRAINS.filter((pt) => (b.byPt[pt] || 0) > 0);
      let groupUnits = 0;
      let groupPct = 0;
      pts.forEach((pt, j) => {
        const u = b.byPt[pt] || 0;
        const pctNum = grand ? (100 * u) / grand : 0;
        const pct = grand ? pctNum.toFixed(1) + "%" : "—";
        groupUnits += u;
        groupPct += pctNum;
        html +=
          "<tr>" +
          "<td class='num'>" +
          (j === 0 ? b.rank || i + 1 : "") +
          "</td>" +
          "<td>" +
          (j === 0 ? esc(b.marca) : "") +
          "</td>" +
          "<td>" +
          pillHtml(pt) +
          "</td>" +
          "<td class='num'>" +
          fmt(u) +
          "</td>" +
          "<td class='num'>" +
          pct +
          "</td></tr>";
      });
      if (showGroupTotals && pts.length >= 2) {
        html +=
          "<tr class='rank-group-total'>" +
          "<td class='num'></td>" +
          "<td></td>" +
          "<td>" +
          esc(t("total")) +
          "</td>" +
          "<td class='num'>" +
          fmt(groupUnits) +
          "</td>" +
          "<td class='num'>" +
          (grand ? groupPct.toFixed(1) + "%" : "—") +
          "</td></tr>";
      }
    });
    html += "</tbody></table></div>";
    el.innerHTML = html;
  }

  function modelEditionKey(m) {
    return m.marca + "\0" + m.modelo;
  }

  function renderTopModelTable(el, models, opts) {
    if (!el) return;
    if (!models || !models.length) {
      el.innerHTML = "";
      return;
    }
    opts = opts || {};
    const showGroupTotals = !!opts.showGroupTotals;
    const expanded = opts.expandedModels;
    let html =
      '<div class="data-table-wrap table-fit"><table class="data rank-models"><thead><tr><th>#</th><th>' +
      t("models_col_brand") +
      "</th><th>" +
      t("models_col_model") +
      "</th><th>" +
      t("models_col_pt") +
      "</th><th class='num'>" +
      t("units") +
      "</th></tr></thead><tbody>";
    models.forEach((m, i) => {
      const pts = POWERTRAINS.filter((pt) => (m.byPt[pt] || 0) > 0);
      const editions = m.editions;
      const key = editions ? modelEditionKey(m) : "";
      const open = !!(editions && expanded && expanded.has(key));
      let groupUnits = 0;
      pts.forEach((pt, j) => {
        const u = m.byPt[pt] || 0;
        groupUnits += u;
        const modelCell = !editions
          ? j === 0
            ? esc(m.modelo)
            : ""
          : j === 0
            ? '<button type="button" class="rank-model-toggle" aria-expanded="' +
              (open ? "true" : "false") +
              '" aria-label="' +
              esc(t("vol_editions")) +
              '"><span class="rank-chev" aria-hidden="true">' +
              (open ? "▾" : "▸") +
              "</span>" +
              esc(m.modelo) +
              "</button>"
            : "";
        html +=
          "<tr" +
          (editions
            ? ' class="rank-model-hit' +
              (open ? " is-open" : "") +
              '" data-edition-key="' +
              esc(key) +
              '"'
            : "") +
          ">" +
          "<td class='num'>" +
          (j === 0 ? m.rank || i + 1 : "") +
          "</td>" +
          "<td>" +
          (j === 0 ? esc(m.marca) : "") +
          "</td>" +
          "<td>" +
          modelCell +
          "</td>" +
          "<td>" +
          pillHtml(pt) +
          "</td>" +
          "<td class='num'>" +
          fmt(u) +
          "</td></tr>";
      });
      if (showGroupTotals && pts.length >= 2) {
        html +=
          "<tr class='rank-group-total'>" +
          "<td class='num'></td>" +
          "<td></td>" +
          "<td></td>" +
          "<td>" +
          esc(t("total")) +
          "</td>" +
          "<td class='num'>" +
          fmt(groupUnits) +
          "</td></tr>";
      }
      if (editions && open) {
        let items = "";
        editions.forEach((ed) => {
          const name = ed.blank ? t("vol_edition_none") : ed.name;
          items +=
            "<li><span>" +
            esc(name) +
            "</span><span class='num'>" +
            fmt(ed.units) +
            "</span></li>";
        });
        html +=
          "<tr class='rank-editions'><td colspan='5'><div class='rank-editions-label'>" +
          esc(t("vol_editions")) +
          "</div><ul class='rank-edition-list'>" +
          items +
          "</ul></td></tr>";
      }
    });
    html += "</tbody></table></div>";
    el.innerHTML = html;
  }

  function pillHtml(pt) {
    return '<span class="pill ' + (PILL[pt] || "pill-others") + '">' + pt + "</span>";
  }

  function fmt(n) {
    return global.PYEV && global.PYEV.fmtInt
      ? global.PYEV.fmtInt(n)
      : String(Math.round(n));
  }

  function t(k) {
    return global.PYEV && global.PYEV.t ? global.PYEV.t(k) : k;
  }

  function chartLayout(extra) {
    const dark = !!(global.PYEV && global.PYEV.isDark && global.PYEV.isDark());
    const grid = dark ? "#3a3934" : "#e4e2dd";
    const ink = dark ? "#ecebe6" : "#1a1a18";
    const muted = dark ? "#aeaba2" : "#55534c";
    return Object.assign(
      {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: {
          family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif',
          color: ink,
          size: 12,
        },
        margin: { t: 28, r: 24, b: 48, l: 56 },
        legend: {
          orientation: "h",
          y: 1.12,
          x: 0,
          font: { size: 11, color: muted },
          bgcolor: "rgba(0,0,0,0)",
        },
        xaxis: {
          gridcolor: grid,
          zeroline: false,
          linecolor: grid,
          tickfont: { size: 11, color: muted },
        },
        yaxis: {
          gridcolor: grid,
          zeroline: false,
          linecolor: grid,
          tickfont: { size: 11, color: muted },
          title: { text: t("units"), font: { size: 11, color: muted } },
        },
      },
      extra || {}
    );
  }

  function colors() {
    return (
      (global.PYEV && global.PYEV.colors && global.PYEV.colors()) || {
        BEV: "#2f6b45",
        PHEV: "#1d4f91",
        HEV: "#8a6a12",
        OTHERS: "#6b4f9a",
        ICE: "#6b6860",
      }
    );
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  global.PYEVModels = {
    POWERTRAINS,
    loadParaguayModels,
    parseModelsCSV,
    resolveModelsUrl,
    resolveModelsDir,
    periodsOf: function (rows) {
      return [...new Set((rows || []).map((r) => r.period).filter(Boolean))].sort();
    },
    brandsOf: function (rows) {
      return [...new Set((rows || []).map((r) => r.marca).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    },
    modelsOf: function (rows, marca) {
      return [
        ...new Set(
          (rows || [])
            .filter((r) => !marca || r.marca === marca)
            .map((r) => r.modelo)
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    },
    powertrainsOf: function (rows) {
      const s = new Set((rows || []).map((r) => r.powertrain));
      return POWERTRAINS.filter((p) => s.has(p));
    },
    filterModels: function (rows, opts) {
      let a = rows || [];
      opts = opts || {};
      if (opts.period) a = a.filter((r) => r.period === opts.period);
      if (opts.variant) a = a.filter((r) => r.variant === opts.variant);
      if (opts.segmento) {
        const seg =
          global.PYEV && global.PYEV.normalizeSegment
            ? global.PYEV.normalizeSegment(opts.segmento)
            : opts.segmento;
        a = a.filter((r) => r.segmento === seg);
      }
      if (opts.powertrains && opts.powertrains.length) {
        const set = new Set(opts.powertrains);
        a = a.filter((r) => set.has(r.powertrain));
      }
      if (opts.marca) a = a.filter((r) => r.marca === opts.marca);
      if (opts.modelo) a = a.filter((r) => r.modelo === opts.modelo);
      if (opts.condicion === "nuevo" || opts.condicion === "usado") {
        a = a.filter((r) => r.condicion === opts.condicion);
      }
      if (opts.marcaQuery) {
        const q = String(opts.marcaQuery).trim().toLowerCase();
        if (q) a = a.filter((r) => r.marca.toLowerCase().includes(q));
      }
      return a;
    },
    sumUnits,
    byPowertrain,
    byBrand,
    byModel,
    byModelStacked,
    marketSeriesRows,
    aggregateToMarketRows,
    filterByPeriodScope,
    normalizeCondicion,
    hasCondicion,
    hasEdicion,
    joinEdicion,
    rankBrands,
    rankModels,
    renderTopBrandChart,
    renderTopModelChart,
    renderTopBrandTable,
    renderTopModelTable,
    pillHtml,
    renderGeneralChart: function (el, rows) {
      if (!el || !global.Plotly) return;
      const data = byPowertrain(rows);
      if (!data.length) {
        el.innerHTML = '<div class="status">' + t("models_empty_filter") + "</div>";
        return;
      }
      const c = colors();
      Plotly.newPlot(
        el,
        [
          {
            type: "bar",
            x: data.map((d) => d.powertrain),
            y: data.map((d) => d.units),
            text: data.map((d) => fmt(d.units)),
            textposition: "outside",
            marker: { color: data.map((d) => c[d.powertrain] || c.OTHERS) },
            hovertemplate: "%{x}: %{y:,}<extra></extra>",
            name: t("units"),
          },
        ],
        chartLayout({ showlegend: false, margin: { t: 36, r: 24, b: 48, l: 56 } }),
        { responsive: true, displayModeBar: false }
      );
    },
    renderBrandChart: function (el, rows) {
      if (!el || !global.Plotly) return;
      const brands = byBrand(rows, 15);
      if (!brands.length) {
        el.innerHTML = '<div class="status">' + t("models_empty_filter") + "</div>";
        return;
      }
      const c = colors();
      const x = brands.map((b) => b.marca);
      const traces = POWERTRAINS.map((pt) => ({
        type: "bar",
        name: pt,
        x,
        y: brands.map((b) => b.byPt[pt] || 0),
        marker: { color: c[pt] },
        hovertemplate: "%{x} · " + pt + ": %{y:,}<extra></extra>",
      })).filter((tr) => tr.y.some((v) => v > 0));
      Plotly.newPlot(
        el,
        traces,
        chartLayout({
          barmode: "stack",
          xaxis: Object.assign({}, chartLayout().xaxis, { tickangle: -35 }),
          margin: { t: 36, r: 16, b: 88, l: 56 },
        }),
        { responsive: true, displayModeBar: false }
      );
    },
    renderModelChart: function (el, rows) {
      if (!el || !global.Plotly) return;
      const models = byModel(rows, 25);
      if (!models.length) {
        el.innerHTML = '<div class="status">' + t("models_empty_filter") + "</div>";
        return;
      }
      const c = colors();
      const y = models.map((m) => m.marca + " " + m.modelo + " · " + m.powertrain).reverse();
      const x = models.map((m) => m.units).reverse();
      const pts = models.map((m) => m.powertrain).reverse();
      Plotly.newPlot(
        el,
        [
          {
            type: "bar",
            orientation: "h",
            y,
            x,
            text: x.map(fmt),
            textposition: "outside",
            marker: { color: pts.map((p) => c[p] || c.OTHERS) },
            hovertemplate: "%{y}<br>%{x:,}<extra></extra>",
          },
        ],
        chartLayout({
          showlegend: false,
          height: Math.max(360, 22 * models.length + 80),
          margin: { t: 24, r: 64, b: 40, l: 180 },
          xaxis: Object.assign({}, chartLayout().xaxis, { title: { text: t("units") } }),
          yaxis: Object.assign({}, chartLayout().yaxis, { title: "", automargin: true }),
        }),
        { responsive: true, displayModeBar: false }
      );
    },
    renderGeneralTable: function (el, rows) {
      if (!el) return;
      const data = byPowertrain(rows);
      const total = sumUnits(rows);
      if (!data.length) {
        el.innerHTML = "";
        return;
      }
      let html =
        '<div class="data-table-wrap table-fit"><table class="data"><thead><tr><th>' +
        t("models_col_pt") +
        "</th><th class='num'>" +
        t("units") +
        "</th><th class='num'>%</th></tr></thead><tbody>";
      data.forEach((d) => {
        const pct = total ? ((100 * d.units) / total).toFixed(1) + "%" : "—";
        html +=
          "<tr><td>" +
          pillHtml(d.powertrain) +
          "</td><td class='num'>" +
          fmt(d.units) +
          "</td><td class='num'>" +
          pct +
          "</td></tr>";
      });
      html +=
        "<tr><td><strong>" +
        t("total") +
        "</strong></td><td class='num'><strong>" +
        fmt(total) +
        "</strong></td><td class='num'>100%</td></tr>";
      html += "</tbody></table></div>";
      el.innerHTML = html;
    },
    renderBrandTable: function (el, rows) {
      if (!el) return;
      const brands = byBrand(rows, 50);
      if (!brands.length) {
        el.innerHTML = "";
        return;
      }
      const flat = [];
      brands.forEach((b) => {
        POWERTRAINS.forEach((pt) => {
          const u = b.byPt[pt] || 0;
          if (u > 0) flat.push({ marca: b.marca, powertrain: pt, units: u, total: b.total });
        });
      });
      flat.sort((a, b) => b.total - a.total || b.units - a.units);
      let html =
        '<div class="data-table-wrap table-fit"><table class="data"><thead><tr><th>' +
        t("models_col_brand") +
        "</th><th>" +
        t("models_col_pt") +
        "</th><th class='num'>" +
        t("units") +
        "</th></tr></thead><tbody>";
      flat.forEach((r) => {
        html +=
          "<tr><td>" +
          esc(r.marca) +
          "</td><td>" +
          pillHtml(r.powertrain) +
          "</td><td class='num'>" +
          fmt(r.units) +
          "</td></tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    },
    renderModelTable: function (el, rows) {
      if (!el) return;
      const models = byModel(rows, 100);
      if (!models.length) {
        el.innerHTML = "";
        return;
      }
      let html =
        '<div class="data-table-wrap table-fit"><table class="data"><thead><tr><th>' +
        t("models_col_brand") +
        "</th><th>" +
        t("models_col_model") +
        "</th><th>" +
        t("models_col_pt") +
        "</th><th class='num'>" +
        t("units") +
        "</th></tr></thead><tbody>";
      models.forEach((r) => {
        html +=
          "<tr><td>" +
          esc(r.marca) +
          "</td><td>" +
          esc(r.modelo) +
          "</td><td>" +
          pillHtml(r.powertrain) +
          "</td><td class='num'>" +
          fmt(r.units) +
          "</td></tr>";
      });
      html += "</tbody></table></div>";
      el.innerHTML = html;
    },
    restyleTheme: function (el) {
      if (el && el.data && global.Plotly) {
        try {
          Plotly.relayout(el, chartLayout());
        } catch (e) {}
      }
    },
  };

  if (global.PYEV) global.PYEV.loadParaguayModels = loadParaguayModels;
  else global.PYEV = { loadParaguayModels };
})(typeof window !== "undefined" ? window : globalThis);
