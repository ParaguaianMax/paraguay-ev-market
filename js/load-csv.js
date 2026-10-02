/**
 * Load and parse Paraguay.csv for GitHub Pages (relative paths).
 * Schema: period,time_interval,variant,source,BEV,PHEV,HEV,ICE,OTHERS,TOTAL,notes
 */
(function (global) {
  const NUM = ["BEV", "PHEV", "HEV", "ICE", "OTHERS", "TOTAL"];

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
    const inPages = /\/pages\//.test(location.pathname) || location.pathname.endsWith("/share.html") || location.pathname.endsWith("/volumes.html");
    return inPages ? "../data/Paraguay.csv" : "data/Paraguay.csv";
  }

  async function loadParaguay(url) {
    const u = url || resolveDataUrl();
    const res = await fetch(u);
    if (!res.ok) throw new Error("No se pudo cargar " + u + " (" + res.status + ")");
    const text = await res.text();
    const rows = parseCSV(text);
    rows.sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
    return rows;
  }

  function fmtInt(n) {
    return Math.round(n).toLocaleString("es-PY");
  }

  function fmtPct(n, digits) {
    return n.toFixed(digits == null ? 1 : digits) + "%";
  }

  function periodLabel(p) {
    // 2026-08 → ago 2026
    const m = {
      "01": "ene", "02": "feb", "03": "mar", "04": "abr",
      "05": "may", "06": "jun", "07": "jul", "08": "ago",
      "09": "sep", "10": "oct", "11": "nov", "12": "dic",
    };
    const [y, mo] = String(p).split("-");
    return (m[mo] || mo) + " " + y;
  }

  global.PYEV = {
    loadParaguay,
    parseCSV,
    fmtInt,
    fmtPct,
    periodLabel,
    COLORS: {
      BEV: "#22c55e",
      PHEV: "#06b6d4",
      HEV: "#eab308",
      OTHERS: "#a78bfa",
      ICE: "#64748b",
      TOTAL: "#3d9cf0",
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
