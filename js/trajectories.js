/**
 * Gallery-style trajectories: S-curve extrapolation + trailing market split.
 * Fits linear-in-logit (logistic) on available monthly shares — short series,
 * dashed projection, clear disclaimer. Does not invent historical months.
 */
(function (global) {
  const CATS = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
  const FIT_CATS = ["BEV", "PHEV", "HEV", "ICE"];
  const EPS = 1e-4;
  const PROJECT_MONTHS = 48;

  function periodToIndex(period) {
    const [y, m] = String(period).split("-").map(Number);
    return y * 12 + (m - 1);
  }
  function indexToPeriod(idx) {
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    return y + "-" + String(m).padStart(2, "0");
  }
  function addMonths(period, n) {
    return indexToPeriod(periodToIndex(period) + n);
  }
  function logit(p) {
    const x = Math.min(1 - EPS, Math.max(EPS, p));
    return Math.log(x / (1 - x));
  }
  function invLogit(z) {
    if (z > 30) return 1 - EPS;
    if (z < -30) return EPS;
    const e = Math.exp(z);
    return e / (1 + e);
  }
  function linreg(xs, ys) {
    const n = xs.length;
    if (n < 2) return { a: ys[0] || 0, b: 0, ok: false };
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
      sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i];
    }
    const den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-12) return { a: sy / n, b: 0, ok: false };
    const b = (n * sxy - sx * sy) / den;
    const a = (sy - b * sx) / n;
    return { a: a, b: b, ok: true };
  }
  function fitLogitShare(rows, key) {
    const t0 = periodToIndex(rows[0].period);
    const xs = [];
    const ys = [];
    rows.forEach(function (r) {
      const p = (r.share[key] || 0) / 100;
      xs.push(periodToIndex(r.period) - t0);
      ys.push(logit(p));
    });
    const fit = linreg(xs, ys);
    return {
      predict: function (period) {
        const x = periodToIndex(period) - t0;
        return invLogit(fit.a + fit.b * x) * 100;
      },
      fit: fit,
      t0: t0
    };
  }
  function buildTimeline(rows) {
    const hist = rows.map(function (r) { return r.period; });
    const last = hist[hist.length - 1];
    const future = [];
    for (let i = 1; i <= PROJECT_MONTHS; i++) future.push(addMonths(last, i));
    return { hist: hist, future: future, all: hist.concat(future) };
  }
  function fitAll(rows) {
    const models = {};
    FIT_CATS.forEach(function (k) { models[k] = fitLogitShare(rows, k); });
    const lastOthers = rows[rows.length - 1].share.OTHERS || 0;
    function rawAt(period) {
      const out = {};
      FIT_CATS.forEach(function (k) { out[k] = models[k].predict(period); });
      out.OTHERS = lastOthers;
      return out;
    }
    function normalized(period) {
      const raw = rawAt(period);
      let sum = 0;
      CATS.forEach(function (k) { sum += Math.max(0, raw[k]); });
      const out = {};
      if (sum <= 0) {
        CATS.forEach(function (k) { out[k] = k === "ICE" ? 100 : 0; });
        return out;
      }
      CATS.forEach(function (k) { out[k] = (Math.max(0, raw[k]) / sum) * 100; });
      return out;
    }
    return { models: models, at: normalized };
  }
  function t(key) {
    return (global.PYEV && global.PYEV.t && global.PYEV.t(key)) || key;
  }
  function colors() {
    return (global.PYEV && global.PYEV.colors && global.PYEV.colors()) || {};
  }
  function isDark() {
    return global.PYEV && global.PYEV.isDark ? global.PYEV.isDark() : false;
  }
  function layoutBase(extra) {
    return global.PYEVCharts && global.PYEVCharts.plotlyLayout
      ? global.PYEVCharts.plotlyLayout(extra)
      : Object.assign({ paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", margin: { t: 40, r: 24, b: 48, l: 52 } }, extra || {});
  }
  function extrapolationChart(el, rows) {
    if (!el || !rows || !rows.length) return;
    const col = colors();
    const dark = isDark();
    const muted = dark ? "#aeaba2" : "#55534c";
    const fitted = fitAll(rows);
    const tl = buildTimeline(rows);
    const lastHist = rows[rows.length - 1].period;
    const histByCat = {};
    CATS.forEach(function (k) {
      histByCat[k] = {
        x: rows.map(function (r) { return r.period; }),
        y: rows.map(function (r) { return +r.share[k].toFixed(4); })
      };
    });
    const futX = [lastHist].concat(tl.future);
    const futByCat = {};
    CATS.forEach(function (k) {
      futByCat[k] = futX.map(function (p) { return +fitted.at(p)[k].toFixed(4); });
    });
    const histCurveX = tl.hist;
    const histCurveByCat = {};
    CATS.forEach(function (k) {
      histCurveByCat[k] = histCurveX.map(function (p) { return +fitted.at(p)[k].toFixed(4); });
    });
    const traces = [];
    const displayCats = ["BEV", "PHEV", "HEV", "ICE"];
    if (rows.some(function (r) { return r.share.OTHERS >= 0.15; })) displayCats.splice(3, 0, "OTHERS");
    displayCats.forEach(function (k) {
      traces.push({ type: "scatter", mode: "lines", name: k + " · " + t("traj_fit"), x: histCurveX, y: histCurveByCat[k], line: { color: col[k], width: 1.75 }, legendgroup: k, hovertemplate: "<b>" + k + "</b> " + t("traj_fit") + ": %{y:.2f}%<extra></extra>", showlegend: false });
      traces.push({ type: "scatter", mode: "lines", name: k + " · " + t("traj_proj"), x: futX, y: futByCat[k], line: { color: col[k], width: 1.75, dash: "dash" }, legendgroup: k, hovertemplate: "<b>" + k + "</b> " + t("traj_proj") + ": %{y:.2f}%<extra></extra>", showlegend: false });
      traces.push({ type: "scatter", mode: "markers", name: k, x: histByCat[k].x, y: histByCat[k].y, marker: { color: col[k], size: 8, line: { width: 1, color: dark ? "#141413" : "#fdfdfc" } }, legendgroup: k, hovertemplate: "<b>" + k + "</b>: %{y:.2f}%<extra></extra>" });
    });
    const annotations = [];
    const milestones = [];
    const lastY = Number(String(lastHist).slice(0, 4));
    for (let y = lastY + 1; y <= lastY + 4; y++) milestones.push(y + "-01");
    const iceNotes = milestones.filter(function (p) {
      return periodToIndex(p) > periodToIndex(lastHist);
    }).map(function (p) {
      const s = fitted.at(p);
      return global.PYEV.periodLabel(p) + ": ICE " + s.ICE.toFixed(1) + "% · BEV " + s.BEV.toFixed(1) + "%";
    });
    if (iceNotes.length) {
      annotations.push({ xref: "paper", yref: "paper", x: 0.01, y: 0.02, xanchor: "left", yanchor: "bottom", text: iceNotes.slice(0, 4).join("<br>"), showarrow: false, align: "left", font: { size: 10, color: muted }, bgcolor: dark ? "rgba(20,20,19,0.65)" : "rgba(253,253,252,0.75)" });
    }
    const base = layoutBase();
    Plotly.newPlot(el, traces, layoutBase({
      yaxis: Object.assign({}, base.yaxis || {}, { title: { text: t("traj_axis_share"), font: (base.yaxis && base.yaxis.title && base.yaxis.title.font) || { size: 11, color: muted } }, range: [0, 105], ticksuffix: "%", dtick: 20 }),
      xaxis: Object.assign({}, base.xaxis || {}, { title: { text: t("month"), font: (base.xaxis && base.xaxis.title && base.xaxis.title.font) || { size: 11, color: muted } }, type: "date", tickformat: "%b %Y" }),
      annotations: annotations,
      margin: { t: 36, r: 24, b: 52, l: 52 },
      legend: Object.assign({}, base.legend || {}, { orientation: "h", y: 1.14, x: 0 })
    }), { responsive: true, displayModeBar: false });
    el._pyevKind = "trajExtra";
    el._pyevRows = rows;
  }
  function trailingSplitChart(el, rows) {
    if (!el || !rows || !rows.length) return;
    const col = colors();
    const n = rows.length;
    const windowSize = Math.min(12, n);
    const incomplete = n < 12;
    const points = rows.map(function (r, i) {
      const start = Math.max(0, i - 11);
      const slice = rows.slice(start, i + 1);
      const sums = { BEV: 0, PHEV: 0, HEV: 0, OTHERS: 0, ICE: 0, TOTAL: 0 };
      slice.forEach(function (row) {
        CATS.forEach(function (k) { sums[k] += row[k] || 0; });
        sums.TOTAL += row.TOTAL || 0;
      });
      const share = {};
      CATS.forEach(function (k) { share[k] = sums.TOTAL ? (100 * sums[k]) / sums.TOTAL : 0; });
      return { period: r.period, label: global.PYEV.periodLabel(r.period), windowMonths: slice.length, share: share, sums: sums };
    });
    const cats = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"];
    const traces = cats.map(function (k) {
      return {
        type: "scatter", mode: "lines", name: k,
        x: points.map(function (p) { return p.period; }),
        y: points.map(function (p) { return +p.share[k].toFixed(4); }),
        customdata: points.map(function (p) { return p.windowMonths; }),
        stackgroup: "one", groupnorm: "percent",
        line: { width: 0.5, color: col[k] }, fillcolor: col[k],
        hovertemplate: "<b>" + k + "</b>: %{y:.2f}% · " + t("traj_window") + " %{customdata} " + t("traj_months_short") + "<extra></extra>"
      };
    });
    if (n < 4) {
      const barTraces = cats.map(function (k) {
        return {
          type: "bar", name: k,
          x: points.map(function (p) { return p.label; }),
          y: points.map(function (p) { return +p.share[k].toFixed(4); }),
          customdata: points.map(function (p) { return p.windowMonths; }),
          marker: { color: col[k], line: { width: 0 } },
          hovertemplate: "<b>" + k + "</b>: %{y:.2f}% · " + t("traj_window") + " %{customdata} " + t("traj_months_short") + "<extra></extra>"
        };
      });
      const base = layoutBase();
      Plotly.newPlot(el, barTraces, layoutBase({
        barmode: "stack", barnorm: "percent",
        yaxis: Object.assign({}, base.yaxis || {}, { title: { text: incomplete ? t("traj_ttm_axis_partial") : t("traj_ttm_axis"), font: (base.yaxis && base.yaxis.title && base.yaxis.title.font) || { size: 11 } }, range: [0, 100], ticksuffix: "%", dtick: 20 }),
        xaxis: Object.assign({}, base.xaxis || {}, { title: { text: t("month"), font: (base.xaxis && base.xaxis.title && base.xaxis.title.font) || { size: 11 } } }),
        bargap: 0.28, margin: { t: 36, r: 24, b: 48, l: 56 }
      }), { responsive: true, displayModeBar: false });
    } else {
      const base = layoutBase();
      Plotly.newPlot(el, traces, layoutBase({
        yaxis: Object.assign({}, base.yaxis || {}, { title: { text: incomplete ? t("traj_ttm_axis_partial") : t("traj_ttm_axis"), font: (base.yaxis && base.yaxis.title && base.yaxis.title.font) || { size: 11 } }, range: [0, 100], ticksuffix: "%", dtick: 20 }),
        xaxis: Object.assign({}, base.xaxis || {}, { title: { text: t("month"), font: (base.xaxis && base.xaxis.title && base.xaxis.title.font) || { size: 11 } }, type: "date", tickformat: "%b %Y" }),
        margin: { t: 36, r: 24, b: 48, l: 56 }
      }), { responsive: true, displayModeBar: false });
    }
    el._pyevKind = "trajTtm";
    el._pyevRows = rows;
    el._pyevMeta = { incomplete: incomplete, windowSize: windowSize, n: n };
  }
  function restyleTheme(el) {
    if (!el || !el._pyevRows) return;
    if (el._pyevKind === "trajExtra") extrapolationChart(el, el._pyevRows);
    else if (el._pyevKind === "trajTtm") trailingSplitChart(el, el._pyevRows);
  }
  global.PYEVTrajectories = {
    extrapolationChart: extrapolationChart,
    trailingSplitChart: trailingSplitChart,
    fitAll: fitAll,
    restyleTheme: restyleTheme
  };
})(typeof window !== "undefined" ? window : globalThis);
