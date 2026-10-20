(function (global) {
  function resolveChargersUrl() {
    const inPages =
      /\/pages\//.test(location.pathname) ||
      location.pathname.endsWith("/chargers.html");
    return inPages ? "../data/chargers-dc.csv" : "data/chargers-dc.csv";
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
        } else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  }

  function parseChargersCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).filter(Boolean).map((line) => {
      const cols = splitCSVLine(line);
      const row = {};
      headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
      row.lat = parseFloat(row.lat);
      row.lon = parseFloat(row.lon);
      row.n_dc_plugs = Number(row.n_dc_plugs) || 0;
      row.kw_max = row.kw_max === "" ? null : parseFloat(row.kw_max);
      return row;
    }).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));
  }

  async function loadChargers(url) {
    const u = url || resolveChargersUrl();
    const res = await fetch(u);
    if (!res.ok) throw new Error("No se pudo cargar " + u + " (" + res.status + ")");
    return parseChargersCSV(await res.text());
  }

  function countBy(rows, key) {
    const m = {};
    rows.forEach((r) => {
      const k = r[key] || "—";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  // Keep these orders independent of translated labels and of the row counts.
  // The power filter and the breakdown must read from weakest to strongest.
  const POWER_BAND_ORDER = [
    "abaixo de 50 kW",
    "50–99 kW",
    "100–149 kW",
    "150+ kW",
    "desconhecida",
  ];
  const STATUS_ORDER = [
    "ativo",
    "ativo (residencial/privado)",
    "ativo (restrito)",
    // Keep the two "em breve" variants adjacent.
    "em breve",
    "em breve (restrito)",
    // Keep both maintenance variants adjacent as well.
    "em manutenção",
    "parcialmente em manutenção",
  ];

  function countByInOrder(rows, key, order) {
    const pairs = countBy(rows, key);
    const rank = {};
    order.forEach((value, i) => (rank[value] = i));
    return pairs.sort((a, b) => {
      const ar = rank[a[0]] == null ? order.length : rank[a[0]];
      const br = rank[b[0]] == null ? order.length : rank[b[0]];
      return ar - br || a[0].localeCompare(b[0]);
    });
  }

  // Operator values that are not a real network (unknown, none, private home).
  const PLACEHOLDER_OPERATORS = ["não informado", "sem rede", "residencial / privado", "—", ""];

  // Carga page-level access mode. "public" = access "público" AND status
  // "ativo" (open and working); "all" = the whole inventory. Every status value
  // a público row can carry is mapped explicitly; anything else (restrito,
  // residencial/privado, unknown values) only appears in "all".
  const ACCESS_MODE_KEY = "pyev-chargers-access";
  const PUBLIC_STATUS = {
    "ativo": true,
    "em manutenção": false,
    "parcialmente em manutenção": false,
    "em breve": false,
  };
  function isPublicOpen(r) {
    return String(r.access || "").trim() === "público" && PUBLIC_STATUS[String(r.status || "").trim()] === true;
  }
  function normMode(m) {
    return m === "all" ? "all" : "public";
  }
  function rowsForMode(rows, mode) {
    const list = rows || [];
    if (!mode || normMode(mode) === "all") return list;
    return list.filter(isPublicOpen);
  }
  function getAccessMode() {
    try { return normMode(localStorage.getItem(ACCESS_MODE_KEY)); } catch (e) { return "public"; }
  }
  function setAccessMode(m) {
    try { localStorage.setItem(ACCESS_MODE_KEY, normMode(m)); } catch (e) {}
  }

  // Unit words for the tap readout under each chart (js/chart-click.js).
  function unitMeta(kind) {
    return kind === "sites"
      ? { pyevUnit: PYEV.t("unit_sites"), pyevUnitOne: PYEV.t("unit_sites_one") }
      : { pyevUnit: PYEV.t("unit_connectors"), pyevUnitOne: PYEV.t("unit_connectors_one") };
  }

  // GB/T adapter flag (column gbt_adaptador: sí/si/yes/true, any case or
  // accent; missing column or anything else = no adapter). An adapter is NOT a
  // connector: it never enters n_dc_plugs, types or any connector total.
  function hasGbtAdapter(r) {
    const v = String((r && r.gbt_adaptador) || "").trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return v === "si" || v === "yes" || v === "true";
  }

  // One set of definitions for every count on the site (Inicio card, KPIs,
  // map footer, network charts): a location is one CSV row; connectors are
  // n_dc_plugs summed, split by type from connectors_dc; pub* fields mean
  // access === "público". With `mode` ("public" | "all") the rows are first
  // cut to that Carga access mode. The CSV has no per-charger (post) field, so
  // locations are the finest charger unit available.
  function chargerCounts(rows, mode) {
    const all = rowsForMode(rows, mode);
    const pub = all.filter((r) => r.access === "público");
    const plugs = (list) => list.reduce((s, r) => s + (Number(r.n_dc_plugs) || 0), 0);
    const types = { CCS: 0, CHAdeMO: 0, GBT: 0 };
    const pubTypes = { CCS: 0, CHAdeMO: 0, GBT: 0 };
    const net = {};
    const opNames = {};
    let adapterSites = 0;
    all.forEach((r) => {
      const c = parseConnectorCounts(r.connectors_dc);
      const isPub = r.access === "público";
      ["CCS", "CHAdeMO", "GBT"].forEach((k) => {
        types[k] += c[k];
        if (isPub) pubTypes[k] += c[k];
      });
      opNames[r.operator || "—"] = true;
      const key = operatorKey(r.operator);
      if (!net[key]) net[key] = { key: key, sites: 0, plugs: 0, CCS: 0, CHAdeMO: 0, GBT: 0, GBTA: 0 };
      if (hasGbtAdapter(r)) {
        adapterSites += 1;
        net[key].GBTA += 1;
      }
      net[key].sites += 1;
      net[key].plugs += Number(r.n_dc_plugs) || 0;
      net[key].CCS += c.CCS;
      net[key].CHAdeMO += c.CHAdeMO;
      net[key].GBT += c.GBT;
    });
    const ops = Object.keys(opNames);
    const pubOps = {};
    pub.forEach((r) => {
      const o = String(r.operator || "").trim();
      if (PLACEHOLDER_OPERATORS.indexOf(o) < 0) pubOps[o] = true;
    });
    return {
      sites: all.length,
      plugs: plugs(all),
      pubSites: pub.length,
      pubPlugs: plugs(pub),
      types: types,
      pubTypes: pubTypes,
      // Locations with a GB/T adapter (not connectors; never in types/plugs).
      adapterSites: adapterSites,
      // As the KPI always counted it: distinct operator values, placeholders included.
      operators: ops.length,
      realOperators: ops.filter((o) => PLACEHOLDER_OPERATORS.indexOf(o) < 0).length,
      // Real networks (no placeholders) among public locations only.
      pubRealOperators: Object.keys(pubOps).length,
      networks: Object.keys(net).map((k) => net[k]),
      mode: mode ? normMode(mode) : "all",
    };
  }

  /**
   * Growth baselines from data/historico/ (latest report cut that lists its
   * locations), so a newer survey row there replaces them automatically.
   * - public: locations printed as "En Funcionamiento" (same rule as today's
   *   Público side: open and working).
   * - all: every location the report listed (the value the history chart draws).
   */
  function historyBaselines(pointRows) {
    const byCut = {};
    (pointRows || []).forEach((r) => {
      const c = String(r.corte || "").trim();
      if (!/^\d{4}-\d{2}$/.test(c) || c >= "2026-01") return;
      if (String(r.fonte || "informe").trim() !== "informe") return;
      if (!byCut[c]) byCut[c] = { corte: c, all: 0, public: 0 };
      byCut[c].all += 1;
      if (String(r.estado || "").trim().toLowerCase() === "en funcionamiento") byCut[c].public += 1;
    });
    const cuts = Object.keys(byCut).sort();
    if (!cuts.length) return null;
    return byCut[cuts[cuts.length - 1]];
  }

  function growthBaseline(bundle, mode) {
    const b = bundle && bundle.baselines;
    if (!b) return null;
    const m = normMode(mode);
    const sites = b[m];
    if (!(sites > 0)) return null;
    const out = { corte: b.corte, sites: sites };
    // "Público y restringido": compare like with like, both sides from
    // resumo_por_corte.csv (locations per cut: no residential/private, no
    // "em breve"), latest cut vs the base cut. Público keeps the live count
    // (público + ativo), which matches the base's "En Funcionamiento".
    const pts = (bundle && bundle.points) || [];
    const last = pts[pts.length - 1];
    if (m === "all" && last && last.corte.slice(0, 7) > b.corte) out.current = last.value;
    return out;
  }

  function signed(n) {
    return (n > 0 ? "+" : n < 0 ? "\u2212" : "\u00b1") + Math.abs(n);
  }

  /**
   * Carga top cards for the selected access mode: locations, growth against the
   * history baseline, connectors (CCS large, CHAdeMO and GB/T small, no total)
   * and real operators. Labels follow the mode. `baseline` comes from
   * growthBaseline(); without it the growth card shows a dash.
   */
  function renderKPIs(el, rows, baseline, mode) {
    const m = normMode(mode);
    const n = chargerCounts(rows, m);
    const pub = m === "public";
    el.classList.add("kpi-4");
    let growth = '<div class="value">\u2014</div>';
    if (baseline && baseline.sites > 0) {
      const diff = (baseline.current > 0 ? baseline.current : n.sites) - baseline.sites;
      const pct = Math.round((diff / baseline.sites) * 100);
      growth =
        '<div class="value">' + signed(diff) + ' <small>(' + signed(pct) + "%)</small></div>" +
        '<div class="sub">' + PYEV.t(pub ? "kpi_growth_sub" : "kpi_growth_sub_all", { period: historyMonthLabel(baseline.corte, true) }) + "</div>";
    } else if (baseline === false) {
      growth = '<div class="value">\u2014</div><div class="sub">' + PYEV.t("kpi_growth_na") + "</div>";
    }
    el.innerHTML =
      '<div class="kpi bev"><div class="label">' + PYEV.t(pub ? "kpi_pub_points" : "kpi_points") + '</div><div class="value">' + n.sites +
      '</div><div class="sub">' + PYEV.t(pub ? "kpi_pub_points_sub" : "kpi_points_sub_all") + "</div></div>" +
      '<div class="kpi kpi-growth"><div class="label">' + PYEV.t("kpi_growth") + "</div>" + growth + "</div>" +
      '<div class="kpi bev kpi-conn"><div class="label">' + PYEV.t("kpi_connectors") + '</div><div class="value">' + n.types.CCS +
      ' <small>CCS</small></div><div class="kpi-minor"><span>CHAdeMO <b>' + n.types.CHAdeMO + "</b></span><span>GB/T <b>" + n.types.GBT +
      "</b></span></div>" +
      (n.adapterSites > 0
        ? '<div class="kpi-adapter">' + PYEV.t(n.adapterSites === 1 ? "kpi_gbt_adapter_one" : "kpi_gbt_adapter", { n: n.adapterSites }) + "</div>"
        : "") +
      "</div>" +
      '<div class="kpi"><div class="label">' + PYEV.t("operators") + '</div><div class="value">' + n.realOperators +
      '</div><div class="sub">' + PYEV.t(pub ? "kpi_ops_sub" : "kpi_ops_sub_all") + "</div></div>";
  }

  function renderBreakdown(el, rows) {
    const bands = countByInOrder(rows, "power_band", POWER_BAND_ORDER);
    const statuses = countByInOrder(rows, "status", STATUS_ORDER);
    const ops = networkStats(rows).slice(0, 8).map((n) => [n.key, n.sites]);
    function list(title, pairs) {
      return (
        `<div class="kpi" style="border-right:1px solid var(--line);min-width:0">` +
        `<div class="label">${title}</div>` +
        pairs
          .map(
            ([k, v]) =>
              `<div class="sub" style="display:flex;justify-content:space-between;gap:8px;margin-top:4px"><span>${escapeHtml(localizeValue(k))}</span><b style="color:var(--text)">${v}</b></div>`
          )
          .join("") +
        `</div>`
      );
    }
    el.innerHTML =
      `<div class="kpi-grid" style="margin-top:0">` +
      list(PYEV.t("by_power"), bands) +
      list(PYEV.t("by_status"), statuses) +
      list(PYEV.t("top_operators"), ops) +
      `</div>`;
  }

  function accessClass(a) {
    if (a === "público") return "publico";
    if (a && a.indexOf("residencial") >= 0) return "privado";
    return "restrito";
  }

  function statusColor(status) {
    const s = (status || "").toLowerCase();
    if (s.indexOf("manutenção") >= 0 || s.indexOf("manutencao") >= 0) return "#8a6a12";
    if (s.indexOf("em breve") >= 0) return "#1d4f91";
    if (s.indexOf("ativo") >= 0) return "#2f6b45";
    return "#6b6860";
  }

  // CSV values are Portuguese; show them in the UI language via i18n keys.
  const CSV_VALUE_KEYS = {
    "abaixo de 50 kW": "cv_band_lt50",
    "desconhecida": "cv_unknown",
    "ativo": "cv_active",
    "ativo (residencial/privado)": "cv_active_private",
    "ativo (restrito)": "cv_active_restricted",
    "em breve": "cv_soon",
    "em breve (restrito)": "cv_soon_restricted",
    "em manutenção": "cv_maint",
    "parcialmente em manutenção": "cv_partial_maint",
    "público": "public",
    "restrito": "restricted",
    "residencial/privado": "private",
    "residencial / privado": "private",
    "não informado": "unknown_operator",
    "sem rede": "no_network",
  };

  function localizeValue(value) {
    const v = String(value || "");
    const key = CSV_VALUE_KEYS[v];
    return key ? PYEV.t(key) : v;
  }

  /** "2× CCS · GB/T con adaptador": native connectors by type, then the adapter flag. */
  function connectorText(r) {
    const c = parseConnectorCounts(r.connectors_dc);
    const parts = [];
    if (c.CCS) parts.push(c.CCS + "\u00d7 CCS");
    if (c.CHAdeMO) parts.push(c.CHAdeMO + "\u00d7 CHAdeMO");
    if (c.GBT) parts.push(c.GBT + "\u00d7 GB/T");
    if (!parts.length) parts.push(String(r.n_dc_plugs || 0));
    if (hasGbtAdapter(r)) parts.push(PYEV.t("gbt_adapter_text"));
    return parts.join(" \u00b7 ");
  }

  // Locations table sorting. Null = the CSV order (default until a header is
  // clicked). The state lives here, so it survives re-renders from the search
  // box and the Público / Público y restringido switch.
  const TABLE_COLLATOR = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  const TABLE_COLUMNS = [
    { key: "name", label: "name", text: (r) => r.name },
    { key: "city", label: "city", text: (r) => r.ciudad },
    { key: "dept", label: "dept", text: (r) => r.departamento },
    { key: "net", label: "operators", text: (r) => operatorLabel(r.operator) },
    { key: "plugs", label: "plugs_short", num: (r) => Number(r.n_dc_plugs) || 0, desc: true },
    { key: "kw", label: "max_kw", num: (r) => (Number.isFinite(r.kw_max) ? r.kw_max : null), desc: true },
    { key: "status", label: "status", text: (r) => localizeValue(r.status) },
    { key: "access", label: "access_col", text: (r) => localizeValue(r.access) },
  ];
  let tableSort = null; // { key, dir: 1 ascending | -1 descending }

  function sortTableRows(rows) {
    if (!tableSort) return rows;
    const col = TABLE_COLUMNS.find((c) => c.key === tableSort.key);
    if (!col) return rows;
    const dir = tableSort.dir;
    return rows.slice().sort((a, b) => {
      if (col.num) {
        const x = col.num(a), y = col.num(b);
        // Empty values (no published kW) always last, in both directions.
        if (x == null || y == null) return x == null && y == null ? 0 : x == null ? 1 : -1;
        return (x - y) * dir;
      }
      return TABLE_COLLATOR.compare(String(col.text(a) || ""), String(col.text(b) || "")) * dir;
    });
  }

  function renderTable(el, rows) {
    el._pyevRows = rows;
    if (!el._pyevSortBound) {
      el._pyevSortBound = true;
      el.addEventListener("click", (ev) => {
        const btn = ev.target.closest && ev.target.closest("button[data-sort]");
        if (!btn || !el.contains(btn)) return;
        const col = TABLE_COLUMNS.find((c) => c.key === btn.dataset.sort);
        if (!col) return;
        const natural = col.desc ? -1 : 1;
        tableSort = tableSort && tableSort.key === col.key
          ? { key: col.key, dir: -tableSort.dir }
          : { key: col.key, dir: natural };
        const wrap = el.querySelector(".data-table-wrap");
        const scrollLeft = wrap ? wrap.scrollLeft : 0;
        renderTable(el, el._pyevRows || []);
        const nw = el.querySelector(".data-table-wrap");
        if (nw) nw.scrollLeft = scrollLeft;
        const again = el.querySelector('button[data-sort="' + col.key + '"]');
        if (again) again.focus();
      });
    }
    const head =
      "<thead><tr>" +
      TABLE_COLUMNS.map((c) => {
        const active = tableSort && tableSort.key === c.key;
        const aria = active ? (tableSort.dir === 1 ? "ascending" : "descending") : "none";
        const ind = active ? (tableSort.dir === 1 ? "\u25b2" : "\u25bc") : "\u2195";
        return '<th aria-sort="' + aria + '"' + (c.num ? ' class="num"' : "") + '><button type="button" class="th-sort' + (active ? " is-active" : "") +
          '" data-sort="' + c.key + '">' + escapeHtml(PYEV.t(c.label)) + ' <span class="sort-ind" aria-hidden="true">' + ind + "</span></button></th>";
      }).join("") +
      "</tr></thead>";
    const body = sortTableRows(rows)
      .map((r) => {
        const rowUrl = plugShareUrl(r);
        const name = rowUrl
          ? `<a href="${escapeHtml(rowUrl)}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>`
          : escapeHtml(r.name);
        const kw = r.kw_max == null ? PYEV.t("no_value") : String(r.kw_max);
        return (
          "<tr>" +
          `<td>${name}</td>` +
          `<td>${escapeHtml(r.ciudad)}</td>` +
          `<td class="muted-cell">${escapeHtml(r.departamento)}</td>` +
          `<td>${escapeHtml(operatorLabel(r.operator))}</td>` +
          `<td class="conn-cell">${escapeHtml(connectorText(r))}</td>` +
          `<td class="num">${kw}</td>` +
          `<td>${escapeHtml(localizeValue(r.status))}</td>` +
          `<td><span class="tag-access ${accessClass(r.access)}">${escapeHtml(localizeValue(r.access))}</span></td>` +
          "</tr>"
        );
      })
      .join("");
    el.innerHTML = `<div class="data-table-wrap"><table class="data charger-table">${head}<tbody>${body}</tbody></table></div>`;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Prefer the published PlugShare URL, but keep the map useful when only the
  // source location id is available in the CSV.
  function plugShareUrl(row) {
    const url = String(row && row.url || "").trim();
    if (url) return url;
    const id = String(row && row.id || "").trim();
    return /^\d+$/.test(id) ? "https://www.plugshare.com/location/" + encodeURIComponent(id) : "";
  }

  function plugShareLink(row) {
    const url = plugShareUrl(row);
    return url
      ? `<br><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(PYEV.t("popup_plugshare"))}</a>`
      : "";
  }

  /** Map popup: name, network, max power, connectors (with adapter note), access · status, PlugShare link. */
  function chargerPopup(row) {
    const kw = Number.isFinite(row.kw_max) ? row.kw_max + " kW" : PYEV.t("popup_kw_unknown");
    return (
      `<b>${escapeHtml(row.name)}</b><br>` +
      `${escapeHtml(PYEV.t("network"))}: ${escapeHtml(operatorLabel(row.operator))}` +
      (SHOW_APP && appOf(row) ? ` \u00b7 ${escapeHtml(PYEV.t("app_label"))}: ${escapeHtml(appOf(row))}` : "") + "<br>" +
      `${escapeHtml(PYEV.t("popup_power"))}: ${escapeHtml(kw)}<br>` +
      `${escapeHtml(PYEV.t("plugs_short"))}: ${escapeHtml(connectorText(row))}<br>` +
      `${escapeHtml(PYEV.t("access_col"))}: ${escapeHtml(localizeValue(row.access))} \u00b7 ${escapeHtml(PYEV.t("status"))}: ${escapeHtml(localizeValue(row.status))}` +
      plugShareLink(row)
    );
  }

  const PY_BOUNDS = [[-27.6, -62.65], [-19.3, -54.25]];

  function invalidateMap(map) {
    if (!map) return;
    try {
      map.invalidateSize({ animate: false });
    } catch (e) {}
  }

  function initMap(mapEl, rows) {
    const map = L.map(mapEl, {
      scrollWheelZoom: false,
      preferCanvas: false,
      minZoom: 5,
      maxBounds: [[-28.4, -63.6], [-18.6, -53.6]],
      maxBoundsViscosity: 0.85,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    const group = L.featureGroup();
    const markers = [];

    rows.forEach((r) => {
      const color = statusColor(r.status);
      const icon = L.divIcon({
        className: "pyev-marker",
        html: `<div class="marker-dot" style="background:${color}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const m = L.marker([r.lat, r.lon], { icon }).bindPopup(chargerPopup(r));
      m._pyev = r;
      markers.push(m);
      group.addLayer(m);
    });
    group.addTo(map);
    // Whole country in view, not just the cluster around Asunción.
    const fitParaguay = () => {
      try { map.fitBounds(PY_BOUNDS, { padding: [6, 6] }); } catch (e) {}
    };
    fitParaguay();

    const scheduleInvalidate = () => {
      invalidateMap(map);
      requestAnimationFrame(() => invalidateMap(map));
      setTimeout(() => invalidateMap(map), 120);
      setTimeout(() => invalidateMap(map), 400);
    };
    map.whenReady(scheduleInvalidate);
    window.addEventListener("resize", () => invalidateMap(map));
    if (window.ResizeObserver) {
      try {
        const ro = new ResizeObserver(() => invalidateMap(map));
        ro.observe(mapEl);
        map._pyevRo = ro;
      } catch (e) {}
    }
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => setTimeout(() => invalidateMap(map), 50));
    }

    return {
      map,
      group,
      markers,
      invalidate: () => invalidateMap(map),
      fitParaguay,
      updateLanguage: () => updateLanguage({ markers }),
    };
  }

  function updateLanguage(mapApi) {
    if (!mapApi) return;
    mapApi.markers.forEach((m) => {
      const r = m._pyev;
      m.bindPopup(chargerPopup(r));
    });
  }

  function filterRows(rows, access, band) {
    return rows.filter((r) => {
      if (access && access !== "all" && r.access !== access) return false;
      if (band && band !== "all" && r.power_band !== band) return false;
      return true;
    });
  }

  /** Parse "CCS2×1, GB/T DC×2" → { CCS: n, GBT: n, CHAdeMO: n }. */
  function parseConnectorCounts(connectorsDc) {
    const out = { CCS: 0, GBT: 0, CHAdeMO: 0 };
    const s = String(connectorsDc || "");
    const re = /([^,×x]+)[×x](\d+)/gi;
    let m;
    while ((m = re.exec(s))) {
      const raw = m[1].trim().toUpperCase().replace(/\s+/g, " ");
      const n = parseInt(m[2], 10) || 0;
      if (!n) continue;
      if (raw.indexOf("CHADEMO") >= 0) out.CHAdeMO += n;
      else if (raw.indexOf("GB") >= 0 || raw.indexOf("GBT") >= 0) out.GBT += n;
      else if (raw.indexOf("CCS") >= 0) out.CCS += n;
    }
    return out;
  }

  function countConnectors(rows) {
    return chargerCounts(rows).types;
  }

  function chartTheme() {
    const dark =
      (global.PYEV && global.PYEV.isDark && global.PYEV.isDark()) ||
      document.documentElement.getAttribute("data-theme") === "dark";
    return {
      dark: dark,
      grid: dark ? "#3a3934" : "#e4e2dd",
      text: dark ? "#ecebe6" : "#1a1a18",
      muted: dark ? "#aeaba2" : "#55534c",
      // Match site palette: CCS≈PHEV blue, GB/T≈OTHERS purple, CHAdeMO≈HEV gold
      CCS: dark ? "#86acdd" : "#1d4f91",
      GBT: dark ? "#b59ad6" : "#6b4f9a",
      GBTA: dark ? "rgba(181,154,214,0.35)" : "rgba(107,79,154,0.22)",
      CHAdeMO: dark ? "#d4b45a" : "#8a6a12",
    };
  }

  function operatorKey(op) {
    const v = String(op || "").trim();
    return v || "não informado";
  }

  function operatorLabel(op) {
    const v = operatorKey(op);
    return localizeValue(v);
  }

  /** Sites (one row = one DC charger location) and connector quantities, largest network first. */
  // Non-networks always sort last: real networks (0), then no network /
  // unknown / private (1), then "Otras" (2).
  function networkTailRank(key) {
    const k = String(key == null ? "" : key).trim();
    if (k === "__other__") return 2;
    if (PLACEHOLDER_OPERATORS.indexOf(k) >= 0) return 1;
    if (/^(sin red|sem rede|no informado|não informado|nao informado|residencial)/i.test(k)) return 1;
    return 0;
  }

  function networkStats(rows) {
    return chargerCounts(rows).networks
      .sort((a, b) => networkTailRank(a.key) - networkTailRank(b.key) || b.sites - a.sites || operatorLabel(a.key).localeCompare(operatorLabel(b.key)));
  }

  function operatorColor(name, dark) {
    const light = {
      Evergo: "#2f8a45",
      Automotor: "#1d4f91",
      Diesa: "#6e6b64",
      "Shell Recharge": "#8a6a12",
      PTI: "#9a3d62",
      Enex: "#1f6f8a",
      Petropar: "#5c6570",
      "Pya'e": "#5a7a28",
      BYD: "#1f6b4a",
      Audi: "#4d5156",
      "Charger Pro": "#b85c38",
      "AG Power": "#6b4f9a",
      "Energia Actual": "#3d6b8a",
      Autocharge: "#8a4b2f",
      "Green Wolf": "#3d6b45",
    };
    const dim = {
      Evergo: "#7dce8a",
      Automotor: "#86acdd",
      Diesa: "#b7b3aa",
      "Shell Recharge": "#d4b45a",
      PTI: "#e09ab8",
      Enex: "#7ec4d4",
      Petropar: "#a8b0b8",
      "Pya'e": "#b5cf78",
      BYD: "#7dceaa",
      Audi: "#c5c8cc",
      "Charger Pro": "#e0a088",
      "AG Power": "#b59ad6",
      "Energia Actual": "#8eb4d4",
      Autocharge: "#e0a888",
      "Green Wolf": "#8ec49a",
    };
    const table = dark ? dim : light;
    if (table[name]) return table[name];
    const palette = dark
      ? ["#e07a3d", "#9a8ad4", "#5ec4c4", "#e08a62", "#8eb0e0", "#e09ac0", "#c4d48a", "#e0c48a"]
      : ["#c4622d", "#6b4f9a", "#2f7a7a", "#a35a32", "#3d5f8a", "#8a4a68", "#5c6b32", "#8a6a32"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  // Carga charts set an explicit layout.height (rows × per-row height). They are
  // drawn with responsive: false: Plotly's responsive resize relayouts with
  // autosize, which drops that height and collapses the chart to its container
  // (0 px for the network bars) on any resize, including the iPhone URL bar
  // showing/hiding. carga.html re-renders them itself when the width changes.
  function resetChart(el) {
    if (!el) return;
    if (el.data && global.Plotly) {
      try { Plotly.purge(el); } catch (e) {}
    }
    // Plotly replaces this node's contents when it draws. Clear the initial
    // status explicitly so a stale "Cargando…" cannot remain over the plot.
    el.innerHTML = "";
  }

  function emptyChart(el) {
    resetChart(el);
    el.innerHTML = '<div class="status">' + PYEV.t("no_value") + "</div>";
  }

  function renderNetworkPie(el, rows) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const stats = networkStats(rows);
    if (!stats.length) {
      emptyChart(el);
      return;
    }
    const th = chartTheme();
    const labels = stats.map((s) => operatorLabel(s.key));
    const values = stats.map((s) => s.sites);
    const colors = stats.map((s) => operatorColor(s.key, th.dark));
    const trace = {
      type: "pie",
      labels: labels,
      values: values,
      hole: 0.46,
      sort: false,
      direction: "clockwise",
      marker: { colors: colors, line: { color: th.dark ? "#141413" : "#fdfdfc", width: 1.5 } },
      text: stats.map((s) => operatorLabel(s.key) + " " + s.sites),
      textinfo: "text",
      textposition: "auto",
      insidetextorientation: "horizontal",
      hovertemplate: "<b>%{label}</b><br>" + PYEV.t("n_chargers") + ": %{value}<br>%{percent}<extra></extra>",
      showlegend: true,
    };
    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif',
        color: th.text,
        size: 12,
      },
      margin: { t: 16, r: 12, b: 72, l: 12 },
      legend: {
        orientation: "h",
        y: -0.12,
        x: 0,
        font: { size: 11, color: th.muted },
        bgcolor: "rgba(0,0,0,0)",
      },
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    resetChart(el);
    Plotly.newPlot(el, [trace], layout, { responsive: false, displayModeBar: false });
  }

  /**
   * Connectors by network: vertical grouped columns, one per connector type
   * (CCS, CHAdeMO, GB/T) for each network, value on top, never summed. Networks
   * run largest to smallest by total connectors. On phones the plot keeps a
   * readable width and scrolls sideways inside its own container.
   */
  function renderNetworkBars(el, rows) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const stats = chargerCounts(rows).networks
      .filter((s) => s.CCS + s.CHAdeMO + s.GBT > 0)
      .sort((a, b) => networkTailRank(a.key) - networkTailRank(b.key) || (b.CCS + b.CHAdeMO + b.GBT) - (a.CCS + a.CHAdeMO + a.GBT) || b.sites - a.sites ||
        operatorLabel(a.key).localeCompare(operatorLabel(b.key)));
    if (!stats.length) {
      emptyChart(el);
      return;
    }
    const th = chartTheme();
    const host = el.parentElement && el.parentElement.classList.contains("chart-hscroll") ? el.parentElement : null;
    const avail = (host || el).clientWidth || window.innerWidth;
    const phone = window.innerWidth < 640;
    const names = stats.map((s) => operatorLabel(s.key));
    const n = stats.length;
    const anyAdapter = stats.some((s) => s.GBTA > 0);
    // About 3 columns of ~13px per network on phones; wider than the screen
    // scrolls in the container. Adapters stack on the GB/T column (no 4th slot).
    const need = n * (phone ? 46 : 54) + 70;
    const width = need > avail ? need : null;
    function col(key, label, color) {
      const y = stats.map((s) => s[key]);
      return {
        type: "bar",
        meta: unitMeta(key === "GBTA" ? "sites" : "connectors"),
        name: label,
        x: names,
        y: y,
        marker: { color: color, line: { width: 0 } },
        text: y.map((v) => (v ? String(v) : "")),
        textposition: "outside",
        textangle: 0,
        cliponaxis: false,
        textfont: { size: phone ? 9 : 10, color: th.muted },
        constraintext: "none",
        // "x unified" hover already names the network once as the header.
        hovertemplate: label + ": %{y}<extra></extra>",
        offsetgroup: key === "GBTA" ? "GBT" : key,
      };
    }
    const maxOne = stats.reduce((m, s) => Math.max(m, s.CCS, s.CHAdeMO, s.GBT + (s.GBTA || 0)), 0);
    const gbt = col("GBT", "GB/T", th.GBT);
    const traces = [col("CCS", "CCS", th.CCS), col("CHAdeMO", "CHAdeMO", th.CHAdeMO), gbt];
    if (anyAdapter) {
      // Locations with a GB/T adapter: hatched, lighter, stacked on the native GB/T
      // column (same slot, base = native count). Outside every total and the sort.
      const short = PYEV.t("gbt_adapter_short");
      const a = col("GBTA", PYEV.t("gbt_adapter_series"), th.GBTA);
      // Points only where the network has adapters (null elsewhere: no bar, no hover row).
      const adapterText = stats.map((s) =>
        s.GBTA > 0 ? PYEV.t(s.GBTA === 1 ? "gbt_adapter_hover_one" : "gbt_adapter_hover", { n: PYEV.fmtInt ? PYEV.fmtInt(s.GBTA) : s.GBTA }) : ""
      );
      a.y = stats.map((s) => (s.GBTA > 0 ? s.GBTA : null));
      a.base = stats.map((s) => s.GBT);
      a.customdata = adapterText;
      // Tap readout: the same "+ N adaptadores" row, skipped where there are none.
      a.meta = Object.assign({}, a.meta, { pyevReadoutText: adapterText });
      a.marker = { color: th.GBTA, line: { color: th.GBT, width: stats.map((s) => (s.GBTA > 0 ? 1 : 0)) }, pattern: { shape: "/", fgcolor: th.GBT, size: 5, solidity: 0.25 } };
      // Hover value is the adapter count only (customdata), never base + value.
      a.hovertemplate = "%{customdata}<extra></extra>";
      // One label on top of the GB/T column: "1 + 2 adapt.", "2 adapt." or the native number
      // (two lines so it stays about as narrow as the column).
      a.text = stats.map((s) => (s.GBTA > 0 ? (s.GBT > 0 ? s.GBT + " + " : "") + s.GBTA + "<br>" + short : ""));
      gbt.text = stats.map((s) => (s.GBTA > 0 || !s.GBT ? "" : String(s.GBT)));
      traces.push(a);
    }
    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif', color: th.text, size: 12 },
      barmode: "group",
      bargap: 0.25,
      bargroupgap: 0.06,
      showlegend: true,
      height: phone ? 380 : 420,
      legend: { orientation: "h", y: 1.08, yanchor: "bottom", x: 0, font: { size: 11, color: th.muted }, bgcolor: "rgba(0,0,0,0)" },
      margin: { t: 40, r: 12, b: 20, l: 40 },
      xaxis: {
        gridcolor: "rgba(0,0,0,0)",
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 11, color: th.text },
        tickangle: phone || n > 10 ? -40 : 0,
        automargin: true,
      },
      yaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: 11, color: th.muted },
        title: { text: PYEV.t("plugs_short"), font: { size: 11, color: th.muted } },
        rangemode: "tozero",
        range: [0, Math.max(4, Math.ceil(maxOne * 1.15))],
        automargin: true,
      },
      hovermode: "x unified",
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    if (width) layout.width = width;
    resetChart(el);
    el.style.width = width ? width + "px" : "";
    if (host) host.classList.toggle("is-scrolling", !!width);
    Plotly.newPlot(
      el,
      traces,
      layout,
      { responsive: false, displayModeBar: false }
    );
  }

  /** One bar per network: charging locations (not connectors), most on top. */
  function renderNetworkSites(el, rows) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const stats = networkStats(rows).slice().reverse();
    if (!stats.length) {
      emptyChart(el);
      return;
    }
    const th = chartTheme();
    const phone = window.innerWidth < 640;
    const names = stats.map((s) => operatorLabel(s.key));
    const vals = stats.map((s) => s.sites);
    const maxV = vals.reduce((m, v) => Math.max(m, v), 0);
    const n = stats.length;
    const label = PYEV.t("carga_sites_axis");
    const trace = {
      type: "bar",
      meta: unitMeta("sites"),
      orientation: "h",
      name: label,
      y: names,
      x: vals,
      text: vals.map(String),
      textposition: "outside",
      cliponaxis: false,
      textfont: { size: 11, color: th.muted },
      marker: { color: th.dark ? "#2fc46a" : "#0f7a3a", line: { width: 0 } },
      hovertemplate: "<b>%{y}</b><br>" + label + ": %{x}<extra></extra>",
    };
    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif', color: th.text, size: 12 },
      bargap: 0.28,
      showlegend: false,
      height: Math.max(phone ? 260 : 300, n * (phone ? 28 : 32) + (phone ? 50 : 60)),
      margin: { t: 12, r: phone ? 24 : 36, b: 36, l: phone ? 8 : 12 },
      xaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: 11, color: th.muted },
        title: { text: label, font: { size: 11, color: th.muted } },
        rangemode: "tozero",
        range: [0, Math.max(4, Math.ceil(maxV * 1.12))],
        dtick: maxV > 20 ? 5 : maxV > 8 ? 2 : 1,
        automargin: true,
      },
      yaxis: {
        gridcolor: "rgba(0,0,0,0)",
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 12, color: th.text },
        automargin: true,
      },
      hovermode: "closest",
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    resetChart(el);
    Plotly.newPlot(el, [trace], layout, { responsive: false, displayModeBar: false });
  }

  // App that unlocks/charges (column `app`); may differ from the network
  // (owner). Empty = not recorded; never inferred from the network.
  // Temporarily off until every charger has an app (Max, 2026-10-20). Hides
  // the map App filter, the App part of the popup and the "Por app" section.
  const SHOW_APP = false;

  function appOf(row) {
    return String((row && row.app) || "").trim();
  }

  function appList(rows) {
    const seen = {};
    (rows || []).forEach((r) => { const a = appOf(r); if (a) seen[a] = (seen[a] || 0) + 1; });
    return Object.keys(seen).sort((a, b) => seen[b] - seen[a] || a.localeCompare(b));
  }

  function filterByApp(rows, app) {
    if (!app || app === "all") return rows;
    return (rows || []).filter((r) => appOf(r) === app);
  }

  const APP_TOP = 5;
  /** Points per app: top APP_TOP apps, then one "Otras" bar (other apps + no app), always last. */
  function appStats(rows) {
    const counts = {};
    (rows || []).forEach((r) => { const a = appOf(r); if (a) counts[a] = (counts[a] || 0) + 1; });
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    const top = ranked.slice(0, APP_TOP);
    const other = (rows || []).length - top.reduce((s, a) => s + counts[a], 0);
    const out = top.map((a) => ({ name: a, sites: counts[a] }));
    if (other > 0) out.push({ name: PYEV.t("app_other"), sites: other, other: true });
    return out;
  }

  function renderAppSites(el, rows) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const stats = appStats(rows).reverse();
    if (!stats.length) {
      emptyChart(el);
      return;
    }
    const th = chartTheme();
    const phone = window.innerWidth < 640;
    const names = stats.map((s) => s.name);
    const vals = stats.map((s) => s.sites);
    const maxV = vals.reduce((m, v) => Math.max(m, v), 0);
    const label = PYEV.t("carga_sites_axis");
    const green = th.dark ? "#2fc46a" : "#0f7a3a";
    const trace = {
      type: "bar",
      meta: unitMeta("sites"),
      orientation: "h",
      name: label,
      y: names,
      x: vals,
      text: vals.map(String),
      textposition: "outside",
      cliponaxis: false,
      textfont: { size: 11, color: th.muted },
      marker: { color: stats.map((s) => (s.other ? th.muted : green)), line: { width: 0 } },
      hovertemplate: "<b>%{y}</b><br>" + label + ": %{x}<extra></extra>",
    };
    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif', color: th.text, size: 12 },
      bargap: 0.28,
      showlegend: false,
      height: Math.max(phone ? 200 : 220, stats.length * (phone ? 28 : 32) + (phone ? 50 : 60)),
      margin: { t: 12, r: phone ? 24 : 36, b: 36, l: phone ? 8 : 12 },
      xaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: 11, color: th.muted },
        title: { text: label, font: { size: 11, color: th.muted } },
        rangemode: "tozero",
        range: [0, Math.max(4, Math.ceil(maxV * 1.12))],
        dtick: maxV > 40 ? 10 : maxV > 20 ? 5 : maxV > 8 ? 2 : 1,
        automargin: true,
      },
      yaxis: {
        gridcolor: "rgba(0,0,0,0)",
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 12, color: th.text },
        automargin: true,
      },
      hovermode: "closest",
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    resetChart(el);
    Plotly.newPlot(el, [trace], layout, { responsive: false, displayModeBar: false });
  }

  function renderConnectorChart(el, rows) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const counts = countConnectors(rows);
    // Primary ask is CCS vs GB/T; include CHAdeMO when present in the inventory.
    const items = [
      { key: "CCS", label: "CCS", value: counts.CCS },
      { key: "GBT", label: "GB/T", value: counts.GBT },
    ];
    if (counts.CHAdeMO > 0) {
      items.push({ key: "CHAdeMO", label: "CHAdeMO", value: counts.CHAdeMO });
    }
    const th = chartTheme();
    const colors = items.map((it) => th[it.key]);
    const total = items.reduce((s, it) => s + it.value, 0);
    const trace = {
      type: "bar",
      meta: unitMeta("connectors"),
      x: items.map((it) => it.label),
      y: items.map((it) => it.value),
      text: items.map((it) => String(it.value)),
      textposition: "outside",
      marker: { color: colors, line: { width: 0 } },
      hovertemplate: "%{x}: %{y:,} " + PYEV.t("plugs_short") + "<extra></extra>",
      name: PYEV.t("plugs_short"),
    };
    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif',
        color: th.text,
        size: 12,
      },
      showlegend: false,
      margin: { t: 36, r: 24, b: 48, l: 56 },
      xaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: 12, color: th.muted },
      },
      yaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: 11, color: th.muted },
        title: {
          text: PYEV.t("plugs_short"),
          font: { size: 11, color: th.muted },
        },
        rangemode: "tozero",
      },
      bargap: 0.42,
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    resetChart(el);
    Plotly.newPlot(el, [trace], layout, { responsive: false, displayModeBar: false });
    el._pyevConnectorTotal = total;
    el._pyevConnectorCounts = counts;
  }


  function resolveHistoryUrl() {
    const inPages =
      /\/pages\//.test(location.pathname) ||
      location.pathname.endsWith("/chargers.html");
    return inPages ? "../data/historico/resumo_por_corte.csv" : "data/historico/resumo_por_corte.csv";
  }

  function resolveHistoryPointsUrl() {
    const inPages =
      /\/pages\//.test(location.pathname) ||
      location.pathname.endsWith("/chargers.html");
    return inPages ? "../data/historico/pontos_por_corte.csv" : "data/historico/pontos_por_corte.csv";
  }

  function parseHistoryCSV(text) {
    const lines = String(text || "").trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).filter(Boolean).map((line) => {
      const cols = splitCSVLine(line);
      const row = {};
      headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
      return row;
    });
  }

  // History: real cuts only (fonte=informe or levantamento).
  // Never reads data/chargers-dc.csv.
  // Real survey points only: published reports (fonte=informe, also when the
  // column is empty) and our own dated surveys (fonte=levantamento). Any
  // reconstructed/estimated row is ignored. corte is YYYY-MM or YYYY-MM-DD.
  // History x-axis tick spacing (Plotly dtick): phone vs wide screens.
  const HISTORY_TICKS = { phone: "M6", wide: "M3" };
  const HISTORY_TOP_NETWORKS = 5;
  const OTHER_NET = "__other__";
  const NO_NETWORK_RE = /^(sin red|sem rede|no informado|não informado|nao informado)/i;
  function historyNetName(name) {
    return name === OTHER_NET ? PYEV.t("history_other_networks") : name;
  }
  const CUT_RE = /^\d{4}-\d{2}(-\d{2})?$/;
  function isRealCut(r) {
    const f = String((r && r.fonte) || "informe").trim().toLowerCase();
    return f === "informe" || f === "levantamento";
  }
  // x position = sourced survey date (column `data`, YYYY-MM-DD). Rows without
  // a valid date are skipped; no day is ever invented.
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function historyCut(r) {
    const d = String((r && r.data) || "").trim();
    return DATE_RE.test(d) && isRealCut(r) ? d : null;
  }
  function cutDate(c) {
    return c;
  }

  function historyPoints(rows) {
    return (rows || []).map((r) => {
      const corte = historyCut(r);
      const links = Number(r.n_links_plugshare);
      const graph = Number(r.n_grafico_soma);
      if (!corte) return null;
      const summaryOnly = !(links > 0);
      const value = summaryOnly ? graph : links;
      if (!Number.isFinite(value)) return null;
      return { corte: corte, value: value, summaryOnly: summaryOnly };
    }).filter(Boolean).sort((a, b) => cutDate(a.corte).localeCompare(cutDate(b.corte)));
  }

  function historyMonthLabel(corte, fullYear) {
    const lang = PYEV.language ? PYEV.language() : "es";
    const months = lang === "en"
      ? { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" }
      : lang === "pt"
        ? { "01": "jan", "02": "fev", "03": "mar", "04": "abr", "05": "mai", "06": "jun", "07": "jul", "08": "ago", "09": "set", "10": "out", "11": "nov", "12": "dez" }
        : { "01": "ene", "02": "feb", "03": "mar", "04": "abr", "05": "may", "06": "jun", "07": "jul", "08": "ago", "09": "sep", "10": "oct", "11": "nov", "12": "dic" };
    const parts = String(corte).split("-");
    if (parts[2]) return String(Number(parts[2])) + " " + (months[parts[1]] || parts[1]) + " " + parts[0];
    const yy = parts[0] ? (fullYear ? parts[0] : parts[0].slice(2)) : "";
    return (months[parts[1]] || parts[1]) + " " + yy;
  }

  function parseNetworkJSON(raw) {
    const s = String(raw || "").trim();
    if (!s) return {};
    let obj;
    try { obj = JSON.parse(s); } catch (e) { return {}; }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    const out = {};
    Object.keys(obj).forEach((k) => {
      const name = String(k).trim();
      if (!name) return;
      const n = Number(obj[k]);
      if (Number.isFinite(n)) out[name] = n;
    });
    return out;
  }

  // Network series from n_grafico_por_rede only.
  // Same cuts as the line (no 2026, never chargers-dc.csv).
  function historyStacks(rows) {
    const cuts = (rows || []).map((r) => {
      const corte = historyCut(r);
      if (!corte) return null;
      return { corte: corte, byNet: parseNetworkJSON(r.n_grafico_por_rede) };
    }).filter(Boolean).sort((a, b) => cutDate(a.corte).localeCompare(cutDate(b.corte)));
    // Top HISTORY_TOP_NETWORKS networks by the latest cut (ties: sum over all
    // cuts, then name); every other network and the points without a network
    // go into one "Otras" line per cut.
    const totals = {};
    cuts.forEach((c) => {
      Object.keys(c.byNet).forEach((k) => {
        totals[k] = (totals[k] || 0) + c.byNet[k];
      });
    });
    const latest = cuts.length ? cuts[cuts.length - 1].byNet : {};
    const top = Object.keys(totals)
      .filter((k) => !NO_NETWORK_RE.test(k))
      .sort((a, b) => ((latest[b] || 0) - (latest[a] || 0)) || (totals[b] - totals[a]) || a.localeCompare(b))
      .slice(0, HISTORY_TOP_NETWORKS);
    const keep = {};
    top.forEach((k) => { keep[k] = true; });
    const folded = cuts.map((c) => {
      const byNet = {};
      top.forEach((k) => { byNet[k] = c.byNet[k] || 0; });
      byNet[OTHER_NET] = Object.keys(c.byNet).reduce((sum, k) => sum + (keep[k] ? 0 : c.byNet[k]), 0);
      return { corte: c.corte, byNet: byNet };
    });
    return { networks: top.concat([OTHER_NET]), cuts: folded };
  }

  // Connector counts come only from the historical location file. Cuts without
  // location rows (Jan/Feb 2024) remain absent rather than being treated as zero.
  function historyConnectors(rows) {
    const fields = [
      { key: "ccs", name: "CCS", color: "CCS" },
      { key: "chademo", name: "CHAdeMO", color: "CHAdeMO" },
      { key: "gbt", name: "GB/T", color: "GBT" },
    ];
    const cuts = {};
    const present = {};
    (rows || []).forEach((r) => {
      const corte = historyCut(r);
      if (!corte) return;
      if (!cuts[corte]) cuts[corte] = { ccs: 0, chademo: 0, gbt: 0 };
      fields.forEach((f) => {
        const raw = String(r[f.key] ?? "").trim();
        if (!raw) return;
        const n = Number(raw);
        if (Number.isFinite(n)) {
          cuts[corte][f.key] += n;
          present[f.key] = true;
        }
      });
    });
    const available = fields.filter((f) => present[f.key]);
    return { fields: available, cuts: cuts };
  }

  // Growth base from serie_locais.csv (one row per location, one column group
  // per report cut). Latest pre-2026 report cut: all = present, public =
  // present and "En Funcionamiento" (mar/2025: 42 / 40). Same rule as before.
  function baselinesFromSerie(rows) {
    if (!rows || !rows.length) return null;
    const cuts = Object.keys(rows[0])
      .map((k) => (k.match(/^(\d{4}-\d{2})_presente$/) || [])[1])
      .filter((c) => c && c < "2026-01")
      .sort();
    if (!cuts.length) return null;
    const c = cuts[cuts.length - 1];
    const out = { corte: c, all: 0, public: 0 };
    rows.forEach((r) => {
      if (String(r[c + "_presente"] || "").trim().toLowerCase() !== "sim") return;
      out.all += 1;
      if (String(r[c + "_estado"] || "").trim().toLowerCase() === "en funcionamiento") out.public += 1;
    });
    return out.all > 0 ? out : null;
  }

  function historyBundle(rows, connectorRows, serieRows) {
    return {
      points: historyPoints(rows),
      stacks: historyStacks(rows),
      connectors: historyConnectors(connectorRows),
      baselines: historyBaselines(connectorRows) || baselinesFromSerie(serieRows),
    };
  }

  function historyNetworkColor(name, dark) {
    if (name === OTHER_NET) return dark ? "#8a8a84" : "#9a9a94";
    const alias = { EverGo: "Evergo", Shell: "Shell Recharge", Petrobras: "Petropar" };
    return operatorColor(alias[name] || name, dark);
  }

  async function loadHistory(url) {
    const u = url || resolveHistoryUrl();
    const connectorUrl = resolveHistoryPointsUrl();
    const results = await Promise.all([fetch(u), fetch(connectorUrl)]);
    if (!results[0].ok) throw new Error(PYEV.t("source_error") + " (" + results[0].status + ")");
    if (!results[1].ok) throw new Error(PYEV.t("source_error") + " (" + results[1].status + ")");
    const [summaryText, connectorText] = await Promise.all(results.map((res) => res.text()));
    let serieRows = [];
    try {
      const sr = await fetch(connectorUrl.replace("pontos_por_corte.csv", "serie_locais.csv"));
      if (sr.ok) serieRows = parseHistoryCSV(await sr.text());
    } catch (e) { /* growth card falls back to its dash */ }
    return historyBundle(parseHistoryCSV(summaryText), parseHistoryCSV(connectorText), serieRows);
  }

  // Monotone cubic (Fritsch-Carlson) through the real cuts, on x in ms. Never
  // overshoots: between two cuts the curve stays within their two values.
  // Null values split the series into runs (a series starts at its first cut).
  function monotoneCurve(xs, ys, steps) {
    const outX = [];
    const outY = [];
    const run = [];
    const flush = () => {
      const n = run.length;
      if (n === 1) { outX.push(run[0][0]); outY.push(run[0][1]); }
      if (n >= 2) {
        const x = run.map((p) => p[0]);
        const y = run.map((p) => p[1]);
        const d = [];
        for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
        const m = new Array(n);
        m[0] = d[0];
        m[n - 1] = d[n - 2];
        for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
        for (let i = 0; i < n - 1; i++) {
          if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
          const a = m[i] / d[i];
          const b = m[i + 1] / d[i];
          const h = a * a + b * b;
          if (h > 9) {
            const t = 3 / Math.sqrt(h);
            m[i] = t * a * d[i];
            m[i + 1] = t * b * d[i];
          }
        }
        for (let i = 0; i < n - 1; i++) {
          const dx = x[i + 1] - x[i];
          for (let k = 0; k < steps; k++) {
            const t = k / steps;
            const t2 = t * t;
            const t3 = t2 * t;
            outX.push(x[i] + t * dx);
            outY.push((2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * dx * m[i] +
              (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * dx * m[i + 1]);
          }
        }
        outX.push(x[n - 1]);
        outY.push(y[n - 1]);
      }
      if (n) { outX.push(null); outY.push(null); }
      run.length = 0;
    };
    xs.forEach((xv, i) => {
      const yv = ys[i];
      if (yv == null || !Number.isFinite(Number(yv))) { flush(); return; }
      run.push([Date.parse(xv), Number(yv)]);
    });
    flush();
    return {
      x: outX.map((v) => (v == null ? null : new Date(v).toISOString())),
      y: outY,
    };
  }

  // One series -> [smooth line (no hover, no readout), markers at real cuts
  // (hover + tap readout)]. Legend shows the line; markers share its group.
  function smoothHistoryTraces(trace, showLegend) {
    const curve = monotoneCurve(trace.x, trace.y, 24);
    const group = "h-" + trace.name;
    const line = {
      type: "scatter",
      mode: "lines",
      name: trace.name,
      x: curve.x,
      y: curve.y,
      line: Object.assign({}, trace.line, { shape: "linear" }),
      connectgaps: false,
      hoverinfo: "skip",
      legendgroup: group,
      showlegend: showLegend,
      meta: { pyevReadoutSkip: true },
    };
    const marks = Object.assign({}, trace, {
      mode: String(trace.mode || "markers").replace(/lines\+?/, "") || "markers",
      legendgroup: group,
      showlegend: false,
    });
    delete marks.line;
    return [line, marks];
  }

  function renderHistory(el, points, connectors) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const rows = points || [];
    if (!rows.length) {
      emptyChart(el);
      return;
    }
    const th = chartTheme();
    const phone = window.innerWidth < 640;
    const labels = rows.map((r) => cutDate(r.corte));
    const values = rows.map((r) => r.value);
    const summaryColor = th.muted;
    const siteColor = th.CCS;
    const max = values.reduce((m, v) => Math.max(m, v), 0);
    const trace = {
      type: "scatter",
      meta: unitMeta("sites"),
      mode: "lines+markers+text",
      name: PYEV.t("chargers_history_series"),
      x: labels,
      y: values,
      text: values.map(String),
      textposition: "top center",
      textfont: { size: phone ? 10 : 11, color: th.muted },
      cliponaxis: false,
      line: { color: siteColor, width: 2, shape: "linear" },
      marker: {
        size: rows.map((r) => (r.summaryOnly ? 11 : 9)),
        symbol: rows.map((r) => (r.summaryOnly ? "circle-open" : "circle")),
        color: rows.map((r) => (r.summaryOnly ? (th.dark ? "#141413" : "#fdfdfc") : siteColor)),
        line: {
          color: rows.map((r) => (r.summaryOnly ? summaryColor : siteColor)),
          width: 2,
        },
      },
      hovertemplate: PYEV.t("chargers_history_series") + ": %{y}<extra></extra>",
    };
    const connectorTraces = ((connectors && connectors.fields) || []).map((field) => {
      const values = rows.map((r) => {
        const cut = connectors.cuts && connectors.cuts[r.corte];
        return cut && Number.isFinite(cut[field.key]) ? cut[field.key] : null;
      });
      return {
        type: "scatter",
        meta: unitMeta("connectors"),
        mode: "lines+markers",
        name: field.name,
        x: labels,
        y: values,
        connectgaps: false,
        line: { color: th[field.color], width: 2, dash: "dot", shape: "linear" },
        marker: { size: 6, color: th[field.color] },
        hovertemplate: field.name + ": %{y}<extra></extra>",
      };
    });
    const showLeg = connectorTraces.length > 0;
    const traces = [trace].concat(connectorTraces).reduce((acc, t) => acc.concat(smoothHistoryTraces(t, showLeg)), []);
    const layout = {
      height: phone ? 280 : 340,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif',
        color: th.text,
        size: 12,
      },
      showlegend: connectorTraces.length > 0,
      legend: {
        orientation: "h",
        x: 0,
        y: phone ? -0.38 : -0.28,
        xanchor: "left",
        yanchor: "top",
        font: { size: phone ? 10 : 11, color: th.muted },
      },
      margin: phone ? { t: 28, r: 10, b: 112, l: 42 } : { t: 32, r: 16, b: 88, l: 52 },
      xaxis: {
        type: "date",
        // Real time scale; report cuts in 2024 sit a month apart, so cut-level
        // labels collide. Regular ticks (HISTORY_TICKS); the exact cut shows in the hover/readout.
        dtick: phone ? HISTORY_TICKS.phone : HISTORY_TICKS.wide,
        tick0: "2024-01-01",
        tickformat: "%b %Y",
        hoverformat: "%b %Y",
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 12, color: th.muted },
        tickangle: 0,
        automargin: true,
        fixedrange: true,
      },
      yaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 11, color: th.muted },
        title: { text: PYEV.t("chargers_history_series"), font: { size: 11, color: th.muted } },
        rangemode: "tozero",
        range: [0, Math.ceil(max * 1.28)],
        fixedrange: true,
      },
      hovermode: "x unified",
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    el.style.minHeight = (phone ? 330 : 390) + "px";
    resetChart(el);
    Plotly.newPlot(el, traces, layout, { responsive: false, displayModeBar: false, scrollZoom: false, doubleClick: false });
  }

  function renderHistoryNetworkLegend(el, stacks) {
    if (!el) return;
    const networks = (stacks && stacks.networks) || [];
    if (!networks.length) {
      el.innerHTML = "";
      return;
    }
    const th = chartTheme();
    el.innerHTML = networks.map((name) => {
      const color = historyNetworkColor(name, th.dark);
      return '<span class="item"><span class="swatch" style="background:' + escapeHtml(color) + '"></span>' + escapeHtml(historyNetName(name)) + '</span>';
    }).join("");
  }

  function renderHistoryNetworks(el, stacks) {
    if (!el) return;
    if (!global.Plotly) {
      el.innerHTML = '<div class="status">' + (PYEV.t("loading") || "…") + "</div>";
      return;
    }
    const bundle = stacks || {};
    const cuts = bundle.cuts || [];
    const networks = bundle.networks || [];
    if (!cuts.length || !networks.length) {
      emptyChart(el);
      return;
    }
    const th = chartTheme();
    const phone = window.innerWidth < 640;
    const labels = cuts.map((c) => cutDate(c.corte));
    const series = networks.map((name) => ({
      type: "scatter",
      meta: unitMeta("sites"),
      mode: "lines+markers",
      name: historyNetName(name),
      x: labels,
      y: cuts.map((c) => (c.byNet && c.byNet[name]) || 0),
      line: { color: historyNetworkColor(name, th.dark), width: 2, shape: "linear" },
      marker: { color: historyNetworkColor(name, th.dark), size: 6 },
      hovertemplate: historyNetName(name) + ": %{y}<extra></extra>",
    }));
    const max = series.reduce((m, trace) =>
      Math.max(m, ...trace.y.map((v) => Number(v) || 0)), 0
    );
    const traces = series.reduce((acc, t) => acc.concat(smoothHistoryTraces(t, false)), []);
    const layout = {
      height: phone ? 380 : 420,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif',
        color: th.text,
        size: 12,
      },
      // The legend is rendered as a normal-flow HTML row below the chart.
      // Keeping it out of Plotly leaves the legend in the normal flow below the chart.
      showlegend: false,
      margin: phone ? { t: 8, r: 8, b: 68, l: 36 } : { t: 12, r: 16, b: 58, l: 48 },
      xaxis: {
        type: "date",
        // Real time scale; report cuts in 2024 sit a month apart, so cut-level
        // labels collide. Regular ticks (HISTORY_TICKS); the exact cut shows in the hover/readout.
        dtick: phone ? HISTORY_TICKS.phone : HISTORY_TICKS.wide,
        tick0: "2024-01-01",
        tickformat: "%b %Y",
        hoverformat: "%b %Y",
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 12, color: th.muted },
        tickangle: 0,
        automargin: true,
        fixedrange: true,
      },
      yaxis: {
        gridcolor: th.grid,
        zeroline: false,
        linecolor: th.grid,
        tickfont: { size: phone ? 10 : 11, color: th.muted },
        title: phone ? "" : { text: PYEV.t("chargers_history_networks_axis"), font: { size: 11, color: th.muted } },
        rangemode: "tozero",
        range: [0, Math.ceil(max * 1.12) || 1],
        fixedrange: true,
      },
      hovermode: "x unified",
      hoverlabel: {
        bgcolor: th.dark ? "#1b1b19" : "#ffffff",
        bordercolor: th.grid,
        font: { family: "Public Sans, system-ui, sans-serif", size: 12, color: th.text },
      },
    };
    el.style.minHeight = (phone ? 400 : 440) + "px";
    resetChart(el);
    Plotly.newPlot(el, traces, layout, { responsive: false, displayModeBar: false, scrollZoom: false, doubleClick: false });
  }

  global.PYEVChargers = {
    loadChargers,
    chargerCounts,
    renderKPIs,
    growthBaseline,
    rowsForMode,
    hasGbtAdapter,
    connectorText,
    getAccessMode,
    setAccessMode,
    renderBreakdown,
    renderTable,
    renderConnectorChart,
    renderNetworkPie,
    renderNetworkBars,
    renderNetworkSites,
    loadHistory,
    renderHistory,
    renderHistoryNetworks,
    renderHistoryNetworkLegend,
    historyPoints,
    historyConnectors,
    historyStacks,
    historyBundle,
    networkStats,
    operatorLabel,
    countConnectors,
    parseConnectorCounts,
    initMap,
    filterRows,
    countBy,
    SHOW_APP,
    appOf,
    appList,
    filterByApp,
    appStats,
    renderAppSites,
    countByInOrder,
    updateLanguage,
    localizeValue,
    invalidateMap,
  };
})(typeof window !== "undefined" ? window : globalThis);
