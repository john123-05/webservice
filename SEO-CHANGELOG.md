# Website-Aenderungen

Status dieser Eintraege: im Vorschlag umgesetzt und getestet; noch nicht auf impress-rank.de veroeffentlicht. Nach der Veroeffentlichung das tatsaechliche Live-Datum ergaenzen. Nachkontrolle: 2027-02-03 bzw. drei Monate nach dem Live-Datum.

| Seite | Was geaendert wurde | Datum | Warum |
| --- | --- | --- | --- |
| Startseite | Titel, Beschreibung und erste Ueberschrift nennen Webdesign, SEO, Bad Salzuflen und Bielefeld; Grammatik der Leistungskarte korrigiert. | 2026-11-03 | Das Angebot im Suchergebnis und auf der Seite schneller verstaendlich machen. |
| /webdesign-handwerker-bielefeld | Beschreibung, Einleitung und Ablauf konkreter beschrieben; Generator mitangepasst. | 2026-11-03 | Interessenten erkennen schneller, was sie erhalten und wie sie starten. |
| /naechster-schritt | Newsletter-Einwilligung freiwillig gemacht und als optional beschriftet; ohne Haken wird angemeldet=nein uebergeben. | 2026-11-03 | Eine Videoanalyse ohne zusaetzliche Newsletter-Anmeldung anfragen koennen. |
| Alle Anfrageformulare mit .offer-form | generate_lead erst nach erfolgreicher Serverantwort und nur mit Statistik-Einwilligung; ohne persoenliche Angaben. | 2026-11-03 | Erfolgreiche Formularanfragen von blossen Klicks unterscheiden. |
| Kontaktwege | Klickmessung fuer kurze Anfrage-Adressen und Telefonlinks ergaenzt. | 2026-11-03 | Die tatsaechlich verwendeten Kontaktwege messen koennen. |
| Seiten ohne Statistik-Tag, etwa /naechster-schritt | Vorhandenes Statistik-Konto wird bei fehlendem Tag erst nach Einwilligung geladen. | 2026-11-03 | Auch dort erfolgreiche Anfragen messen koennen. |
| Alle HTML-Seiten | Kurze interne Links, bevorzugte Adressen, Vorschauadressen und strukturierte Angaben beim Build vereinheitlicht. | 2026-11-03 | Widerspruechliche Seitenadressen vermeiden. |
| Sitemap | Seiten mit noindex entfernt, kurze Adressen verwendet und doppelte Eintraege vermieden. | 2026-11-03 | Google nur die zur Aufnahme vorgesehenen Seiten nennen. |
| Hosting-Regeln | Nicht unterstuetztes Suffix-Wildcard durch explizit erzeugte Weiterleitungen ersetzt; Unterverzeichnisse beim Ausliefern beruecksichtigt. | 2026-11-03 | Alte Adressen eindeutig zur vorgesehenen Seite fuehren. |
| Sprachwechsel | Deutsche und englische Kurzadressen sowie englische Blogartikel korrekt zugeordnet. | 2026-11-03 | Der Sprachwechsel soll zur anderen Sprache fuehren. |
| /webdesign-en | Falschen Verweis auf die englische Startseite in bevorzugter Adresse und Linkvorschau korrigiert. | 2026-11-03 | Die englische Webdesign-Seite als eigenstaendige Seite kennzeichnen. |
| Erzeugte Leistungsseiten | Technischen Erklaertext unter verwandten Leistungen durch kundenbezogenen Satz ersetzt. | 2026-11-03 | Besuchern passende Leistungen zeigen und interne Umsetzungssprache entfernen. |

## Nach Veroeffentlichung pruefen

- Alte .html-Adressen leiten einmalig auf die passenden kurzen Seiten; Blog-Verzeichnisadressen bleiben erhalten.
- Sitemap in der Search Console einreichen; die Seite muss dort erfolgreich gelesen werden.
- Startseite, Handwerker-Seite, SEO und Webdesign einzeln mit der URL-Pruefung kontrollieren.
- In der Website-Statistik generate_lead als Schluesselereignis einrichten. Diese Kontoeinstellung ist nicht Teil der Codeaenderung.
- Einen abgestimmten Formularversand bis zum Posteingang/CRM pruefen. Die Tests versenden keine echten Anfragen.
- Dabei pruefen, dass Make/CRM angemeldet=nein respektieren und ohne Newsletter-Einwilligung keine Marketinganmeldung vornehmen. Die nachgelagerten Automationen sind hier nicht einsehbar.
- Die beiden historisch gemeldeten Serverfehler nachpruefen; ein aktueller HTTP-200-Test allein beweist keine dauerhafte Behebung.
- Nach 28 Tagen erste Klickdaten vergleichen; nach drei Monaten qualifizierte Anfragen und gewonnene Auftraege bewerten.
