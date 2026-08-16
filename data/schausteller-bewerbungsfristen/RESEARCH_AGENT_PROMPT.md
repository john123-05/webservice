# Auftrag für einen Research-Agenten

Du erweiterst einen Fristenkalender für Schausteller, Händler, Gastronomen
und andere Standbetreiber. Ziel sind 1.000 veröffentlichbare Einträge mit
offener Bewerbungsfrist.

Lies zuerst `coverage/PLAN.md`. Dort stehen Arbeitsweise, Ergiebigkeits-
muster und bekannte Stolpersteine. Dieses Dokument regelt nur, was du je
Stadt tust und wie das Ergebnis auszusehen hat.

## Umfang eines Durchgangs

Genau **eine** Einheit aus `coverage/queue.json`:

```
npm run deadlines:next
```

Mehr nicht. Nach der Einheit Batch schreiben, bauen, Worklog-Zeile
ergänzen, Kontext verwerfen. Halte keine früheren Einheiten im Kontext —
alles Nötige steht in den Dateien.

## Vorgehen je Stadt

Vier Stellen prüfen, in dieser Reihenfolge:

1. **Stadtverwaltung** — Marktamt, Ordnungsamt, Serviceportal,
   Dienstleistungen A–Z. Begriffe: Beschicker, Standplatz, Schausteller,
   Zulassung, Marktsatzung.
2. **Eigene Veranstaltungsdomain** — große Feste haben meist eine.
3. **Nicht-städtischer Veranstalter** — Werbegemeinschaft, Gewerbeverein,
   Verkehrsverein, Schützenverein, beauftragte Agentur. In Klein- und
   Mittelstädten ist das der Regelfall, nicht die Ausnahme.
4. **Unterseiten öffnen** — „Für Schausteller", „Aussteller werden",
   „Informationen für Beschicker", „Bewerbung". Fristen stehen fast nie
   auf der Startseite und sind oft nicht indexiert. Eine Suchmaschine
   allein reicht nicht; du musst klicken.

Prüfe bei jeder Stadt, ob eine **Sammelseite** mehrere Veranstaltungen
gebündelt ausschreibt. Das ist der häufigste Weg zu mehreren Einträgen
aus einem Fund.

## Quellenstandard

- `source_url` ist ausschließlich eine offizielle Stadt-, Behörden- oder
  Veranstalterseite.
- Presseartikel, Portale und Suchtreffer dienen nur dem Auffinden.
- Rate nichts. Fehlende Ansprechpartner, Adressen oder Termine bleiben leer.
- Trage in `last_verified_at` das Datum deiner tatsächlichen Prüfung ein.
- Konnte eine Seite nicht abgerufen werden (403, 503, SSL), schreibe den
  Vorbehalt in `notes` und stufe entsprechend zurückhaltender ein.

## Wann ein Eintrag veröffentlichbar ist

Ein Eintrag braucht ein konkretes ISO-Datum. Wie du dahin kommst:

- **Datum für das Zieljahr genannt** → `verified`, wenn auch Veranstaltungs-
  zeitraum, Bewerbungsweg, Ort und Adresse stehen; sonst `partial`.
- **Als „voraussichtlich" gekennzeichnet** → `partial`, Vorbehalt wörtlich
  in `application_deadline_text`.
- **Dauerregel** („jeweils zum 30.11. des Vorjahres") → `partial`, Datum für
  den nächsten offenen Jahrgang ableiten, Herkunft in `notes` nennen.
- **Relative Regel** („4 Wochen vor Veranstaltungsbeginn") → nur wenn der
  Veranstaltungstermin bekannt ist: Datum berechnen, `partial`, Rechenweg
  in `notes`. Ohne bekannten Termin: `review_candidate`.
- **Frist abgelaufen** → `rejected_candidate` mit Datum und Grund.
- **Nichts gefunden** → `review_candidate` mit Veranstalter, Kontakt und
  Begründung. Das ist ein verwertbares Ergebnis für die Nachfasswelle.

Abgeleitete Daten niemals als bestätigt darstellen. Aus dem Fristtext oder
den Notes muss hervorgehen, worauf das Datum beruht.

Prüfe vor dem Anlegen, ob die Veranstaltung schon im Master steht:

```
node -e "const m=require('./data/schausteller-bewerbungsfristen/master.json');console.log(m.entries.filter(e=>/STADTNAME/i.test(e.city)).map(e=>e.application_deadline_iso+' '+e.event_name))"
```

## Pflichtausgabe

Genau eine Datei `batches/<unit-id>-<yyyy-mm>.json` nach
`schemas/research-batch.schema.json`:

- `entries` — Funde im vollständigen `FristEntry`-Schema
- `rejected_candidates` — geprüft und verworfen, jeweils mit Grund
- `review_candidates` — Veranstaltung bestätigt, Frist offen, mit Kontakt

Schreibe nicht in `master.json`, `web.json` oder die Website. Ausnahme:
Korrekturen an bereits konsolidierten Feldern greifen nur direkt im Master
(siehe PLAN.md).

## Formregeln, die die Validierung sonst bricht

- Bundesland exakt wie in `GERMAN_STATES` (`scripts/deadlines/lib.mjs`),
  mit Umlaut: `Thüringen`, `Baden-Württemberg`.
- `source_domain` muss dem Host der `source_url` entsprechen, inklusive
  Subdomain, ohne `www.`.
- Umlaute in nutzersichtbaren Feldern ausschreiben. IDs, URLs und E-Mails
  bleiben ASCII.
- `country` ist `DE`, `source_kind` ist `official`.

## Abschluss

```
npm run deadlines:build
npm test
```

Beides muss grün sein. Danach in `coverage/queue.json` den Status der
Einheit auf `done` setzen und in `coverage/WORKLOG.md` eine Zeile ergänzen.
