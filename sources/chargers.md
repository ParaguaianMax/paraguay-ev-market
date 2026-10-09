# Datos de cargadores DC en Paraguay

## Origen

Inventario de puntos de carga publicado en PlugShare y revisado para evitar duplicados. El corte utilizado es del **2 de octubre de 2026** (hora de Paraguay). El sitio publica el conjunto consolidado en [`data/chargers-dc.csv`](../data/chargers-dc.csv).

## Alcance

Se incluyen ubicaciones con conectores **DC** (CCS2, CHAdeMO y GB/T), tanto públicas como restringidas o residenciales/privadas, claramente identificadas. Este corte no registra conectores NACS/Tesla.

**Totales del corte:** 74 ubicaciones DC · 145 conectores DC (CCS2 92 · CHAdeMO 28 · GB/T 25).

**Agregado el 9 de octubre de 2026:** Pyae Azotey Parador Fleitas (PlugShare 2277261, Azotey, Concepción), con 1 CCS2 y 1 GB/T de 60 kW (potencia según la descripción del local). Se cargó a mano porque la API de PlugShare no respondía ese día. Los conectores fueron confirmados por el equipo y la coordenada es aproximada (ubicación del Parador Fleitas).

## Potencia (kW)

La potencia es orientativa: cuando PlugShare no publica un valor, se estima a partir de la información disponible en el punto (check-ins, nombre/descripción) o se confirma manualmente. No debe interpretarse como una medición certificada.

| `kw_source` | Significado |
|-------------|-------------|
| estimado (check-ins) | Derivado de check-ins PlugShare (con filtro de outliers) |
| inferido (nome/desc) | Leído del nombre o descripción del local |
| PlugShare (outlet) | Valor declarado en el outlet PlugShare |
| Max (confirmação) | Confirmado manualmente |
| desconocido | Sin dato usable |

## Operadoras y acceso

Los nombres de red combinan la información visible en PlugShare con el nombre del local. El acceso se clasifica como público, restringido o residencial/privado. Para consultar el punto original, cada registro enlaza con PlugShare cuando existe el enlace.

## Actualización

El inventario puede actualizarse cuando haya un nuevo corte revisado. Las coordenadas y potencias sin respaldo no se completan por inferencia.
