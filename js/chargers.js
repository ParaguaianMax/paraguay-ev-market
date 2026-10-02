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

  function renderKPIs(el, rows) {
    const plugs = rows.reduce((s, r) => s + r.n_dc_plugs, 0);
    const pub = rows.filter((r) => r.access === "público").length;
    const ops = countBy(rows, "operator").length;
    const items = [
      { cls: "", label: PYEV.t("locations_dc"), value: String(rows.length), sub: PYEV.t("chargers_dc") },
      { cls: "elec", label: PYEV.t("plugs"), value: String(plugs), sub: PYEV.t("connector_types") },
      { cls: "bev", label: PYEV.t("public"), value: String(pub), sub: PYEV.t("from_locations", {n: rows.length}) },
      { cls: "phev", label: PYEV.t("operators"), value: String(ops), sub: PYEV.t("consolidated_labels") },
    ];
    el.innerHTML = items
      .map(
        (it) =>
          `<div class="kpi ${it.cls}"><div class="label">${it.label}</div><div class="value">${it.value}</div><div class="sub">${it.sub}</div></div>`
      )
      .join("");
  }

  function renderBreakdown(el, rows) {
    const bands = countBy(rows, "power_band");
    const statuses = countBy(rows, "status");
    const ops = countBy(rows, "operator").slice(0, 8);
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

  function localizeValue(value) {
    const v = String(value || "");
    const map = {
      "abaixo de 50 kW": { es: "menos de 50 kW", pt: "abaixo de 50 kW", en: "under 50 kW" },
      "desconhecida": { es: "desconocida", pt: "desconhecida", en: "unknown" },
      "inferido (nome/desc)": { es: "inferido (nombre/desc.)", pt: "inferido (nome/desc.)", en: "inferred (name/description)" },
      "estimado (check-ins)": { es: "estimado (check-ins)", pt: "estimado (check-ins)", en: "estimated (check-ins)" },
      "PlugShare (outlet)": { es: "PlugShare (punto)", pt: "PlugShare (outlet)", en: "PlugShare (outlet)" },
      "est.": { es: "est.", pt: "est.", en: "est." }
    };
    return map[v] ? (map[v][PYEV.language()] || v) : v;
  }

  function renderTable(el, rows) {
    const head =
      "<thead><tr>" +
      [PYEV.t("name"), PYEV.t("city"), PYEV.t("dept"), PYEV.t("operators"), PYEV.t("plugs_short"), PYEV.t("max_kw"), PYEV.t("band"), PYEV.t("kw_source"), PYEV.t("status"), PYEV.t("access_col")]
        .map((h) => "<th>" + h + "</th>")
        .join("") +
      "</tr></thead>";
    const body = rows
      .map((r) => {
        const name = r.url
          ? `<a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>`
          : escapeHtml(r.name);
        const kw = r.kw_max == null ? PYEV.t("no_value") : String(r.kw_max);
        return (
          "<tr>" +
          `<td>${name}</td>` +
          `<td>${escapeHtml(r.ciudad)}</td>` +
          `<td class="muted-cell">${escapeHtml(r.departamento)}</td>` +
          `<td>${escapeHtml(r.operator)}</td>` +
          `<td class="num">${r.n_dc_plugs}</td>` +
          `<td class="num">${kw}</td>` +
          `<td>${escapeHtml(localizeValue(r.power_band))}</td>` +
          `<td class="muted-cell">${escapeHtml(localizeValue(r.kw_source || PYEV.t("no_value")))}</td>` +
          `<td>${escapeHtml(localizeValue(r.status))}</td>` +
          `<td><span class="tag-access ${accessClass(r.access)}">${escapeHtml(localizeValue(r.access))}</span></td>` +
          "</tr>"
        );
      })
      .join("");
    el.innerHTML = `<div class="data-table-wrap"><table class="data">${head}<tbody>${body}</tbody></table></div>`;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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
      const kw = r.kw_max == null ? "—" : r.kw_max + " kW";
      const popup =
        `<b>${escapeHtml(r.name)}</b><br>` +
        `${escapeHtml(r.ciudad)}, ${escapeHtml(r.departamento)}<br>` +
        `Operadora: ${escapeHtml(r.operator)}<br>` +
        `${r.n_dc_plugs} ${escapeHtml(PYEV.t("plugs"))} · ${escapeHtml(r.connectors_dc || PYEV.t("no_value"))}<br>` +
        `${escapeHtml(PYEV.t("max_kw"))}: ${kw} <span style="opacity:.75">(${escapeHtml(localizeValue(r.kw_source || "est."))})</span><br>` +
        `${escapeHtml(localizeValue(r.status))} · ${escapeHtml(localizeValue(r.access))}` +
        (r.url ? `<br><a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(PYEV.t("plugshare_link"))}</a>` : "");
      const m = L.marker([r.lat, r.lon], { icon }).bindPopup(popup);
      m._pyev = r;
      markers.push(m);
      group.addLayer(m);
    });
    group.addTo(map);
    if (rows.length) map.fitBounds(group.getBounds().pad(0.12));
    else map.setView([-25.3, -57.6], 7);

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
      updateLanguage: () => updateLanguage({ markers }),
    };
  }

  function updateLanguage(mapApi) {
    if (!mapApi) return;
    mapApi.markers.forEach((m) => {
      const r = m._pyev;
      const kw = r.kw_max == null ? PYEV.t("no_value") : r.kw_max + " kW";
      const popup = `<b>${escapeHtml(r.name)}</b><br>${escapeHtml(r.ciudad)}, ${escapeHtml(r.departamento)}<br>${escapeHtml(PYEV.t("operators"))}: ${escapeHtml(r.operator)}<br>${r.n_dc_plugs} ${escapeHtml(PYEV.t("plugs"))} · ${escapeHtml(r.connectors_dc || PYEV.t("no_value"))}<br>${escapeHtml(PYEV.t("max_kw"))}: ${kw} <span style="opacity:.75">(${escapeHtml(localizeValue(r.kw_source || "est."))})</span><br>${escapeHtml(localizeValue(r.status))} · ${escapeHtml(localizeValue(r.access))}` + (r.url ? `<br><a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(PYEV.t("plugshare_link"))}</a>` : "");
      m.bindPopup(popup);
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
    const tot = { CCS: 0, GBT: 0, CHAdeMO: 0 };
    (rows || []).forEach((r) => {
      const c = parseConnectorCounts(r.connectors_dc);
      tot.CCS += c.CCS;
      tot.GBT += c.GBT;
      tot.CHAdeMO += c.CHAdeMO;
    });
    return tot;
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
      CHAdeMO: dark ? "#d4b45a" : "#8a6a12",
    };
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
    Plotly.newPlot(el, [trace], layout, { responsive: true, displayModeBar: false });
    el._pyevConnectorTotal = total;
    el._pyevConnectorCounts = counts;
  }

  global.PYEVChargers = {
    loadChargers,
    renderKPIs,
    renderBreakdown,
    renderTable,
    renderConnectorChart,
    countConnectors,
    parseConnectorCounts,
    initMap,
    filterRows,
    countBy,
    updateLanguage,
    localizeValue,
    invalidateMap,
  };
})(typeof window !== "undefined" ? window : globalThis);
