/**
 * Load and parse Paraguay.csv for GitHub Pages (relative paths).
 * Schema: period,time_interval,variant,source,BEV,PHEV,HEV,ICE,OTHERS,TOTAL,notes
 *
 * Variants:
 *   Whole         — clean HS 8703 (no golf/ATV)
 *   LightVehicles — one combined row/month: clean 8703 + light 8704 pickups
 */
(function (global) {
  const NUM = ["BEV", "PHEV", "HEV", "ICE", "OTHERS", "TOTAL"];
  const VARIANT_KEY = "pyev-variant";
  const KNOWN_VARIANTS = ["Whole", "LightVehicles"];

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).filter(Boolean).map((line) => {
      const cols = splitCSVLine(line);
      const row = {};
      headers.forEach((h, i) => {
        let v = cols[i] ?? "";
        if (NUM.includes(h)) v = Number(v) || 0;
        row[h] = v;
      });
      row.electrified = row.BEV + row.PHEV + row.HEV + row.OTHERS;
      row.electrified_pct = row.TOTAL ? (100 * row.electrified) / row.TOTAL : 0;
      row.share = {
        BEV: pct(row.BEV, row.TOTAL),
        PHEV: pct(row.PHEV, row.TOTAL),
        HEV: pct(row.HEV, row.TOTAL),
        OTHERS: pct(row.OTHERS, row.TOTAL),
        ICE: pct(row.ICE, row.TOTAL),
      };
      return row;
    });
  }

  function pct(n, total) {
    return total ? (100 * n) / total : 0;
  }

  /** Minimal CSV splitter that respects quoted fields. */
  function splitCSVLine(line) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out;
  }

  function resolveDataUrl() {
    // From root: data/Paraguay.csv ; from pages/: ../data/Paraguay.csv
    const inPages =
      /\/pages\//.test(location.pathname) ||
      location.pathname.endsWith("/share.html") ||
      location.pathname.endsWith("/volumes.html");
    return inPages ? "../data/Paraguay.csv" : "data/Paraguay.csv";
  }

  async function loadParaguay(url) {
    const u = url || resolveDataUrl();
    const res = await fetch(u);
    if (!res.ok) throw new Error("No se pudo cargar " + u + " (" + res.status + ")");
    const text = await res.text();
    const rows = parseCSV(text);
    rows.sort((a, b) => {
      if (a.period < b.period) return -1;
      if (a.period > b.period) return 1;
      // Stable secondary: Whole before LightVehicles for same period
      if (a.variant < b.variant) return -1;
      if (a.variant > b.variant) return 1;
      return 0;
    });
    return rows;
  }

  function availableVariants(rows) {
    // Always expose known variants so the control is ready when data arrives
    const ordered = KNOWN_VARIANTS.slice();
    (rows || []).forEach((r) => {
      if (r.variant && !ordered.includes(r.variant)) ordered.push(r.variant);
    });
    return ordered;
  }

  function variantsWithData(rows) {
    return [...new Set((rows || []).map((r) => r.variant).filter(Boolean))];
  }

  function latestPeriod(rows) {
    let max = null;
    (rows || []).forEach((r) => {
      if (!max || r.period > max) max = r.period;
    });
    return max;
  }

  /** Prefer LightVehicles when the latest month has that variant; else Whole. */
  function defaultVariant(rows) {
    const latest = latestPeriod(rows);
    if (latest && (rows || []).some((r) => r.variant === "LightVehicles" && r.period === latest)) {
      return "LightVehicles";
    }
    if ((rows || []).some((r) => r.variant === "Whole")) return "Whole";
    const withData = variantsWithData(rows);
    return withData[0] || "Whole";
  }

  function getVariant(rows) {
    try {
      const saved = localStorage.getItem(VARIANT_KEY);
      if (saved && (rows || []).some((r) => r.variant === saved)) return saved;
    } catch (e) {}
    return defaultVariant(rows);
  }

  function setVariant(variant) {
    const v = KNOWN_VARIANTS.includes(variant) || variant ? variant : "Whole";
    try {
      localStorage.setItem(VARIANT_KEY, v);
    } catch (e) {}
    global.dispatchEvent(new CustomEvent("pyev-variant", { detail: v }));
  }

  function filterByVariant(rows, variant) {
    const v = variant || getVariant(rows);
    const filtered = (rows || []).filter((r) => r.variant === v);
    if (filtered.length) return filtered;
    // Fallback to Whole, then any data
    const whole = (rows || []).filter((r) => r.variant === "Whole");
    return whole.length ? whole : rows || [];
  }

  /** Wire a <select id="variantToggle"> (or any select) to the variant preference. */
  function mountVariantToggle(selectEl, rows, onChange) {
    if (!selectEl) return;
    const opts = availableVariants(rows);
    const withData = new Set(variantsWithData(rows));
    const current = getVariant(rows);
    const toolbar = selectEl.closest(".series-toolbar");
    // Keep the UI quiet while only one series is available. The internal
    // variant value remains unchanged so the selector appears automatically
    // once a second series (for example LightVehicles) is published.
    if (toolbar) toolbar.hidden = withData.size < 2;

    selectEl.innerHTML = "";
    opts.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.disabled = !withData.has(v);
      opt.textContent = variantLabel(v);
      selectEl.appendChild(opt);
    });
    // If saved/default has no data, fall back to a variant that does
    const effective = withData.has(current) ? current : defaultVariant(rows);
    selectEl.value = effective;
    selectEl.setAttribute(
      "aria-label",
      (global.PYEV && global.PYEV.t && global.PYEV.t("variant_label")) || "Serie"
    );

    selectEl.onchange = () => {
      setVariant(selectEl.value);
      if (typeof onChange === "function") onChange(selectEl.value);
    };

    // Keep labels in sync when language changes (once per element)
    if (!selectEl._pyevLangBound) {
      selectEl._pyevLangBound = true;
      global.addEventListener("pyev-lang", () => {
        Array.from(selectEl.options).forEach((opt) => {
          opt.textContent = variantLabel(opt.value);
        });
        selectEl.setAttribute(
          "aria-label",
          (global.PYEV && global.PYEV.t && global.PYEV.t("variant_label")) || "Serie"
        );
      });
    }
  }

  function variantLabel(v) {
    const t = global.PYEV && global.PYEV.t ? global.PYEV.t : (k) => k;
    if (v === "Whole") return t("variant_whole");
    if (v === "LightVehicles") return t("variant_light");
    return v;
  }

  function fmtInt(n) {
    const lang = global.PYEV && global.PYEV.language ? global.PYEV.language() : "es";
    return Math.round(n).toLocaleString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-PY");
  }

  function fmtPct(n, digits) {
    return n.toFixed(digits == null ? 1 : digits) + "%";
  }

  function periodLabel(p) {
    // 2026-08 → ago 2026
    const lang = global.PYEV && global.PYEV.language ? global.PYEV.language() : "es";
    const m =
      lang === "en"
        ? {
            "01": "Jan",
            "02": "Feb",
            "03": "Mar",
            "04": "Apr",
            "05": "May",
            "06": "Jun",
            "07": "Jul",
            "08": "Aug",
            "09": "Sep",
            "10": "Oct",
            "11": "Nov",
            "12": "Dec",
          }
        : lang === "pt"
          ? {
              "01": "jan",
              "02": "fev",
              "03": "mar",
              "04": "abr",
              "05": "mai",
              "06": "jun",
              "07": "jul",
              "08": "ago",
              "09": "set",
              "10": "out",
              "11": "nov",
              "12": "dez",
            }
          : {
              "01": "ene",
              "02": "feb",
              "03": "mar",
              "04": "abr",
              "05": "may",
              "06": "jun",
              "07": "jul",
              "08": "ago",
              "09": "sep",
              "10": "oct",
              "11": "nov",
              "12": "dic",
            };
    const [y, mo] = String(p).split("-");
    return (m[mo] || mo) + " " + y;
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  /** Theme-aware drivetrain palette (gallery-muted, still distinct). */
  function colors() {
    if (isDark()) {
      return {
        BEV: "#6fb585",
        PHEV: "#86acdd",
        HEV: "#d4b45a",
        OTHERS: "#b39ddb",
        ICE: "#9a978e",
        TOTAL: "#a9c4e8",
      };
    }
    return {
      BEV: "#2f6b45",
      PHEV: "#1d4f91",
      HEV: "#8a6a12",
      OTHERS: "#6b4f9a",
      ICE: "#6b6860",
      TOTAL: "#1d4f91",
    };
  }

  global.PYEV = Object.assign(global.PYEV || {}, {
    loadParaguay,
    parseCSV,
    filterByVariant,
    getVariant,
    setVariant,
    defaultVariant,
    availableVariants,
    variantsWithData,
    mountVariantToggle,
    variantLabel,
    KNOWN_VARIANTS,
    fmtInt,
    fmtPct,
    periodLabel,
    isDark,
    colors,
    get COLORS() {
      return colors();
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
