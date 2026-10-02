(function (global) {
  const C = () => (global.PYEV && global.PYEV.COLORS) || {};

  function plotlyLayout(extra) {
    const dark = !window.matchMedia("(prefers-color-scheme: light)").matches;
    const base = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "Segoe UI, system-ui, sans-serif", color: dark ? "#e8eef6" : "#1a2332", size: 13 },
      margin: { t: 40, r: 24, b: 48, l: 56 },
      legend: { orientation: "h", y: 1.12, x: 0 },
      xaxis: { gridcolor: dark ? "#2a3a50" : "#d0dae8", zeroline: false },
      yaxis: { gridcolor: dark ? "#2a3a50" : "#d0dae8", zeroline: false },
      hovermode: "x unified",
    };
    return Object.assign(base, extra || {});
  }

  function shareChart(el, rows) {
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const cats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
    const traces = cats.map((k) => ({
      type: "bar",
      name: k,
      x: labels,
      y: rows.map((r) => +r.share[k].toFixed(3)),
      marker: { color: C()[k] },
      hovertemplate: "%{fullData.name}: %{y:.2f}%<extra></extra>",
    }));
    Plotly.newPlot(
      el,
      traces,
      plotlyLayout({
        barmode: "stack",
        title: { text: "Participación (%) — importaciones HS 8703", font: { size: 15 } },
        yaxis: Object.assign(plotlyLayout().yaxis, { title: "% del total", range: [0, 100], ticksuffix: "%" }),
        xaxis: Object.assign(plotlyLayout().xaxis, { title: "Mes" }),
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function volumesChart(el, rows) {
    const labels = rows.map((r) => global.PYEV.periodLabel(r.period));
    const cats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
    const traces = cats.map((k) => ({
      type: "bar",
      name: k,
      x: labels,
      y: rows.map((r) => r[k]),
      marker: { color: C()[k] },
      hovertemplate: "%{fullData.name}: %{y:,}<extra></extra>",
    }));
    traces.push({
      type: "scatter",
      mode: "lines+markers",
      name: "TOTAL",
      x: labels,
      y: rows.map((r) => r.TOTAL),
      line: { color: C().TOTAL, width: 2.5 },
      marker: { size: 8 },
      yaxis: "y2",
      hovertemplate: "TOTAL: %{y:,}<extra></extra>",
    });
    Plotly.newPlot(
      el,
      traces,
      plotlyLayout({
        barmode: "group",
        title: { text: "Volúmenes (unidades) — HS 8703", font: { size: 15 } },
        yaxis: Object.assign(plotlyLayout().yaxis, { title: "Unidades (categorías)" }),
        yaxis2: {
          title: "TOTAL",
          overlaying: "y",
          side: "right",
          showgrid: false,
          zeroline: false,
        },
        xaxis: Object.assign(plotlyLayout().xaxis, { title: "Mes" }),
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function renderKPIs(container, row) {
    if (!row || !container) return;
    const items = [
      { cls: "", label: "Total HS 8703", value: global.PYEV.fmtInt(row.TOTAL), sub: global.PYEV.periodLabel(row.period) },
      { cls: "elec", label: "Electrificados", value: global.PYEV.fmtPct(row.electrified_pct), sub: global.PYEV.fmtInt(row.electrified) + " u." },
      { cls: "bev", label: "BEV", value: global.PYEV.fmtInt(row.BEV), sub: global.PYEV.fmtPct(row.share.BEV) },
      { cls: "phev", label: "PHEV", value: global.PYEV.fmtInt(row.PHEV), sub: global.PYEV.fmtPct(row.share.PHEV) },
      { cls: "hev", label: "HEV", value: global.PYEV.fmtInt(row.HEV), sub: global.PYEV.fmtPct(row.share.HEV) },
      { cls: "ice", label: "ICE", value: global.PYEV.fmtInt(row.ICE), sub: global.PYEV.fmtPct(row.share.ICE) },
    ];
    container.innerHTML = items
      .map(
        (it) =>
          `<div class="kpi ${it.cls}"><div class="label">${it.label}</div><div class="value">${it.value}</div><div class="sub">${it.sub}</div></div>`
      )
      .join("");
  }

  global.PYEVCharts = { shareChart, volumesChart, renderKPIs, plotlyLayout };
})(typeof window !== "undefined" ? window : globalThis);
