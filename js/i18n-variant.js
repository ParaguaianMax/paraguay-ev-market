(function (global) {
  const extra = {
    es: {
      variant_label: "Serie",
      variant_whole: "Automóviles y similares",
      variant_light: "Vehículos livianos + camionetas",
      variant_whole_hint: "Automóviles HS 8703 limpio (sin golf/ATV).",
      variant_light_hint: "HS 8703 limpio + pickups livianos HS 8704 (totales combinados).",
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
      models_lead: "Unidades importadas desglosadas por marca y modelo. Cada fila y barra indica claramente si es BEV, PHEV, HEV, ICE u OTHERS.",
      models_empty: "Todavía no hay el detalle por marca/modelo. Cuando se publique <code>data/Paraguay_models.csv</code>, esta página se completa sola.",
      models_empty_filter: "Sin filas para estos filtros.",
      models_period: "Mes", models_col_brand: "Marca", models_col_model: "Modelo", models_col_pt: "Motorización",
      models_view_general: "Totales", models_view_brand: "Por marca", models_view_model: "Por modelo",
      models_all_brands: "Todas las marcas", models_all_models: "Todos los modelos",
      models_rows: "{n} filas", models_foot: "Fuente: Aduana PY · detalle marca/modelo. Incluye vehículos nuevos y usados.",
      card_models: "Marcas y modelos", card_models_desc: "Volúmenes por marca, modelo y motorización (BEV / PHEV / HEV / ICE).",
      next_models: "Marcas →", prev_models: "← Marcas",
      page_trajectories: "Trayectorias — Paraguay EV Market",
      next_trajectories: "Trayectorias →",
      prev_trajectories: "← Trayectorias",
      next_chargers: "Cargadores →",
      card_traj: "Trayectorias",
      card_traj_desc: "Extrapolación tipo S-curve y participación acumulada (TTM) al estilo Gallery.",
      traj_badge: "S-curve · TTM",
      traj_title: "Trayectorias de adopción",
      traj_lead: "Curva ajustada (estilo Gallery) sobre la participación mensual observada, más el desglose acumulado en ventana móvil. Con una serie corta la proyección es ilustrativa — no un pronóstico firme.",
      traj_disclaimer: "Serie corta · el ajuste logístico (logit-lineal) usa solo los meses publicados; la línea punteada es una extrapolación ilustrativa, no un pronóstico firme.",
      traj_extra_title: "Extrapolación — participación BEV / PHEV / HEV / ICE",
      traj_extra_lead: "Puntos = meses observados. Línea continua = ajuste sobre lo observado. Línea punteada = proyección si la tendencia logit se mantuviera.",
      traj_ttm_title: "Participación acumulada (ventana móvil)",
      traj_ttm_lead: "Cuando hay menos de 12 meses, cada punto usa todos los meses disponibles hasta esa fecha (ventana incompleta). Con 12+ meses pasa a TTM de 12 meses.",
      traj_note: "No se inventan meses históricos. Los totales vienen de data/Paraguay.csv (Aduana PY). ICE = total − BEV − PHEV − HEV − OTHERS.",
      traj_axis_share: "% del total (ajustado)",
      traj_ttm_axis: "Participación TTM 12 meses",
      traj_ttm_axis_partial: "Participación acumulada (ventana incompleta)",
      traj_fit: "ajuste",
      traj_proj: "proyección",
      traj_window: "ventana",
      traj_months_short: "meses",
      traj_observed: "Observado",
      traj_not_forecast: "no es pronóstico firme",
      traj_ttm_partial_label: "Ventana incompleta (menos de 12 meses)",
      traj_ttm_full_label: "TTM 12 meses",
      traj_available: "disponibles"
    },
    pt: {
      variant_label: "Série",
      variant_whole: "Automóveis e similares",
      variant_light: "Veículos leves + picapes",
      variant_whole_hint: "Automóveis HS 8703 limpo (sem golf/ATV).",
      variant_light_hint: "HS 8703 limpo + pickups leves HS 8704 (totais combinados).",
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
      models_lead: "Unidades importadas detalhadas por marca e modelo. Cada linha e barra indica claramente se é BEV, PHEV, HEV, ICE ou OTHERS.",
      models_empty: "Ainda não há o detalhe por marca/modelo. Quando for publicado <code>data/Paraguay_models.csv</code>, esta página se completa sozinha.",
      models_empty_filter: "Sem linhas para estes filtros.",
      models_period: "Mês", models_col_brand: "Marca", models_col_model: "Modelo", models_col_pt: "Motorização",
      models_view_general: "Totais", models_view_brand: "Por marca", models_view_model: "Por modelo",
      models_all_brands: "Todas as marcas", models_all_models: "Todos os modelos",
      models_rows: "{n} linhas", models_foot: "Fonte: Aduana PY · detalhe marca/modelo. Inclui veículos novos e usados.",
      card_models: "Marcas e modelos", card_models_desc: "Volumes por marca, modelo e motorização (BEV / PHEV / HEV / ICE).",
      next_models: "Marcas →", prev_models: "← Marcas",
      page_trajectories: "Trajetórias — Paraguay EV Market",
      next_trajectories: "Trajetórias →",
      prev_trajectories: "← Trajetórias",
      next_chargers: "Carregadores →",
      card_traj: "Trajetórias",
      card_traj_desc: "Extrapolação tipo S-curve e participação acumulada (TTM) no estilo Gallery.",
      traj_badge: "S-curve · TTM",
      traj_title: "Trajetórias de adoção",
      traj_lead: "Curva ajustada (estilo Gallery) sobre a participação mensal observada, mais o detalhamento acumulado em janela móvel. Com série curta a projeção é ilustrativa — não é um prognóstico firme.",
      traj_disclaimer: "Série curta · o ajuste logístico (logit-linear) usa só os meses publicados; a linha tracejada é uma extrapolação ilustrativa, não um prognóstico firme.",
      traj_extra_title: "Extrapolação — participação BEV / PHEV / HEV / ICE",
      traj_extra_lead: "Pontos = meses observados. Linha contínua = ajuste sobre o observado. Linha tracejada = projeção se a tendência logit se mantiver.",
      traj_ttm_title: "Participação acumulada (janela móvel)",
      traj_ttm_lead: "Com menos de 12 meses, cada ponto usa todos os meses disponíveis até aquela data (janela incompleta). Com 12+ meses passa a TTM de 12 meses.",
      traj_note: "Não se inventam meses históricos. Os totais vêm de data/Paraguay.csv (Aduana PY). ICE = total − BEV − PHEV − HEV − OTHERS.",
      traj_axis_share: "% do total (ajustado)",
      traj_ttm_axis: "Participação TTM 12 meses",
      traj_ttm_axis_partial: "Participação acumulada (janela incompleta)",
      traj_fit: "ajuste",
      traj_proj: "projeção",
      traj_window: "janela",
      traj_months_short: "meses",
      traj_observed: "Observado",
      traj_not_forecast: "não é prognóstico firme",
      traj_ttm_partial_label: "Janela incompleta (menos de 12 meses)",
      traj_ttm_full_label: "TTM 12 meses",
      traj_available: "disponíveis"
    },
    en: {
      variant_label: "Series",
      variant_whole: "Passenger cars",
      variant_light: "Light vehicles + pickups",
      variant_whole_hint: "Clean HS 8703 cars (no golf/ATV).",
      variant_light_hint: "Clean HS 8703 + light HS 8704 pickups (combined totals).",
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
      models_lead: "Imported units broken down by brand and model. Every row and bar clearly shows whether it is BEV, PHEV, HEV, ICE or OTHERS.",
      models_empty: "Brand/model detail is not published yet. When <code>data/Paraguay_models.csv</code> goes live, this page fills in automatically.",
      models_empty_filter: "No rows for these filters.",
      models_period: "Month", models_col_brand: "Brand", models_col_model: "Model", models_col_pt: "Powertrain",
      models_view_general: "Totals", models_view_brand: "By brand", models_view_model: "By model",
      models_all_brands: "All brands", models_all_models: "All models",
      models_rows: "{n} rows", models_foot: "Source: Paraguay Customs · brand/model detail. Includes new and used vehicles.",
      card_models: "Brands & models", card_models_desc: "Volumes by brand, model and powertrain (BEV / PHEV / HEV / ICE).",
      next_models: "Brands →", prev_models: "← Brands",
      page_trajectories: "Trajectories — Paraguay EV Market",
      next_trajectories: "Trajectories →",
      prev_trajectories: "← Trajectories",
      next_chargers: "Chargers →",
      card_traj: "Trajectories",
      card_traj_desc: "S-curve-style extrapolation and rolling accumulated share (TTM), Gallery-inspired.",
      traj_badge: "S-curve · TTM",
      traj_title: "Adoption trajectories",
      traj_lead: "Gallery-style fitted curve on observed monthly shares, plus a rolling accumulated split. With a short series the projection is illustrative — not a firm forecast.",
      traj_disclaimer: "Short series · the logistic (linear-in-logit) fit uses only published months; the dashed line is an illustrative extrapolation, not a firm forecast.",
      traj_extra_title: "Extrapolation — BEV / PHEV / HEV / ICE share",
      traj_extra_lead: "Dots = observed months. Solid line = fit on observations. Dashed line = projection if the logit trend continued.",
      traj_ttm_title: "Accumulated share (rolling window)",
      traj_ttm_lead: "With fewer than 12 months, each point uses all months available up to that date (incomplete window). With 12+ months it becomes a true 12-month TTM.",
      traj_note: "No invented historical months. Totals come from data/Paraguay.csv (Paraguay Customs). ICE = total − BEV − PHEV − HEV − OTHERS.",
      traj_axis_share: "% of total (fitted)",
      traj_ttm_axis: "12-month trailing share",
      traj_ttm_axis_partial: "Accumulated share (incomplete window)",
      traj_fit: "fit",
      traj_proj: "projection",
      traj_window: "window",
      traj_months_short: "months",
      traj_observed: "Observed",
      traj_not_forecast: "not a firm forecast",
      traj_ttm_partial_label: "Incomplete window (under 12 months)",
      traj_ttm_full_label: "12-month TTM",
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
