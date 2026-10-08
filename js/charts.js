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

  /** Monthly % lines by powertrain, one y axis only (never a second ICE axis).
   * opts.only: e.g. ["BEV"]; opts.withIce: add ICE on the same 0–100% axis.
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
    const only = Array.isArray(opts.only) && opts.only.length ? opts.only : null;
    const cats = only
      ? ["BEV", "PHEV", "HEV", "OTHERS", "ICE"].filter((k) => only.includes(k))
      : opts.withIce
        ? ["BEV", "PHEV", "HEV", "OTHERS", "ICE"]
        : ["BEV", "PHEV", "HEV", "OTHERS"];
    let maxY = 0;
    cats.forEach((k) => {
      rows.forEach((r) => {
        if ((r.share[k] || 0) > maxY) maxY = r.share[k] || 0;
      });
    });
    const top = cats.includes("ICE") ? 100 : Math.max(4, Math.ceil((maxY * 1.2) * 2) / 2);
    const traces = cats.map((k) => ({
      type: "scatter",
      mode: "lines+markers",
      name: k === "OTHERS" ? "mild" : k,
      x: periods,
      y: rows.map((r) => +((r.share[k] || 0).toFixed(4))),
      customdata: rows.map((r) => r[k] || 0),
      line: { color: col[k], width: narrow ? 1.75 : 2.25 },
      marker: { color: col[k], size: narrow ? 4 : 6, line: { width: 1, color: markerBorder } },
      hovertemplate: "<b>" + (k === "OTHERS" ? "mild" : k) + "</b>: %{y:.1f}% · %{customdata:,} " + global.PYEV.t("units") + "<extra></extra>",
    }));
    const base = plotlyLayout();
    const titleFont = { size: narrow ? 10 : 11, color: muted };
    const tickFont = { size: narrow ? 10 : 11, color: muted };
    const layout = plotlyLayout({
      showlegend: false,
      height: narrow ? 320 : 420,
      yaxis: Object.assign({}, base.yaxis, {
        title: { text: global.PYEV.t("share_axis"), font: titleFont, standoff: 6 },
        range: [0, top],
        ticksuffix: "%",
        rangemode: "tozero",
        automargin: true,
        tickfont: tickFont,
      }),
      xaxis: Object.assign({}, base.xaxis, {
        type: "date",
        tickformat: narrow ? "%b %y" : "%b %Y",
        hoverformat: "%b %Y",
        nticks: narrow ? 5 : 8,
        automargin: true,
        tickfont: tickFont,
        tickangle: 0,
      }),
      margin: narrow ? { t: 8, r: 8, b: 8, l: 8 } : { t: 12, r: 12, b: 8, l: 8 },
    });
    Plotly.newPlot(el, traces, layout, { responsive: true, displayModeBar: false });
    el._pyevKind = "share";
    el._pyevRows = rows;
    el._pyevOpts = opts;
  }

  /** Unit change as on Inicio: "×2.5" from double up, else "+43%" / "−5%" / "±0%". */
  function unitChangeLabel(cur, old) {
    if (!old) return "";
    const r = cur / old;
    if (r >= 2) return "×" + r.toFixed(1);
    const c = Math.round((r - 1) * 100);
    return (c > 0 ? "+" : c < 0 ? "−" : "±") + Math.abs(c) + "%";
  }

  /** Share change in pp, from the shares as displayed (one decimal), so the numbers add up. */
  function ppChangeLabel(curPct, oldPct) {
    const r1 = (v) => Math.round(v * 10) / 10;
    const d = r1(curPct) - r1(oldPct);
    const arrow = d >= 0.05 ? "▲" : d <= -0.05 ? "▼" : "=";
    return arrow + " " + Math.abs(d).toFixed(1) + " pp";
  }

  /**
   * Calendar-year totals per group (BEV, PHEV, HEV + mild, ICE, total) with the
   * change against the previous year. A partial year is compared with the same
   * months of the year before; the first year has no comparison.
   */
  function renderAnnualTable(container, rows) {
    if (!container || !rows || !rows.length) return;
    const P = global.PYEV;
    const t = P.t;
    const byPeriod = {};
    rows.forEach((r) => { byPeriod[r.period] = r; });
    const sumOf = (periods) => {
      const o = { BEV: 0, PHEV: 0, NONPLUG: 0, ICE: 0, TOTAL: 0 };
      periods.forEach((p) => {
        const r = byPeriod[p];
        o.BEV += Number(r.BEV) || 0;
        o.PHEV += Number(r.PHEV) || 0;
        o.NONPLUG += (Number(r.HEV) || 0) + (Number(r.OTHERS) || 0);
        o.ICE += Number(r.ICE) || 0;
        o.TOTAL += Number(r.TOTAL) || 0;
      });
      return o;
    };
    const years = {};
    Object.keys(byPeriod).sort().forEach((p) => {
      const y = p.slice(0, 4);
      (years[y] = years[y] || []).push(p);
    });
    const cats = [
      ["BEV", "BEV", "c-bev"],
      ["PHEV", "PHEV", "c-phev"],
      ["NONPLUG", t("hl_nonplug"), "c-hev"],
      ["ICE", t("hl_ice"), "c-ice"],
    ];
    const noYoy = '<span class="yoy none">—</span>';
    const head = "<thead><tr>" +
      cats.map((c) => "<th class='num " + c[2] + "'>" + c[1] + "</th>").join("") +
      "<th class='num annual-tot'>" + t("total") + "</th></tr></thead>";
    const notes = [];
    const body = Object.keys(years).sort().reverse().map((y) => {
      const months = years[y];
      const d = sumOf(months);
      const prevMonths = months.map((p) => String(Number(y) - 1) + p.slice(4));
      const hasPrev = prevMonths.every((p) => byPeriod[p]);
      const ps = hasPrev ? sumOf(prevMonths) : null;
      const partial = months.length < 12;
      const monthsOnly = (ms) => monthsLabel(ms).replace(/\s+\d{4}$/, "");
      let sub = "";
      if (partial) {
        sub = monthsOnly(months) + (ps ? " · " + t("annual_vs", { prev: monthsLabel(prevMonths) }) : "");
        if (ps) notes.push(t("annual_partial_note", { year: y, months: monthsOnly(months), prev: monthsLabel(prevMonths) }));
      } else if (ps) {
        sub = t("annual_vs", { prev: String(Number(y) - 1) });
      }
      const cells = cats.map((c) => {
        const u = d[c[0]];
        const pct = d.TOTAL ? (100 * u) / d.TOTAL : 0;
        let yoy = noYoy;
        if (ps && ps.TOTAL) {
          const old = ps[c[0]];
          const uc = unitChangeLabel(u, old);
          yoy = '<span class="yoy">' + ppChangeLabel(pct, (100 * old) / ps.TOTAL) +
            (uc ? "<span>" + uc + "</span>" : "") + "</span>";
        }
        return "<td class='num'><b>" + P.fmtPct(pct) + "</b><small>" + P.fmtInt(u) + "</small>" + yoy + "</td>";
      }).join("");
      const totYoy = ps && ps.TOTAL ? '<span class="yoy"><span>' + unitChangeLabel(d.TOTAL, ps.TOTAL) + "</span></span>" : noYoy;
      // Phones show the total in the year line instead of a sixth column.
      const totInline = '<span class="annual-tot-inline">' + t("total") + " <b>" + P.fmtInt(d.TOTAL) + "</b>" +
        (ps && ps.TOTAL ? " (" + unitChangeLabel(d.TOTAL, ps.TOTAL) + ")" : "") + "</span>";
      return "<tr class='annual-year'><th colspan='" + (cats.length + 1) + "' scope='rowgroup'><b>" + y + "</b>" +
        (sub ? " <small>" + sub + "</small>" : "") + totInline + "</th></tr>" +
        "<tr>" + cells + "<td class='num annual-tot'><b>" + P.fmtInt(d.TOTAL) + "</b>" + totYoy + "</td></tr>";
    }).join("");
    container.innerHTML = '<div class="data-table-wrap"><table class="data annual-table">' + head + "<tbody>" + body +
      "</tbody></table></div>" +
      '<p class="annual-note">' + t("annual_note") + (notes.length ? " " + notes.join(" ") : "") + "</p>";
  }

  /** Monthly date x-axis shared by the volume charts: ticks follow the UI
   * language (Plotly locale), never cut, never rotated. */
  function monthAxis(base, narrow) {
    return Object.assign({}, base.xaxis, {
      title: { text: global.PYEV.t("month"), font: base.xaxis.title.font, standoff: 8 },
      type: "date",
      tickformat: narrow ? "%b %y" : "%b %Y",
      hoverformat: "%b %Y",
      nticks: narrow ? 5 : 9,
      tickangle: 0,
      automargin: true,
    });
  }

  /** Full volumes with ICE — secondary; hover shows units + %. */
  function volumesChart(el, rows, opts) {
    opts = opts || {};
    const narrow = typeof window !== "undefined" && window.innerWidth < 640;
    const labels = rows.map((r) => r.period);
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
      xperiod: "M1",
      xperiodalignment: "middle",
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
      xperiod: "M1",
      xperiodalignment: "middle",
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
          automargin: true,
        }),
        yaxis2: {
          title: { text: "TOTAL", font: { size: 11, color: muted } },
          automargin: true,
          overlaying: "y",
          side: "right",
          showgrid: false,
          zeroline: false,
          tickfont: { size: 11, color: muted },
        },
        xaxis: monthAxis(base, narrow),
        margin: narrow ? { t: 36, r: 8, b: 8, l: 8 } : { t: 36, r: 16, b: 8, l: 16 },
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
    const narrow = typeof window !== "undefined" && window.innerWidth < 640;
    const labels = rows.map((r) => r.period);
    // Value labels only when they fit; otherwise the hover / tap readout carries them.
    const labelAll = rows.length <= (narrow ? 4 : 12);
    const limit = Array.isArray(opts.cats) && opts.cats.length ? opts.cats : null;
    const cats = (mode === "hev" ? ["HEV", "OTHERS"] : ["BEV", "PHEV", "HEV", "OTHERS"]).filter(
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
      name: k === "OTHERS" ? "mild" : k,
      x: labels,
      xperiod: "M1",
      xperiodalignment: "middle",
      y: rows.map((r) => r[k]),
      customdata: rows.map((r) => r.share[k]),
      text: labelAll ? rows.map((r) => r[k] + " (" + r.share[k].toFixed(1) + "%)") : rows.map(() => ""),
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
        xperiod: "M1",
        xperiodalignment: "middle",
        y: rows.map((r) => (r.BEV || 0) + (r.PHEV || 0)),
        customdata: rows.map((r) => (r.TOTAL ? (100 * ((r.BEV || 0) + (r.PHEV || 0))) / r.TOTAL : 0).toFixed(1) + "%"),
        // Label every point only when few months are shown; otherwise just the latest.
        text: rows.map((r, i) => (labelAll || i === rows.length - 1)
          ? (r.TOTAL ? (100 * ((r.BEV || 0) + (r.PHEV || 0))) / r.TOTAL : 0).toFixed(1) + "%"
          : ""),
        // With many months only the latest point is labelled, to its right (clear of the previous point).
        textposition: labelAll ? "top center" : "middle right",
        textfont: { size: 11, color: lineCol },
        cliponaxis: false,
        line: { color: lineCol, width: 2, dash: "dot" },
        marker: { size: 7, color: lineCol },
        hovertemplate: "<b>" + global.PYEV.t("plug_short") + "</b>: %{y:,} " + global.PYEV.t("units") + " (%{customdata} " + global.PYEV.t("share_of_total") + ")<extra></extra>",
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
          automargin: true,
        }),
        xaxis: monthAxis(base, narrow),
        margin: narrow ? { t: 40, r: 40, b: 8, l: 8 } : { t: 40, r: 48, b: 8, l: 16 },
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
      OTHERS: "mild",
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
      ["BEV", "PHEV", "HEV", global.PYEV.t("mild_col"), "ICE", global.PYEV.t("plug_short")].map((c) => "<th class='num'>" + c + "</th><th class='num'>%</th>").join("") +
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

  /** "ene–sep 2026" (or "sep 2026", "oct 2025 – sep 2026") for a list of YYYY-MM. */
  function monthsLabel(periods) {
    const ps = [...new Set((periods || []).filter(Boolean))].sort();
    if (!ps.length) return "";
    const first = ps[0];
    const last = ps[ps.length - 1];
    if (first === last) return global.PYEV.periodLabel(first);
    if (first.slice(0, 4) === last.slice(0, 4)) {
      return global.PYEV.periodLabel(first).replace(/\s+\d{4}$/, "") + "–" + global.PYEV.periodLabel(last);
    }
    return global.PYEV.periodLabel(first) + " – " + global.PYEV.periodLabel(last);
  }

  /** "0 km · ene–sep 2026" from the condition and the months covered. */
  function cutLabel(periods, cond) {
    const t = global.PYEV.t;
    const months = monthsLabel(periods);
    const c = cond === "nuevo" ? t("hl_cut_new") : cond === "usado" ? t("hl_cut_used") : t("hl_cut_all");
    return months ? c + " · " + months : c;
  }

  /**
   * Headline by powertrain group: BEV (emphasised) | PHEV under a plug-in
   * subtotal, then non-plug-in hybrids (HEV + mild/OTHERS) and combustion.
   * sums: { BEV, PHEV, HEV, OTHERS, ICE, TOTAL }; opts: { periods, cond }.
   * opts.prev = { sums, periods } adds a delta line per card (share change in
   * pp and unit change) against that window. opts.cutOnly renders just the
   * period line (Mercado, Marcas): the percentage cards live only on Inicio.
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
    const prev = opts.prev && opts.prev.sums && opts.prev.sums.TOTAL ? opts.prev : null;
    const ps = prev ? prev.sums : null;
    const prevLabel = prev ? monthsLabel(prev.periods) : "";
    const unitChange = unitChangeLabel;
    const ppChange = (cur, old) =>
      ppChangeLabel(total ? (100 * cur) / total : 0, ps.TOTAL ? (100 * old) / ps.TOTAL : 0);
    const delta = (cur, old) => {
      if (!ps) return "";
      const u = unitChange(cur, old);
      return '<div class="pt-delta" title="' + t("hl_delta_title") + '">' + ppChange(cur, old) +
        (u ? " · " + u : "") + " " + t("hl_vs") + " " + prevLabel + "</div>";
    };
    const card = (cls, label, n, sub, old) =>
      '<div class="pt-card ' + cls + '"><div class="label">' + label + '</div><div class="value">' + pct(n) +
      '</div><div class="sub">' + (sub || units(n)) + "</div>" + (ps ? delta(n, old) : "") + "</div>";
    const prevPlug = ps ? (ps.BEV || 0) + (ps.PHEV || 0) : 0;
    const cutLine =
      '<div class="pt-cut">' + cutLabel(opts.periods, opts.cond) + " · <b>" + units(total) + "</b>" +
      (ps ? ' <span class="pt-cut-delta">(' + unitChange(total, ps.TOTAL) + " " + t("hl_vs") + " " + prevLabel + ")</span>" : "") +
      "</div>";
    container.classList.toggle("cut-only", !!opts.cutOnly);
    if (opts.cutOnly) {
      container.innerHTML = cutLine;
      return;
    }
    container.innerHTML =
      cutLine +
      '<div class="pt-grid" role="group" aria-label="' + t("hl_aria") + '">' +
      '<div class="pt-group"><div class="pt-group-head"><span>' + t("hl_plug") + "</span><span>" +
      P.fmtInt(plug) + " · " + pct(plug) + (ps ? ' · <span class="pt-head-delta">' + ppChange(plug, prevPlug) + "</span>" : "") + "</span></div>" +
      '<div class="pt-group-cards">' +
      card("bev", t("hl_bev"), s.BEV || 0, null, ps && ps.BEV) +
      card("phev", t("hl_phev"), s.PHEV || 0, null, ps && ps.PHEV) +
      "</div></div>" +
      card(
        "nonplug",
        t("hl_nonplug"),
        nonPlug,
        units(nonPlug) + '<span class="pt-split">HEV ' + P.fmtInt(s.HEV || 0) + " · mild " + P.fmtInt(s.OTHERS || 0) + "</span>",
        ps && (ps.HEV || 0) + (ps.OTHERS || 0)
      ) +
      card("ice", t("hl_ice"), s.ICE || 0, null, ps && ps.ICE) +
      "</div>";
  }

  /** Inicio: monthly BEV and PHEV share (% of each month's units), one axis. */
  function bevPhevChart(el, monthly) {
    if (!el || !monthly || !monthly.length) return;
    const col = C();
    const dark = isDark();
    const narrow = typeof window !== "undefined" && window.innerWidth < 640;
    const markerBorder = dark ? "#141413" : "#fdfdfc";
    const x = monthly.map((m) => m.period);
    const traces = ["BEV", "PHEV"].map((k) => ({
      type: "scatter",
      mode: "lines+markers",
      name: k,
      x: x,
      y: monthly.map((m) => (m.TOTAL ? +((100 * m[k]) / m.TOTAL).toFixed(2) : 0)),
      customdata: monthly.map((m) => m[k]),
      line: { color: col[k], width: narrow ? 2 : 2.5 },
      marker: { color: col[k], size: narrow ? 6 : 7, line: { width: 1, color: markerBorder } },
      hovertemplate: "<b>" + k + "</b>: %{y:.1f}% · %{customdata:,} " + global.PYEV.t("units") + "<extra></extra>",
    }));
    const maxY = traces.reduce((m, tr) => Math.max(m, ...tr.y), 0);
    const base = plotlyLayout();
    Plotly.newPlot(
      el,
      traces,
      plotlyLayout({
        showlegend: false,
        height: narrow ? 280 : 340,
        yaxis: Object.assign({}, base.yaxis, {
          title: { text: global.PYEV.t("share_axis"), font: base.yaxis.title.font, standoff: 6 },
          ticksuffix: "%",
          rangemode: "tozero",
          range: [0, Math.max(4, Math.ceil(maxY * 1.2))],
          automargin: true,
        }),
        xaxis: Object.assign({}, base.xaxis, {
          type: "date",
          tickformat: narrow ? "%b %y" : "%b %Y",
          hoverformat: "%b %Y",
          nticks: narrow ? 5 : 7,
          tickangle: 0,
          automargin: true,
        }),
        margin: { t: 12, r: 12, b: 8, l: 8 },
      }),
      { responsive: true, displayModeBar: false }
    );
    el._pyevKind = "bevPhev";
    el._pyevRows = monthly;
  }

  function restyleTheme(el) {
    if (!el || !el._pyevRows) return;
    if (el._pyevKind === "volumes") volumesChart(el, el._pyevRows, el._pyevOpts);
    else if (el._pyevKind === "bevPhev") bevPhevChart(el, el._pyevRows);
    else if (el._pyevKind === "volumesElec") volumesElectrifiedChart(el, el._pyevRows, Object.assign({}, el._pyevOpts, { mode: el._pyevElecMode }));
    else shareChart(el, el._pyevRows, el._pyevOpts);
  }

  global.PYEVCharts = {
    shareChart,
    volumesChart,
    volumesElectrifiedChart,
    renderShareTable,
    renderAnnualTable,
    renderKPIs,
    renderPowertrainHeadline,
    sumPowertrains,
    cutLabel,
    monthsLabel,
    bevPhevChart,
    plotlyLayout,
    restyleTheme,
  };
})(typeof window !== "undefined" ? window : globalThis);
