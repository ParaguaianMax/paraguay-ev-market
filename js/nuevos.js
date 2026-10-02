/**
 * Site-wide "Nuevos" toggle for Vehículos tabs.
 * ON → only condicion=nuevo (from models CSV). OFF → all (Paraguay.csv aggregate).
 * Persists in localStorage (pyev-nuevos) and syncs with Volúmenes condición chips.
 */
(function (global) {
  const KEY = "pyev-nuevos";
  const COND_KEY = "pyev-vol-cond-mode";

  function t(k, vars) {
    return global.PYEV && global.PYEV.t ? global.PYEV.t(k, vars) : k;
  }

  function isNuevosOnly() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setNuevosOnly(on, opts) {
    opts = opts || {};
    const next = !!on;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch (e) {}
    // Align Volúmenes local cond chip with global toggle
    try {
      if (next) localStorage.setItem(COND_KEY, "nuevo");
      else {
        const cur = localStorage.getItem(COND_KEY);
        if (cur === "nuevo") localStorage.setItem(COND_KEY, "all");
      }
    } catch (e) {}
    syncToggleUI();
    if (!opts.silent) {
      global.dispatchEvent(new CustomEvent("pyev-nuevos", { detail: next }));
    }
  }

  function syncToggleUI() {
    const on = isNuevosOnly();
    document.querySelectorAll("#nuevosToggle, [data-nuevos-toggle]").forEach((el) => {
      if (el.type === "checkbox") el.checked = on;
      else el.classList.toggle("active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.documentElement.setAttribute("data-nuevos", on ? "1" : "0");
    document.querySelectorAll("[data-nuevos-note]").forEach((el) => {
      el.hidden = !on;
    });
    document.querySelectorAll("[data-i18n='includes_new_used'], [data-i18n='home_note']").forEach((el) => {
      // Footnotes that mention new+used: swap copy when filter is on
      if (el.dataset.i18n === "includes_new_used" || el.dataset.i18n === "home_note") {
        el.innerHTML = on ? t("nuevos_only_note") : t(el.dataset.i18n);
      }
    });
    document.querySelectorAll("[data-i18n='vol_rank_foot']").forEach((el) => {
      el.innerHTML = on ? t("nuevos_rank_foot") : t("vol_rank_foot");
    });
  }

  function mountNuevosToggle(host) {
    const wrap = host || document.querySelector(".subnav-bar .wrap");
    if (!wrap) return null;
    const existing = wrap.querySelector(".nuevos-toggle");
    if (existing) {
      const input = existing.querySelector('input[type="checkbox"]');
      if (input && !input.dataset.nuevosBound) {
        input.dataset.nuevosBound = "1";
        input.addEventListener("change", () => {
          setNuevosOnly(input.checked);
        });
      }
      syncToggleUI();
      return existing;
    }
    const label = document.createElement("label");
    label.className = "nuevos-toggle";
    label.setAttribute("title", t("nuevos_hint"));
    label.innerHTML =
      '<input type="checkbox" id="nuevosToggle" data-nuevos-toggle />' +
      '<span class="nuevos-toggle-ui" aria-hidden="true"></span>' +
      '<span class="nuevos-toggle-label" data-i18n="nuevos_label">' +
      t("nuevos_label") +
      "</span>";
    wrap.appendChild(label);
    const input = label.querySelector("input");
    input.checked = isNuevosOnly();
    input.setAttribute("aria-label", t("nuevos_label"));
    input.dataset.nuevosBound = "1";
    input.addEventListener("change", () => {
      setNuevosOnly(input.checked);
    });
    syncToggleUI();
    return label;
  }

  /**
   * Resolve market rows for Vehículos charts.
   * When Nuevos is OFF → Paraguay.csv filtered LightVehicles·leve.
   * When ON → aggregate models CSV LightVehicles·leve·nuevo (shares recomputed).
   */
  async function resolveVehicleRows(paraguayRows) {
    if (!isNuevosOnly()) {
      const rows =
        global.PYEV && global.PYEV.filterRows
          ? global.PYEV.filterRows(paraguayRows || [])
          : paraguayRows || [];
      return { rows: rows, source: "aggregate", nuevos: false };
    }
    if (!global.PYEVModels || !global.PYEVModels.loadParaguayModels) {
      return {
        rows: [],
        source: "missing-models",
        nuevos: true,
        note: "nuevos_models_required",
      };
    }
    const res = await global.PYEVModels.loadParaguayModels();
    const market = global.PYEVModels.marketSeriesRows(res.rows || []);
    if (!market.length) {
      return {
        rows: [],
        source: "empty-lv",
        nuevos: true,
        note: "vol_lv_empty",
      };
    }
    if (!global.PYEVModels.hasCondicion(market)) {
      return {
        rows: [],
        source: "no-condicion",
        nuevos: true,
        note: "nuevos_no_condicion",
      };
    }
    const filtered = global.PYEVModels.filterModels(market, { condicion: "nuevo" });
    const rows = global.PYEVModels.aggregateToMarketRows(filtered);
    return {
      rows: rows,
      source: "models-nuevo",
      nuevos: true,
      note: rows.length ? "nuevos_derived_note" : "models_empty_filter",
    };
  }

  function emptyStatusHtml(noteKey) {
    const msg = t(noteKey || "nuevos_no_condicion");
    return '<div class="status">' + msg + "</div>";
  }

  global.PYEV = Object.assign(global.PYEV || {}, {
    isNuevosOnly: isNuevosOnly,
    setNuevosOnly: setNuevosOnly,
    mountNuevosToggle: mountNuevosToggle,
    resolveVehicleRows: resolveVehicleRows,
    syncNuevosUI: syncToggleUI,
    nuevosEmptyHtml: emptyStatusHtml,
  });

  function boot() {
    mountNuevosToggle();
    syncToggleUI();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  global.addEventListener("pyev-lang", () => {
    document.querySelectorAll(".nuevos-toggle-label").forEach((el) => {
      el.textContent = t("nuevos_label");
    });
    document.querySelectorAll("#nuevosToggle").forEach((el) => {
      el.setAttribute("aria-label", t("nuevos_label"));
    });
    const host = document.querySelector(".nuevos-toggle");
    if (host) host.setAttribute("title", t("nuevos_hint"));
    syncToggleUI();
  });
})(typeof window !== "undefined" ? window : globalThis);
