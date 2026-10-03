/**
 * Top marcas / modelos on Volúmenes — month | year | YTD, multi-select name lists, powertrain stack.
 * Scope: LightVehicles + leve only (no Whole fallback).
 * Powertrain chips (multi-select): Todos | BEV | plug-in (PHEV) | HEV.
 * Todos = every powertrain in the ranking. Specific chips are a union and
 * never include ICE/OTHERS. Turning the last specific chip off returns to Todos.
 * With 2+ specific chips, brand/model tables add a Total row under each
 * group that spans multiple powertrains (units + % for brands).
 * Condición chips: Todos | Nuevo | Usado (hidden until CSV has condicion).
 * Aligns with site-wide 0 km filter (localStorage pyev-vehicles-all).
 * Model editions: on when rows carry `edicion` (monthly CSV, or joined
 * onto the assembled file). Blank edicion is the "no edition" bucket.
 * Ranking charts default to Top 20; "Todas" shows the full brand list
 * and all models. Bar labels include the rank number.
 */
(function (global) {
  const TOP_DEFAULT = 20;
  const TOP_KEY = "pyev-vol-top-limit";
  const MODE_KEY = "pyev-vol-period-mode";
  const MONTH_KEY = "pyev-vol-period-month";
  const YEAR_KEY = "pyev-vol-period-year";
  const PT_KEY = "pyev-vol-pt-mode";
  const COND_KEY = "pyev-vol-cond-mode";
  const ALL_VEHICLES_KEY = "pyev-vehicles-all";

  /** Specific chips. Empty selection means Todos (all powertrains). */
  const PT_SPECIFIC = ["bev", "plugin", "hev"];
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

  function loadPtSet() {
    const raw = (lsGet(PT_KEY) || "all").trim();
    if (!raw || raw === "all") return new Set();
    // Previous single chip grouped PHEV + HEV.
    if (raw === "hybrids") return new Set(["plugin", "hev"]);
    const parts = raw.split(",").map((s) => s.trim()).filter((s) => PT_SPECIFIC.includes(s));
    return new Set(parts);
  }

  function savePtSet(ptSet) {
    if (!ptSet.size) lsSet(PT_KEY, "all");
    else lsSet(PT_KEY, PT_SPECIFIC.filter((k) => ptSet.has(k)).join(","));
  }

  /** null = all powertrains (Todos). Otherwise the union of selected types. */
  function powertrainsForSet(ptSet) {
    if (!ptSet.size) return null;
    const pts = [];
    if (ptSet.has("bev")) pts.push("BEV");
    if (ptSet.has("plugin")) pts.push("PHEV");
    if (ptSet.has("hev")) pts.push("HEV");
    return pts;
  }

  function init() {
    const root = document.getElementById("vol-rankings");
    if (!root || !global.PYEVModels) return;

    const modeBtns = root.querySelectorAll("[data-period-mode]");
    const topBtns = root.querySelectorAll("[data-top-limit]");
    const ptBtns = root.querySelectorAll("[data-pt-mode]");
    const condBtns = root.querySelectorAll("[data-cond-mode]");
    const condWrap = document.getElementById("volCondWrap");
    const monthSel = document.getElementById("volMonthToggle");
    const yearSel = document.getElementById("volYearToggle");
    const monthWrap = document.getElementById("volMonthWrap");
    const yearWrap = document.getElementById("volYearWrap");
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

    let closePickers = function () {};
    function setupPicker(ids, labelKey) {
      const btn = document.getElementById(ids.btn);
      const panel = document.getElementById(ids.panel);
      const list = document.getElementById(ids.list);
      const clearBtn = panel ? panel.querySelector(".vol-picker-clear") : null;
      const selected = new Set();
      let sig = "";

      function updateBtn() {
        if (!btn) return;
        const base = t(labelKey);
        btn.textContent = selected.size ? base + " · " + selected.size : base;
      }
      function close() {
        if (panel) panel.hidden = true;
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
      function open() {
        if (panel) panel.hidden = false;
        if (btn) btn.setAttribute("aria-expanded", "true");
      }
      function sync(names) {
        if (!list) return;
        const clean = [];
        const seen = new Set();
        (names || []).forEach((name) => {
          const value = String(name || "").trim();
          if (!value || seen.has(value)) return;
          seen.add(value);
          clean.push(value);
        });
        selected.forEach((name) => {
          if (!seen.has(name)) selected.delete(name);
        });
        const nextSig = clean.join("\0");
        if (nextSig !== sig) {
          sig = nextSig;
          const scroll = list.scrollTop;
          list.replaceChildren();
          clean.forEach((name) => {
            const lab = document.createElement("label");
            lab.className = "vol-picker-item";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = name;
            input.checked = selected.has(name);
            const span = document.createElement("span");
            span.textContent = name;
            input.addEventListener("change", () => {
              if (input.checked) selected.add(name);
              else selected.delete(name);
              updateBtn();
              draw();
            });
            lab.appendChild(input);
            lab.appendChild(span);
            list.appendChild(lab);
          });
          list.scrollTop = scroll;
        } else {
          list.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            input.checked = selected.has(input.value);
          });
        }
        updateBtn();
      }
      if (btn) {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const willOpen = !!(panel && panel.hidden);
          closePickers();
          if (willOpen) open();
        });
      }
      if (panel) panel.addEventListener("click", (ev) => ev.stopPropagation());
      if (clearBtn) {
        clearBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          selected.clear();
          if (list) {
            list.querySelectorAll('input[type="checkbox"]').forEach((input) => {
              input.checked = false;
            });
          }
          updateBtn();
          draw();
        });
      }
      updateBtn();
      return { selected, sync, close, updateBtn };
    }

    const brandPicker = setupPicker(
      { btn: "volBrandPickerBtn", panel: "volBrandPickerPanel", list: "volBrandPickerList" },
      "vol_picker_brands"
    );
    const modelPicker = setupPicker(
      { btn: "volModelPickerBtn", panel: "volModelPickerPanel", list: "volModelPickerList" },
      "vol_picker_models"
    );
    closePickers = function () {
      brandPicker.close();
      modelPicker.close();
    };
    document.addEventListener("click", closePickers);
    if (modelTable) {
      modelTable.addEventListener("click", (ev) => {
        const row = ev.target.closest("tr[data-edition-key]");
        if (!row || row.classList.contains("rank-editions")) return;
        toggleModelEdition(row.getAttribute("data-edition-key"));
      });
    }
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closePickers();
    });

    let allModelRows = [];
    let marketRows = [];
    let lastModels = [];
    const expandedModels = new Set();
    let plotGen = 0;
    let modelClickBound = null;
    let topLimit = lsGet(TOP_KEY) === "all" ? "all" : "20";
    let mode = lsGet(MODE_KEY) || "month";
    if (!["month", "year", "ytd"].includes(mode)) mode = "month";
    let ptSet = loadPtSet();
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
      const pts = powertrainsForSet(ptSet);
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
      topBtns.forEach((btn) => {
        const on = btn.dataset.topLimit === topLimit;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      const brandsTitle = document.getElementById("volBrandsTitle");
      const modelsTitle = document.getElementById("volModelsTitle");
      if (brandsTitle) {
        brandsTitle.textContent = t(topLimit === "all" ? "vol_top_brands_all" : "vol_top_brands_20");
      }
      if (modelsTitle) {
        modelsTitle.textContent = t(topLimit === "all" ? "vol_top_models_all" : "vol_top_models_20");
      }
      ptBtns.forEach((btn) => {
        const mode = btn.dataset.ptMode;
        const on = mode === "all" ? ptSet.size === 0 : ptSet.has(mode);
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderPtBanners();
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
      if (ptSet.size) {
        const bits = [];
        if (ptSet.has("bev")) bits.push("BEV");
        if (ptSet.has("plugin")) bits.push(t("vol_pt_plugin"));
        if (ptSet.has("hev")) bits.push(t("vol_pt_hev"));
        if (bits.length) label += " · " + bits.join(" + ");
      }
      if (condicionAvailable && condMode === "nuevo") label += " · " + t("vol_cond_nuevo");
      else if (condicionAvailable && condMode === "usado") label += " · " + t("vol_cond_usado");
      return label;
    }

    function renderPtBanners() {
      const el = document.getElementById("volPtBanners");
      if (!el) return;
      const keys = [];
      if (ptSet.has("bev")) keys.push("vol_pt_banner_bev");
      if (ptSet.has("plugin")) keys.push("vol_pt_banner_plugin");
      if (ptSet.has("hev")) keys.push("vol_pt_banner_hev");
      el.replaceChildren();
      if (!keys.length) {
        el.hidden = true;
        return;
      }
      keys.forEach((k) => {
        const line = document.createElement("p");
        line.className = "vol-pt-banner";
        line.textContent = t(k);
        el.appendChild(line);
      });
      el.hidden = false;
    }

    function setChartsEmpty(msg) {
      const html = '<div class="status">' + msg + "</div>";
      if (brandChart) brandChart.innerHTML = html;
      if (modelChart) modelChart.innerHTML = html;
      if (brandTable) brandTable.innerHTML = "";
      if (modelTable) modelTable.innerHTML = "";
      if (brandMeta) brandMeta.textContent = t("vol_showing_n", { n: "0" });
      if (modelMeta) modelMeta.textContent = t("vol_showing_n", { n: "0" });
      if (brandPicker) brandPicker.sync([]);
      if (modelPicker) modelPicker.sync([]);
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

      const allBrands = PYEVModels.rankBrands(rows, { topN: 0 });
      const allModels = PYEVModels.rankModels(rows, { topN: 0 });
      allBrands.forEach((b, i) => {
        b.rank = i + 1;
      });
      allModels.forEach((m, i) => {
        m.rank = i + 1;
      });
      brandPicker.sync(allBrands.map((b) => b.marca));
      modelPicker.sync(allModels.map((m) => m.label));
      const cap = topLimit === "all" ? Infinity : TOP_DEFAULT;
      const brands = brandPicker.selected.size
        ? allBrands.filter((b) => brandPicker.selected.has(b.marca))
        : allBrands.slice(0, cap);
      const models = modelPicker.selected.size
        ? allModels.filter((m) => modelPicker.selected.has(m.label))
        : allModels.slice(0, cap);

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
        modelChart._pyevPlotPromise = PYEVModels.renderTopModelChart(modelChart, models);
      }
      const tableOpts = { showGroupTotals: ptSet.size >= 2 };
      PYEVModels.renderTopBrandTable(brandTable, brands, tableOpts);
      lastModels = models;
      paintModelTable();
      bindModelChartClicks(models);
    }

    function paintModelTable() {
      PYEVModels.renderTopModelTable(modelTable, lastModels, {
        showGroupTotals: ptSet.size >= 2,
        expandedModels,
      });
    }

    function toggleModelEdition(key) {
      if (!key) return;
      if (expandedModels.has(key)) expandedModels.delete(key);
      else expandedModels.add(key);
      paintModelTable();
    }

    function bindModelChartClicks(models) {
      const gen = ++plotGen;
      const expandable = (models || []).some((m) => m.editions);
      const plotted = modelChart && modelChart.data ? Promise.resolve(modelChart) : null;
      // renderTopModelChart returns the Plotly promise when it just plotted.
      const pending = modelChart && modelChart._pyevPlotPromise;
      Promise.resolve(pending || plotted).then((gd) => {
        const node = gd || modelChart;
        if (gen !== plotGen || !node || typeof node.on !== "function") return;
        if (modelClickBound && node.removeListener) {
          node.removeListener("plotly_click", modelClickBound);
          modelClickBound = null;
        }
        if (!expandable) return;
        modelClickBound = function (ev) {
          const pt = ev && ev.points && ev.points[0];
          if (!pt) return;
          const raw = String((pt.customdata != null ? pt.customdata : pt.y) || "");
          const label = raw.replace(/^\d+\.\s+/, "");
          const hit = models.find((m) => (m.label === label || m.label === raw) && m.editions);
          if (!hit) return;
          toggleModelEdition(hit.marca + "\0" + hit.modelo);
        };
        node.on("plotly_click", modelClickBound);
      });
    }

    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.periodMode;
        lsSet(MODE_KEY, mode);
        draw();
      });
    });
    topBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        topLimit = btn.dataset.topLimit === "all" ? "all" : "20";
        lsSet(TOP_KEY, topLimit);
        draw();
      });
    });
    ptBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.ptMode;
        if (mode === "all") {
          ptSet.clear();
        } else if (PT_SPECIFIC.includes(mode)) {
          if (ptSet.has(mode)) ptSet.delete(mode);
          else ptSet.add(mode);
        }
        savePtSet(ptSet);
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
      if (brandPicker) brandPicker.updateBtn();
      if (modelPicker) modelPicker.updateBtn();
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
    if (global.matchMedia) {
      const mq = global.matchMedia("(max-width: 640px)");
      const onWidth = () => {
        if (marketRows.length) draw();
      };
      if (mq.addEventListener) mq.addEventListener("change", onWidth);
      else if (mq.addListener) mq.addListener(onWidth);
    }
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
