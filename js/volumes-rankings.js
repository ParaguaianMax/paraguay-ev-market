/**
 * Top marcas / modelos on Volúmenes — month | year | YTD, multi-select name lists, powertrain stack.
 * Scope: LightVehicles + leve only (no Whole fallback).
 * Powertrain chips (multi-select): Todos | BEV | PHEV | non-plug-in (HEV + mild).
 * Todos = every powertrain in the ranking. Specific chips are a union and
 * never include ICE. Turning the last specific chip off returns to Todos.
 * Period (month | year | YTD) lives in sessionStorage: a new visit opens on
 * YTD of the latest year. Links can set it with ?periodo=ytd&anio=YYYY&pt=bev.
 * % columns (brands and models) = share of the current cut: period + condition
 * toggle + powertrain chips. Top 20 / Todas, brand picks and search never change it.
 * With 2+ specific chips, the brand table adds a Total row under each
 * brand that spans multiple powertrains (units + %).
 * Top modelos rows are marca + modelo + powertrain (versions count as one
 * model only with the same powertrain); the Modelos checklist lists base
 * models and picking one includes all its powertrains.
 * Condición chips: Todos | Nuevo | Usado (hidden until CSV has condicion).
 * Aligns with site-wide 0 km filter (localStorage pyev-vehicles-all).
 * Model editions: on when rows carry `edicion` (monthly CSV, or joined
 * onto the assembled file). Blank edicion is the "no edition" bucket.
 * Expanded lines show trim, units, and that edition's share of the row.
 * Ranking charts default to Top 20; "Todas" shows the full brand list
 * and all models. Bar labels include the rank number.
 * Brand selection scopes the model ranking and the model picker to those
 * brands. Brand/model selection is published as PYEVVolFilter (event
 * "pyev-vol-filter") so the page series and units table can follow it.
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
  // Period choice is per visit (sessionStorage), so a fresh visit starts on YTD.
  function ssGet(k) {
    try {
      return sessionStorage.getItem(k) || "";
    } catch (e) {
      return "";
    }
  }
  function ssSet(k, v) {
    try {
      sessionStorage.setItem(k, v);
    } catch (e) {}
  }

  /** ?periodo=month|year|ytd&anio=YYYY&pt=bev|plugin|hev|all (links from Inicio). */
  function applyUrlScope() {
    let q;
    try {
      q = new URLSearchParams(location.search);
    } catch (e) {
      return;
    }
    const periodo = q.get("periodo");
    const anio = q.get("anio");
    const pt = q.get("pt");
    if (!periodo && !anio && !pt) return;
    if (["month", "year", "ytd"].includes(periodo)) ssSet(MODE_KEY, periodo);
    if (/^\d{4}$/.test(anio || "")) ssSet(YEAR_KEY, anio);
    if (pt === "all" || PT_SPECIFIC.includes(pt)) lsSet(PT_KEY, pt);
    try {
      history.replaceState(null, "", location.pathname + location.hash);
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
    if (ptSet.has("hev")) pts.push("HEV", "OTHERS");
    return pts;
  }

  /** "(sin modelo)", "SIN MARCA" and similar placeholders sort last. */
  function isPlaceholderOption(name) {
    return /\(sin [^)]*\)|\bSIN (MARCA|MODELO)\b/i.test(name);
  }

  const optionCollator =
    typeof Intl !== "undefined" && Intl.Collator
      ? new Intl.Collator(undefined, { sensitivity: "base", numeric: true })
      : null;

  function compareOptions(a, b) {
    const pa = isPlaceholderOption(a);
    const pb = isPlaceholderOption(b);
    if (pa !== pb) return pa ? 1 : -1;
    return optionCollator
      ? optionCollator.compare(a, b)
      : a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
  }

  /** Lowercase, no accents, no spaces/hyphens/dots: "E-TRON" → "etron". */
  function searchKey(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[\s\-_.\/]+/g, "");
  }

  /** Every word of the query must appear somewhere in the label, any order. */
  function searchTokens(q) {
    return String(q || "")
      .trim()
      .split(/\s+/)
      .map(searchKey)
      .filter(Boolean);
  }

  function canAutofocus() {
    try {
      return !!(global.matchMedia && global.matchMedia("(hover: hover) and (pointer: fine)").matches);
    } catch (e) {
      return false;
    }
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
    const monthYearSel = document.getElementById("volMonthYearToggle");
    const yearSel = document.getElementById("volYearToggle");
    const monthWrap = document.getElementById("volMonthWrap");
    const monthYearWrap = document.getElementById("volMonthYearWrap");
    const yearWrap = document.getElementById("volYearWrap");
    const brandChart = document.getElementById("chart-top-brands");
    const modelChart = document.getElementById("chart-top-models");
    const brandTable = document.getElementById("table-top-brands");
    const modelTable = document.getElementById("table-top-models");
    const bevChart = document.getElementById("chart-bev-rank");
    const bevTable = document.getElementById("table-bev-rank");
    const searchInput = document.getElementById("mmSearch");
    const brandMeta = document.getElementById("volBrandMeta");
    const modelMeta = document.getElementById("volModelMeta");
    const scopeHint = document.getElementById("volScopeHint");
    const emptyEl = document.getElementById("vol-rankings-empty");
    const uiEl = document.getElementById("vol-rankings-ui");
    const scopeEmptyEl = document.getElementById("vol-scope-empty");

    let closePickers = function () {};
    function setupPicker(ids, labelKey, searchKeyName) {
      const btn = document.getElementById(ids.btn);
      const panel = document.getElementById(ids.panel);
      const list = document.getElementById(ids.list);
      const clearBtn = panel ? panel.querySelector(".vol-picker-clear") : null;
      const selected = new Set();
      let sig = "";

      // Search box above Limpiar; it only hides options, never unchecks them.
      let search = null;
      let noResults = null;
      if (panel && list) {
        const head = document.createElement("div");
        head.className = "vol-picker-head";
        search = document.createElement("input");
        search.type = "search";
        search.className = "vol-picker-search";
        search.autocomplete = "off";
        search.spellcheck = false;
        search.setAttribute("autocapitalize", "off");
        search.setAttribute("enterkeyhint", "search");
        head.appendChild(search);
        if (clearBtn) head.appendChild(clearBtn);
        panel.insertBefore(head, panel.firstChild);
        noResults = document.createElement("p");
        noResults.className = "vol-picker-empty";
        noResults.hidden = true;
        panel.appendChild(noResults);
        search.addEventListener("input", applySearch);
        search.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") ev.preventDefault();
        });
      }

      function applySearch() {
        if (!list) return;
        const tokens = search ? searchTokens(search.value) : [];
        let shown = 0;
        list.querySelectorAll(".vol-picker-item").forEach((lab) => {
          const key = lab.dataset.searchKey || "";
          const hit = !tokens.length || tokens.every((tok) => key.includes(tok));
          lab.hidden = !hit;
          if (hit) shown += 1;
        });
        if (noResults) noResults.hidden = shown > 0 || !list.children.length;
      }

      function updateBtn() {
        if (search) {
          search.placeholder = t(searchKeyName);
          search.setAttribute("aria-label", t(searchKeyName));
        }
        if (noResults) noResults.textContent = t("vol_picker_no_results");
        if (!btn) return;
        const base = t(labelKey);
        btn.textContent = selected.size ? base + " · " + selected.size : base;
      }
      function close() {
        const wasOpen = !!(panel && !panel.hidden);
        if (panel) panel.hidden = true;
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (search && search.value) {
          search.value = "";
          applySearch();
        }
        if (wasOpen && search && document.activeElement === search) search.blur();
      }
      function open() {
        if (panel) panel.hidden = false;
        if (btn) btn.setAttribute("aria-expanded", "true");
        applySearch();
        // Desktop only: on phones focusing would pop the keyboard right away.
        if (search && canAutofocus()) {
          try {
            search.focus({ preventScroll: true });
          } catch (e) {
            search.focus();
          }
        }
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
        // Checklist options are alphabetical; rankings keep volume order.
        clean.sort(compareOptions);
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
            lab.dataset.searchKey = searchKey(name);
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
          applySearch();
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
      "vol_picker_brands",
      "vol_picker_search_brands"
    );
    const modelPicker = setupPicker(
      { btn: "volModelPickerBtn", panel: "volModelPickerPanel", list: "volModelPickerList" },
      "vol_picker_models",
      "vol_picker_search_models"
    );
    closePickers = function () {
      brandPicker.close();
      modelPicker.close();
    };
    document.addEventListener("click", closePickers);
    function bindEditionClicks(table, which) {
      if (!table) return;
      table.addEventListener("click", (ev) => {
        const row = ev.target.closest("tr[data-edition-key]");
        if (!row || row.classList.contains("rank-editions")) return;
        toggleModelEdition(row.getAttribute("data-edition-key"), which);
      });
    }
    bindEditionClicks(modelTable, "main");
    bindEditionClicks(bevTable, "bev");
    if (searchInput) {
      searchInput.addEventListener("input", () => draw());
    }
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closePickers();
    });

    let allModelRows = [];
    let marketRows = [];
    let lastModels = [];
    let lastBevModels = [];
    let periodTotal = 0;
    let bevTotal = 0;
    const expandedModels = new Set();
    const expandedBev = new Set();
    let plotGen = 0;
    let modelClickBound = null;
    let topLimit = lsGet(TOP_KEY) === "all" ? "all" : "20";
    applyUrlScope();
    let mode = ssGet(MODE_KEY) || "ytd";
    if (!["month", "year", "ytd"].includes(mode)) mode = "ytd";
    let ptSet = loadPtSet();
    let condMode = lsGet(COND_KEY) || "all";
    if (!COND_MODES.includes(condMode)) condMode = "all";
    // Default is 0 km only; the site-wide toggle explicitly enables new + used.
    if (lsGet(ALL_VEHICLES_KEY) !== "1") condMode = "nuevo";
    else if (condMode === "nuevo") condMode = "all";
    let condicionAvailable = false;

    function selectedMonthPeriod() {
      const year = monthYearSel && monthYearSel.value;
      const month = monthSel && monthSel.value;
      return year && month ? year + "-" + month : "";
    }

    function periodOptionRows() {
      let rows = marketRows;
      const pts = powertrainsForSet(ptSet);
      if (pts) rows = PYEVModels.filterModels(rows, { powertrains: pts });
      if (condicionAvailable && (condMode === "nuevo" || condMode === "usado")) {
        rows = PYEVModels.filterModels(rows, { condicion: condMode });
      }
      if (brandPicker && brandPicker.selected.size) {
        rows = rows.filter((r) => brandPicker.selected.has(r.marca));
      }
      if (modelPicker && modelPicker.selected.size) {
        rows = rows.filter((r) => modelPicker.selected.has(r.marca + " " + r.modelo));
      }
      return rows;
    }

    function scopedRows() {
      // Re-assert LightVehicles·leve so YTD/year never mix Whole (HS 8703 double-count).
      const base = PYEVModels.marketSeriesRows(marketRows);
      const periodRows = PYEVModels.filterByPeriodScope(base, {
        mode,
        month: selectedMonthPeriod(),
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
      renderStickySummary();
      condBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.condMode === condMode);
      });
      if (condWrap) condWrap.hidden = !condicionAvailable;
      if (monthYearWrap) monthYearWrap.hidden = mode !== "month";
      if (monthWrap) monthWrap.hidden = mode !== "month";
      if (yearWrap) yearWrap.hidden = mode === "month";
      if (yearWrap && mode === "ytd") yearWrap.hidden = false;
    }

    /** One-line cut for the collapsed filter bar: "0 km · YTD 2026 · Todos". */
    function renderStickySummary() {
      const el = document.getElementById("mmStickySummary");
      if (!el) return;
      const cond = !condicionAvailable ? "" :
        condMode === "nuevo" ? t("hl_cut_new") : condMode === "usado" ? t("hl_cut_used") : t("hl_cut_all");
      let period = "";
      if (mode === "month") {
        const p = selectedMonthPeriod();
        period = p ? PYEV.periodLabel(p) : t("vol_period_month");
      } else {
        const y = (yearSel && yearSel.value) || "";
        period = t(mode === "ytd" ? "vol_period_ytd" : "vol_period_year") + (y ? " " + y : "");
      }
      const pts = [];
      if (ptSet.has("bev")) pts.push("BEV");
      if (ptSet.has("plugin")) pts.push("PHEV");
      if (ptSet.has("hev")) pts.push("HEV + mild");
      el.textContent = [cond, period, pts.length ? pts.join(" + ") : t("vol_pt_all")].filter(Boolean).join(" · ");
    }

    function fillPeriodSelects(forceYear) {
      const periods = PYEVModels.periodsOf(periodOptionRows());
      const years = [...new Set(periods.map((p) => p.slice(0, 4)))].sort();
      const latest = periods[periods.length - 1] || "";
      const savedMonth = ssGet(MONTH_KEY);
      const savedYear = ssGet(YEAR_KEY);
      const oldMonthPeriod = selectedMonthPeriod();
      let desiredPeriod;
      if (forceYear) {
        const forced = periods.filter((p) => p.startsWith(String(forceYear) + "-"));
        desiredPeriod = forced[forced.length - 1] || latest;
      } else {
        desiredPeriod = periods.includes(savedMonth)
          ? savedMonth
          : periods.includes(oldMonthPeriod)
            ? oldMonthPeriod
            : latest;
      }

      if (monthYearSel) {
        monthYearSel.innerHTML = "";
        years.forEach((y) => {
          const opt = document.createElement("option");
          opt.value = y;
          opt.textContent = y;
          monthYearSel.appendChild(opt);
        });
        monthYearSel.value = desiredPeriod ? desiredPeriod.slice(0, 4) : "";
      }

      if (monthSel) {
        const selectedYear = monthYearSel && monthYearSel.value;
        const monthPeriods = periods.filter((p) => p.startsWith(selectedYear + "-"));
        const chosenPeriod = monthPeriods.includes(desiredPeriod)
          ? desiredPeriod
          : monthPeriods[monthPeriods.length - 1] || latest;
        monthSel.innerHTML = "";
        monthPeriods.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.slice(5, 7);
          opt.textContent = PYEV.periodLabel(p).replace(/\s+\d{4}$/, "");
          monthSel.appendChild(opt);
        });
        monthSel.value = chosenPeriod ? chosenPeriod.slice(5, 7) : "";
        if (chosenPeriod) {
          if (monthYearSel) monthYearSel.value = chosenPeriod.slice(0, 4);
          ssSet(MONTH_KEY, chosenPeriod);
        }
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
        month: selectedMonthPeriod(),
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
      if (bevTable) bevTable.innerHTML = "";
      if (brandMeta) brandMeta.textContent = t("vol_showing_n", { n: "0" });
      if (modelMeta) modelMeta.textContent = t("vol_showing_n", { n: "0" });
      if (brandPicker) brandPicker.sync([]);
      if (modelPicker) modelPicker.sync([]);
      publishFilter();
    }

    let filterSig = "";
    /** Share brand/model selection with the page series + units table. */
    function publishFilter() {
      const brands = [...brandPicker.selected].sort();
      const models = [...modelPicker.selected].sort();
      const cond = condicionAvailable ? condMode : "all";
      const active = !!(brands.length || models.length);
      // Powertrain chips also drive the charts above (e.g. BEV only).
      const pts = powertrainsForSet(ptSet);
      const sig =
        (active ? brands.join("|") + "#" + models.join("|") + "#" + cond : "") +
        (pts ? "@" + pts.join(",") : "");
      if (sig === filterSig) return;
      filterSig = sig;
      global.PYEVVolFilter = {
        active,
        brands,
        models,
        cond,
        pts,
        seriesRows() {
          let rows = marketRows;
          if (brands.length) {
            const bs = new Set(brands);
            rows = rows.filter((r) => bs.has(r.marca));
          }
          if (models.length) {
            const ms = new Set(models);
            rows = rows.filter((r) => ms.has(r.marca + " " + r.modelo));
          }
          if (cond === "nuevo" || cond === "usado") {
            rows = PYEVModels.filterModels(rows, { condicion: cond });
          }
          const out = PYEVModels.aggregateToMarketRows(rows);
          if (!out.length) return out;
          // Fill months without units with zeros so the series has no gaps.
          const have = new Set(out.map((r) => r.period));
          const proto = out[0];
          PYEVModels.periodsOf(marketRows)
            .filter((p) => p >= proto.period && !have.has(p))
            .forEach((p) => {
              out.push(Object.assign({}, proto, {
                period: p, BEV: 0, PHEV: 0, HEV: 0, ICE: 0, OTHERS: 0, TOTAL: 0,
                electrified: 0, electrified_pct: 0,
                share: { BEV: 0, PHEV: 0, HEV: 0, OTHERS: 0, ICE: 0 },
              }));
            });
          return out.sort((x, y) => (x.period < y.period ? -1 : x.period > y.period ? 1 : 0));
        },
        clear: clearItemFilter,
      };
      global.dispatchEvent(new CustomEvent("pyev-vol-filter"));
    }

    function clearItemFilter() {
      brandPicker.selected.clear();
      modelPicker.selected.clear();
      ptSet.clear();
      savePtSet(ptSet);
      brandPicker.updateBtn();
      modelPicker.updateBtn();
      draw();
    }

    /** Top-of-page headline: current period + condición (+ brand/model picks). */
    function renderHeadline(periodRows) {
      const el = document.getElementById("volHeadline");
      if (!el || !global.PYEVCharts || !PYEVCharts.renderPowertrainHeadline) return;
      if (!periodRows || !periodRows.length) {
        el.innerHTML = "";
        return;
      }
      let rows = periodRows;
      const cond = condicionAvailable ? condMode : "all";
      if (cond === "nuevo" || cond === "usado") rows = PYEVModels.filterModels(rows, { condicion: cond });
      if (brandPicker.selected.size) rows = rows.filter((r) => brandPicker.selected.has(r.marca));
      if (modelPicker.selected.size) rows = rows.filter((r) => modelPicker.selected.has(r.marca + " " + r.modelo));
      PYEVCharts.renderPowertrainHeadline(el, PYEVCharts.sumPowertrains(rows), {
        periods: PYEVModels.periodsOf(periodRows),
        cond,
        cutOnly: true,
      });
    }

    function draw() {
      syncModeUI();
      // Keep the month/year choices limited to periods present under all active filters.
      fillPeriodSelects();
      renderStickySummary();
      const periodRows = PYEVModels.filterByPeriodScope(marketRows, {
        mode,
        month: selectedMonthPeriod(),
        year: yearSel && yearSel.value,
      });
      if (scopeHint) scopeHint.textContent = scopeLabel();

      if (!periodRows.length) {
        if (scopeEmptyEl) {
          scopeEmptyEl.hidden = false;
          scopeEmptyEl.textContent = t("vol_lv_empty");
        }
        setChartsEmpty(t("vol_lv_empty"));
        renderHeadline(periodRows);
        return;
      }
      if (scopeEmptyEl) scopeEmptyEl.hidden = true;

      const rows = scopedRows();
      if (!rows.length) {
        setChartsEmpty(t("models_empty_filter"));
        renderHeadline(periodRows);
        return;
      }

      const qOn = queryTokens().length > 0;
      // Base for every % column: the current cut (period + condition + powertrain chips).
      // Top 20 / Todas, brand picks and search never change it.
      periodTotal = rows.reduce((a, r) => a + (Number(r.units) || 0), 0);
      const rankedBrands = PYEVModels.rankBrands(rows, { topN: 0 });
      rankedBrands.forEach((b, i) => {
        b.rank = i + 1;
      });
      brandPicker.sync(rankedBrands.map((b) => b.marca));
      // The search box only narrows what is shown; ranks stay those of the full list.
      const allBrands = qOn ? rankedBrands.filter((b) => matchesQuery(b.marca)) : rankedBrands;
      // With brands chosen, the model ranking and picker only cover those brands.
      const modelRows = brandPicker.selected.size
        ? rows.filter((r) => brandPicker.selected.has(r.marca))
        : rows;
      const rankedModels = PYEVModels.rankModels(modelRows, { topN: 0 });
      rankedModels.forEach((m, i) => {
        m.rank = i + 1;
      });
      modelPicker.sync(rankedModels.map((m) => m.label));
      const allModels = qOn
        ? rankedModels.filter((m) => matchesQuery(m.marca + " " + m.modelo + " " + m.label))
        : rankedModels;
      publishFilter();
      const cap = topLimit === "all" || qOn ? Infinity : TOP_DEFAULT;
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
      const tableOpts = {
        grand: periodTotal,
        showGroupTotals: ptSet.size >= 2,
        columns: !!(brandTable && brandTable.dataset.columns === "1"),
      };
      PYEVModels.renderTopBrandTable(brandTable, brands, tableOpts);
      lastModels = models;
      paintModelTable();
      bindModelChartClicks(models);
      paintBevRanking(periodRows, qOn);
      renderHeadline(periodRows);
    }

    function paintBevRanking(periodRows, qOn) {
      if (!bevChart && !bevTable) return;
      let base = periodRows;
      const cond = condicionAvailable ? condMode : "all";
      if (cond === "nuevo" || cond === "usado") base = PYEVModels.filterModels(base, { condicion: cond });
      base = PYEVModels.marketSeriesRows(base).filter((r) => r.powertrain === "BEV");
      // This table's cut is BEV only, so its % is of all BEV units in the period.
      bevTotal = base.reduce((a, r) => a + (Number(r.units) || 0), 0);
      if (brandPicker.selected.size) base = base.filter((r) => brandPicker.selected.has(r.marca));
      let ranked = PYEVModels.rankModels(base, { topN: 0 });
      ranked.forEach((m, i) => { m.rank = i + 1; });
      if (qOn) ranked = ranked.filter((m) => matchesQuery(m.marca + " " + m.modelo + " " + m.label));
      const cap = topLimit === "all" || qOn ? Infinity : TOP_DEFAULT;
      const shown = ranked.slice(0, cap);
      if (bevChart) {
        bevChart.innerHTML = "";
        PYEVModels.renderTopModelChart(bevChart, shown);
      }
      lastBevModels = shown;
      paintBevTable();
    }

    function paintModelTable() {
      // Model rows are single-powertrain, so no per-model Total line.
      PYEVModels.renderTopModelTable(modelTable, lastModels, {
        grand: periodTotal,
        showGroupTotals: false,
        expandedModels,
      });
    }
    function paintBevTable() {
      if (!bevTable) return;
      PYEVModels.renderTopModelTable(bevTable, lastBevModels, {
        grand: bevTotal,
        showGroupTotals: false,
        expandedModels: expandedBev,
      });
    }
    function queryTokens() {
      return searchInput ? searchTokens(searchInput.value) : [];
    }
    function matchesQuery(label) {
      const tokens = queryTokens();
      if (!tokens.length) return true;
      const key = searchKey(label);
      return tokens.every((tok) => key.includes(tok));
    }

    function toggleModelEdition(key, which) {
      if (!key) return;
      const set = which === "bev" ? expandedBev : expandedModels;
      if (set.has(key)) set.delete(key);
      else set.add(key);
      if (which === "bev") paintBevTable();
      else paintModelTable();
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
          // Ticks start with the row's rank, which is unique per model + powertrain.
          const raw = String((pt.customdata != null ? pt.customdata : pt.y) || "");
          const rk = /^(\d+)\.\s/.exec(raw);
          const hit = rk && models.find((m) => m.rank === Number(rk[1]) && m.editions);
          if (!hit) return;
          toggleModelEdition(PYEVModels.modelEditionKey(hit));
        };
        node.on("plotly_click", modelClickBound);
      });
    }

    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.periodMode;
        ssSet(MODE_KEY, mode);
        syncModeUI();
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
        fillPeriodSelects();
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
        fillPeriodSelects();
        draw();
      });
    });
    if (monthYearSel) {
      monthYearSel.addEventListener("change", () => {
        fillPeriodSelects(monthYearSel.value);
        ssSet(MONTH_KEY, selectedMonthPeriod());
        draw();
      });
    }
    if (monthSel) {
      monthSel.addEventListener("change", () => {
        ssSet(MONTH_KEY, selectedMonthPeriod());
        draw();
      });
    }
    if (yearSel) {
      yearSel.addEventListener("change", () => {
        ssSet(YEAR_KEY, yearSel.value);
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
      if (searchInput) {
        searchInput.placeholder = t("mm_search");
        searchInput.setAttribute("aria-label", t("mm_search_aria"));
      }
      if (!marketRows.length) return;
      fillPeriodSelects();
      draw();
    });
    global.addEventListener("pyev-nuevos", (ev) => {
      if (!marketRows.length) return;
      condMode = ev.detail ? "nuevo" : (lsGet(COND_KEY) === "usado" ? "usado" : "all");
      if (ev.detail) lsSet(COND_KEY, "nuevo");
      else if (lsGet(COND_KEY) === "nuevo") lsSet(COND_KEY, "all");
      fillPeriodSelects();
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
