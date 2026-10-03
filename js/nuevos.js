/**
 * Site-wide 0 km filter for Vehículos tabs.
 * OFF (default) → only condicion=nuevo (from models CSV). ON → all (Paraguay.csv aggregate).
 * Persists in localStorage and syncs with Volúmenes condición chips.
 */
(function (global) {
  const KEY = "pyev-vehicles-all";
  const COND_KEY = "pyev-vol-cond-mode";
  const IMPORTS_BANNER = {
    es: "Todas las importaciones de vehículos, incluyendo nuevos y usados.",
    pt: "Todas as importações de veículos, incluindo novos e usados.",
    en: "All vehicle imports, including new and used.",
  };

  function t(k, vars) {
    return global.PYEV && global.PYEV.t ? global.PYEV.t(k, vars) : k;
  }

  function isAllVehicles() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  // Compatibility API: callers historically ask whether the 0 km-only filter is on.
  function isNuevosOnly() {
    return !isAllVehicles();
  }

  function setAllVehicles(on, opts) {
    opts = opts || {};
    const next = !!on;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch (e) {}
    // Align Volúmenes local cond chip with global toggle
    try {
      if (next) {
        const cur = localStorage.getItem(COND_KEY);
        if (cur === "nuevo") localStorage.setItem(COND_KEY, "all");
      } else {
        localStorage.setItem(COND_KEY, "nuevo");
      }
    } catch (e) {}
    syncToggleUI();
    if (!opts.silent) {
      // Event detail remains the historical "0 km only" boolean for consumers.
      global.dispatchEvent(new CustomEvent("pyev-nuevos", { detail: !next }));
    }
  }

  // Compatibility API: true means 0 km only, as before this inversion.
  function setNuevosOnly(on, opts) {
    setAllVehicles(!on, opts);
  }

  function syncToggleUI() {
    const on = isAllVehicles();
    document.querySelectorAll("#nuevosToggle, [data-nuevos-toggle]").forEach((el) => {
      if (el.type === "checkbox") el.checked = on;
      else el.classList.toggle("active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.documentElement.setAttribute("data-nuevos", on ? "0" : "1");
    document.querySelectorAll("[data-nuevos-note]").forEach((el) => {
      // The default 0 km-only view is intentionally quiet; explain the broader
      // scope only after the user turns on “Nuevos y usados”.
      el.hidden = !on;
      const lang = global.PYEV && global.PYEV.language ? global.PYEV.language() : "es";
      el.textContent = IMPORTS_BANNER[lang] || IMPORTS_BANNER.es;
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
          setAllVehicles(input.checked);
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
    input.checked = isAllVehicles();
    input.setAttribute("aria-label", t("nuevos_label"));
    input.dataset.nuevosBound = "1";
    input.addEventListener("change", () => {
      setAllVehicles(input.checked);
    });
    syncToggleUI();
    return label;
  }

  /**
   * Resolve market rows for Vehículos charts.
   * When the toggle is ON → Paraguay.csv filtered LightVehicles·leve (new + used).
   * When OFF (default) → aggregate models CSV LightVehicles·leve·nuevo (shares recomputed).
   */
  async function resolveVehicleRows(paraguayRows) {
    if (isAllVehicles()) {
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
    isAllVehicles: isAllVehicles,
    setAllVehicles: setAllVehicles,
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
