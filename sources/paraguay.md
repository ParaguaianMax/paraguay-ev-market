# Datos del mercado automotor de Paraguay

## Origen

- **Portal:** [datosabiertos.aduana.gov.py](https://datosabiertos.aduana.gov.py)
- **Datos:** archivos mensuales de importaciones a nivel de ítem
- **Publicación:** mes a mes en [`data/Paraguay.csv`](../data/Paraguay.csv)

## Variantes (`variant`)

Header del CSV (sin cambios):

`period,time_interval,variant,source,BEV,PHEV,HEV,ICE,OTHERS,TOTAL,notes`

| Valor | Significado |
|-------|-------------|
| `Whole` | HS **8703** limpio: automóviles y demás vehículos para personas, **sin** golf carts / ATV (8703.10 y similares). Una fila por mes. |
| `LightVehicles` | Totales **combinados** del mes: HS 8703 limpio **+** pickups livianos HS **8704**. Una sola fila por mes (BEV/PHEV/HEV/ICE/OTHERS/TOTAL ya mezclados). No se publican dos filas separadas 8703/8704. |

El sitio carga todas las filas y filtra por la variante seleccionada (selector en Inicio, Participación y Volúmenes; preferencia en `localStorage`). Por defecto usa `LightVehicles` si existe para el último mes; si no, `Whole`.

## Categorías

| Código | Significado |
|--------|-------------|
| BEV | Eléctrico puro (battery electric) |
| PHEV | Híbrido enchufable (plug-in) |
| HEV | Híbrido convencional (no enchufable) |
| OTHERS | Mild hybrid / otros electrificados |
| ICE | TOTAL menos las categorías electrificadas |
| TOTAL | Total de la variante del mes (nuevos y usados) |

## Meses publicados (`variant=Whole`)

| period | TOTAL | Electrificados | % electr. |
|--------|------:|---------------:|----------:|
| 2026-08 | 27 916 | 2 182 | 7,8 % |
| 2026-09 | 39 666 | 2 220 | 5,6 % |

La serie `LightVehicles` se agrega cuando esté disponible (sin inventar filas). La serie se amplía cuando se publica un nuevo archivo oficial del mes.

## Datos del sitio

Los números agregados están en [`data/Paraguay.csv`](../data/Paraguay.csv). Este sitio es una visualización independiente y no una publicación oficial de la Aduana.
