(function (global) {
  const extra = {
    es: {
      variant_label: "Serie",
      variant_whole: "Automóviles y similares",
      variant_light: "Vehículos livianos + camionetas",
      variant_whole_hint: "Automóviles HS 8703 limpio (sin golf/ATV).",
      variant_light_hint: "HS 8703 limpio + pickups livianos HS 8704 (totales combinados).",
      variant_empty: "Sin datos para esta serie todavía."
    },
    pt: {
      variant_label: "Série",
      variant_whole: "Automóveis e similares",
      variant_light: "Veículos leves + picapes",
      variant_whole_hint: "Automóveis HS 8703 limpo (sem golf/ATV).",
      variant_light_hint: "HS 8703 limpo + pickups leves HS 8704 (totais combinados).",
      variant_empty: "Ainda sem dados para esta série."
    },
    en: {
      variant_label: "Series",
      variant_whole: "Passenger cars",
      variant_light: "Light vehicles + pickups",
      variant_whole_hint: "Clean HS 8703 cars (no golf/ATV).",
      variant_light_hint: "Clean HS 8703 + light HS 8704 pickups (combined totals).",
      variant_empty: "No data for this series yet."
    }
  };

  function install() {
    if (!global.PYEV || typeof global.PYEV.t !== "function") return false;
    if (global.PYEV._variantI18n) return true;
    global.PYEV._variantI18n = true;
    const prevT = global.PYEV.t;
    const langFn = global.PYEV.language || function () { return "es"; };
    global.PYEV.t = function (key, vars) {
      const pack = extra[langFn()] || extra.es;
      if (Object.prototype.hasOwnProperty.call(pack, key)) {
        var s = pack[key];
        if (vars) Object.keys(vars).forEach(function (k) {
          s = s.split("{" + k + "}").join(vars[k]);
        });
        return s;
      }
      return prevT(key, vars);
    };
    function paint() {
      document.querySelectorAll("[data-i18n^='variant_']").forEach(function (el) {
        el.innerHTML = global.PYEV.t(el.dataset.i18n);
      });
    }
    global.addEventListener("pyev-lang", paint);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", paint);
    } else {
      paint();
    }
    return true;
  }

  if (!install()) {
    document.addEventListener("DOMContentLoaded", install);
  }
})(window);
