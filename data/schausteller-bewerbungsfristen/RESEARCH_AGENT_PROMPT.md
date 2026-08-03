# Auftrag für einen Research-Agenten

Bearbeite ausschließlich die übergebene Jobdefinition. Recherchiere Veranstaltungen
im angegebenen Gebiet, für die sich Schausteller, Händler, Gastronomen oder andere
Standbetreiber mit einer konkreten Frist bewerben können.

## Quellenstandard

- Suche zuerst auf offiziellen Stadt-, Behörden- und Veranstalterseiten.
- Nutze Presseartikel, Verzeichnisse und Such-Snippets nur zum Auffinden einer
  offiziellen Seite.
- Übernimm keine Frist ohne nachvollziehbare Bestätigung auf einer offiziellen Seite.
- Rate keine Ansprechpartner, Kontaktdaten, Adressen oder Termine.
- Trage das Datum der tatsächlichen Prüfung in `last_verified_at` ein.

## Pflichtausgabe

Liefere genau ein JSON-Objekt gemäß `schemas/research-batch.schema.json`:

- `entries`: strukturierte Funde im vollständigen `FristEntry`-Schema
- `rejected_candidates`: Kandidaten, die nach Prüfung verworfen wurden, jeweils mit Grund
- `review_candidates`: Kandidaten, bei denen die offizielle Frist nicht sauber bestätigt werden konnte

Verwende `verified`, wenn Quelle, Frist und Kerndaten bestätigt sind. Verwende
`partial`, wenn die offizielle Quelle und Frist bestätigt sind, aber Zusatzfelder
fehlen. Ein unsicherer Fund gehört in `review_candidates` oder als
`needs_review`-Eintrag in die Batch-Datei und darf niemals künstlich vervollständigt
werden. Schreibe nicht direkt in `master.json`, `web.json` oder die Website.
