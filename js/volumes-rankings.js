/**
 * Top marcas / modelos on Volúmenes — month | year | YTD, search, powertrain stack.
 */
(function (global) {
  const TOP_N = 100;
  const MODE_KEY = "pyev-vol-period-mode";
  const MONTH_KEY = "pyev-vol-period-month";
  const YEAR_KEY = "pyev-vol-period-year";

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

  function init() {
    const root = document.getElementById("vol-rankings");
    if (!root || !global.PYEVModels) return;

    const modeBtns = root.querySelectorAll("[data-period-mode]");
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

    let allModelRows = [];
    let marketRows = [];
    let mode = lsGet(MODE_KEY) || "month";
    if (!["month", "year", "ytd"].includes(mode)) mode = "month";

    function scopedRows() {
      return PYEVModels.filterByPeriodScope(marketRows, {
        mode,
        month: monthSel && monthSel.value,
        year: yearSel && yearSel.value,
      });
    }

    function syncModeUI() {
      modeBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.periodMode === mode);
      });
      if (monthWrap) monthWrap.hidden = mode !== "month";
      if (yearWrap) yearWrap.hidden = mode === "month";
      // YTD uses year of latest data; still allow year pick for multi-year later
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
      const periods = PYEVModels.periodsOf(scopedRows());
      if (!periods.length) return "";
      if (mode === "month") return PYEV.periodLabel(periods[0]);
      if (mode === "year") {
        return (
          t("vol_period_year") +
          " " +
          (yearSel.value || periods[0].slice(0, 4))
        );
      }
      const first = periods[0];
      const last = periods[periods.length - 1];
      return (
        t("vol_period_ytd") +
        " · " +
        PYEV.periodLabel(first) +
        " – " +
        PYEV.periodLabel(last)
      );
    }

    function draw() {
      syncModeUI();
      const rows = scopedRows();
      if (scopeHint) scopeHint.textContent = scopeLabel();

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
        if (!marketRows.length) {
          if (emptyEl) emptyEl.hidden = false;
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
      // refresh placeholders / mode button labels via data-i18n already applied
    });
    global.addEventListener("pyev-theme", () => {
      if (brandChart && brandChart.data) PYEVModels.restyleTheme(brandChart);
      if (modelChart && modelChart.data) PYEVModels.restyleTheme(modelChart);
      // restyle alone may miss stacked colors — redraw
      if (marketRows.length) draw();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
