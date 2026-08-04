# Ausbauplan: von 414 auf 1.000 Bewerbungsfristen

Dieser Plan beschreibt, wie der Fristenkalender deutschlandweit auf 1.000
veröffentlichbare Einträge gebracht wird. Er ist so geschrieben, dass eine
beliebige KI oder eine Person die Arbeit an jeder Stelle aufnehmen kann,
ohne die Vorgeschichte zu kennen.

## Stand

Aktuellen Stand immer per Skript abfragen, nie aus diesem Dokument ablesen:

```
npm run deadlines:coverage    # Fortschritt je Einheit
npm run deadlines:next        # nur die nächste offene Einheit
npm run deadlines:audit       # Datenqualität prüfen
```

## Arbeitsprinzip: eine Einheit pro Durchgang

`coverage/queue.json` teilt Deutschland in rund 30 Einheiten zu je 15–25
Städten. Eine Einheit ist ein Arbeitspaket für einen Durchgang.

**Wichtig für den Token-Verbrauch:** Immer nur *eine* Einheit bearbeiten,
danach die Batch-Datei schreiben, bauen, Ergebnis kurz protokollieren und
den Kontext verwerfen. Niemals mehrere Einheiten im selben Kontext halten.
Alles, was der nächste Durchgang wissen muss, steht in `queue.json`,
`WORKLOG.md` und im Master-Datensatz — nicht im Gesprächsverlauf.

### Ablauf je Einheit

1. `npm run deadlines:next` → Einheit und offene Städte holen
2. Status der Einheit in `queue.json` auf `in_progress` setzen
3. Städte der Reihe nach abarbeiten (Methode siehe unten)
4. Ergebnisse in **eine** Batch-Datei schreiben:
   `batches/<unit-id>-<yyyy-mm>.json`
5. `npm run deadlines:build` und `npm test` — beides muss grün sein
6. Status auf `done` setzen, Zeile in `WORKLOG.md` ergänzen
7. Kontext verwerfen, nächste Einheit

## Recherchemethode je Stadt

Die Reihenfolge ist bewusst so gewählt — Schritt 3 wird am häufigsten
übersehen und ist am ergiebigsten.

1. **Stadtseite** prüfen: Marktamt, Ordnungsamt, Bürgerservice,
   Dienstleistungen A–Z, Serviceportal. Suchbegriffe: „Beschicker",
   „Standplatz", „Schausteller", „Marktsatzung", „Zulassung".
2. **Veranstaltungsseite** prüfen: eigene Domain je Fest ist üblich
   (z. B. `cranger-kirmes.de`, `stadt-hafenfest-wittenberge.de`).
3. **Nicht-städtische Veranstalter** prüfen. In Klein- und Mittelstädten
   organisieren häufig Werbegemeinschaften, Gewerbe- oder Verkehrsvereine,
   Schützenvereine oder beauftragte Agenturen. Die Stadtseite verweist dann
   nur weiter oder schweigt. **Beispiel Bad Salzuflen:** Die Stadt nennt
   keine Frist; die Werbegemeinschaft hat auf einer Unterseite
   „Aussteller werden" zwei gestaffelte Fristen stehen.
4. **In die Tiefe klicken.** Fristen stehen selten auf der Startseite,
   fast immer auf Unterseiten wie „Für Schausteller", „Aussteller werden",
   „Informationen für Beschicker", „Bewerbung". Suchmaschinen indexieren
   diese Unterseiten oft nicht.
5. Findet sich nichts: als `review_candidate` mit Veranstalter, Kontakt
   und Begründung dokumentieren. Das ist ein vollwertiges Ergebnis, kein
   Fehlschlag — die Nachfasswelle arbeitet damit weiter.

## Welche Fristen zählen

Veröffentlichbar (`verified` oder `partial`) ist ein Eintrag, wenn eine
offizielle Quelle ihn belegt und ein konkretes ISO-Datum ermittelbar ist.

| Fall | Umgang |
|---|---|
| Konkretes Datum für das Zieljahr genannt | `verified`, sofern Kerndaten vollständig |
| Datum genannt, Zusatzfelder fehlen | `partial` |
| Als „voraussichtlich" gekennzeichnet | `partial`, Vorbehalt in `application_deadline_text` |
| Dauerregel („jeweils zum 30.11. des Vorjahres") | `partial`, Datum ableiten, Herkunft in `notes` |
| Relative Regel („4 Wochen vor Veranstaltungsbeginn") | `partial`, **wenn** der Veranstaltungstermin bekannt ist → Datum berechnen |
| Relative Regel ohne bekannten Termin | `review_candidate` |
| Frist bereits abgelaufen | `rejected_candidate` mit Datum und Grund |

**Immer gilt:** Woher das Datum stammt, muss aus `application_deadline_text`
oder `notes` hervorgehen. Abgeleitete Daten nie als bestätigt ausgeben.
Nichts raten — fehlende Felder bleiben leer.

Quellenstandard unverändert: nur offizielle Stadt-, Behörden- oder
Veranstalterseiten als `source_url`. Portale und Presse nur zum Auffinden.

## Ergiebigkeitsmuster

Erfahrungswerte aus den bisherigen Wellen, nach Ertrag sortiert:

1. **Sammelseiten**: eine Stadt schreibt mehrere Veranstaltungen gebündelt
   aus. München 4, Goslar 6, Erfurt 5, Paderborn 6, Schwabach 12,
   Nürnberg 11. Immer prüfen, ob eine Übersichtsseite existiert.
2. **Gestaffelte Fristen** je Branche oder Geschäftsart ergeben mehrere
   Einträge pro Fest (Bad Salzuflen: Gastronomie 30.03., Kunsthandwerk
   30.06.; Ravensburg: Großgeschäfte 15.09., Standbetreiber 15.11.).
3. **Dauerregeln** erlauben, den jeweils nächsten offenen Jahrgang
   anzulegen — auch für 2028 und später.
4. **Mehrjahresvergaben** beachten: Maschseefest Hannover, Kieler Woche und
   Wackersdorf haben Plätze über mehrere Jahre vergeben. Das ist ein
   `rejected_candidate` mit Hinweis, kein offener Platz.

## Saisonalität

Der Ausschreibungszyklus bestimmt, wann welche Recherche lohnt:

| Zeitraum | Was erscheint |
|---|---|
| Aug–Okt | Weihnachtsmärkte des laufenden Jahres, Volksfeste des Folgejahres |
| Okt–Dez | Große Kirmessen und Volksfeste des Folgejahres |
| Jan–Mär | Weihnachtsmärkte des Folgejahres, Frühjahrsmärkte |
| Apr–Jun | Nachzügler, Kunsthandwerkermärkte |

Wer im toten Winkel recherchiert, findet überwiegend abgelaufene Fristen.
Deshalb die Nachfasswelle (siehe unten) an diesen Zyklus koppeln.

## Nachfasswelle

`research-log.json` enthält über 400 `review_candidates` mit Veranstalter
und Kontakt, denen nur das Datum fehlt. Sie erneut prüfen, sobald die
jeweilige Ausschreibung erscheint. Terminierte Fälle stehen in
`WORKLOG.md` unter „Nachfass-Termine".

Vor jeder Welle einmal prüfen, ob ein review-Kandidat inzwischen als
Eintrag existiert:

```
node -e "const l=require('./data/schausteller-bewerbungsfristen/research-log.json'),m=require('./data/schausteller-bewerbungsfristen/master.json');const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const names=new Set(m.entries.map(e=>n(e.event_name)));console.log(l.review_candidates.filter(c=>names.has(n(c.event_name))).map(c=>c.event_name));"
```

## Qualitätsprüfung

`npm run deadlines:audit` prüft abgelaufene Fristen, doppelte IDs,
unbekannte Bundesländer, ASCII-Umschriften in nutzersichtbaren Feldern,
fehlende Kontaktwege und ob Fristtext und ISO-Datum übereinstimmen.

Die Linkprüfung läuft separat, weil sie einige Minuten dauert:

```
node scripts/deadlines/audit.mjs --links
```

Statuscodes 403 und 429 sind Blockaden der Betreiber, keine toten Links.
Nach jeder Welle einmal ohne `--links` laufen lassen, vor größeren
Releases einmal mit.

## Bekannte Stolpersteine

- **Master gewinnt beim Merge.** Korrekturen an bereits konsolidierten
  Feldern greifen *nicht* über Batch-Dateien. Wer einen Tippfehler in einem
  alten Eintrag beheben will, muss `master.json` direkt ändern.
- **Bundesland exakt schreiben**, mit Umlaut: `Thüringen`, nicht
  `Thueringen`. Sonst entsteht ein zweiter Bundesland-Eimer auf der Website.
  Kanonische Liste: `GERMAN_STATES` in `scripts/deadlines/lib.mjs`.
- **Umlaute in nutzersichtbaren Feldern** ausschreiben (`Wechselhütte`,
  nicht `Wechselhuette`). Betroffen sind `event_name`, `event_type`, `city`,
  `venue_or_area` und alle Textfelder. IDs, URLs und E-Mails bleiben ASCII.
  Vorsicht: `Kramermarkt`, `Moers`, `Itzehoe`, `Voerde`, `Soest` und
  `Ueckermünde` sind korrekt ohne bzw. mit dieser Schreibweise.
- **`source_domain` muss zur `source_url` passen**, inklusive Subdomain
  (`veranstaltungen.kassel-marketing.de`). Sonst schlägt die Validierung fehl.
- Manche Städte blockieren automatisierte Abrufe (HTTP 403: `dinslaken.de`,
  `voerde.de`, `viersen.de`). Dann Quelle kennzeichnen und Vorbehalt in
  `notes` schreiben.

## Zieldefinition

1.000 veröffentlichbare Einträge mit offener Frist. Bei rund 550 Städten in
der Warteschlange und im Schnitt 1–2 verwertbaren Fristen je Stadt ist das
erreichbar, wenn die Einheiten konsequent abgearbeitet werden.
