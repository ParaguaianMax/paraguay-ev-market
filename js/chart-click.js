(function (global) {
  function lang() {
    if (global.PYEV && global.PYEV.language) return global.PYEV.language();
    return document.documentElement.lang || "es";
  }

  function unitsWord() {
    if (global.PYEV && global.PYEV.t) {
      var u = global.PYEV.t("units");
      if (u && u !== "units") return u;
    }
    return lang() === "en" ? "units" : "unidades";
  }

  function hintText() {
    var L = lang();
    if (L === "en") return "Tap a point to see the values.";
    if (L === "pt") return "Toque um ponto para ver os valores.";
    return "Tocá un punto para ver los valores.";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normCat(v) {
    if (v instanceof Date && !isNaN(v.getTime())) {
      return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0");
    }
    var s = String(v == null ? "" : v);
    var m = s.match(/^(\d{4})-(\d{2})/);
    if (m) return m[1] + "-" + m[2];
    return s;
  }

  function formatCat(v) {
    var key = normCat(v);
    if (/^\d{4}-\d{2}$/.test(key) && global.PYEV && global.PYEV.periodLabel) {
      return global.PYEV.periodLabel(key);
    }
    if (v instanceof Date && !isNaN(v.getTime()) && global.PYEV && global.PYEV.periodLabel) {
      return global.PYEV.periodLabel(normCat(v));
    }
    return String(v == null ? "" : v);
  }

  function axisKey(trace, horizontal) {
    var spec = horizontal ? (trace.xaxis || "x") : (trace.yaxis || "y");
    var prefix = horizontal ? "xaxis" : "yaxis";
    if (spec === "x" || spec === "y") return prefix;
    return prefix + String(spec).slice(1);
  }

  function axisIsPct(layout, key) {
    var ax = layout && layout[key];
    if (!ax) return false;
    if (ax.ticksuffix === "%") return true;
    var title = ax.title && (ax.title.text || ax.title);
    return typeof title === "string" && title.indexOf("%") !== -1;
  }

  function formatValue(n, pctAxis, custom) {
    if (n == null || n === "") return "—";
    var num = typeof n === "number" ? n : Number(n);
    var main;
    if (pctAxis && isFinite(num)) {
      main = num.toFixed(2) + "%";
    } else if (isFinite(num)) {
      var shown;
      if (Math.abs(num - Math.round(num)) < 1e-6 && global.PYEV && global.PYEV.fmtInt) {
        shown = global.PYEV.fmtInt(num);
      } else {
        var locale = lang() === "pt" ? "pt-BR" : lang() === "en" ? "en-US" : "es-PY";
        shown = num.toLocaleString(locale, { maximumFractionDigits: 2 });
      }
      main = shown + " " + unitsWord();
    } else {
      main = String(n);
    }
    if (!pctAxis && custom != null && custom !== "" && isFinite(Number(custom))) {
      main += " (" + Number(custom).toFixed(2) + "%)";
    }
    return main;
  }

  function panelFor(el) {
    if (!el || !el.parentNode) return null;
    var panel = el.nextElementSibling;
    if (!panel || !panel.classList || !panel.classList.contains("chart-readout")) {
      panel = document.createElement("div");
      panel.className = "chart-readout";
      panel.setAttribute("role", "status");
      panel.setAttribute("aria-live", "polite");
      el.insertAdjacentElement("afterend", panel);
    }
    return panel;
  }

  function showHint(el) {
    var panel = panelFor(el);
    if (!panel) return;
    panel.hidden = false;
    panel.dataset.state = "hint";
    panel.textContent = hintText();
  }

  function lockLayout(layout) {
    var next = Object.assign({}, layout || {});
    next.dragmode = false;
    next.clickmode = "event";
    ["xaxis", "yaxis", "xaxis2", "yaxis2", "xaxis3", "yaxis3"].forEach(function (k) {
      if (next[k] && typeof next[k] === "object") {
        next[k] = Object.assign({}, next[k], { fixedrange: true });
      }
    });
    return next;
  }

  function rowsFromClick(gd, ev) {
    var pt = ev && ev.points && ev.points[0];
    if (!pt || !pt.data) return null;
    var layout = gd._fullLayout || gd.layout || {};
    if (pt.data.type === "pie") {
      var pct = pt.percent;
      if (pct != null && pct <= 1) pct = pct * 100;
      var shown;
      if (global.PYEV && global.PYEV.fmtInt && isFinite(Number(pt.value))) shown = global.PYEV.fmtInt(pt.value);
      else shown = String(pt.value == null ? "—" : pt.value);
      if (pct != null && isFinite(pct)) shown += " (" + pct.toFixed(1) + "%)";
      var series = pt.data.name;
      if (!series && global.PYEV && global.PYEV.t) {
        var nch = global.PYEV.t("n_chargers");
        if (nch && nch !== "n_chargers") series = nch;
      }
      if (!series) series = unitsWord();
      return { cat: pt.label, lines: [{ name: series, value: shown, hit: true }] };
    }
    var horizontal = pt.data.orientation === "h";
    var target = normCat(horizontal ? pt.y : pt.x);
    var lines = [];
    var traces = gd.data || [];
    traces.forEach(function (trace, i) {
      if (!trace || trace.type === "pie") return;
      var horiz = trace.orientation === "h";
      var cats = horiz ? trace.y : trace.x;
      var vals = horiz ? trace.x : trace.y;
      if (!cats || !vals) return;
      var idx = -1;
      for (var j = 0; j < cats.length; j++) {
        if (normCat(cats[j]) === target) { idx = j; break; }
      }
      if (idx < 0) return;
      var custom = trace.customdata ? trace.customdata[idx] : undefined;
      var pctAxis = axisIsPct(layout, axisKey(trace, horiz));
      lines.push({
        name: trace.name || formatCat(cats[idx]),
        value: formatValue(vals[idx], pctAxis, custom),
        hit: i === pt.curveNumber,
      });
    });
    if (!lines.length) {
      var horizPt = pt.data.orientation === "h";
      var pctAxisPt = axisIsPct(layout, axisKey(pt.data, horizPt));
      lines.push({
        name: pt.data.name || formatCat(horizPt ? pt.y : pt.x),
        value: formatValue(horizPt ? pt.x : pt.y, pctAxisPt, pt.customdata),
        hit: true,
      });
    }
    return { cat: formatCat(horizontal ? pt.y : pt.x), lines: lines };
  }

  function renderClick(gd, ev) {
    var panel = panelFor(gd);
    if (!panel) return;
    var parsed = rowsFromClick(gd, ev);
    if (!parsed) return;
    var html = '<div class="chart-readout-cat">' + esc(parsed.cat) + "</div><ul>";
    parsed.lines.forEach(function (line) {
      html += '<li class="' + (line.hit ? "is-hit" : "") + '"><span class="name">' + esc(line.name) + '</span><span class="val">' + esc(line.value) + "</span></li>";
    });
    html += "</ul>";
    panel.hidden = false;
    panel.dataset.state = "value";
    panel.innerHTML = html;
  }

  function bind(el) {
    if (!el || typeof el.on !== "function") return;
    showHint(el);
    el.on("plotly_click", function (ev) { renderClick(el, ev); });
  }

  function install() {
    if (!global.Plotly || global.Plotly.__pyevClickPatched) return false;
    var origNew = global.Plotly.newPlot;
    var origPurge = global.Plotly.purge;
    var origRelayout = global.Plotly.relayout;
    function nodeOf(el) {
      return typeof el === "string" ? document.getElementById(el) : el;
    }
    global.Plotly.newPlot = function (el, data, layout, config) {
      var locked = lockLayout(layout);
      var cfg = Object.assign({}, config || {}, { scrollZoom: false, doubleClick: false });
      var ret = origNew.call(global.Plotly, el, data, locked, cfg);
      return Promise.resolve(ret).then(function (gd) {
        bind(gd || nodeOf(el));
        return gd;
      });
    };
    global.Plotly.relayout = function (el, update) {
      if (update && typeof update === "object" && !Array.isArray(update)) {
        update = Object.assign({}, update, { dragmode: false, clickmode: "event" });
        ["xaxis", "yaxis", "xaxis2", "yaxis2", "xaxis3", "yaxis3"].forEach(function (k) {
          if (update[k] && typeof update[k] === "object") {
            update[k] = Object.assign({}, update[k], { fixedrange: true });
          }
        });
      }
      return origRelayout.call(global.Plotly, el, update);
    };
    global.Plotly.purge = function (el) {
      var panel = el && el.nextElementSibling;
      if (panel && panel.classList && panel.classList.contains("chart-readout")) {
        panel.hidden = true;
        panel.innerHTML = "";
        panel.dataset.state = "";
      }
      return origPurge.apply(global.Plotly, arguments);
    };
    global.Plotly.__pyevClickPatched = true;
    return true;
  }

  if (!install()) {
    document.addEventListener("DOMContentLoaded", install);
  }
  global.addEventListener("pyev-lang", function () {
    document.querySelectorAll(".chart-readout").forEach(function (panel) {
      if (panel.dataset.state === "hint") panel.textContent = hintText();
    });
  });
})(typeof window !== "undefined" ? window : globalThis);
