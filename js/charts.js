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

  function shareChart(el, rows) {
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const cats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
    const col = C();
    const dark = isDark();
    const textOnBar = dark ? "#0f0f0e" : "#fdfdfc";
    const traces = cats.map((k) => {
      const ys = rows.map((r) => +r.share[k].toFixed(3));
      const text = ys.map((v) => (v >= 2.5 ? k + " " + v.toFixed(1) + "%" : v >= 0.8 ? v.toFixed(1) + "%" : ""));
      return {
        type: "bar",
        name: k,
        x: labels,
        y: ys,
        text: text,
        textposition: "inside",
        insidetextanchor: "middle",
        textfont: { size: 11, color: textOnBar, family: 'Public Sans, system-ui, sans-serif' },
        cliponaxis: false,
        marker: { color: col[k], line: { width: 0 } },
        hovertemplate: "<b>%{fullData.name}</b>: %{y:.2f}%<extra></extra>",
      };
    });
    const annotations = [];
    rows.forEach((r, i) => {
      const tiny = ["BEV", "PHEV", "HEV", "OTHERS"]
        .filter((k) => r.share[k] > 0 && r.share[k] < 2.5)
        .map((k) => k + " " + r.share[k].toFixed(1) + "%");
      if (tiny.length) {
        annotations.push({
          x: labels[i],
          y: 102,
          text: tiny.join(" · "),
          showarrow: false,
          font: { size: 10, color: dark ? "#aeaba2" : "#55534c" },
          xanchor: "center",
          yanchor: "bottom",
        });
      }
    });
    const layout = plotlyLayout({
      barmode: "stack",
      barnorm: "percent",
      yaxis: Object.assign({}, plotlyLayout().yaxis, {
        title: { text: "% del total HS 8703", font: plotlyLayout().yaxis.title.font },
        range: [0, 108],
        ticksuffix: "%",
        dtick: 20,
      }),
      xaxis: Object.assign({}, plotlyLayout().xaxis, {
        title: { text: "Mes", font: plotlyLayout().xaxis.title.font },
      }),
      bargap: 0.32,
      annotations: annotations,
      margin: { t: 48, r: 24, b: 48, l: 52 },
    });
    Plotly.newPlot(el, traces, layout, { responsive: true, displayModeBar: false });
    el._pyevKind = "share";
    el._pyevRows = rows;
  }

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
      hovertemplate: "<b>%{fullData.name}</b>: %{y:,} u. (%{customdata:.2f}%)<extra></extra>",
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
      hovertemplate: "<b>TOTAL</b>: %{y:,} u.<extra></extra>",
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
          title: { text: "Unidades (categorías)", font: base.yaxis.title.font },
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
          title: { text: "Mes", font: base.xaxis.title.font },
        }),
        margin: { t: 36, r: 56, b: 48, l: 56 },
      }),
      { responsive: true, displayModeBar: false }
    );
    el._pyevKind = "volumes";
    el._pyevRows = rows;
  }

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
      hovertemplate: "<b>%{fullData.name}</b>: %{y:,} u. · %{customdata:.2f}% del total<extra></extra>",
    }));
    traces.push({
      type: "scatter",
      mode: "lines+markers+text",
      name: "Electrificados",
      x: labels,
      y: rows.map((r) => r.electrified),
      text: rows.map((r) => r.electrified_pct.toFixed(1) + "%"),
      textposition: "top center",
      textfont: { size: 11, color: isDark() ? "#6fb585" : "#2f6b45" },
      line: { color: isDark() ? "#6fb585" : "#2f6b45", width: 2, dash: "dot" },
      marker: { size: 8 },
      hovertemplate: "<b>Electrificados</b>: %{y:,} u. (%{text} del total)<extra></extra>",
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
          title: { text: "Unidades (sin ICE)", font: base.yaxis.title.font },
          rangemode: "tozero",
        }),
        xaxis: Object.assign({}, base.xaxis, {
          title: { text: "Mes", font: base.xaxis.title.font },
        }),
        margin: { t: 40, r: 24, b: 48, l: 56 },
      }),
      { responsive: true, displayModeBar: false }
    );
    el._pyevKind = "volumesElec";
    el._pyevRows = rows;
  }

  function renderShareTable(container, rows) {
    if (!container || !rows || !rows.length) return;
    const head =
      "<thead><tr><th>Mes</th><th class='num'>Total</th>" +
      ["BEV", "PHEV", "HEV", "OTHERS", "ICE", "Electr."].map((c) => "<th class='num'>" + c + "</th><th class='num'>%</th>").join("") +
      "</tr></thead>";
    const body = rows
      .map((r) => {
        const cells = [
          ["BEV", r.BEV, r.share.BEV],
          ["PHEV", r.PHEV, r.share.PHEV],
          ["HEV", r.HEV, r.share.HEV],
          ["OTHERS", r.OTHERS, r.share.OTHERS],
          ["ICE", r.ICE, r.share.ICE],
          ["Electr.", r.electrified, r.electrified_pct],
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
      { cls: "", label: "Total HS 8703", value: global.PYEV.fmtInt(row.TOTAL), sub: global.PYEV.periodLabel(row.period) },
      { cls: "elec", label: "Electrificados", value: global.PYEV.fmtPct(row.electrified_pct), sub: global.PYEV.fmtInt(row.electrified) + " u." },
      { cls: "bev", label: "BEV %", value: global.PYEV.fmtPct(row.share.BEV), sub: global.PYEV.fmtInt(row.BEV) + " u." },
      { cls: "phev", label: "PHEV %", value: global.PYEV.fmtPct(row.share.PHEV), sub: global.PYEV.fmtInt(row.PHEV) + " u." },
      { cls: "hev", label: "HEV %", value: global.PYEV.fmtPct(row.share.HEV), sub: global.PYEV.fmtInt(row.HEV) + " u." },
      { cls: "ice", label: "ICE %", value: global.PYEV.fmtPct(row.share.ICE), sub: global.PYEV.fmtInt(row.ICE) + " u." },
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
