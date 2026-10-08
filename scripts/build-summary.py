#!/usr/bin/env python3
"""Build data/summary.json, the only file the Inicio page reads.

Run from the repository root after any data change:

    python3 scripts/build-summary.py

Inputs (same sources and rules as the other pages):
  * data/models/manifest.json + data/models/YYYY-MM.csv (fallback:
    data/Paraguay_models.csv) -> "0 km" figures (condicion = nuevo) and the
    Top 5 model lists. Only variant=LightVehicles, segmento=leve.
  * data/Paraguay.csv (LightVehicles, leve) -> "Nuevos y usados" figures.
  * data/chargers-dc.csv -> charger counts for the Carga "Público" mode only:
    access == "público" AND status == "ativo" (public and working; maintenance,
    partial maintenance and "em breve" are left out). A location is one row,
    connectors are n_dc_plugs summed, split by type from connectors_dc. Keep
    this in sync with PUBLIC_STATUS / isPublicOpen() and parseConnectorCounts()
    in js/chargers.js.

Windows: "ytd" = January through the latest month of the latest year with
data; "prev" = the same months one year earlier; "last12" = the 12 months up
to the latest month; "prev12" = the 12 months before that.
"""
import csv
import json
import re
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
PTS = ["BEV", "PHEV", "HEV", "OTHERS", "ICE"]
PT_ORDER = ["BEV", "PHEV", "HEV", "ICE", "OTHERS"]  # tie-break order used by js/models.js
TOP_N = 5


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def num(v):
    try:
        return float(str(v).strip() or 0)
    except ValueError:
        return 0.0


def load_model_rows():
    manifest = DATA / "models" / "manifest.json"
    rows = []
    if manifest.exists():
        data = json.loads(manifest.read_text(encoding="utf-8"))
        files = data.get("files", data) if isinstance(data, dict) else data
        for name in files:
            name = str(name if str(name).endswith(".csv") else f"{name}.csv")
            path = DATA / "models" / name
            if path.exists():
                rows.extend(read_csv(path))
    if not rows:
        rows = read_csv(DATA / "Paraguay_models.csv")
    out = []
    for r in rows:
        if (r.get("variant") or "").strip() != "LightVehicles":
            continue
        if (r.get("segmento") or "").strip() != "leve":
            continue
        period = (r.get("period") or "").strip()
        if not re.match(r"^\d{4}-\d{2}$", period):
            continue
        pt = (r.get("powertrain") or "").strip().upper()
        out.append({
            "period": period,
            "marca": (r.get("marca") or "").strip(),
            "modelo": (r.get("modelo") or "").strip(),
            "powertrain": pt if pt in PTS else "OTHERS",
            "condicion": (r.get("condicion") or "").strip().lower(),
            "units": num(r.get("units")),
        })
    return out


def market_from_models(rows):
    by = defaultdict(lambda: {k: 0.0 for k in PTS + ["TOTAL"]})
    for r in rows:
        m = by[r["period"]]
        m[r["powertrain"]] += r["units"]
        m["TOTAL"] += r["units"]
    return dict(by)


def market_from_paraguay():
    by = {}
    for r in read_csv(DATA / "Paraguay.csv"):
        if r.get("variant") != "LightVehicles" or (r.get("segmento") or "").strip() != "leve":
            continue
        by[r["period"]] = {k: num(r.get(k)) for k in PTS + ["TOTAL"]}
    return by


def shift(period, months):
    y, m = map(int, period.split("-"))
    i = y * 12 + (m - 1) + months
    return f"{i // 12:04d}-{i % 12 + 1:02d}"


def window_sum(market, periods):
    tot = {k: 0 for k in PTS + ["TOTAL"]}
    present = []
    for p in periods:
        if p in market:
            present.append(p)
            for k in tot:
                tot[k] += market[p][k]
    return {k: int(round(v)) for k, v in tot.items()}, present


def top_models(rows, periods, pts):
    pset = set(periods)
    agg = {}
    for r in rows:
        if r["period"] not in pset or r["powertrain"] not in pts:
            continue
        key = (r["marca"], r["modelo"], r["powertrain"])
        agg[key] = agg.get(key, 0) + r["units"]
    items = [
        {"marca": k[0], "modelo": k[1], "powertrain": k[2], "label": f"{k[0]} {k[1]}", "units": int(round(v))}
        for k, v in agg.items()
    ]
    items.sort(key=lambda x: (-x["units"], x["label"], PT_ORDER.index(x["powertrain"]) if x["powertrain"] in PT_ORDER else 9))
    return items[:TOP_N]


def build_condition(market, model_rows, latest):
    year = latest[:4]
    ytd_months = [f"{year}-{m:02d}" for m in range(1, int(latest[5:]) + 1)]
    prev_months = [shift(p, -12) for p in ytd_months]
    last12 = [shift(latest, -i) for i in range(11, -1, -1)]
    prev12 = [shift(p, -12) for p in last12]
    ytd, ytd_present = window_sum(market, ytd_months)
    prev, prev_present = window_sum(market, prev_months)
    w12, _ = window_sum(market, last12)
    p12, p12_present = window_sum(market, prev12)
    monthly = []
    for p in last12:
        if p not in market:
            continue
        m = market[p]
        monthly.append({"period": p, "BEV": int(round(m["BEV"])), "PHEV": int(round(m["PHEV"])), "TOTAL": int(round(m["TOTAL"]))})
    return {
        "ytd": dict(ytd, months=ytd_present),
        "prev": dict(prev, months=prev_present),
        "last12": dict(w12, months=[p for p in last12 if p in market]),
        "prev12": dict(p12, months=p12_present),
        "monthly": monthly,
        "top": {
            "BEV": top_models(model_rows, ytd_months, {"BEV"}),
            "PHEV": top_models(model_rows, ytd_months, {"PHEV"}),
            "NONPLUG": top_models(model_rows, ytd_months, {"HEV", "OTHERS"}),
        },
    }


# Same rule as js/chargers.js (PUBLIC_STATUS, isPublicOpen): only these statuses
# of an access == "público" row count as "Público" on Carga.
PUBLIC_STATUS = {"ativo": True, "em manutenção": False, "parcialmente em manutenção": False, "em breve": False}
CONNECTOR_RE = re.compile(r"([^,×x]+)[×x](\d+)", re.I)


def is_public_open(r):
    return (r.get("access") or "").strip() == "público" and PUBLIC_STATUS.get((r.get("status") or "").strip()) is True


def connector_types(rows):
    """Same parsing as parseConnectorCounts() in js/chargers.js."""
    out = {"CCS": 0, "CHAdeMO": 0, "GBT": 0}
    for r in rows:
        for m in CONNECTOR_RE.finditer(r.get("connectors_dc") or ""):
            raw = re.sub(r"\s+", " ", m.group(1).strip().upper())
            n = int(m.group(2) or 0)
            if not n:
                continue
            if "CHADEMO" in raw:
                out["CHAdeMO"] += n
            elif "GB" in raw:
                out["GBT"] += n
            elif "CCS" in raw:
                out["CCS"] += n
    return out


def charger_counts():
    rows = read_csv(DATA / "chargers-dc.csv")
    rows = [r for r in rows if num(r.get("lat")) and num(r.get("lon"))]
    pub = [r for r in rows if is_public_open(r)]
    return {
        "public": {
            "sites": len(pub),
            "plugs": int(sum(num(r.get("n_dc_plugs")) for r in pub)),
            "types": connector_types(pub),
        }
    }


def main():
    models = load_model_rows()
    nuevo_rows = [r for r in models if r["condicion"] == "nuevo"]
    market_new = market_from_models(nuevo_rows)
    market_all = market_from_paraguay()
    latest = max(market_new) if market_new else max(market_all)
    summary = {
        "generated": datetime.now(timezone(timedelta(hours=-3))).isoformat(timespec="seconds"),
        "cutoff": latest,
        "conditions": {
            "nuevo": build_condition(market_new, nuevo_rows, latest),
            "all": build_condition(market_all, models, latest),
        },
        "chargers": charger_counts(),
    }
    out = DATA / "summary.json"
    # Keep the old timestamp when nothing else changed, so re-runs without new
    # data leave the file untouched (no empty commits from CI).
    if out.exists():
        try:
            old = json.loads(out.read_text(encoding="utf-8"))
            if {k: v for k, v in old.items() if k != "generated"} == {k: v for k, v in summary.items() if k != "generated"}:
                print(f"{out.relative_to(ROOT)} unchanged")
                return
        except ValueError:
            pass
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    n = summary["conditions"]["nuevo"]["ytd"]
    print(f"wrote {out.relative_to(ROOT)} · cutoff {latest} · 0 km YTD total {n['TOTAL']} BEV {n['BEV']}")


if __name__ == "__main__":
    main()
