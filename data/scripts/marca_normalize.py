"""Canonical marca normalization for Paraguay import Volume exports.

Loads versioned alias map from paraguay-ev-market/data/marca_aliases.json
(preferred) or .yaml twin. Auto-applies ONLY map aliases; use scan_suspicious()
for QA proposals before expanding the map.

Permanent QA step before every models publish.
"""
from __future__ import annotations

import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

SITE_DATA = Path('/workspace/paraguay-ev-market/data')
MAP_JSON = SITE_DATA / 'marca_aliases.json'
MAP_YAML = SITE_DATA / 'marca_aliases.yaml'
MODELS_DIR = SITE_DATA / 'models'
QA_NOTES = Path('/workspace/paraguay-ev-market/notes/marca_qa.md')

_CACHE: dict | None = None

# Fallback if map file missing (keep in sync with marca_aliases.json)
_FALLBACK_ALIASES = {
  'MERCEDES BENZ': 'MERCEDES-BENZ',
  'MERCEDES - BENZ': 'MERCEDES-BENZ',
  'MERCEDEZ BENZ': 'MERCEDES-BENZ',
  'MERECEDES BENZ': 'MERCEDES-BENZ',
  'MERCEDES BENEZ': 'MERCEDES-BENZ',
  'MERCEDES': 'MERCEDES-BENZ',
  'HUYNDAI': 'HYUNDAI',
  'HYUNDIA': 'HYUNDAI',
  'TOTOTA': 'TOYOTA',
  'TOTOYA': 'TOYOTA',
  'TOYATA': 'TOYOTA',
  'TOYOYA': 'TOYOTA',
  'MITSUBISHII': 'MITSUBISHI',
  'MITSUBUSHI': 'MITSUBISHI',
  'VOLSKWAGEN': 'VOLKSWAGEN',
  'VOLSWAGEN': 'VOLKSWAGEN',
  'ZUZUKI': 'SUZUKI',
  'CHANGAM': 'CHANGAN',
  'KENTO': 'KENTON',
  'DOGDE': 'DODGE',
  'BUILD YOUR DREAMS': 'BYD',
  'BUILD YOUR DREAMS.': 'BYD',
  'LYNK & CO': 'LYNK CO',
  'LANDROVER': 'LAND ROVER',
  'GREAT WALL': 'GREATWALL',
  'GWM': 'GREATWALL',
  'HAVAL': 'GREATWALL',
}


def _strip_accents(s: str) -> str:
  s = unicodedata.normalize('NFKD', s)
  return ''.join(c for c in s if not unicodedata.combining(c))


def similarity_key(s: str) -> str:
  """Upper, no accents; hyphen/space/dot/underscore treated as space."""
  s = _strip_accents((s or '').upper().replace('&', ' ').strip())
  s = re.sub(r'[\s\-_\./]+', ' ', s)
  return re.sub(r'\s+', ' ', s).strip()


def load_map(force: bool = False) -> dict:
  global _CACHE
  if _CACHE is not None and not force:
    return _CACHE
  if MAP_JSON.exists():
    data = json.loads(MAP_JSON.read_text(encoding='utf-8'))
  elif MAP_YAML.exists():
    # Minimal YAML: only flat "aliases:" block of "  KEY: VAL" (JSON-quoted or bare)
    text = MAP_YAML.read_text(encoding='utf-8')
    aliases = {}
    in_aliases = False
    for line in text.splitlines():
      if line.strip().startswith('aliases:'):
        in_aliases = True
        continue
      if in_aliases:
        if line and not line.startswith(' ') and not line.startswith('\t') and line.strip() and not line.strip().startswith('#'):
          in_aliases = False
          continue
        m = re.match(r'\s+(.+?):\s*(.+?)\s*$', line)
        if not m:
          continue
        k, v = m.group(1).strip(), m.group(2).strip()
        if k.startswith('#'):
          continue
        if (k.startswith('"') and k.endswith('"')) or (k.startswith("'") and k.endswith("'")):
          k = json.loads(k.replace("'", '"') if k.startswith("'") else k)
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
          v = json.loads(v.replace("'", '"') if v.startswith("'") else v)
        aliases[str(k)] = str(v)
    data = {'version': 0, 'aliases': aliases, 'proposed': []}
  else:
    data = {'version': 0, 'aliases': dict(_FALLBACK_ALIASES), 'proposed': []}
  # Index aliases by similarity_key for hyphen/space variants not listed explicitly
  aliases = {str(k).upper().strip(): str(v).strip() for k, v in (data.get('aliases') or {}).items()}
  by_sim = {}
  for alias, canon in aliases.items():
    by_sim[similarity_key(alias)] = canon
  # Canonicals map to themselves
  for canon in set(aliases.values()):
    by_sim.setdefault(similarity_key(canon), canon)
  data['_aliases_upper'] = aliases
  data['_by_sim'] = by_sim
  _CACHE = data
  return data


def reload_map() -> dict:
  return load_map(force=True)


def canonical_marca(raw: str) -> str:
  """Return canonical marca. Empty/junk → SIN MARCA when mapped; else cleaned upper."""
  m = (raw or '').upper().replace('&', ' ').strip()
  m = re.sub(r'\s+', ' ', m)
  if not m:
    return 'SIN MARCA'
  data = load_map()
  aliases = data['_aliases_upper']
  if m in aliases:
    return aliases[m]
  # Direct hyphen/space collapse via similarity key
  sk = similarity_key(m)
  if sk in data['_by_sim']:
    return data['_by_sim'][sk]
  # Legacy weak rules (also in map, kept as belt-and-suspenders)
  if m.startswith('LYNK'):
    return 'LYNK CO'
  if m in ('LANDROVER', 'LAND  ROVER'):
    return 'LAND ROVER'
  if m in ('GREAT WALL', 'GWM', 'HAVAL', 'GREAT-WALL'):
    return 'GREATWALL'
  return m


def scan_suspicious(marcas_with_units: dict[str, int], min_ratio: float = 0.82):
  """Group by similarity_key; also near-matches via SequenceMatcher.

  Returns (splits_same_key, near_pairs) where near_pairs are NOT yet resolved
  by the alias map to the same canonical.
  """
  import difflib
  data = load_map()
  by_key = defaultdict(Counter)
  for raw, u in marcas_with_units.items():
    by_key[similarity_key(raw)][raw] += u

  splits = []
  for k, forms in by_key.items():
    canons = {canonical_marca(r) for r in forms}
    if len(forms) > 1 and len(canons) > 1:
      splits.append((sum(forms.values()), k, dict(forms), canons))
    elif len(forms) > 1 and len(canons) == 1:
      # already unified by map — informational
      pass
  splits.sort(reverse=True)

  keys = sorted(by_key.keys())
  near = []
  seen = set()
  for i, a in enumerate(keys):
    if not a or len(a) < 3:
      continue
    for b in keys[i + 1:]:
      if not b or len(b) < 3:
        continue
      ratio = difflib.SequenceMatcher(None, a, b).ratio()
      ta, tb = set(a.split()), set(b.split())
      jacc = len(ta & tb) / len(ta | tb) if (ta | tb) else 0
      if ratio < min_ratio and not (jacc >= 0.5 and abs(len(a) - len(b)) <= 4 and ratio >= 0.7):
        continue
      ca = canonical_marca(next(iter(by_key[a])))
      cb = canonical_marca(next(iter(by_key[b])))
      if ca == cb:
        continue  # already same after map
      pair = tuple(sorted([a, b]))
      if pair in seen:
        continue
      seen.add(pair)
      ua = sum(by_key[a].values())
      ub = sum(by_key[b].values())
      near.append({
        'key_a': a, 'key_b': b, 'ratio': round(ratio, 3), 'jaccard': round(jacc, 3),
        'units_a': ua, 'units_b': ub,
        'canon_a': ca, 'canon_b': cb,
        'raw_a': dict(by_key[a]), 'raw_b': dict(by_key[b]),
      })
  near.sort(key=lambda x: -(x['units_a'] + x['units_b']))
  return splits, near


def reaggregate_models_file(path: Path) -> tuple[int, int, Counter]:
  """Rewrite one models CSV with canonical marcas; merge duplicate keys.

  Key: period,variant,segmento,marca,modelo,powertrain
  Returns (rows_in, rows_out, merge_counter alias→canon units)
  """
  fields = ['period', 'variant', 'segmento', 'marca', 'modelo', 'powertrain', 'units', 'source', 'notes']
  bucket = {}
  applied = Counter()
  rows_in = 0
  with path.open(newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
      rows_in += 1
      raw = row.get('marca', '')
      canon = canonical_marca(raw)
      if similarity_key(raw) != similarity_key(canon) or raw.strip().upper() != canon:
        # count units moved under alias application (including hyphen unify)
        if raw.strip().upper() != canon:
          applied[(raw, canon)] += int(float(row.get('units') or 0))
      key = (
        row.get('period', ''),
        row.get('variant', ''),
        row.get('segmento', ''),
        canon,
        row.get('modelo', '') or '(sin modelo)',
        row.get('powertrain', '') or 'ICE',
      )
      if key not in bucket:
        bucket[key] = {
          'period': key[0], 'variant': key[1], 'segmento': key[2],
          'marca': canon, 'modelo': key[4], 'powertrain': key[5],
          'units': 0,
          'source': row.get('source') or 'Aduana PY datos abiertos',
          'notes': row.get('notes') or '',
        }
      bucket[key]['units'] += int(float(row.get('units') or 0))
      # prefer non-empty notes
      if (row.get('notes') or '') and not bucket[key]['notes']:
        bucket[key]['notes'] = row['notes']

  out_rows = sorted(
    bucket.values(),
    key=lambda r: (-r['units'], r['segmento'], r['marca'], r['modelo'], r['powertrain']),
  )
  with path.open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=fields, lineterminator='\n')
    w.writeheader()
    w.writerows(out_rows)
  return rows_in, len(out_rows), applied


def assemble_paraguay_models(dest: Path | None = None) -> Path:
  dest = dest or (SITE_DATA / 'Paraguay_models.csv')
  fields = ['period', 'variant', 'segmento', 'marca', 'modelo', 'powertrain', 'units', 'source', 'notes']
  rows = []
  for p in sorted(MODELS_DIR.glob('????-??.csv')):
    with p.open(newline='', encoding='utf-8') as f:
      rows.extend(csv.DictReader(f))
  with dest.open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=fields, lineterminator='\n')
    w.writeheader()
    w.writerows(rows)
  return dest


def reaggregate_all_models() -> dict:
  reload_map()
  summary = {'files': {}, 'applied_total': Counter()}
  for p in sorted(MODELS_DIR.glob('????-??.csv')):
    rin, rout, applied = reaggregate_models_file(p)
    summary['files'][p.name] = {'rows_in': rin, 'rows_out': rout, 'applied': dict(applied)}
    summary['applied_total'].update(applied)
  assemble_paraguay_models()
  return summary
