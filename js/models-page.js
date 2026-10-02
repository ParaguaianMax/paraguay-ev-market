/**
 * Marcas / models page — brand·model·powertrain detail.
 * Hard scope: LightVehicles + leve only (never Whole ∪ LightVehicles).
 * Months without LV·leve detail stay empty (no Whole fallback).
 */
document.addEventListener("DOMContentLoaded", async () => {
  const emptyEl = document.getElementById("models-empty");
  const uiEl = document.getElementById("models-ui");
  const chartEl = document.getElementById("chart-models");
  const tableEl = document.getElementById("table-models");
  const kpisEl = document.getElementById("kpis");
  const hintEl = document.getElementById("variantHint");
  const periodSel = document.getElementById("periodToggle");
  const marcaSel = document.getElementById("marcaToggle");
  const modeloSel = document.getElementById("modeloToggle");
  const ptButtons = document.getElementById("ptButtons");

  /** @type {any[]} scoped LightVehicles·leve rows only */
  let marketRows = [];
  let view = "general";
  let activePts = new Set(PYEVModels.POWERTRAINS);
  /** @type {"all"|"nuevo"|"usado"} */
  let condMode = "all";
  let condicionAvailable = false;
  try {
    const saved = localStorage.getItem("pyev-models-cond") || "";
    if (saved === "nuevo" || saved === "usado" || saved === "all") condMode = saved;
  } catch (e) {}

  function showEmpty(msg) {
    emptyEl.hidden = false;
    uiEl.hidden = true;
    if (msg) {
      emptyEl.textContent = msg;
      emptyEl.classList.add("error");
    }
  }

  function scopedBase() {
    return marketRows;
  }

  function syncCondUI() {
    const wrap = document.getElementById("modelsCondWrap");
    if (wrap) wrap.hidden = !condicionAvailable;
    document.querySelectorAll("#modelsCondWrap [data-cond-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.condMode === condMode);
    });
  }

  function filteredRows() {
    const opts = {
      period: periodSel.value || null,
      powertrains: [...activePts],
      marca: marcaSel.value || null,
      modelo: modeloSel.value || null,
    };
    if (condicionAvailable && (condMode === "nuevo" || condMode === "usado")) {
      opts.condicion = condMode;
    }
    return PYEVModels.filterModels(scopedBase(), opts);
  }

  function updateHint() {
    if (!hintEl) return;
    const parts = [];
    parts.push(
      (PYEV.t && PYEV.t("variant_light_hint")) ||
        "HS 8703 limpio + pickups livianos HS 8704 (totales combinados)."
    );
    parts.push(
      (PYEV.t && PYEV.t("segment_leve_hint")) ||
        "Automóviles y similares (livianos)."
    );
    const n = filteredRows().length;
    parts.push(PYEV.t("models_rows", { n: String(n) }));
    hintEl.textContent = parts.join(" · ");
  }

  function fillPeriods() {
    const periods = PYEVModels.periodsOf(scopedBase());
    const latest = periods[periods.length - 1] || "";
    let saved = "";
    try {
      saved = localStorage.getItem("pyev-models-period") || "";
    } catch (e) {}
    const pick = periods.includes(saved) ? saved : latest;
    periodSel.innerHTML = "";
    periods.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = PYEV.periodLabel(p);
      periodSel.appendChild(opt);
    });
    if (pick) periodSel.value = pick;
    else if (latest) periodSel.value = latest;
    const wrap = document.getElementById("periodWrap");
    if (wrap) wrap.hidden = periods.length < 1;
  }

  function fillBrands() {
    const opts = {
      period: periodSel.value || null,
      powertrains: [...activePts],
    };
    if (condicionAvailable && (condMode === "nuevo" || condMode === "usado")) {
      opts.condicion = condMode;
    }
    const rows = PYEVModels.filterModels(scopedBase(), opts);
    const brands = PYEVModels.brandsOf(rows);
    const prev = marcaSel.value;
    marcaSel.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = PYEV.t("models_all_brands");
    marcaSel.appendChild(all);
    brands.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      marcaSel.appendChild(opt);
    });
    marcaSel.value = brands.includes(prev) ? prev : "";
    const wrap = document.getElementById("marcaWrap");
    if (wrap) wrap.hidden = brands.length < 1;
  }

  function fillModels() {
    const opts = {
      period: periodSel.value || null,
      powertrains: [...activePts],
      marca: marcaSel.value || null,
    };
    if (condicionAvailable && (condMode === "nuevo" || condMode === "usado")) {
      opts.condicion = condMode;
    }
    const rows = PYEVModels.filterModels(scopedBase(), opts);
    const models = PYEVModels.modelsOf(rows, marcaSel.value || null);
    const prev = modeloSel.value;
    modeloSel.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = PYEV.t("models_all_models");
    modeloSel.appendChild(all);
    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      modeloSel.appendChild(opt);
    });
    modeloSel.value = models.includes(prev) ? prev : "";
    const wrap = document.getElementById("modeloWrap");
    if (wrap) wrap.hidden = !marcaSel.value && models.length > 40;
  }

  function fillPowertrains() {
    const available = new Set(PYEVModels.powertrainsOf(scopedBase()));
    ptButtons.innerHTML = "";
    const pillClass = {
      BEV: "pill-bev",
      PHEV: "pill-phev",
      HEV: "pill-hev",
      ICE: "pill-ice",
      OTHERS: "pill-others",
    };
    PYEVModels.POWERTRAINS.forEach((pt) => {
      if (!available.has(pt) && marketRows.length) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pt-chip" + (activePts.has(pt) ? " active" : "");
      btn.dataset.pt = pt;
      btn.innerHTML =
        '<span class="pill ' +
        (pillClass[pt] || "pill-others") +
        '">' +
        pt +
        "</span>";
      btn.addEventListener("click", () => {
        if (activePts.has(pt)) {
          if (activePts.size > 1) activePts.delete(pt);
        } else {
          activePts.add(pt);
        }
        btn.classList.toggle("active", activePts.has(pt));
        Array.from(ptButtons.querySelectorAll(".pt-chip")).forEach((el) => {
          el.classList.toggle("active", activePts.has(el.dataset.pt));
        });
        fillBrands();
        fillModels();
        draw();
      });
      ptButtons.appendChild(btn);
    });
    const wrap = document.getElementById("ptFilter");
    if (wrap) wrap.hidden = ptButtons.children.length < 1;
  }

  function renderKpis(rows) {
    const total = PYEVModels.sumUnits(rows);
    const byPt = PYEVModels.byPowertrain(rows);
    const map = {};
    byPt.forEach((e) => {
      map[e.powertrain] = e.units;
    });
    const items = [
      { key: "total", label: PYEV.t("total"), value: total, cls: "" },
      { key: "BEV", label: "BEV", value: map.BEV || 0, cls: "bev" },
      { key: "PHEV", label: "PHEV", value: map.PHEV || 0, cls: "phev" },
      { key: "HEV", label: "HEV", value: map.HEV || 0, cls: "hev" },
      { key: "ICE", label: "ICE", value: map.ICE || 0, cls: "ice" },
    ];
    kpisEl.innerHTML = items
      .map(
        (e) =>
          '<div class="kpi ' +
          e.cls +
          '"><div class="label">' +
          e.label +
          '</div><div class="value">' +
          PYEV.fmtInt(e.value) +
          "</div></div>"
      )
      .join("");
  }

  function draw() {
    updateHint();
    const rows = filteredRows();
    renderKpis(rows);
    chartEl.innerHTML = "";
    if (!rows.length) {
      const msg =
        (PYEV.t && PYEV.t("vol_lv_empty")) ||
        "Sin detalle LightVehicles · leve para este período. No se usa la serie Whole.";
      // Period exists in LV set but filters emptied it vs no LV at all
      const hasPeriod = marketRows.some((r) => r.period === periodSel.value);
      chartEl.innerHTML =
        '<div class="status">' +
        (hasPeriod ? PYEV.t("models_empty_filter") : msg) +
        "</div>";
      tableEl.innerHTML = "";
      return;
    }
    if (view === "general") {
      PYEVModels.renderGeneralChart(chartEl, rows);
      PYEVModels.renderGeneralTable(tableEl, rows);
    } else if (view === "brand") {
      PYEVModels.renderBrandChart(chartEl, rows);
      PYEVModels.renderBrandTable(tableEl, rows);
    } else {
      PYEVModels.renderModelChart(chartEl, rows);
      PYEVModels.renderModelTable(tableEl, rows);
    }
  }

  function remount() {
    // Variant/segment toggles intentionally not mounted — fixed LightVehicles·leve.
    fillPeriods();
    fillPowertrains();
    syncCondUI();
    fillBrands();
    fillModels();
    updateHint();
  }

  document.querySelectorAll(".view-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      view = btn.dataset.view;
      draw();
    });
  });

  periodSel.addEventListener("change", () => {
    try {
      localStorage.setItem("pyev-models-period", periodSel.value);
    } catch (e) {}
    fillBrands();
    fillModels();
    draw();
  });
  marcaSel.addEventListener("change", () => {
    fillModels();
    draw();
  });
  modeloSel.addEventListener("change", draw);

  document.querySelectorAll("#modelsCondWrap [data-cond-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!condicionAvailable) return;
      condMode = btn.dataset.condMode;
      try {
        localStorage.setItem("pyev-models-cond", condMode);
      } catch (e) {}
      syncCondUI();
      fillBrands();
      fillModels();
      draw();
    });
  });

  try {
    const res = await PYEVModels.loadParaguayModels();
    const all = res.rows || [];
    if (res.missing || !all.length) {
      showEmpty();
      return;
    }
    marketRows = PYEVModels.marketSeriesRows(all);
    condicionAvailable = !!(
      PYEVModels.hasCondicion && PYEVModels.hasCondicion(marketRows)
    );
    if (!condicionAvailable) condMode = "all";
    if (!marketRows.length) {
      showEmpty(
        (PYEV.t && PYEV.t("vol_lv_empty")) ||
          "Sin detalle LightVehicles · leve. No se usa la serie Whole."
      );
      return;
    }
    emptyEl.hidden = true;
    uiEl.hidden = false;
    remount();
    draw();
  } catch (err) {
    showEmpty(err.message || String(err));
  }

  window.addEventListener("pyev-lang", () => {
    if (!marketRows.length) return;
    remount();
    draw();
  });
  // Ignore variant/segment switches — series is fixed to LightVehicles·leve.
  window.addEventListener("pyev-theme", () => {
    if (chartEl && chartEl.data) PYEVModels.restyleTheme(chartEl);
  });
});
