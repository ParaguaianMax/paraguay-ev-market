(function (global) {
  const extra = {
    es: {
      variant_label: "Serie",
      variant_whole: "Automóviles y similares",
      variant_light: "Vehículos livianos + camionetas",
      variant_whole_hint: "Automóviles (sin golf ni ATV).",
      variant_light_hint: "Automóviles y camionetas livianas.",
      variant_empty: "Sin datos para esta serie todavía.",
      segment_label: "Segmento",
      segment_leve: "Vehículos livianos",
      segment_recreativo: "Recreativos",
      segment_pesado: "Pesados",
      segment_leve_hint: "Automóviles y similares (livianos).",
      segment_recreativo_hint: "ATV / UTV y recreativos.",
      segment_pesado_hint: "Camiones y buses.",
      nav_trajectories: "Trayectorias",
      nav_models: "Marcas", page_models: "Marcas y modelos — Paraguay EV Market",
      models_badge: "Marca · modelo · motorización",
      models_title: "Ventas por marca, modelo y motorización",
      models_lead: "Unidades importadas por marca y modelo (vehículos livianos y camionetas). Cada fila indica BEV, PHEV, HEV, mild o ICE.",
      models_empty: "Todavía no hay detalle por marca y modelo.",
      models_empty_filter: "Sin filas para estos filtros.",
      models_period: "Mes", models_col_brand: "Marca", models_col_model: "Modelo", models_col_pt: "Motorización",
      models_view_general: "Totales", models_view_brand: "Por marca", models_view_model: "Por modelo",
      models_all_brands: "Todas las marcas", models_all_models: "Todos los modelos",
      models_rows: "{n} filas", models_foot: "Fuente: Aduana Nacional del Paraguay · detalle por marca y modelo (livianos y camionetas).",
      card_models: "Marcas y modelos", card_models_desc: "Volúmenes por marca, modelo y motorización (BEV / PHEV / HEV / ICE).",
      next_models: "Marcas →", prev_models: "← Marcas",

      page_trajectories: "Trayectorias — Paraguay EV Market",
      next_trajectories: "Trayectorias →",
      prev_trajectories: "← Trayectorias",
      next_chargers: "Cargadores →",
      card_traj: "Trayectorias",
      card_traj_desc: "Proyección ilustrativa y participación acumulada de 12 meses.",
      traj_badge: "Tendencia",
      traj_title: "Trayectorias de adopción",
      traj_lead: "Curva ajustada a la participación mensual observada y participación acumulada de 12 meses. Con una serie corta, la proyección es ilustrativa.",
      traj_disclaimer: "La línea punteada extiende la tendencia observada. Es ilustrativa, no un pronóstico.",
      traj_extra_title: "Proyección: participación BEV / PHEV / HEV / ICE",
      traj_extra_lead: "Puntos = meses observados. Línea continua = ajuste. Línea punteada = proyección si la tendencia se mantuviera.",
      traj_ttm_title: "Participación acumulada 12 meses",
      traj_ttm_lead: "Cada punto suma los últimos 12 meses (o los disponibles, si son menos).",
      traj_note: "ICE = total − BEV − PHEV − HEV − mild.",
      traj_axis_share: "% del total (ajustado)",
      traj_ttm_axis: "Acumulado 12 meses",
      traj_ttm_axis_partial: "Acumulado (menos de 12 meses)",
      traj_fit: "ajuste",
      traj_proj: "proyección",
      traj_window: "ventana",
      traj_months_short: "meses",
      traj_observed: "Observado",
      traj_ice_below50_annotation: "ICE < 50% · {period}",
      traj_ice_below50_caption: "El ajuste sitúa ICE por debajo del 50% de importaciones en {period}.",
      traj_ice_below50_unreached: "ICE no baja del 50% dentro de la ventana proyectada.",
      traj_not_forecast: "no es un pronóstico",
      traj_ttm_partial_label: "Menos de 12 meses disponibles",
      traj_ttm_full_label: "Acumulado 12 meses",
      traj_available: "disponibles"
    },
    pt: {
      variant_label: "Série",
      variant_whole: "Automóveis e similares",
      variant_light: "Veículos leves + picapes",
      variant_whole_hint: "Automóveis (sem golf nem ATV).",
      variant_light_hint: "Automóveis e picapes leves.",
      variant_empty: "Ainda sem dados para esta série.",
      segment_label: "Segmento",
      segment_leve: "Veículos leves",
      segment_recreativo: "Recreativos",
      segment_pesado: "Pesados",
      segment_leve_hint: "Automóveis e similares (leves).",
      segment_recreativo_hint: "ATV / UTV e recreativos.",
      segment_pesado_hint: "Caminhões e ônibus.",
      nav_trajectories: "Trajetórias",
      nav_models: "Marcas", page_models: "Marcas e modelos — Paraguay EV Market",
      models_badge: "Marca · modelo · motorização",
      models_title: "Vendas por marca, modelo e motorização",
      models_lead: "Unidades importadas por marca e modelo (veículos leves e picapes). Cada linha indica BEV, PHEV, HEV, mild ou ICE.",
      models_empty: "Ainda não há detalhe por marca e modelo.",
      models_empty_filter: "Sem linhas para estes filtros.",
      models_period: "Mês", models_col_brand: "Marca", models_col_model: "Modelo", models_col_pt: "Motorização",
      models_view_general: "Totais", models_view_brand: "Por marca", models_view_model: "Por modelo",
      models_all_brands: "Todas as marcas", models_all_models: "Todos os modelos",
      models_rows: "{n} linhas", models_foot: "Fonte: Aduana Nacional do Paraguai · detalhe por marca e modelo (leves e picapes).",
      card_models: "Marcas e modelos", card_models_desc: "Volúmenes por marca, modelo e motorização (BEV / PHEV / HEV / ICE).",
      next_models: "Marcas →", prev_models: "← Marcas",

      page_trajectories: "Trayectorias — Paraguay EV Market",
      next_trajectories: "Trajetórias →",
      prev_trajectories: "← Trajetórias",
      next_chargers: "Carregadores →",
      card_traj: "Trayectorias",
      card_traj_desc: "Projeção ilustrativa e participação acumulada de 12 meses.",
      traj_badge: "Tendência",
      traj_title: "Trajetórias de adoção",
      traj_lead: "Curva ajustada à participação mensal observada e participação acumulada de 12 meses. Com uma série curta, a projeção é ilustrativa.",
      traj_disclaimer: "A linha tracejada prolonga a tendência observada. É ilustrativa, não uma previsão.",
      traj_extra_title: "Projeção: participação BEV / PHEV / HEV / ICE",
      traj_extra_lead: "Pontos = meses observados. Linha contínua = ajuste. Linha tracejada = projeção se a tendência se mantiver.",
      traj_ttm_title: "Participação acumulada 12 meses",
      traj_ttm_lead: "Cada ponto soma os últimos 12 meses (ou os disponíveis, se forem menos).",
      traj_note: "ICE = total − BEV − PHEV − HEV − mild.",
      traj_axis_share: "% do total (ajustado)",
      traj_ttm_axis: "Acumulado 12 meses",
      traj_ttm_axis_partial: "Acumulado (menos de 12 meses)",
      traj_fit: "ajuste",
      traj_proj: "projeção",
      traj_window: "janela",
      traj_months_short: "meses",
      traj_observed: "Observado",
      traj_ice_below50_annotation: "ICE < 50% · {period}",
      traj_ice_below50_caption: "O ajuste coloca o ICE abaixo de 50% das importações em {period}.",
      traj_ice_below50_unreached: "O ICE não cai abaixo de 50% dentro da janela projetada.",
      traj_not_forecast: "não é uma previsão",
      traj_ttm_partial_label: "Menos de 12 meses disponíveis",
      traj_ttm_full_label: "Acumulado 12 meses",
      traj_available: "disponíveis"
    },
    en: {
      variant_label: "Series",
      variant_whole: "Passenger cars",
      variant_light: "Light vehicles + pickups",
      variant_whole_hint: "Passenger cars (no golf carts or ATVs).",
      variant_light_hint: "Passenger cars and light pickups.",
      variant_empty: "No data for this series yet.",
      segment_label: "Segment",
      segment_leve: "Light vehicles",
      segment_recreativo: "Recreational",
      segment_pesado: "Heavy",
      segment_leve_hint: "Passenger cars and similar (light).",
      segment_recreativo_hint: "ATV / UTV and recreational.",
      segment_pesado_hint: "Trucks and buses.",
      nav_trajectories: "Trajectories",
      nav_models: "Brands", page_models: "Brands & models — Paraguay EV Market",
      models_badge: "Brand · model · powertrain",
      models_title: "Sales by brand, model and powertrain",
      models_lead: "Imported units by brand and model (light vehicles and pickups). Each row shows BEV, PHEV, HEV, mild or ICE.",
      models_empty: "Brand and model detail is not available yet.",
      models_empty_filter: "No rows for these filters.",
      models_period: "Month", models_col_brand: "Brand", models_col_model: "Model", models_col_pt: "Powertrain",
      models_view_general: "Totals", models_view_brand: "By brand", models_view_model: "By model",
      models_all_brands: "All brands", models_all_models: "All models",
      models_rows: "{n} rows", models_foot: "Source: Paraguay Customs · brand and model detail (light vehicles and pickups).",
      card_models: "Brands & models", card_models_desc: "Volumes by brand, model and powertrain (BEV / PHEV / HEV / ICE).",
      next_models: "Brands →", prev_models: "← Brands",

      page_trajectories: "Trajectories — Paraguay EV Market",
      next_trajectories: "Trajectories →",
      prev_trajectories: "← Trajectories",
      next_chargers: "Chargers →",
      card_traj: "Trajectories",
      card_traj_desc: "Illustrative projection and 12-month accumulated share.",
      traj_badge: "Trend",
      traj_title: "Adoption trajectories",
      traj_lead: "Curve fitted to the observed monthly share, plus the 12-month accumulated share. With a short series, the projection is illustrative.",
      traj_disclaimer: "The dashed line extends the observed trend. It is illustrative, not a forecast.",
      traj_extra_title: "Projection: BEV / PHEV / HEV / ICE share",
      traj_extra_lead: "Dots = observed months. Solid line = fit. Dashed line = projection if the trend continued.",
      traj_ttm_title: "12-month accumulated share",
      traj_ttm_lead: "Each point adds up the last 12 months (or all available months, if fewer).",
      traj_note: "ICE = total − BEV − PHEV − HEV − mild.",
      traj_axis_share: "% of total (fitted)",
      traj_ttm_axis: "12-month accumulated",
      traj_ttm_axis_partial: "Accumulated (under 12 months)",
      traj_fit: "fit",
      traj_proj: "projection",
      traj_window: "window",
      traj_months_short: "months",
      traj_observed: "Observed",
      traj_ice_below50_annotation: "ICE < 50% · {period}",
      traj_ice_below50_caption: "The fit places ICE below 50% of imports in {period}.",
      traj_ice_below50_unreached: "ICE does not fall below 50% within the projected window.",
      traj_not_forecast: "not a forecast",
      traj_ttm_partial_label: "Under 12 months available",
      traj_ttm_full_label: "12-month accumulated",
      traj_available: "available"
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
      document.querySelectorAll("[data-i18n^='variant_'], [data-i18n^='segment_'], [data-i18n^='traj_'], [data-i18n^='models_'], [data-i18n='nav_trajectories'], [data-i18n='nav_models'], [data-i18n='page_trajectories'], [data-i18n='page_models'], [data-i18n='card_traj'], [data-i18n='card_traj_desc'], [data-i18n='card_models'], [data-i18n='card_models_desc'], [data-i18n='next_trajectories'], [data-i18n='prev_trajectories'], [data-i18n='next_chargers'], [data-i18n='next_models'], [data-i18n='prev_models']").forEach(function (el) {
        el.innerHTML = global.PYEV.t(el.dataset.i18n);
      });
      document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
        el.dataset.i18nAttr.split(":").forEach(function (item) {
          var pair = item.split(":");
          if (pair.length >= 2) el.setAttribute(pair[0], global.PYEV.t(pair.slice(1).join(":")));
        });
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
