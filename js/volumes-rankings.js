/**
 * Top marcas / modelos on Volúmenes — month | year | YTD, search, powertrain stack.
 * Scope: LightVehicles + leve only (no Whole fallback).
 * Powertrain chips: Todos | BEV | Híbridos.
 * Condición chips: Todos | Nuevo | Usado (hidden until CSV has condicion).
 * Aligns with site-wide 0 km filter (localStorage pyev-vehicles-all).
 */
(function (global) {
  const TOP_N = 100;
  const MODE_KEY = "pyev-vol-period-mode";
  const MONTH_KEY = "pyev-vol-period-month";
  const YEAR_KEY = "pyev-vol-period-year";
  const PT_KEY = "pyev-vol-pt-mode";
  const COND_KEY = "pyev-vol-cond-mode";
  const ALL_VEHICLES_KEY = "pyev-vehicles-all";

  /** @type {"all"|"bev"|"hybrids"} */
  const PT_MODES = ["all", "bev", "hybrids"];
  /** @type {"all"|"nuevo"|"usado"} */
  const COND_MODES = ["all", "nuevo", "usado"];

  function t(k, vars) {
    return global.PYEV && global.PYEV.t ? global.PYEV.t(k, vars) : k;
  }

  function lsGet(k) {
    try {
      return localStorage.getItem(k) || "";
    } catch (e) {
      return "";
    }
  }
  function lsSet(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }

  function powertrainsForMode(mode) {
    if (mode === "bev") return ["BEV"];
    if (mode === "hybrids") return ["PHEV", "HEV"];
    return null; // all
  }

  function init() {
    const root = document.getElementById("vol-rankings");
    if (!root || !global.PYEVModels) return;

    const modeBtns = root.querySelectorAll("[data-period-mode]");
    const ptBtns = root.querySelectorAll("[data-pt-mode]");
    const condBtns = root.querySelectorAll("[data-cond-mode]");
    const condWrap = document.getElementById("volCondWrap");
    const monthSel = document.getElementById("volMonthToggle");
    const yearSel = document.getElementById("volYearToggle");
    const monthWrap = document.getElementById("volMonthWrap");
    const yearWrap = document.getElementById("volYearWrap");
    const brandSearch = document.getElementById("volBrandSearch");
    const modelSearch = document.getElementById("volModelSearch");
    const brandChart = document.getElementById("chart-top-brands");
    const modelChart = document.getElementById("chart-top-models");
    const brandTable = document.getElementById("table-top-brands");
    const modelTable = document.getElementById("table-top-models");
    const brandMeta = document.getElementById("volBrandMeta");
    const modelMeta = document.getElementById("volModelMeta");
    const scopeHint = document.getElementById("volScopeHint");
    const emptyEl = document.getElementById("vol-rankings-empty");
    const uiEl = document.getElementById("vol-rankings-ui");
    const scopeEmptyEl = document.getElementById("vol-scope-empty");

    let allModelRows = [];
    let marketRows = [];
    let mode = lsGet(MODE_KEY) || "month";
    if (!["month", "year", "ytd"].includes(mode)) mode = "month";
    let ptMode = lsGet(PT_KEY) || "all";
    if (!PT_MODES.includes(ptMode)) ptMode = "all";
    let condMode = lsGet(COND_KEY) || "all";
    if (!COND_MODES.includes(condMode)) condMode = "all";
    // Default is 0 km only; the site-wide toggle explicitly enables new + used.
    if (lsGet(ALL_VEHICLES_KEY) !== "1") condMode = "nuevo";
    else if (condMode === "nuevo") condMode = "all";
    let condicionAvailable = false;

    function scopedRows() {
      // Re-assert LightVehicles·leve so YTD/year never mix Whole (HS 8703 double-count).
      const base = PYEVModels.marketSeriesRows(marketRows);
      const periodRows = PYEVModels.filterByPeriodScope(base, {
        mode,
        month: monthSel && monthSel.value,
        year: yearSel && yearSel.value,
      });
      const opts = {};
      const pts = powertrainsForMode(ptMode);
      if (pts) opts.powertrains = pts;
      if (condicionAvailable && (condMode === "nuevo" || condMode === "usado")) {
        opts.condicion = condMode;
      }
      if (!opts.powertrains && !opts.condicion) return periodRows;
      return PYEVModels.filterModels(periodRows, opts);
    }

    function syncModeUI() {
      modeBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.periodMode === mode);
      });
      ptBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.ptMode === ptMode);
      });
      condBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.condMode === condMode);
      });
      if (condWrap) condWrap.hidden = !condicionAvailable;
      if (monthWrap) monthWrap.hidden = mode !== "month";
      if (yearWrap) yearWrap.hidden = mode === "month";
      if (yearWrap && mode === "ytd") yearWrap.hidden = false;
    }

    function fillPeriodSelects() {
      const periods = PYEVModels.periodsOf(marketRows);
      const years = [...new Set(periods.map((p) => p.slice(0, 4)))].sort();
      const latest = periods[periods.length - 1] || "";
      const savedMonth = lsGet(MONTH_KEY);
      const savedYear = lsGet(YEAR_KEY);

      if (monthSel) {
        monthSel.innerHTML = "";
        periods.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p;
          opt.textContent = PYEV.periodLabel(p);
          monthSel.appendChild(opt);
        });
        monthSel.value = periods.includes(savedMonth) ? savedMonth : latest;
      }
      if (yearSel) {
        yearSel.innerHTML = "";
        years.forEach((y) => {
          const opt = document.createElement("option");
          opt.value = y;
          opt.textContent = y;
          yearSel.appendChild(opt);
        });
        const defYear = latest ? latest.slice(0, 4) : "";
        yearSel.value = years.includes(savedYear) ? savedYear : defYear;
      }
    }

    function scopeLabel() {
      const periodRows = PYEVModels.filterByPeriodScope(marketRows, {
        mode,
        month: monthSel && monthSel.value,
        year: yearSel && yearSel.value,
      });
      const periods = PYEVModels.periodsOf(periodRows);
      if (!periods.length) return "";
      let label = "";
      if (mode === "month") label = PYEV.periodLabel(periods[0]);
      else if (mode === "year") {
        label =
          t("vol_period_year") +
          " " +
          (yearSel.value || periods[0].slice(0, 4));
      } else {
        const first = periods[0];
        const last = periods[periods.length - 1];
        label =
          t("vol_period_ytd") +
          " · " +
          PYEV.periodLabel(first) +
          " – " +
          PYEV.periodLabel(last);
      }
      if (ptMode === "bev") label += " · BEV";
      else if (ptMode === "hybrids") label += " · " + t("vol_pt_hybrids");
      if (condicionAvailable && condMode === "nuevo") label += " · " + t("vol_cond_nuevo");
      else if (condicionAvailable && condMode === "usado") label += " · " + t("vol_cond_usado");
      return label;
    }

    function setChartsEmpty(msg) {
      const html = '<div class="status">' + msg + "</div>";
      if (brandChart) brandChart.innerHTML = html;
      if (modelChart) modelChart.innerHTML = html;
      if (brandTable) brandTable.innerHTML = "";
      if (modelTable) modelTable.innerHTML = "";
      if (brandMeta) brandMeta.textContent = t("vol_showing_n", { n: "0" });
      if (modelMeta) modelMeta.textContent = t("vol_showing_n", { n: "0" });
    }

    function draw() {
      syncModeUI();
      const periodRows = PYEVModels.filterByPeriodScope(marketRows, {
        mode,
        month: monthSel && monthSel.value,
        year: yearSel && yearSel.value,
      });
      if (scopeHint) scopeHint.textContent = scopeLabel();

      if (!periodRows.length) {
        if (scopeEmptyEl) {
          scopeEmptyEl.hidden = false;
          scopeEmptyEl.textContent = t("vol_lv_empty");
        }
        setChartsEmpty(t("vol_lv_empty"));
        return;
      }
      if (scopeEmptyEl) scopeEmptyEl.hidden = true;

      const rows = scopedRows();
      if (!rows.length) {
        setChartsEmpty(t("models_empty_filter"));
        return;
      }

      const brands = PYEVModels.rankBrands(rows, {
        topN: TOP_N,
        query: brandSearch ? brandSearch.value : "",
      });
      const models = PYEVModels.rankModels(rows, {
        topN: TOP_N,
        query: modelSearch ? modelSearch.value : "",
      });

      if (brandMeta) {
        brandMeta.textContent = t("vol_showing_n", { n: String(brands.length) });
      }
      if (modelMeta) {
        modelMeta.textContent = t("vol_showing_n", { n: String(models.length) });
      }

      if (brandChart) {
        brandChart.innerHTML = "";
        PYEVModels.renderTopBrandChart(brandChart, brands);
      }
      if (modelChart) {
        modelChart.innerHTML = "";
        PYEVModels.renderTopModelChart(modelChart, models);
      }
      PYEVModels.renderTopBrandTable(brandTable, brands);
      PYEVModels.renderTopModelTable(modelTable, models);
    }

    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.periodMode;
        lsSet(MODE_KEY, mode);
        draw();
      });
    });
    ptBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        ptMode = btn.dataset.ptMode;
        lsSet(PT_KEY, ptMode);
        draw();
      });
    });
    condBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!condicionAvailable) return;
        condMode = btn.dataset.condMode;
        lsSet(COND_KEY, condMode);
        // Align site-wide Nuevos toggle
        if (global.PYEV && global.PYEV.setNuevosOnly) {
          global.PYEV.setNuevosOnly(condMode === "nuevo", { silent: false });
        } else {
          lsSet(ALL_VEHICLES_KEY, condMode === "nuevo" ? "0" : "1");
        }
        draw();
      });
    });
    if (monthSel) {
      monthSel.addEventListener("change", () => {
        lsSet(MONTH_KEY, monthSel.value);
        draw();
      });
    }
    if (yearSel) {
      yearSel.addEventListener("change", () => {
        lsSet(YEAR_KEY, yearSel.value);
        draw();
      });
    }
    let searchTimer = null;
    function onSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(draw, 120);
    }
    if (brandSearch) brandSearch.addEventListener("input", onSearch);
    if (modelSearch) modelSearch.addEventListener("input", onSearch);

    async function boot() {
      try {
        const res = await PYEVModels.loadParaguayModels();
        allModelRows = res.rows || [];
        if (res.missing || !allModelRows.length) {
          if (emptyEl) emptyEl.hidden = false;
          if (uiEl) uiEl.hidden = true;
          return;
        }
        marketRows = PYEVModels.marketSeriesRows(allModelRows);
        condicionAvailable = !!(
          PYEVModels.hasCondicion && PYEVModels.hasCondicion(marketRows)
        );
        if (!condicionAvailable) condMode = "all";
        if (!marketRows.length) {
          if (emptyEl) {
            emptyEl.hidden = false;
            emptyEl.textContent = t("vol_lv_empty");
          }
          if (uiEl) uiEl.hidden = true;
          return;
        }
        if (emptyEl) emptyEl.hidden = true;
        if (uiEl) uiEl.hidden = false;
        fillPeriodSelects();
        draw();
      } catch (err) {
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent = err.message || String(err);
          emptyEl.classList.add("error");
        }
        if (uiEl) uiEl.hidden = true;
      }
    }

    boot();
    global.addEventListener("pyev-lang", () => {
      if (!marketRows.length) return;
      fillPeriodSelects();
      draw();
    });
    global.addEventListener("pyev-nuevos", (ev) => {
      if (!marketRows.length) return;
      condMode = ev.detail ? "nuevo" : (lsGet(COND_KEY) === "usado" ? "usado" : "all");
      if (ev.detail) lsSet(COND_KEY, "nuevo");
      else if (lsGet(COND_KEY) === "nuevo") lsSet(COND_KEY, "all");
      draw();
    });
    global.addEventListener("pyev-theme", () => {
      if (brandChart && brandChart.data) PYEVModels.restyleTheme(brandChart);
      if (modelChart && modelChart.data) PYEVModels.restyleTheme(modelChart);
      if (marketRows.length) draw();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
