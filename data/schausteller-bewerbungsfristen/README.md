# Schausteller-Bewerbungsfristen

`master.json` ist die Source of Truth. Recherche-Ergebnisse werden als einzelne
Batch-Dateien in `batches/` abgelegt und anschließend konsolidiert.

## Manueller Research-Lauf

1. Mit `npm run deadlines:create-wave -- --wave-id de-wave-001` automatisch
   16 getrennte Bundesland-Jobs erzeugen. Optional begrenzt
   `--max-results 25` die erwartete Zielgröße pro Agent.
2. Den Job an einen Research-Agenten geben. Die verbindliche Aufgabenbeschreibung
   steht in `RESEARCH_AGENT_PROMPT.md`.
3. Das Ergebnis als `batches/<batch_id>.json` ablegen.
4. `npm run deadlines:build` ausführen.
5. `npm test` ausführen und die Änderungen an `master.json`, `web.json`,
   `export.csv` und `research-log.json` prüfen.

## Statusregeln

- `verified`: Offizielle Quelle und Frist sind bestätigt; die Kerndaten sind vollständig.
- `partial`: Offizielle Quelle und Frist sind bestätigt; Zusatzdaten fehlen noch.
- `needs_review`: Kandidat ist noch nicht veröffentlichbar. Diese Einträge werden
  weder in `web.json` noch in Nutzer-Workflows übernommen.

Sekundäre Quellen und Such-Snippets dürfen nur zur Entdeckung verwendet werden.
Als `source_url` ist ausschließlich eine offizielle Stadt-, Behörden- oder
Veranstalterquelle zulässig. Fehlende Werte bleiben leer und werden nicht geraten.

## Generierte Dateien

- `master.json`: kanonischer, deduplizierter Gesamtdatenbestand
- `web.json`: nur `verified` und `partial`, für die Website
- `export.csv`: flacher Export mit stabiler Spaltenreihenfolge für Google Sheets
- `research-log.json`: verworfene und noch zu prüfende Kandidaten aus allen Batches
- `excluded-entries.json`: historische IDs, die durch präzisere Einzeleinträge ersetzt wurden

Der Schlüssel für die Deduplizierung ist normalisiert
`event_name + city + application_deadline_iso`. Bei einem Konflikt gewinnt zuerst
der höhere Qualitätsstatus und danach die jüngere Verifizierung; leere Zusatzfelder
werden aus dem zweiten Eintrag ergänzt.
