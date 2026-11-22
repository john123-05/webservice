#!/usr/bin/env python3
"""Übernimmt Übersetzungen aus scripts/english/tr/*.tsv (Zeilen „id|Englisch“, id aus missing.json)
in die Übersetzungsliste en.json. Danach build_english.py --missing erneut laufen lassen."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
missing = {m["id"]: m["de"] for m in json.loads((HERE / "missing.json").read_text())}
entries = json.loads((HERE / "en.json").read_text()) if (HERE / "en.json").exists() else []
known = {e["de"] for e in entries}
added = unknown = 0
for tsv in sorted((HERE / "tr").glob("*.tsv")):
    for line in tsv.read_text().splitlines():
        if not line.strip():
            continue
        mid, en = line.split("|", 1)
        de = missing.get(mid)
        if de is None:
            unknown += 1
            continue
        if de in known:
            continue
        entries.append({"de": de, "en": en.strip()})
        known.add(de)
        added += 1
(HERE / "en.json").write_text(json.dumps(entries, ensure_ascii=False, indent=1) + "\n")
print(f"{added} neu, {unknown} ids nicht (mehr) offen, {len(entries)} gesamt")
