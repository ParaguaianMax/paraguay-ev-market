(function (global) {
  function C() {
    return (global.PYEV && global.PYEV.colors && global.PYEV.colors()) || {};
  }

  function isDark() {
    return global.PYEV && global.PYEV.isDark ? global.PYEV.isDark() : false;
  }

  function plotlyLayout(extra) {
    const dark = isDark();
    const grid = dark ? "#3a3934" : "#e4e2dd";
    const text = dark ? "#ecebe6" : "#1a1a18";
    const muted = dark ? "#aeaba2" : "#55534c";
    const base = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: 'Public Sans, "Helvetica Neue", system-ui, sans-serif',
        color: text,
        size: 12,
      },
      margin: { t: 36, r: 48, b: 48, l: 52 },
      legend: {
        orientation: "h",
        y: 1.16,
        x: 0,
        font: { size: 11, color: muted },
        bgcolor: "rgba(0,0,0,0)",
      },
      xaxis: {
        gridcolor: grid,
        zeroline: false,
        linecolor: grid,
        tickfont: { size: 11, color: muted },
        title: { font: { size: 11, color: muted } },
      },
      yaxis: {
        gridcolor: grid,
        zeroline: false,
        linecolor: grid,
        tickfont: { size: 11, color: muted },
        title: { font: { size: 11, color: muted } },
      },
      hovermode: "x unified",
      hoverlabel: {
        bgcolor: dark ? "#1b1b19" : "#ffffff",
        bordercolor: grid,
        font: { family: 'Public Sans, system-ui, sans-serif', size: 12, color: text },
      },
    };
    return Object.assign(base, extra || {});
  }

  /** Gallery-style share trajectory — monthly % lines by powertrain (observed).
   * Dual axis: electrified (left) and ICE (right). opts.home tightens the homepage chart.
   */
  function shareChart(el, rows, opts) {
    if (!el || !rows || !rows.length) return;
    opts = opts || {};
    const col = C();
    const dark = isDark();
    const muted = dark ? "#aeaba2" : "#55534c";
    const markerBorder = dark ? "#141413" : "#fdfdfc";
    const narrow = typeof window !== "undefined" && window.innerWidth < 640;
    const periods = rows.map((r) => r.period);
    const displayCats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
    // opts.only: e.g. ["BEV"] draws just those lines on one axis.
    const only = Array.isArray(opts.only) && opts.only.length ? opts.only : null;
    const elecCats = displayCats.filter((k) => k !== "ICE" && (!only || only.includes(k)));
    const showIce = !only || only.includes("ICE");
    let maxElec = 0;
    elecCats.forEach((k) => {
      rows.forEach((r) => {
        if ((r.share[k] || 0) > maxElec) maxElec = r.share[k] || 0;
      });
    });
    const leftTop = Math.max(4, Math.ceil((maxElec * 1.35) * 2) / 2);
    let iceMin = 100;
    let iceMax = 0;
    rows.forEach((r) => {
      const v = r.share.ICE || 0;
      if (v < iceMin) iceMin = v;
      if (v > iceMax) iceMax = v;
    });
    const icePad = Math.max(1, (iceMax - iceMin) * 0.35);
    const iceLo = Math.max(0, Math.floor(iceMin - icePad));
    const iceHi = Math.min(100, Math.ceil(iceMax + icePad));

    const traces = [];
    elecCats.forEach((k) => {
      traces.push({
        type: "scatter",
        mode: "lines+markers",
        name: k,
        x: periods,
        y: rows.map((r) => +((r.share[k] || 0).toFixed(4))),
        line: { color: col[k], width: narrow ? 1.75 : 2.25 },
        marker: { color: col[k], size: narrow ? 5 : 7, line: { width: 1, color: markerBorder } },
        hovertemplate: "<b>" + k + "</b>: %{y:.2f}%<extra></extra>",
      });
    });
    if (showIce) traces.push({
      type: "scatter",
      mode: "lines+markers",
      name: "ICE",
      x: periods,
      y: rows.map((r) => +((r.share.ICE || 0).toFixed(4))),
      yaxis: "y2",
      line: { color: col.ICE, width: narrow ? 1.75 : 2.25 },
      marker: { color: col.ICE, size: narrow ? 5 : 7, line: { width: 1, color: markerBorder } },
      hovertemplate: "<b>ICE</b>: %{y:.2f}%<extra></extra>",
    });

    const base = plotlyLayout();
    const titleFont = { size: narrow ? 10 : 11, color: muted };
    const tickFont = { size: narrow ? 10 : 11, color: muted };
    const elecTitle = only && elecCats.length === 1
      ? "% " + elecCats[0]
      : narrow ? global.PYEV.t("share_axis_elec_short") : global.PYEV.t("share_axis_elec");
    const iceTitle = narrow ? global.PYEV.t("share_axis_ice_short") : global.PYEV.t("share_axis_ice");
    const layout = plotlyLayout({
        showlegend: false,
        height: narrow ? 320 : 420,
        yaxis: Object.assign({}, base.yaxis, {
          title: { text: elecTitle, font: titleFont, standoff: 6 },
          range: [0, leftTop],
          ticksuffix: "%",
          rangemode: "tozero",
          automargin: true,
          tickfont: tickFont,
        }),
        yaxis2: {
          title: { text: iceTitle, font: titleFont, standoff: 6 },
          overlaying: "y",
          side: "right",
          range: [iceLo, iceHi],
          ticksuffix: "%",
          showgrid: false,
          zeroline: false,
          automargin: true,
          tickfont: tickFont,
        },
        xaxis: Object.assign({}, base.xaxis, {
          title: { text: global.PYEV.t("month"), font: titleFont, standoff: 8 },
          type: "date",
          tickformat: narrow ? "%b %y" : "%b %Y",
          nticks: narrow ? 5 : 8,
          automargin: true,
          tickfont: tickFont,
          tickangle: 0,
        }),
        margin: narrow ? { t: 8, r: 8, b: 8, l: 8 } : { t: 12, r: 8, b: 8, l: 8 },
      });
    if (!showIce) delete layout.yaxis2;
    Plotly.newPlot(el, traces, layout, { responsive: true, displayModeBar: false });
    el._pyevKind = "share";
    el._pyevRows = rows;
    el._pyevOpts = opts;
  }

  /** Full volumes with ICE — secondary; hover shows units + %. */
  function volumesChart(el, rows, opts) {
    opts = opts || {};
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const all = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
    // opts.cats limits the bars (Volúmenes powertrain chips).
    const cats = Array.isArray(opts.cats) && opts.cats.length ? all.filter((k) => opts.cats.includes(k)) : all;
    const col = C();
    const dark = isDark();
    const muted = dark ? "#aeaba2" : "#55534c";
    const traces = cats.map((k) => ({
      type: "bar",
      name: k,
      x: labels,
      y: rows.map((r) => r[k]),
      customdata: rows.map((r) => r.share[k]),
      marker: { color: col[k], line: { width: 0 } },
      hovertemplate: "<b>%{fullData.name}</b>: %{y:,} " + global.PYEV.t("units") + " (%{customdata:.2f}%)<extra></extra>",
    }));
    traces.push({
      type: "scatter",
      mode: "lines+markers",
      name: "TOTAL",
      x: labels,
      y: rows.map((r) => r.TOTAL),
      line: { color: col.TOTAL, width: 2.25 },
      marker: { size: 7, color: col.TOTAL },
      yaxis: "y2",
      hovertemplate: "<b>TOTAL</b>: %{y:,} " + global.PYEV.t("units") + "<extra></extra>",
    });
    const base = plotlyLayout();
    Plotly.newPlot(
      el,
      traces,
      plotlyLayout({
        barmode: "group",
        bargap: 0.22,
        bargroupgap: 0.08,
        yaxis: Object.assign({}, base.yaxis, {
          title: { text: global.PYEV.t("units_categories"), font: base.yaxis.title.font },
        }),
        yaxis2: {
          title: { text: "TOTAL", font: { size: 11, color: muted } },
          overlaying: "y",
          side: "right",
          showgrid: false,
          zeroline: false,
          tickfont: { size: 11, color: muted },
        },
        xaxis: Object.assign({}, base.xaxis, {
          title: { text: global.PYEV.t("month"), font: base.xaxis.title.font },
        }),
        margin: { t: 36, r: 56, b: 48, l: 56 },
      }),
      { responsive: true, displayModeBar: false }
    );
    el._pyevKind = "volumes";
    el._pyevRows = rows;
    el._pyevOpts = opts;
  }

  /** Electrified-only volumes — ICE excluded so BEV/PHEV/HEV are readable. */
  function volumesElectrifiedChart(el, rows, opts) {
    opts = opts || {};
    const mode = opts.mode === "hev" ? "hev" : "all";
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const limit = Array.isArray(opts.cats) && opts.cats.length ? opts.cats : null;
    const cats = (mode === "hev" ? ["HEV"] : ["BEV", "PHEV", "HEV", "OTHERS"]).filter(
      (k) => !limit || limit.includes(k)
    );
    if (!cats.length) {
      el.innerHTML = '<div class="status">' + global.PYEV.t("models_empty_filter") + "</div>";
      el._pyevKind = "volumesElec";
      el._pyevRows = null;
      return;
    }
    const col = C();
    const traces = cats.map((k) => ({
      type: "bar",
      name: k,
      x: labels,
      y: rows.map((r) => r[k]),
      customdata: rows.map((r) => r.share[k]),
      text: rows.map((r) => r[k] + " (" + r.share[k].toFixed(1) + "%)"),
      textposition: "outside",
      textfont: { size: 10 },
      cliponaxis: false,
      marker: { color: col[k], line: { width: 0 } },
      hovertemplate: "<b>%{fullData.name}</b>: %{y:,} " + global.PYEV.t("units") + " · %{customdata:.2f}% " + global.PYEV.t("share_of_total") + "<extra></extra>",
    }));
    // Full view adds a dotted plug-in line (BEV + PHEV); HEV-only or chip-limited views don't.
    if (mode !== "hev" && !limit) {
      const lineCol = isDark() ? "#ecebe6" : "#1a1a18";
      traces.push({
        type: "scatter",
        mode: "lines+markers+text",
        name: global.PYEV.t("plug_short"),
        x: labels,
        y: rows.map((r) => (r.BEV || 0) + (r.PHEV || 0)),
        text: rows.map((r) => (r.TOTAL ? (100 * ((r.BEV || 0) + (r.PHEV || 0))) / r.TOTAL : 0).toFixed(1) + "%"),
        textposition: "top center",
        textfont: { size: 11, color: lineCol },
        line: { color: lineCol, width: 2, dash: "dot" },
        marker: { size: 7, color: lineCol },
        hovertemplate: "<b>" + global.PYEV.t("plug_short") + "</b>: %{y:,} " + global.PYEV.t("units") + " (%{text} " + global.PYEV.t("share_of_total") + ")<extra></extra>",
      });
    }
    const base = plotlyLayout();
    Plotly.newPlot(
      el,
      traces,
      plotlyLayout({
        barmode: "group",
        bargap: 0.25,
        bargroupgap: 0.1,
        yaxis: Object.assign({}, base.yaxis, {
          title: { text: global.PYEV.t("units_no_ice"), font: base.yaxis.title.font },
          rangemode: "tozero",
        }),
        xaxis: Object.assign({}, base.xaxis, {
          title: { text: global.PYEV.t("month"), font: base.xaxis.title.font },
        }),
        margin: { t: 40, r: 24, b: 48, l: 56 },
      }),
      { responsive: true, displayModeBar: false }
    );
    el._pyevKind = "volumesElec";
    el._pyevRows = rows;
    el._pyevElecMode = mode;
    el._pyevOpts = opts;
  }

  /** Month-by-month share table under volumes — exact %. */
  function renderShareTable(container, rows) {
    if (!container || !rows || !rows.length) return;
    const cats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE", "electrified"];
    const labels = {
      BEV: "BEV",
      PHEV: "PHEV",
      HEV: "HEV",
      OTHERS: "OTHERS",
      ICE: "ICE",
      electrified: "Electrificados",
    };
    let head =
      "<thead><tr><th>" + global.PYEV.t("month") + "</th><th class='num'>" + global.PYEV.t("total") + "</th>" +
      cats.map((c) => "<th class='num'>" + labels[c] + "</th>").join("") +
      cats.map((c) => "<th class='num'>% " + labels[c] + "</th>").join("") +
      "</tr></thead>";
    // Simpler: units + % side by side per category
    head =
      "<thead><tr><th>" + global.PYEV.t("month") + "</th><th class='num'>" + global.PYEV.t("total") + "</th>" +
      ["BEV", "PHEV", "HEV", "OTHERS", "ICE", global.PYEV.t("plug_short")].map((c) => "<th class='num'>" + c + "</th><th class='num'>%</th>").join("") +
      "</tr></thead>";
    const body = rows
      .map((r) => {
        const cells = [
          ["BEV", r.BEV, r.share.BEV],
          ["PHEV", r.PHEV, r.share.PHEV],
          ["HEV", r.HEV, r.share.HEV],
          ["OTHERS", r.OTHERS, r.share.OTHERS],
          ["ICE", r.ICE, r.share.ICE],
          ["plug", (r.BEV || 0) + (r.PHEV || 0), r.TOTAL ? (100 * ((r.BEV || 0) + (r.PHEV || 0))) / r.TOTAL : 0],
        ]
          .map(
            ([, u, p]) =>
              `<td class="num">${global.PYEV.fmtInt(u)}</td><td class="num"><b>${p.toFixed(2)}%</b></td>`
          )
          .join("");
        return (
          `<tr><td>${global.PYEV.periodLabel(r.period)}</td><td class="num">${global.PYEV.fmtInt(r.TOTAL)}</td>${cells}</tr>`
        );
      })
      .join("");
    container.innerHTML =
      `<div class="data-table-wrap"><table class="data share-table">${head}<tbody>${body}</tbody></table></div>`;
  }

  function renderKPIs(container, row) {
    if (!row || !container) return;
    const items = [
      { cls: "", label: global.PYEV.t("total"), value: global.PYEV.fmtInt(row.TOTAL), sub: global.PYEV.periodLabel(row.period) },
      { cls: "elec", label: global.PYEV.t("electrified_short"), value: global.PYEV.fmtPct(row.electrified_pct), sub: global.PYEV.fmtInt(row.electrified) + " " + global.PYEV.t("units") },
      { cls: "bev", label: "BEV %", value: global.PYEV.fmtPct(row.share.BEV), sub: global.PYEV.fmtInt(row.BEV) + " " + global.PYEV.t("units") },
      { cls: "phev", label: "PHEV %", value: global.PYEV.fmtPct(row.share.PHEV), sub: global.PYEV.fmtInt(row.PHEV) + " " + global.PYEV.t("units") },
      { cls: "hev", label: "HEV %", value: global.PYEV.fmtPct(row.share.HEV), sub: global.PYEV.fmtInt(row.HEV) + " " + global.PYEV.t("units") },
      { cls: "ice", label: "ICE %", value: global.PYEV.fmtPct(row.share.ICE), sub: global.PYEV.fmtInt(row.ICE) + " " + global.PYEV.t("units") },
    ];
    container.innerHTML = items
      .map(
        (it) =>
          `<div class="kpi ${it.cls}"><div class="label">${it.label}</div><div class="value">${it.value}</div><div class="sub">${it.sub}</div></div>`
      )
      .join("");
  }

  /** Sum BEV/PHEV/HEV/OTHERS/ICE/TOTAL over rows (market rows or model rows). */
  function sumPowertrains(rows) {
    const out = { BEV: 0, PHEV: 0, HEV: 0, OTHERS: 0, ICE: 0, TOTAL: 0 };
    (rows || []).forEach((r) => {
      if (r.units != null && r.powertrain) {
        const u = Number(r.units) || 0;
        const k = ["BEV", "PHEV", "HEV", "ICE"].includes(r.powertrain) ? r.powertrain : "OTHERS";
        out[k] += u;
        out.TOTAL += u;
      } else {
        ["BEV", "PHEV", "HEV", "OTHERS", "ICE", "TOTAL"].forEach((k) => {
          out[k] += Number(r[k]) || 0;
        });
      }
    });
    return out;
  }

  /** "0 km · ene–sep 2026" from the condition and the months covered. */
  function cutLabel(periods, cond) {
    const t = global.PYEV.t;
    const ps = [...new Set((periods || []).filter(Boolean))].sort();
    let months = "";
    if (ps.length) {
      const first = ps[0];
      const last = ps[ps.length - 1];
      if (first === last) months = global.PYEV.periodLabel(first);
      else if (first.slice(0, 4) === last.slice(0, 4)) {
        months = global.PYEV.periodLabel(first).replace(/\s+\d{4}$/, "") + "–" + global.PYEV.periodLabel(last);
      } else months = global.PYEV.periodLabel(first) + " – " + global.PYEV.periodLabel(last);
    }
    const c = cond === "nuevo" ? t("hl_cut_new") : cond === "usado" ? t("hl_cut_used") : t("hl_cut_all");
    return months ? c + " · " + months : c;
  }

  /**
   * Headline by powertrain group: BEV (emphasised) | PHEV under a plug-in
   * subtotal, then non-plug-in hybrids (HEV + mild/OTHERS) and combustion.
   * sums: { BEV, PHEV, HEV, OTHERS, ICE, TOTAL }; opts: { periods, cond }.
   */
  function renderPowertrainHeadline(container, sums, opts) {
    if (!container) return;
    opts = opts || {};
    const P = global.PYEV;
    const t = P.t;
    const s = sums || {};
    const total = s.TOTAL || 0;
    const pct = (n) => {
      if (!total) return "—";
      const v = (100 * n) / total;
      return n > 0 && v < 0.05 ? "<" + P.fmtPct(0.1) : P.fmtPct(v);
    };
    const units = (n) => P.fmtInt(n) + " " + t("units");
    const plug = (s.BEV || 0) + (s.PHEV || 0);
    const nonPlug = (s.HEV || 0) + (s.OTHERS || 0);
    const card = (cls, label, n, sub) =>
      '<div class="pt-card ' + cls + '"><div class="label">' + label + '</div><div class="value">' + pct(n) +
      '</div><div class="sub">' + (sub || units(n)) + "</div></div>";
    container.innerHTML =
      '<div class="pt-cut">' + cutLabel(opts.periods, opts.cond) + " · <b>" + units(total) + "</b></div>" +
      '<div class="pt-grid" role="group" aria-label="' + t("hl_aria") + '">' +
      '<div class="pt-group"><div class="pt-group-head"><span>' + t("hl_plug") + "</span><span>" +
      P.fmtInt(plug) + " · " + pct(plug) + "</span></div>" +
      '<div class="pt-group-cards">' +
      card("bev", t("hl_bev"), s.BEV || 0) +
      card("phev", t("hl_phev"), s.PHEV || 0) +
      "</div></div>" +
      card(
        "nonplug",
        t("hl_nonplug"),
        nonPlug,
        units(nonPlug) + '<span class="pt-split">HEV ' + P.fmtInt(s.HEV || 0) + " · mild " + P.fmtInt(s.OTHERS || 0) + "</span>"
      ) +
      card("ice", t("hl_ice"), s.ICE || 0) +
      "</div>";
  }

  function restyleTheme(el) {
    if (!el || !el._pyevRows) return;
    if (el._pyevKind === "volumes") volumesChart(el, el._pyevRows, el._pyevOpts);
    else if (el._pyevKind === "volumesElec") volumesElectrifiedChart(el, el._pyevRows, Object.assign({}, el._pyevOpts, { mode: el._pyevElecMode }));
    else shareChart(el, el._pyevRows, el._pyevOpts);
  }

  global.PYEVCharts = {
    shareChart,
    volumesChart,
    volumesElectrifiedChart,
    renderShareTable,
    renderKPIs,
    renderPowertrainHeadline,
    sumPowertrains,
    cutLabel,
    plotlyLayout,
    restyleTheme,
  };
})(typeof window !== "undefined" ? window : globalThis);
