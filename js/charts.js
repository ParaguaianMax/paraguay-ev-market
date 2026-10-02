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

  /** Gallery-style share trajectory — monthly % lines by powertrain (observed). */
  function shareChart(el, rows) {
    if (!el || !rows || !rows.length) return;
    const col = C();
    const dark = isDark();
    const muted = dark ? "#aeaba2" : "#55534c";
    const markerBorder = dark ? "#141413" : "#fdfdfc";
    const periods = rows.map((r) => r.period);
    const displayCats = ["BEV", "PHEV", "HEV", "ICE"];
    if (rows.some((r) => (r.share.OTHERS || 0) >= 0.15)) {
      displayCats.splice(3, 0, "OTHERS");
    }

    // Dual axis: electrified (left) readable; ICE (right) so ~95% does not crush the chart
    const elecCats = displayCats.filter((k) => k !== "ICE");
    let maxElec = 0;
    elecCats.forEach((k) => {
      rows.forEach((r) => {
        if (r.share[k] > maxElec) maxElec = r.share[k];
      });
    });
    const leftTop = Math.max(4, Math.ceil((maxElec * 1.35) * 2) / 2); // nice headroom
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
        y: rows.map((r) => +r.share[k].toFixed(4)),
        line: { color: col[k], width: 2.25 },
        marker: { color: col[k], size: 8, line: { width: 1, color: markerBorder } },
        hovertemplate: "<b>" + k + "</b>: %{y:.2f}%<extra></extra>",
      });
    });
    if (displayCats.indexOf("ICE") !== -1) {
      traces.push({
        type: "scatter",
        mode: "lines+markers",
        name: "ICE",
        x: periods,
        y: rows.map((r) => +r.share.ICE.toFixed(4)),
        yaxis: "y2",
        line: { color: col.ICE, width: 2.25 },
        marker: { color: col.ICE, size: 8, line: { width: 1, color: markerBorder } },
        hovertemplate: "<b>ICE</b>: %{y:.2f}%<extra></extra>",
      });
    }

    const base = plotlyLayout();
    Plotly.newPlot(
      el,
      traces,
      plotlyLayout({
        yaxis: Object.assign({}, base.yaxis, {
          title: { text: global.PYEV.t("share_axis_elec"), font: base.yaxis.title.font },
          range: [0, leftTop],
          ticksuffix: "%",
          rangemode: "tozero",
        }),
        yaxis2: {
          title: { text: global.PYEV.t("share_axis_ice"), font: { size: 11, color: muted } },
          overlaying: "y",
          side: "right",
          range: [iceLo, iceHi],
          ticksuffix: "%",
          showgrid: false,
          zeroline: false,
          tickfont: { size: 11, color: muted },
        },
        xaxis: Object.assign({}, base.xaxis, {
          title: { text: global.PYEV.t("month"), font: base.xaxis.title.font },
          type: "date",
          tickformat: "%b %Y",
        }),
        legend: Object.assign({}, base.legend || {}, { orientation: "h", y: 1.14, x: 0 }),
        margin: { t: 40, r: 56, b: 52, l: 56 },
      }),
      { responsive: true, displayModeBar: false }
    );
    el._pyevKind = "share";
    el._pyevRows = rows;
  }

  /** Full volumes with ICE — secondary; hover shows units + %. */
  function volumesChart(el, rows) {
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const cats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
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
  }

  /** Electrified-only volumes — ICE excluded so BEV/PHEV/HEV are readable. */
  function volumesElectrifiedChart(el, rows) {
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const cats = ["BEV", "PHEV", "HEV", "OTHERS"];
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
    // Line: electrified total
    traces.push({
      type: "scatter",
      mode: "lines+markers+text",
      name: global.PYEV.t("electrified_short"),
      x: labels,
      y: rows.map((r) => r.electrified),
      text: rows.map((r) => r.electrified_pct.toFixed(1) + "%"),
      textposition: "top center",
      textfont: { size: 11, color: isDark() ? "#6fb585" : "#2f6b45" },
      line: { color: isDark() ? "#6fb585" : "#2f6b45", width: 2, dash: "dot" },
      marker: { size: 8 },
      hovertemplate: "<b>" + global.PYEV.t("electrified_short") + "</b>: %{y:,} " + global.PYEV.t("units") + " (%{text} " + global.PYEV.t("share_of_total") + ")<extra></extra>",
    });
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
      ["BEV", "PHEV", "HEV", "OTHERS", "ICE", global.PYEV.t("electrified_short")].map((c) => "<th class='num'>" + c + "</th><th class='num'>%</th>").join("") +
      "</tr></thead>";
    const body = rows
      .map((r) => {
        const cells = [
          ["BEV", r.BEV, r.share.BEV],
          ["PHEV", r.PHEV, r.share.PHEV],
          ["HEV", r.HEV, r.share.HEV],
          ["OTHERS", r.OTHERS, r.share.OTHERS],
          ["ICE", r.ICE, r.share.ICE],
          [global.PYEV.t("electrified_short"), r.electrified, r.electrified_pct],
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

  function restyleTheme(el) {
    if (!el || !el._pyevRows) return;
    if (el._pyevKind === "volumes") volumesChart(el, el._pyevRows);
    else if (el._pyevKind === "volumesElec") volumesElectrifiedChart(el, el._pyevRows);
    else shareChart(el, el._pyevRows);
  }

  global.PYEVCharts = {
    shareChart,
    volumesChart,
    volumesElectrifiedChart,
    renderShareTable,
    renderKPIs,
    plotlyLayout,
    restyleTheme,
  };
})(typeof window !== "undefined" ? window : globalThis);
