# Fuentes — Paraguay

## Origen

- **Portal:** [datosabiertos.aduana.gov.py](https://datosabiertos.aduana.gov.py)
- **Archivos:** CSV mensuales *Nivel Item* (importaciones)
- **Filtro:** partida arancelaria **HS 8703** (automóviles y demás vehículos principalmente para transporte de personas)

## Categorías (modelo / NCM)

| Código en CSV | Significado |
|---------------|-------------|
| BEV | Eléctrico puro (battery electric) |
| PHEV | Híbrido enchufable (plug-in) |
| HEV | Híbrido convencional (no enchufable) |
| OTHERS | Mild hybrid / residual electrificado |
| ICE | TOTAL − (BEV+PHEV+HEV+OTHERS) |
| TOTAL | Todas las unidades HS 8703 del mes (nuevo + usado) |

## Meses publicados en este repo

| period | TOTAL | Electrificados | % electr. |
|--------|------:|---------------:|----------:|
| 2026-08 | 27 916 | 2 182 | 7,8 % |
| 2026-09 | 39 666 | 2 220 | 5,6 % |

Verificación: Aug 214+613+1343+12+25734 = 27916; Sep 321+481+1413+5+37446 = 39666.

## CSV del sitio

Los números agregados viven en [`data/Paraguay.csv`](../data/Paraguay.csv).
No inventar meses: solo agregar filas cuando exista el CSV oficial del mes.

## Licencia de uso de datos

Datos públicos de la Aduana Nacional del Paraguay. Este sitio es un agregado
independiente para visualización; no es publicación oficial de la Aduana.
