# Fuentes — Cargadores DC Paraguay

## Origen

- **Inventario:** recolección PlugShare (Paraguay), deduplicada por Elon
- **Archivo fuente:** `desduplicados.csv` (corte **2026-10-02**, hora PY)
- **Publicado en el sitio como:** [`data/chargers-dc.csv`](../data/chargers-dc.csv)

## Alcance

| Incluye | Excluye |
|---------|---------|
| Locais com plugs **DC** (CCS2, CHAdeMO, GB/T) | Só-AC (`excluidos_AC.csv`) |
| Público, restrito e residencial/privado (marcados) | NACS / Tesla (0 no corte) |

**Totales del corte:** 73 locais DC · 147 plugs DC.

## Potencia (kW)

La potencia es **casi siempre estimada**:

| `kw_source` | Significado |
|-------------|-------------|
| estimado (check-ins) | Derivado de check-ins PlugShare (con filtro de outliers) |
| inferido (nome/desc) | Leído del nombre o descripción del local |
| PlugShare (outlet) | Valor declarado en el outlet PlugShare |
| desconocido | Sin dato usable |

El sitio muestra `kw_max`, `power_band` y `kw_source`. No tratar kW como medición certificada.

## Operadoras / redes

Campo `operator` consolida red PlugShare + inferencia del nombre. Algunas etiquetas
corresponden a redes vistas en Brasil u otras plazas; **no implica** que operen
formalmente en Paraguay. Preferir el nombre del local + enlace PlugShare.

## Acceso

- **público** — uso general (filtro por defecto del mapa)
- **restrito** — clientes / horario comercial / etc.
- **residencial/privado** — no es red pública

## Actualización

Reemplazar `data/chargers-dc.csv` cuando haya un nuevo corte deduplicado.
No inventar coordenadas ni kW.
