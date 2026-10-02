# Marca QA — Paraguay models

**Updated:** 2026-10-02 (America/Asunción)  
**Map:** (v2 includes CF MOTO→CFMOTO)  [`data/marca_aliases.json`](../data/marca_aliases.yaml) (v1) + JSON twin  
**Pipeline:** `marca_normalize.canonical_marca` used by `normalize_marca` in `build_report_2026_YTD.py`, `write_site_models_csv` in `build_report_month.py`, and `export_volume.py`.

## Rule
1. Auto-apply **only** aliases in the versioned map.
2. Before each push: run similarity scan; new suspicious groups → this file + proposed map entries.
3. Never invent dubious merges (BYD≠BYTON, MITSUBISHI≠MITSUBISHI FUSO, etc.).

## Mercedes (ene–sep 2026) before → after
| raw | units before |
|---|---:|
| `MERCEDES BENZ` | 4078 |
| `MERCEDES-BENZ` | 268 |
| `MERCEDEZ BENZ` | 28 |
| `MERCEDES - BENZ` | 22 |
| `MERCEDES` | 14 |
| `MERCEDES BENEZ` | 1 |
| `MERECEDES BENZ` | 7 |
| **sum** | **4418** |

After canonical: **`MERCEDES-BENZ` = 4418** (single marca).

## Applied merges this republish (units moved)

| alias | marca_oficial | units |
|---|---|---:|
| `MERCEDES BENZ` | `MERCEDES-BENZ` | 4078 |
| `S/M` | `SIN MARCA` | 214 |
| `MERCEDEZ BENZ` | `MERCEDES-BENZ` | 28 |
| `MERCEDES - BENZ` | `MERCEDES-BENZ` | 22 |
| `` | `SIN MARCA` | 14 |
| `MERCEDES` | `MERCEDES-BENZ` | 14 |
| `VOLSKWAGEN` | `VOLKSWAGEN` | 14 |
| `TOYOYA` | `TOYOTA` | 8 |
| `BMW X1` | `BMW` | 7 |
| `MERECEDES BENZ` | `MERCEDES-BENZ` | 7 |
| `E-Z-GO` | `EZGO` | 7 |
| `MITSUBUSHI` | `MITSUBISHI` | 7 |
| `TOTOTA` | `TOYOTA` | 7 |
| `ZUZUKI` | `SUZUKI` | 7 |
| `DOGDE` | `DODGE` | 7 |
| `MINI COOPER` | `MINI` | 7 |
| `TOTOYA` | `TOYOTA` | 7 |
| `TOYATA` | `TOYOTA` | 7 |
| `HYUNDIA` | `HYUNDAI` | 7 |
| `KENTO` | `KENTON` | 7 |
| `MITSUBISHII` | `MITSUBISHI` | 7 |
| `HUYNDAI` | `HYUNDAI` | 7 |
| `DEEPAL SO5` | `DEEPAL` | 3 |
| `.` | `SIN MARCA` | 2 |
| `S/N` | `SIN MARCA` | 1 |
| `AVATR 11` | `AVATR` | 1 |
| `BUILD YOUR DREAMS` | `BYD` | 1 |
| `BUILD YOUR DREAMS.` | `BYD` | 1 |
| `DODGE CHARGER` | `DODGE` | 1 |
| `VOLSWAGEN` | `VOLKSWAGEN` | 1 |
| `MERCEDES BENEZ` | `MERCEDES-BENZ` | 1 |
| `-` | `SIN MARCA` | 1 |
| `CHANGAM` | `CHANGAN` | 1 |
| `CF MOTO` | `CFMOTO` | 7 |

## Proposed (NOT auto-applied)

| from | to | units | reason |
|---|---|---:|---|
| `RANGE ROVER` | `LAND ROVER` | 7 | RANGE ROVER is a Land Rover product line; often declared as marca. Confirm before merge. |
| `ROVER` | `LAND ROVER` | 7 | Ambiguous (classic Rover vs Land Rover). Low volume; review rows before merge. |
| `FUSO` | `MITSUBISHI FUSO` | 12 | Likely commercial truck brand; keep separate from MITSUBISHI passenger. Merge FUSO↔MITSUBISHI FUSO only. |
| `SPORTAGE` | `KIA` | 7 | Model name used as marca (Kia Sportage). Prefer fixing modelo parser; brand merge is secondary. |
| `VOYAH DREAMER` | `VOYAH` | 8 | Model leaked into marca field. |
| `MITSUBISHI FUSO` | `None` | 40 | Do NOT merge into MITSUBISHI — distinct commercial brand/line. |

## Suspicious near-matches still distinct after map

| key_a | canon_a | key_b | canon_b | ratio |
|---|---|---|---|---:|
| `CF MOTO` (7) | `CF MOTO` | `CFMOTO` (74) | `CFMOTO` | 0.92 |

## do_not_merge
See `do_not_merge` in `data/marca_aliases.json`.

## How to extend
1. Add `"ALIAS": "CANONICAL"` under `aliases` in `data/marca_aliases.json` (and mirror in `.yaml`).
2. Bump `version` / `updated`.
3. Re-run: `python3 -c "from marca_normalize import reaggregate_all_models; reaggregate_all_models()"` from `ev-paraguay/dados`.
4. Publish monthly `data/models/*.csv` (+ assemble workflow for `Paraguay_models.csv`).
