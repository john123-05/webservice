import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const domain = 'https://webservice-studios.com';
const brand = 'Webservice.Studios';
const supportEmail = 'kontakt@webservice-studios.com';

const footer = `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <a class="brand" href="index.html">${brand}</a>
          <p>Websites für Unternehmen mit Fokus auf Sichtbarkeit, Struktur und Anfragen.</p>
        </div>
        <div>
          <h4>Seiten</h4>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="leistungen.html">Leistungen</a></li>
            <li><a href="standorte.html">Standorte</a></li>
            <li><a href="projekte.html">Projekte / Case Studies</a></li>
            <li><a href="anfrage.html">Kontakt</a></li>
            <li><a href="impressum.html">Impressum</a></li>
            <li><a href="datenschutz.html">Datenschutz</a></li>
          </ul>
        </div>
        <div>
          <h4>Kontakt</h4>
          <ul>
            <li>${brand}</li>
            <li>Bielefeld &amp; OWL</li>
            <li><a href="mailto:${supportEmail}">${supportEmail}</a></li>
          </ul>
        </div>
      </div>
    </footer>
    <div class="cookie-banner" data-cookie-banner hidden>
      <div class="cookie-banner__copy">
        <strong>Cookies &amp; Statistik</strong>
        <p>
          Diese Website nutzt notwendige Cookies und optional Google Analytics. Mehr dazu steht in
          der <a href="datenschutz.html">Datenschutzerklärung</a>.
        </p>
      </div>
      <div class="cookie-banner__actions">
        <button class="btn btn-ghost" type="button" data-cookie-decline>Nur notwendige</button>
        <button class="btn btn-primary" type="button" data-cookie-accept>Alle akzeptieren</button>
      </div>
    </div>
    <script type="module" src="app.js"></script>
`;

const makeCanonical = (slug) => `${domain}/${slug === 'index.html' ? '' : slug}`;

const globalSchema = (title, description, path) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${domain}/#organization`,
      name: brand,
      url: domain,
      email: supportEmail,
      areaServed: [
        'Bielefeld',
        'Bad Salzuflen',
        'Gütersloh',
        'Detmold',
        'Leopoldshöhe',
        'Oerlinghausen',
        'Verl',
        'Lage',
        'Schloß Holte-Stukenbrock',
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${makeCanonical(path)}#webpage`,
      url: makeCanonical(path),
      name: title,
      description,
      isPartOf: {
        '@id': `${domain}/#website`,
      },
      about: {
        '@id': `${domain}/#organization`,
      },
      inLanguage: 'de-DE',
    },
    {
      '@type': 'WebSite',
      '@id': `${domain}/#website`,
      url: domain,
      name: brand,
      inLanguage: 'de-DE',
    },
  ],
});

const renderHead = ({ title, description, path, ogType = 'website', robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1', schema }) => `
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${makeCanonical(path)}" />
    <meta property="og:locale" content="de_DE" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${makeCanonical(path)}" />
    <meta property="og:site_name" content="${brand}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <link rel="preload" href="assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="styles.css" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  </head>
`;

const renderHeader = (eyebrow, h1) => `
    <header class="subpage-head">
      <div class="container">
        <nav class="nav">
          <a class="brand" href="index.html">${brand}</a>
          <button class="menu-toggle" type="button" aria-label="Navigation öffnen" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="leistungen.html">Leistungen</a></li>
            <li><a href="standorte.html">Standorte</a></li>
            <li><a class="nav-cta" href="anfrage.html">Kontakt</a></li>
          </ul>
        </nav>
        <div class="subpage-title">
          <p class="eyebrow">${eyebrow}</p>
          <h1>${h1}</h1>
        </div>
      </div>
    </header>
`;

const renderLinks = (items) => `
          <div class="insights-grid">
            ${items
              .map(
                (item) => `
              <article class="insight-card">
                <div class="insight-body">
                  <h3><a href="${item.href}">${item.title}</a></h3>
                  <p>${item.text}</p>
                  <a class="insight-link" href="${item.href}">Mehr erfahren</a>
                </div>
              </article>`,
              )
              .join('')}
          </div>
`;

const renderPage = ({
  fileName,
  title,
  description,
  eyebrow,
  h1,
  introTitle,
  introText,
  points,
  detailTitle,
  detailParagraphs,
  relatedTitle,
  relatedLinks,
  faq,
}) => {
  const schema = globalSchema(title, description, fileName);
  schema['@graph'].push({
    '@type': 'FAQPage',
    '@id': `${makeCanonical(fileName)}#faq`,
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  });

  const html = `<!doctype html>
<html lang="de">
${renderHead({ title, description, path: fileName, schema })}
  <body>
${renderHeader(eyebrow, h1)}
    <main>
      <section class="section">
        <div class="container split">
          <div>
            <h2>${introTitle}</h2>
            <p class="section-copy left">${introText}</p>
            <ul class="problem-list">
              ${points.map((point) => `<li>${point}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h2>${detailTitle}</h2>
            ${detailParagraphs.map((paragraph) => `<p class="section-copy left">${paragraph}</p>`).join('')}
            <p class="section-copy left">
              <a class="btn btn-primary" href="anfrage.html">Kostenlose Einschätzung anfragen</a>
            </p>
          </div>
        </div>
      </section>
      <section class="section section-soft">
        <div class="container">
          <div class="insights-head">
            <div class="narrow">
              <h2>${relatedTitle}</h2>
              <p class="section-copy">
                Diese Seiten helfen Suchmaschinen, AI-Systemen und lokalen Unternehmen schneller zu
                verstehen, welche Leistungen ${brand} in Bielefeld und dem Umland anbietet.
              </p>
            </div>
          </div>
${renderLinks(relatedLinks)}
        </div>
      </section>
      <section class="section" id="faq">
        <div class="container">
          <div class="insights-head">
            <div class="narrow">
              <h2>Häufige Fragen</h2>
            </div>
          </div>
          <div class="faq-wrap" data-faq>
            ${faq
              .map(
                (entry) => `
            <details class="faq-item">
              <summary>${entry.question}</summary>
              <div class="faq-answer">
                <p>${entry.answer}</p>
              </div>
            </details>`,
              )
              .join('')}
          </div>
        </div>
      </section>
    </main>
${footer}
  </body>
</html>
`;

  writeFileSync(join(rootDir, fileName), html);
};

const servicePages = [
  {
    fileName: 'leistungen.html',
    title: 'Leistungen für Webdesign, SEO & Online Marketing in Bielefeld | Webservice.Studios',
    description: 'Übersicht über Webdesign, SEO, Online Marketing, Webentwicklung und Website-Relaunch für Unternehmen in Bielefeld und OWL.',
    eyebrow: 'Leistungen',
    h1: 'Leistungen für Websites, Sichtbarkeit und mehr Anfragen',
    introTitle: 'Wobei wir lokale Unternehmen unterstützen',
    introText:
      'Diese Übersichtsseite bündelt die wichtigsten Leistungen für Unternehmen, die online besser gefunden werden, professioneller wirken und aus ihrer Website mehr Anfragen herausholen möchten.',
    points: [
      'Webdesign für lokale Unternehmen mit klarer Nutzerführung',
      'SEO und Local SEO für Sichtbarkeit in Bielefeld und OWL',
      'Website-Relaunch für veraltete oder schwache Seiten',
      'Webentwicklung und Backend-Lösungen für individuelle Anforderungen',
      'Online-Marketing-Grundlagen für bessere Sichtbarkeit und Conversion',
    ],
    detailTitle: 'Wie die Leistungen zusammenspielen',
    detailParagraphs: [
      'Viele Unternehmen suchen zwar nach Webdesign, haben in Wahrheit aber mehrere Probleme gleichzeitig: schlechte Rankings, zu wenig Anfragen, unklare Botschaften oder technische Schwächen auf der Website.',
      'Deshalb werden Webdesign, SEO, Conversion und technische Umsetzung hier nicht als Einzeldisziplinen behandelt, sondern als zusammenhängendes System.',
    ],
    relatedTitle: 'Leistungsseiten',
    relatedLinks: [
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Websites für lokale Unternehmen, die klarer positionieren und mehr Anfragen unterstützen.' },
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Für Unternehmen, die in Google besser sichtbar werden wollen.' },
      { href: 'online-marketing-bielefeld.html', title: 'Online Marketing Bielefeld', text: 'Sichtbarkeit, Website und Nachfrage sinnvoll verzahnen.' },
      { href: 'website-relaunch-bielefeld.html', title: 'Website Relaunch Bielefeld', text: 'Wenn die bestehende Seite veraltet wirkt oder nicht performt.' },
      { href: 'local-seo-bielefeld.html', title: 'Local SEO Bielefeld', text: 'Für lokale Rankings, Maps-Sichtbarkeit und regionale Anfragen.' },
      { href: 'webentwicklung-bielefeld.html', title: 'Webentwicklung Bielefeld', text: 'Technische Umsetzung für moderne Unternehmenswebsites.' },
      { href: 'backend-entwicklung-bielefeld.html', title: 'Backend Entwicklung Bielefeld', text: 'Für individuelle Funktionen, Datenflüsse und Prozesse.' },
      { href: 'webdesign-handwerker-bielefeld.html', title: 'Webdesign für Handwerker in Bielefeld', text: 'Für Handwerksbetriebe mit Fokus auf Vertrauen, Leistungen und regionale Anfragen.' },
      { href: 'webdesign-praxen-bielefeld.html', title: 'Webdesign für Praxen in Bielefeld', text: 'Für Praxen, die professioneller wirken und Anfragen besser führen wollen.' },
      { href: 'webdesign-dienstleister-bielefeld.html', title: 'Webdesign für Dienstleister in Bielefeld', text: 'Für lokale Dienstleister mit erklärungsbedürftigen Leistungen.' },
      { href: 'webdesign-beratung-bielefeld.html', title: 'Webdesign für Berater in Bielefeld', text: 'Für Beratungen, die Expertise, Vertrauen und Klarheit online besser zeigen wollen.' },
      { href: 'website-bringt-keine-anfragen.html', title: 'Website bringt keine Anfragen', text: 'Problemseite für Unternehmen mit schwacher Conversion.' },
      { href: 'website-wird-bei-google-nicht-gefunden.html', title: 'Website wird bei Google nicht gefunden', text: 'Problemseite für fehlende Sichtbarkeit und Rankings.' },
    ],
    faq: [
      { question: 'Für wen sind diese Leistungen gedacht?', answer: 'Vor allem für lokale Unternehmen, Dienstleister und Betriebe, die online professioneller wirken und mehr qualifizierte Anfragen erhalten möchten.' },
      { question: 'Kann man auch mit einem einzelnen Problem starten?', answer: 'Ja. Häufig beginnt die Zusammenarbeit mit einer Analyse oder einem Relaunch-Thema, aus dem sich die nächsten sinnvollen Schritte ergeben.' },
      { question: 'Sind die Leistungen nur für Bielefeld gedacht?', answer: 'Der Schwerpunkt liegt auf Bielefeld und dem Umland in OWL, also auch auf Bad Salzuflen, Gütersloh, Detmold, Leopoldshöhe, Oerlinghausen, Verl, Lage und Schloß Holte-Stukenbrock.' },
    ],
  },
  {
    fileName: 'standorte.html',
    title: 'Standorte in Bielefeld & OWL | Webservice.Studios',
    description: 'Leistungen rund um Webdesign, SEO und Websites für Unternehmen in Bielefeld, Bad Salzuflen, Gütersloh, Detmold, Verl und weiteren Orten in OWL.',
    eyebrow: 'Standorte',
    h1: 'Standorte für Webdesign, SEO und Websites in OWL',
    introTitle: 'Regionale Ausrichtung rund um Bielefeld',
    introText:
      'Die Website ist auf Unternehmen in Bielefeld und dem direkten wirtschaftlichen Umfeld ausgerichtet. So entstehen lokale Signale für Suchmaschinen und klarere Seiten für regionale Suchanfragen.',
    points: [
      'Bielefeld als Hauptstandort und zentrale Suchregion',
      'Bad Salzuflen, Gütersloh und Detmold als wichtige Nachfrage-Räume',
      'Leopoldshöhe, Oerlinghausen, Verl, Lage und Schloß Holte-Stukenbrock als lokales Umland',
      'Lokale Relevanz für Webdesign, SEO und Website-Relaunch',
    ],
    detailTitle: 'Warum Ortsseiten sinnvoll sind',
    detailParagraphs: [
      'Lokale Unternehmen suchen oft nicht nur nach einer Leistung, sondern nach einer Leistung in ihrer unmittelbaren Region. Genau dafür helfen klare Standortseiten mit regionalem Bezug.',
      'Die Standorte sind kein Selbstzweck, sondern sollen konkrete Suchanfragen abdecken, die im Umland von Bielefeld realistisch vorkommen.',
    ],
    relatedTitle: 'Standortseiten',
    relatedLinks: [
      { href: 'webdesign-bad-salzuflen.html', title: 'Webdesign Bad Salzuflen', text: 'Für Unternehmen im direkten Umfeld von Bielefeld.' },
      { href: 'webdesign-guetersloh.html', title: 'Webdesign Gütersloh', text: 'Für Unternehmen mit Bedarf an Website, Struktur und Anfragen.' },
      { href: 'webdesign-detmold.html', title: 'Webdesign Detmold', text: 'Für lokale Dienstleister und Unternehmen in Lippe.' },
      { href: 'webdesign-leopoldshoehe.html', title: 'Webdesign Leopoldshöhe', text: 'Regionale Sichtbarkeit für kleinere lokale Märkte.' },
      { href: 'webdesign-oerlinghausen.html', title: 'Webdesign Oerlinghausen', text: 'Für Unternehmen mit regionaler Kundschaft.' },
      { href: 'webdesign-verl.html', title: 'Webdesign Verl', text: 'Moderne Website- und SEO-Basis für lokale Unternehmen.' },
      { href: 'webdesign-lage.html', title: 'Webdesign Lage', text: 'Websites mit Fokus auf Sichtbarkeit und Conversion.' },
      { href: 'webdesign-schloss-holte-stukenbrock.html', title: 'Webdesign Schloß Holte-Stukenbrock', text: 'Für Unternehmen im südlichen OWL-Umfeld.' },
    ],
    faq: [
      { question: 'Warum ist die Standortauswahl bewusst begrenzt?', answer: 'Die regionale Ausrichtung wird hier bewusst auf Bielefeld und ausgewählte Zielorte fokussiert, damit die Standortstrategie klarer und nicht zu breit wird.' },
      { question: 'Sind die Standorte nur für Webdesign gedacht?', answer: 'Nein. Sie unterstützen auch SEO-, Relaunch- und Sichtbarkeitsanfragen, weil viele lokale Suchanfragen Leistung und Ort kombinieren.' },
      { question: 'Kann man später weitere Orte ergänzen?', answer: 'Ja. Wenn sich zeigt, dass ein zusätzlicher Markt strategisch sinnvoll ist, lässt sich das sauber erweitern.' },
    ],
  },
  {
    fileName: 'webdesign-bielefeld.html',
    title: 'Webdesign Bielefeld | Websites für mehr Anfragen',
    description: 'Webdesign in Bielefeld für lokale Unternehmen, die mit ihrer Website professioneller wirken und mehr Anfragen gewinnen möchten.',
    eyebrow: 'Webdesign Bielefeld',
    h1: 'Webdesign in Bielefeld für Unternehmen, die mehr Anfragen wollen',
    introTitle: 'Webdesign mit Fokus auf Sichtbarkeit und Conversion',
    introText: 'Viele Unternehmen suchen nach Webdesign in Bielefeld, brauchen aber mehr als eine schöne Oberfläche. Entscheidend ist, dass die Website Leistungen klar vermittelt, Vertrauen schafft und Besucher gezielt zur Anfrage führt.',
    points: ['Klare Positionierung auf der Startseite', 'Bessere mobile Nutzerführung', 'Starke Vertrauenssignale für lokale Unternehmen', 'Mehr Anfragen statt nur mehr Seitenaufrufe'],
    detailTitle: 'Worauf es bei Webdesign in Bielefeld ankommt',
    detailParagraphs: ['Gerade in lokalen Märkten entscheiden oft wenige Sekunden darüber, ob ein Interessent bleibt oder abspringt. Deshalb ist Webdesign hier eng mit Struktur, Botschaft und Conversion verbunden.', 'Für Unternehmen in Bielefeld bedeutet das: Die Website muss schnell verständlich machen, was angeboten wird, für wen die Leistung gedacht ist und wie der nächste Schritt aussieht.'],
    relatedTitle: 'Passende Ergänzungen',
    relatedLinks: [
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Für bessere Sichtbarkeit in Google und mehr qualifizierte Besucher.' },
      { href: 'website-relaunch-bielefeld.html', title: 'Website Relaunch Bielefeld', text: 'Wenn eine bestehende Website modernisiert und neu strukturiert werden soll.' },
      { href: 'website-bringt-keine-anfragen.html', title: 'Website bringt keine Anfragen', text: 'Wenn Design da ist, aber die Conversion nicht stimmt.' },
    ],
    faq: [
      { question: 'Was ist der Unterschied zwischen Webdesign und Website-Relaunch?', answer: 'Webdesign beschreibt die strategische und visuelle Gestaltung einer Website. Ein Relaunch meint meist die Überarbeitung einer bestehenden Seite inklusive Struktur, Inhalte und Technik.' },
      { question: 'Ist Webdesign allein genug für gute Rankings?', answer: 'Nein. Gutes Webdesign unterstützt SEO, ersetzt aber keine klare Informationsarchitektur, saubere Meta-Daten und relevante Inhalte.' },
      { question: 'Für welche Branchen lohnt sich Webdesign besonders?', answer: 'Vor allem für lokale Dienstleister, Handwerksbetriebe, Beratungen, Praxen und Unternehmen, bei denen Vertrauen und Klarheit direkt zu Anfragen führen.' },
    ],
  },
  {
    fileName: 'seo-bielefeld.html',
    title: 'SEO Bielefeld | Mehr Sichtbarkeit und Anfragen für lokale Unternehmen',
    description: 'SEO in Bielefeld für Unternehmen, die bei Google besser gefunden werden und aus ihrer Website mehr Anfragen herausholen möchten.',
    eyebrow: 'SEO Bielefeld',
    h1: 'SEO in Bielefeld für lokale Unternehmen mit echten Wachstumszielen',
    introTitle: 'Wenn die Website nicht sichtbar genug ist',
    introText: 'SEO in Bielefeld ist vor allem dann relevant, wenn eine Website trotz guter Leistungen zu wenig Suchsichtbarkeit, zu wenig passende Besucher oder zu wenige Anfragen erzeugt.',
    points: ['Bessere Themen- und Seitenstruktur', 'Lokale Relevanz für Bielefeld und OWL', 'Stärkere Suchintention statt bloßer Keyword-Wiederholung', 'Mehr Sichtbarkeit für Unternehmen mit regionalem Fokus'],
    detailTitle: 'Wie lokale SEO in Bielefeld funktioniert',
    detailParagraphs: ['Lokale Suchmaschinenoptimierung ist nicht nur eine Frage von Keywords. Sie verbindet technische Grundlagen, klare Leistungsseiten, regionale Relevanz und starke Vertrauenssignale.', 'Für Bielefeld bedeutet das: Suchmaschinen müssen verstehen, welche Leistungen angeboten werden, in welcher Region gearbeitet wird und warum die Seite für lokale Unternehmen relevant ist.'],
    relatedTitle: 'SEO-nahe Seiten',
    relatedLinks: [
      { href: 'local-seo-bielefeld.html', title: 'Local SEO Bielefeld', text: 'Für regionale Rankings, Maps-Signale und lokale Nachfrage.' },
      { href: 'website-wird-bei-google-nicht-gefunden.html', title: 'Website wird bei Google nicht gefunden', text: 'Problemseite für fehlende Sichtbarkeit und Rankings.' },
      { href: 'online-marketing-bielefeld.html', title: 'Online Marketing Bielefeld', text: 'Für die Verbindung aus Website, Reichweite und Nachfrage.' },
    ],
    faq: [
      { question: 'Wie schnell sieht man bei SEO Ergebnisse?', answer: 'Das hängt von Wettbewerb, Ausgangslage und Suchintention ab. Oft zeigen sich zuerst Verbesserungen bei Struktur, Sichtbarkeit und passenden Rankings, bevor daraus stabil mehr Anfragen entstehen.' },
      { question: 'Ist SEO nur für große Unternehmen sinnvoll?', answer: 'Nein. Gerade lokale Unternehmen profitieren von sauberem SEO, weil sie meist in klar umrissenen Märkten sichtbar werden wollen.' },
      { question: 'Braucht man dafür regelmäßig neue Inhalte?', answer: 'Nicht zwingend massenhaft. Häufig ist es wirksamer, die wichtigsten Leistungs- und Problemseiten sauber aufzubauen und intern gut zu verknüpfen.' },
    ],
  },
  {
    fileName: 'online-marketing-bielefeld.html',
    title: 'Online Marketing Bielefeld | Website, Sichtbarkeit und mehr Anfragen',
    description: 'Online Marketing in Bielefeld für Unternehmen, die Website, Sichtbarkeit und Nachfrage strategisch zusammenführen möchten.',
    eyebrow: 'Online Marketing Bielefeld',
    h1: 'Online Marketing in Bielefeld mit starker Website als Grundlage',
    introTitle: 'Online Marketing ohne gute Website verpufft oft',
    introText: 'Viele Unternehmen investieren in Aufmerksamkeit, aber die Website trägt den eigentlichen Entscheidungsprozess nicht mit. Genau dort setzt Online Marketing mit Website-Fokus an.',
    points: ['Website als Vertrauens- und Conversion-Basis', 'Bessere Verbindung aus Reichweite und Anfrage', 'Klarere Zielseiten für Suchmaschinen und Nutzer', 'Strategie für lokale Unternehmen in Bielefeld'],
    detailTitle: 'Warum Website und Marketing zusammen gedacht werden müssen',
    detailParagraphs: ['Anzeigen, Social Media oder Empfehlungen können Aufmerksamkeit erzeugen. Ob daraus eine Anfrage wird, entscheidet aber fast immer die Website.', 'Deshalb ist diese Leistung besonders für Unternehmen relevant, die bereits Reichweite haben, aber daraus noch zu wenig passende Anfragen gewinnen.'],
    relatedTitle: 'Strategisch passende Seiten',
    relatedLinks: [
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Für die Grundlage einer überzeugenden Website.' },
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Für organische Sichtbarkeit und lokale Suchanfragen.' },
      { href: 'website-bringt-keine-anfragen.html', title: 'Website bringt keine Anfragen', text: 'Wenn Nachfrage da ist, aber die Website nicht genug daraus macht.' },
    ],
    faq: [
      { question: 'Was ist hier mit Online Marketing gemeint?', answer: 'Gemeint ist kein reines Anzeigenmanagement, sondern die Verbindung aus Website, Suchsichtbarkeit, Positionierung und Conversion.' },
      { question: 'Ist das auch für kleine lokale Unternehmen sinnvoll?', answer: 'Ja. Gerade kleinere Unternehmen brauchen oft eine klarere Struktur, damit vorhandene Nachfrage besser genutzt wird.' },
      { question: 'Braucht man dafür sofort viele Kanäle?', answer: 'Nein. Meist ist es sinnvoller, erst Website und Suchsichtbarkeit zu stabilisieren, bevor zusätzliche Kanäle ausgebaut werden.' },
    ],
  },
  {
    fileName: 'website-relaunch-bielefeld.html',
    title: 'Website Relaunch Bielefeld | Bestehende Website neu aufstellen',
    description: 'Website Relaunch in Bielefeld für Unternehmen mit veralteter, unklarer oder schwacher Website.',
    eyebrow: 'Website Relaunch Bielefeld',
    h1: 'Website Relaunch in Bielefeld für veraltete oder schwache Websites',
    introTitle: 'Wenn die bestehende Website nicht mehr trägt',
    introText: 'Ein Relaunch ist sinnvoll, wenn die aktuelle Website zwar vorhanden ist, aber weder Vertrauen aufbaut noch Suchsichtbarkeit oder Anfragen zuverlässig unterstützt.',
    points: ['Bessere Struktur statt Flickwerk', 'Stärkerer Fokus auf Leistungen und Zielgruppen', 'Technische Bereinigung und modernere Grundlage', 'Mehr Klarheit für Google und für Besucher'],
    detailTitle: 'Wann ein Relaunch besonders sinnvoll ist',
    detailParagraphs: ['Typische Gründe sind veraltete Gestaltung, unklare Inhalte, schlechte mobile Nutzung, schwache Ladezeiten oder eine Website, die kaum Anfragen bringt.', 'Ein Relaunch schafft die Chance, Website, SEO und Positionierung in einem sinnvollen Schritt neu zu ordnen.'],
    relatedTitle: 'Relaunch-nahe Seiten',
    relatedLinks: [
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Für den strategischen und visuellen Neuaufbau.' },
      { href: 'webentwicklung-bielefeld.html', title: 'Webentwicklung Bielefeld', text: 'Für technische Umsetzung und saubere Basis.' },
      { href: 'website-ist-langsam-und-konvertiert-nicht.html', title: 'Website ist langsam und konvertiert nicht', text: 'Wenn Technik und Conversion zusammen schwach sind.' },
    ],
    faq: [
      { question: 'Muss beim Relaunch alles komplett neu gemacht werden?', answer: 'Nicht immer. Häufig können gute Inhalte oder Elemente übernommen werden. Entscheidend ist, dass Struktur, Botschaft und Technik am Ende stimmig sind.' },
      { question: 'Ist ein Relaunch schlecht für SEO?', answer: 'Nur wenn er unsauber umgesetzt wird. Mit sauberer Seitenstruktur, Canonicals und interner Logik kann ein Relaunch SEO deutlich verbessern.' },
      { question: 'Wann sollte man lieber optimieren statt relaunchen?', answer: 'Wenn die Website grundsätzlich tragfähig ist und nur gezielte inhaltliche oder technische Verbesserungen braucht.' },
    ],
  },
  {
    fileName: 'local-seo-bielefeld.html',
    title: 'Local SEO Bielefeld | Regional besser gefunden werden',
    description: 'Local SEO in Bielefeld für Unternehmen, die regional besser gefunden werden und mehr lokale Anfragen erhalten möchten.',
    eyebrow: 'Local SEO Bielefeld',
    h1: 'Local SEO in Bielefeld für mehr regionale Sichtbarkeit',
    introTitle: 'Wenn lokale Suchanfragen wichtiger werden',
    introText: 'Local SEO ist besonders relevant für Unternehmen, deren Kunden aus Bielefeld und dem direkten Umland kommen und die bei regionalen Suchanfragen sichtbar sein müssen.',
    points: ['Mehr regionale Sichtbarkeit in Suchmaschinen', 'Klarere Orts- und Leistungszuordnung', 'Stärkere Relevanz für lokale Suchintentionen', 'Bessere Basis für Bielefeld und angrenzende Orte'],
    detailTitle: 'Was bei Local SEO entscheidend ist',
    detailParagraphs: ['Suchmaschinen brauchen eindeutige Signale zu Leistung, Region und Vertrauenswürdigkeit. Deshalb helfen lokale Leistungsseiten, Standortbezug und saubere technische Meta-Daten.', 'Für Unternehmen in Bielefeld lohnt sich Local SEO vor allem dann, wenn sie lokal sichtbar werden wollen, ohne sich in zu vielen Regionen gleichzeitig zu verzetteln.'],
    relatedTitle: 'Direkt passende Seiten',
    relatedLinks: [
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Für die breitere organische Sichtbarkeit.' },
      { href: 'standorte.html', title: 'Standorte in OWL', text: 'Für die regionale Seitenstruktur rund um Bielefeld.' },
      { href: 'webdesign-bad-salzuflen.html', title: 'Webdesign Bad Salzuflen', text: 'Beispiel für eine gezielte regionale Standortseite.' },
    ],
    faq: [
      { question: 'Ist Local SEO nur für Google Maps?', answer: 'Nein. Es geht generell um regionale Suchanfragen, also auch um organische Ergebnisse für Leistungen in einer bestimmten Stadt oder Region.' },
      { question: 'Braucht man dafür für jeden Ort eine Seite?', answer: 'Nicht immer, aber für wichtige Zielorte rund um Bielefeld kann das strategisch sehr sinnvoll sein.' },
      { question: 'Was bringt Local SEO konkret?', answer: 'Bessere Relevanz für Suchmaschinen, klarere regionale Zuordnung und oft mehr passende lokale Anfragen.' },
    ],
  },
  {
    fileName: 'webentwicklung-bielefeld.html',
    title: 'Webentwicklung Bielefeld | Technische Umsetzung für moderne Websites',
    description: 'Webentwicklung in Bielefeld für Unternehmen, die eine technisch saubere, schnelle und ausbaufähige Website brauchen.',
    eyebrow: 'Webentwicklung Bielefeld',
    h1: 'Webentwicklung in Bielefeld für leistungsfähige Unternehmenswebsites',
    introTitle: 'Wenn die Website technisch mehr können muss',
    introText: 'Webentwicklung ist relevant, wenn es nicht nur um Gestaltung geht, sondern um eine technisch saubere, schnelle und zuverlässige Grundlage für moderne Websites.',
    points: ['Saubere technische Struktur', 'Bessere Performance und mobile Nutzung', 'Flexible Erweiterbarkeit', 'Grundlage für SEO und Conversion'],
    detailTitle: 'Wo Webentwicklung den Unterschied macht',
    detailParagraphs: ['Viele Sichtbarkeits- und Conversion-Probleme hängen nicht nur an Texten, sondern an technischer Umsetzung, Ladezeiten, Struktur und Wartbarkeit.', 'Deshalb ist Webentwicklung besonders dann wichtig, wenn eine Website wachsen, integriert oder stabil weiterentwickelt werden soll.'],
    relatedTitle: 'Technisch passende Seiten',
    relatedLinks: [
      { href: 'backend-entwicklung-bielefeld.html', title: 'Backend Entwicklung Bielefeld', text: 'Für individuelle Logik, Daten und Prozesse.' },
      { href: 'website-relaunch-bielefeld.html', title: 'Website Relaunch Bielefeld', text: 'Wenn eine bestehende Website neu aufgebaut werden soll.' },
      { href: 'website-ist-langsam-und-konvertiert-nicht.html', title: 'Website ist langsam und konvertiert nicht', text: 'Wenn Technik und Geschäftswirkung zusammenhängen.' },
    ],
    faq: [
      { question: 'Worin unterscheidet sich Webentwicklung von Webdesign?', answer: 'Webdesign fokussiert stärker auf Struktur, Botschaft und Darstellung. Webentwicklung fokussiert auf technische Umsetzung, Performance und Erweiterbarkeit.' },
      { question: 'Ist Webentwicklung auch für kleinere Websites relevant?', answer: 'Ja, sobald Performance, Wartbarkeit oder individuelle Anforderungen wichtig werden.' },
      { question: 'Hilft gute Webentwicklung auch bei SEO?', answer: 'Ja. Saubere Technik, schnelle Ladezeiten und gute Seitenstruktur unterstützen Suchmaschinen dabei, Inhalte besser zu crawlen und zu verstehen.' },
    ],
  },
  {
    fileName: 'backend-entwicklung-bielefeld.html',
    title: 'Backend Entwicklung Bielefeld | Individuelle Website-Funktionen und Prozesse',
    description: 'Backend Entwicklung in Bielefeld für Websites mit individuellen Prozessen, Formularlogik, Datenflüssen oder Schnittstellen.',
    eyebrow: 'Backend Entwicklung Bielefeld',
    h1: 'Backend Entwicklung in Bielefeld für Websites mit individuellen Anforderungen',
    introTitle: 'Wenn Standard-Websites nicht mehr ausreichen',
    introText: 'Backend Entwicklung ist wichtig, wenn eine Website nicht nur informieren, sondern Prozesse abbilden, Daten verarbeiten oder mit anderen Systemen zusammenarbeiten soll.',
    points: ['Individuelle Formular- und Anfrageprozesse', 'Saubere Datenflüsse und Logik', 'Erweiterbare Struktur für spätere Anforderungen', 'Mehr Kontrolle über technische Abläufe'],
    detailTitle: 'Wann Backend-Themen relevant werden',
    detailParagraphs: ['Sobald eine Website mehr leisten soll als statische Inhalte, werden Backend-Themen wichtig: Formulare, Automatisierungen, Datenmanagement oder technische Integrationen.', 'Gerade bei Websites, die ein echter Vertriebskanal werden sollen, ist eine saubere Backend-Grundlage häufig ein unterschätzter Hebel.'],
    relatedTitle: 'Passende Ergänzungen',
    relatedLinks: [
      { href: 'webentwicklung-bielefeld.html', title: 'Webentwicklung Bielefeld', text: 'Die breitere technische Grundlage für moderne Websites.' },
      { href: 'anfrage.html', title: 'Projekt anfragen', text: 'Direkter Einstieg für Unternehmen mit technischen Anforderungen.' },
      { href: 'leistungen.html', title: 'Leistungen im Überblick', text: 'Alle verbundenen Themen auf einen Blick.' },
    ],
    faq: [
      { question: 'Braucht jedes Unternehmen Backend Entwicklung?', answer: 'Nein. Aber sobald individuelle Prozesse, Formulare, Daten oder Integrationen eine Rolle spielen, wird sie relevant.' },
      { question: 'Ist Backend Entwicklung nur für große Projekte sinnvoll?', answer: 'Nicht unbedingt. Auch kleinere Websites können von sauberer technischer Logik profitieren, wenn daraus bessere Abläufe entstehen.' },
      { question: 'Hilft das auch bei Anfragen?', answer: 'Ja. Gute Backend-Strukturen helfen dabei, Anfragen sauber zu erfassen, weiterzuleiten und technisch zuverlässig abzubilden.' },
    ],
  },
  {
    fileName: 'website-bringt-keine-anfragen.html',
    title: 'Website bringt keine Anfragen | Analyse für lokale Unternehmen in Bielefeld',
    description: 'Wenn eine Website keine Anfragen bringt, liegen die Ursachen oft bei Botschaft, Struktur, Vertrauen oder Kontaktführung. Diese Seite zeigt die typischen Hebel.',
    eyebrow: 'Problemseite',
    h1: 'Wenn Ihre Website keine Anfragen bringt',
    introTitle: 'Die Website ist online, aber sie arbeitet nicht richtig',
    introText: 'Viele Unternehmenswebsites sehen ordentlich aus, aber sie führen Besucher nicht zu einer Entscheidung. Genau dann entstehen zu wenig Anfragen, obwohl grundsätzlich Bedarf da wäre.',
    points: ['Unklare Botschaft auf der Startseite', 'Zu wenig Vertrauen oder Belege', 'Zu schwache mobile Nutzerführung', 'Kontaktwege sind versteckt oder unnötig kompliziert'],
    detailTitle: 'Wo die meisten Websites Anfragen verlieren',
    detailParagraphs: ['Oft liegt das Problem nicht an fehlendem Traffic allein, sondern daran, dass Besucher nicht schnell genug verstehen, warum sie gerade hier anfragen sollten.', 'Deshalb ist diese Problemseite bewusst auf Unternehmen zugeschnitten, die das Gefühl haben, dass ihre Website vorhanden ist, aber geschäftlich zu wenig beiträgt.'],
    relatedTitle: 'Passende Lösungsseiten',
    relatedLinks: [
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Für klarere Nutzerführung und stärkere erste Eindrücke.' },
      { href: 'website-relaunch-bielefeld.html', title: 'Website Relaunch Bielefeld', text: 'Wenn die bestehende Website grundsätzlich neu geordnet werden muss.' },
      { href: 'anfrage.html', title: 'Kostenlose Einschätzung anfragen', text: 'Direkter Einstieg, wenn die Website aktuell zu wenig bringt.' },
    ],
    faq: [
      { question: 'Liegt es immer am Design?', answer: 'Nein. Häufig sind Botschaft, Vertrauen, Struktur oder Kontaktführung das eigentliche Problem.' },
      { question: 'Braucht man dafür sofort einen kompletten Relaunch?', answer: 'Nicht immer. Manchmal reichen gezielte Anpassungen, manchmal ist ein Relaunch sinnvoller. Das hängt von der Ausgangslage ab.' },
      { question: 'Ist das auch ein SEO-Thema?', answer: 'Ja, teilweise. Eine Website kann zu wenig Anfragen bringen, weil sie entweder nicht sichtbar genug ist oder weil sie Besucher nach dem Klick nicht gut genug weiterführt.' },
    ],
  },
  {
    fileName: 'website-wird-bei-google-nicht-gefunden.html',
    title: 'Website wird bei Google nicht gefunden | SEO für lokale Unternehmen in Bielefeld',
    description: 'Wenn Ihre Website bei Google kaum sichtbar ist, helfen klare Seitenstruktur, lokale Relevanz und technische SEO-Grundlagen.',
    eyebrow: 'Problemseite',
    h1: 'Wenn Ihre Website bei Google nicht gefunden wird',
    introTitle: 'Sichtbarkeitsprobleme haben oft klare Ursachen',
    introText: 'Viele lokale Unternehmen merken erst spät, dass ihre Website für relevante Suchanfragen kaum sichtbar ist. Dann fehlen entweder klare Themen-Seiten, lokale Signale oder technische SEO-Grundlagen.',
    points: ['Leistungsseiten sind zu unklar oder fehlen', 'Die Region ist auf der Website zu schwach verankert', 'Meta-Daten und Struktur helfen Google zu wenig', 'Es gibt kaum hilfreiche interne Link-Logik'],
    detailTitle: 'Wie Websites wieder sichtbarer werden',
    detailParagraphs: ['Sichtbarkeit entsteht nicht durch bloße Keyword-Wiederholung. Entscheidend sind saubere Themen-Seiten, klare Suchintention, technische Ordnung und regionale Relevanz.', 'Gerade für Bielefeld und das direkte Umland hilft eine klare Kombination aus Leistungsseiten und gezielten Standortseiten.'],
    relatedTitle: 'Direkt passende Lösungsseiten',
    relatedLinks: [
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Die zentrale Leistungsseite für organische Sichtbarkeit.' },
      { href: 'local-seo-bielefeld.html', title: 'Local SEO Bielefeld', text: 'Für lokale Suchanfragen und regionale Zuordnung.' },
      { href: 'standorte.html', title: 'Standorte in OWL', text: 'Für die regionale Seitenstruktur rund um Bielefeld.' },
    ],
    faq: [
      { question: 'Wie merkt man, dass die Website zu wenig sichtbar ist?', answer: 'Typische Anzeichen sind ausbleibende organische Anfragen, schwache Rankings für relevante Suchbegriffe oder insgesamt sehr wenig passende Website-Besucher.' },
      { question: 'Hilft nur mehr Content?', answer: 'Nicht automatisch. Oft ist es wichtiger, die richtigen Seiten sauber aufzubauen, statt einfach mehr Inhalte zu produzieren.' },
      { question: 'Kann lokale Sichtbarkeit ohne große Agentur verbessert werden?', answer: 'Ja. Vor allem dann, wenn die wichtigsten Seiten strukturiert, lokal relevant und technisch sauber aufgebaut werden.' },
    ],
  },
  {
    fileName: 'website-ist-langsam-und-konvertiert-nicht.html',
    title: 'Website ist langsam und konvertiert nicht | Performance und Conversion in Bielefeld',
    description: 'Langsame Websites und schwache Conversion hängen oft zusammen. Diese Seite richtet sich an Unternehmen, deren Website technisch und geschäftlich zu wenig leistet.',
    eyebrow: 'Problemseite',
    h1: 'Wenn Ihre Website langsam ist und trotzdem nicht überzeugt',
    introTitle: 'Performance und Anfragen gehören zusammen',
    introText: 'Langsame Websites kosten nicht nur Rankings, sondern auch Vertrauen und Anfragen. Gerade mobil springt ein großer Teil der Besucher ab, wenn Seiten zu lange laden oder unruhig wirken.',
    points: ['Schlechte mobile Ladezeiten', 'Zu große Medien und unnötige Last', 'Schwache Nutzerführung trotz vorhandener Inhalte', 'Wenig Vertrauen und keine klare Handlungsauslösung'],
    detailTitle: 'Was hier meistens verbessert werden muss',
    detailParagraphs: ['Oft treffen zwei Probleme gleichzeitig zusammen: eine technische Schwäche und eine inhaltlich schwache Conversion-Führung. Dann bringt selbst vorhandener Traffic zu wenig Geschäftsergebnis.', 'Für lokale Unternehmen ist das besonders kritisch, weil viele Interessenten mobil, schnell und mit klarer Handlungsabsicht suchen.'],
    relatedTitle: 'Passende Leistungsseiten',
    relatedLinks: [
      { href: 'webentwicklung-bielefeld.html', title: 'Webentwicklung Bielefeld', text: 'Für die technische Basis und bessere Performance.' },
      { href: 'website-relaunch-bielefeld.html', title: 'Website Relaunch Bielefeld', text: 'Wenn Struktur und Technik zusammen überarbeitet werden müssen.' },
      { href: 'website-bringt-keine-anfragen.html', title: 'Website bringt keine Anfragen', text: 'Für den Conversion-Blick auf das Problem.' },
    ],
    faq: [
      { question: 'Ist Ladezeit wirklich so wichtig?', answer: 'Ja. Ladezeit beeinflusst Nutzerverhalten, mobile Nutzbarkeit und auch die Suchmaschinenwahrnehmung einer Website.' },
      { question: 'Reicht Bildkomprimierung allein?', answer: 'Nicht immer. Häufig geht es auch um technische Struktur, unnötige Last, Interaktionslogik und die gesamte Seitenarchitektur.' },
      { question: 'Warum ist das ein SEO-Thema?', answer: 'Weil technische Qualität, Nutzersignale und Website-Erlebnis eng mit Sichtbarkeit und Conversion zusammenhängen.' },
    ],
  },
];

const locationPages = [
  {
    fileName: 'webdesign-bad-salzuflen.html',
    title: 'Webdesign Bad Salzuflen | Websites für lokale Unternehmen',
    description: 'Webdesign in Bad Salzuflen für Unternehmen, die professioneller auftreten und online mehr Anfragen erhalten möchten.',
    city: 'Bad Salzuflen',
    localAngle: 'Bad Salzuflen ist als Markt für lokale Dienstleistungen, Gesundheitsangebote und etablierte Unternehmen interessant, die online klarer auftreten möchten.',
  },
  {
    fileName: 'webdesign-guetersloh.html',
    title: 'Webdesign Gütersloh | Websites für mehr Sichtbarkeit und Anfragen',
    description: 'Webdesign in Gütersloh für Unternehmen, die eine stärkere Website als Vertriebs- und Sichtbarkeitswerkzeug aufbauen möchten.',
    city: 'Gütersloh',
    localAngle: 'Gütersloh verbindet viele mittelständische Strukturen mit starkem Wettbewerbsumfeld, weshalb klare Positionierung und überzeugende Websites besonders wichtig sind.',
  },
  {
    fileName: 'webdesign-detmold.html',
    title: 'Webdesign Detmold | Moderne Websites für lokale Unternehmen',
    description: 'Webdesign in Detmold für Unternehmen, die online überzeugender auftreten und mehr qualifizierte Anfragen gewinnen möchten.',
    city: 'Detmold',
    localAngle: 'Detmold und der Kreis Lippe sind für viele lokale Unternehmen ein Markt, in dem Vertrauen, Seriosität und regionale Sichtbarkeit besonders stark wirken.',
  },
  {
    fileName: 'webdesign-leopoldshoehe.html',
    title: 'Webdesign Leopoldshöhe | Websites für lokale Unternehmen',
    description: 'Webdesign in Leopoldshöhe für Unternehmen, die mit einer klareren Website professioneller auftreten und mehr Anfragen erhalten möchten.',
    city: 'Leopoldshöhe',
    localAngle: 'In Leopoldshöhe sind persönliche Nähe und regionale Vertrauenssignale oft besonders wichtig, weil Märkte kleiner und Empfehlungen relevanter sind.',
  },
  {
    fileName: 'webdesign-oerlinghausen.html',
    title: 'Webdesign Oerlinghausen | Websites mit Fokus auf Anfragen',
    description: 'Webdesign in Oerlinghausen für Unternehmen, die ihre Website als klares Anfrage- und Vertrauenswerkzeug nutzen möchten.',
    city: 'Oerlinghausen',
    localAngle: 'Für Unternehmen in Oerlinghausen ist eine gut verständliche Website oft ein entscheidender Hebel, um regionale Nachfrage besser aufzufangen.',
  },
  {
    fileName: 'webdesign-verl.html',
    title: 'Webdesign Verl | Websites für lokale Sichtbarkeit und Anfragen',
    description: 'Webdesign in Verl für Unternehmen, die online klarer auftreten und ihre Website stärker auf Anfragen ausrichten möchten.',
    city: 'Verl',
    localAngle: 'Verl ist für viele Unternehmen ein interessanter regionaler Suchmarkt, in dem professionelle Websites und lokale Sichtbarkeit spürbar helfen können.',
  },
  {
    fileName: 'webdesign-lage.html',
    title: 'Webdesign Lage | Moderne Websites für Unternehmen',
    description: 'Webdesign in Lage für Unternehmen, die online professioneller wirken und mehr Anfragen generieren möchten.',
    city: 'Lage',
    localAngle: 'In Lage ist eine Website besonders dann wertvoll, wenn sie Vertrauen, lokale Nähe und ein klares Leistungsversprechen schnell vermittelt.',
  },
  {
    fileName: 'webdesign-schloss-holte-stukenbrock.html',
    title: 'Webdesign Schloß Holte-Stukenbrock | Websites für lokale Unternehmen',
    description: 'Webdesign in Schloß Holte-Stukenbrock für Unternehmen, die online überzeugender auftreten und mehr qualifizierte Anfragen gewinnen möchten.',
    city: 'Schloß Holte-Stukenbrock',
    localAngle: 'Schloß Holte-Stukenbrock gehört zu den regionalen Märkten, in denen eine starke Website Vertrauen, Klarheit und Nachfrage besser bündeln kann.',
  },
];

const industryPages = [
  {
    fileName: 'webdesign-handwerker-bielefeld.html',
    title: 'Webdesign für Handwerker in Bielefeld | Mehr Anfragen für Handwerksbetriebe',
    description: 'Webdesign für Handwerksbetriebe in Bielefeld, die online professioneller auftreten und mehr qualifizierte Anfragen gewinnen möchten.',
    eyebrow: 'Handwerk',
    h1: 'Webdesign für Handwerker in Bielefeld, die online mehr Anfragen gewinnen wollen',
    introTitle: 'Websites für Handwerksbetriebe mit klarem Nutzen',
    introText: 'Viele Handwerksbetriebe haben gute Leistungen, aber die Website erklärt diese zu unklar, wirkt veraltet oder führt Besucher nicht schnell genug zur Kontaktaufnahme. Genau dort setzt diese Branchenseite an.',
    points: [
      'Leistungen und Einsatzgebiete klar verständlich machen',
      'Vertrauen durch Referenzen, Bilder und klare Ansprechpartner stärken',
      'Mobile Kontaktaufnahme und schnelle Orientierung verbessern',
      'Besser für lokale Suchanfragen rund um Handwerk in Bielefeld aufgestellt sein',
    ],
    detailTitle: 'Was bei Websites für Handwerker besonders wichtig ist',
    detailParagraphs: [
      'Handwerksseiten müssen schnell verständlich sein: Was wird angeboten, in welchem Gebiet wird gearbeitet und wie läuft die Anfrage ab? Genau das entscheidet oft darüber, ob aus einem Besucher ein echter Kontakt wird.',
      'Die vorhandenen Projektbeispiele auf dieser Website zeigen die Herangehensweise an Struktur, Klarheit und Conversion. Sie stehen bewusst nicht als erfundene Handwerks-Referenzen, sondern als ehrlicher Nachweis der Arbeitsweise.',
    ],
    relatedTitle: 'Passende Seiten für Handwerksbetriebe',
    relatedLinks: [
      { href: 'website-bringt-keine-anfragen.html', title: 'Website bringt keine Anfragen', text: 'Wenn die Website vorhanden ist, aber zu wenig Kontakte daraus entstehen.' },
      { href: 'local-seo-bielefeld.html', title: 'Local SEO Bielefeld', text: 'Für regionale Sichtbarkeit bei Suchanfragen mit Ortsbezug.' },
      { href: 'projekte.html', title: 'Projektbeispiele', text: 'Vorhandene Arbeiten als Einblick in Struktur und Herangehensweise.' },
    ],
    faq: [
      { question: 'Brauchen Handwerksbetriebe wirklich mehr als eine einfache Website?', answer: 'Oft ja. Gerade im lokalen Wettbewerb zählen klare Leistungen, Vertrauenssignale, saubere mobile Nutzung und ein einfacher Kontaktweg.' },
      { question: 'Muss es viele Referenzen aus dem Handwerk geben?', answer: 'Nicht zwingend. Wichtiger ist, dass die Website die typischen Entscheidungsfaktoren von Handwerkskunden gut abbildet.' },
      { question: 'Hilft eine bessere Website auch bei Google?', answer: 'Ja. Wenn Leistungen, Regionen und Kontaktwege klarer dargestellt sind, hilft das sowohl Nutzern als auch Suchmaschinen.' },
    ],
  },
  {
    fileName: 'webdesign-praxen-bielefeld.html',
    title: 'Webdesign für Praxen in Bielefeld | Mehr Vertrauen und Anfragen',
    description: 'Webdesign für Praxen in Bielefeld, die online professioneller wirken, Vertrauen aufbauen und Patientenanfragen besser unterstützen möchten.',
    eyebrow: 'Praxen',
    h1: 'Webdesign für Praxen in Bielefeld mit Fokus auf Vertrauen und klare Patientenanfragen',
    introTitle: 'Wenn eine Praxis-Website Vertrauen schneller aufbauen soll',
    introText: 'Bei Praxen entscheidet der erste Eindruck besonders stark über Vertrauen. Eine gute Website muss Seriosität, Leistungen, Ansprechpartner und Kontaktmöglichkeiten klar vermitteln.',
    points: [
      'Vertrauen durch Struktur, Tonalität und Klarheit stärken',
      'Leistungen verständlich und ruhig darstellen',
      'Kontakt, Anfahrt und wichtige Informationen sofort auffindbar machen',
      'Eine Website schaffen, die professionell wirkt und Hemmschwellen senkt',
    ],
    detailTitle: 'Was Websites für Praxen leisten müssen',
    detailParagraphs: [
      'Praxen brauchen in der Regel keine laute Website, sondern eine, die Orientierung, Vertrauen und professionelle Sicherheit vermittelt. Das gilt besonders für mobile Nutzer, die schnell Informationen suchen.',
      'Die vorhandenen Projekte auf dieser Website werden nicht als Praxis-Referenzen ausgegeben. Sie zeigen stattdessen die Herangehensweise an Struktur, Nutzerführung und Anfragen.',
    ],
    relatedTitle: 'Passende Seiten für Praxen',
    relatedLinks: [
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Die zentrale Leistungsseite für Website-Struktur und Anfragen.' },
      { href: 'website-relaunch-bielefeld.html', title: 'Website Relaunch Bielefeld', text: 'Wenn eine bestehende Praxis-Website modernisiert werden soll.' },
      { href: 'anfrage.html', title: 'Kostenlose Einschätzung anfragen', text: 'Direkter Einstieg für eine erste Bewertung der aktuellen Website.' },
    ],
    faq: [
      { question: 'Was ist bei einer Praxis-Website wichtiger als bei anderen Branchen?', answer: 'Vor allem Vertrauen, Seriosität, klare Informationen und eine ruhige, verlässliche Nutzerführung.' },
      { question: 'Braucht eine Praxis-Website Local SEO?', answer: 'Ja, in vielen Fällen. Patienten suchen häufig lokal und erwarten klare regionale Zuordnung.' },
      { question: 'Ist eine schöne Gestaltung schon genug?', answer: 'Nein. Entscheidend ist, ob Leistungen, Kontaktwege und Vertrauenssignale schnell verständlich sind.' },
    ],
  },
  {
    fileName: 'webdesign-dienstleister-bielefeld.html',
    title: 'Webdesign für Dienstleister in Bielefeld | Websites für mehr Anfragen',
    description: 'Webdesign für Dienstleister in Bielefeld, die ihre Leistungen klarer erklären und aus Website-Besuchern mehr qualifizierte Anfragen machen möchten.',
    eyebrow: 'Dienstleister',
    h1: 'Webdesign für Dienstleister in Bielefeld, die online klarer überzeugen wollen',
    introTitle: 'Wenn erklärungsbedürftige Leistungen online zu unklar wirken',
    introText: 'Lokale Dienstleister haben oft das gleiche Problem: Die Leistung ist gut, aber auf der Website wird sie nicht schnell genug verständlich. Dann gehen Vertrauen und Anfragen verloren.',
    points: [
      'Leistungen und Nutzen klarer formulieren',
      'Den Unterschied zu Wettbewerbern verständlicher zeigen',
      'Kontaktwege sichtbarer und einfacher machen',
      'Die Website stärker auf qualifizierte Anfragen ausrichten',
    ],
    detailTitle: 'Warum Dienstleister besonders von klarer Website-Struktur profitieren',
    detailParagraphs: [
      'Bei Dienstleistern verkaufen oft nicht Produkte, sondern Vertrauen, Klarheit und das Gefühl, dass das Angebot zum eigenen Problem passt. Genau deshalb muss die Website den Entscheidungsprozess gut tragen.',
      'Die bestehenden Projektseiten dienen hier als ehrliche Beispiele für Positionierung, Struktur und Conversion-Denken, nicht als vorgetäuschte Branchen-Referenzen.',
    ],
    relatedTitle: 'Passende Seiten für Dienstleister',
    relatedLinks: [
      { href: 'online-marketing-bielefeld.html', title: 'Online Marketing Bielefeld', text: 'Wenn Website und Nachfrage besser zusammenspielen sollen.' },
      { href: 'website-wird-bei-google-nicht-gefunden.html', title: 'Website wird bei Google nicht gefunden', text: 'Für Dienstleister mit zu wenig organischer Sichtbarkeit.' },
      { href: 'projekte.html', title: 'Projektbeispiele', text: 'Einblick in die Arbeitsweise bei Struktur und Nutzerführung.' },
    ],
    faq: [
      { question: 'Warum ist Webdesign für Dienstleister oft ein Conversion-Thema?', answer: 'Weil Vertrauen, Klarheit und der Weg zur Anfrage bei Dienstleistungen meist wichtiger sind als reine Gestaltung.' },
      { question: 'Ist diese Seite nur für klassische Agentur-Dienstleistungen gedacht?', answer: 'Nein. Sie richtet sich allgemein an lokale Dienstleister mit erklärungsbedürftigen Leistungen.' },
      { question: 'Kann eine klarere Website auch die Qualität der Anfragen verbessern?', answer: 'Ja. Wenn Leistungen, Zielgruppen und Abläufe klarer sind, werden Anfragen oft passender.' },
    ],
  },
  {
    fileName: 'webdesign-beratung-bielefeld.html',
    title: 'Webdesign für Berater in Bielefeld | Klarheit, Vertrauen und Sichtbarkeit',
    description: 'Webdesign für Berater und Beratungen in Bielefeld, die Expertise sichtbar machen und online mehr qualifizierte Anfragen gewinnen möchten.',
    eyebrow: 'Beratung',
    h1: 'Webdesign für Berater in Bielefeld mit Fokus auf Expertise und Vertrauen',
    introTitle: 'Wenn Expertise online nicht klar genug sichtbar wird',
    introText: 'Beratungen und einzelne Berater leben davon, dass Menschen Vertrauen in Kompetenz, Vorgehen und Passung gewinnen. Eine Website muss genau das früh und klar vermitteln.',
    points: [
      'Expertise und Positionierung klarer sichtbar machen',
      'Vertrauen durch klare Botschaften und seriöse Struktur aufbauen',
      'Leistungen, Zielgruppen und Abläufe verständlicher darstellen',
      'Aus Website-Besuchern häufiger qualifizierte Anfragen machen',
    ],
    detailTitle: 'Was Berater-Websites in Bielefeld leisten müssen',
    detailParagraphs: [
      'Gerade bei Beratungsleistungen entscheidet die Website oft darüber, ob jemand fachliche Kompetenz zutraut oder weitersucht. Deshalb müssen Nutzen, Spezialisierung und nächster Schritt schnell erkennbar sein.',
      'Auch hier gilt: Die Projektbeispiele auf dieser Website zeigen Arbeitsweise und Denkansatz, nicht erfundene Beratungs-Referenzen aus Branchen, in denen keine Projekte vorliegen.',
    ],
    relatedTitle: 'Passende Seiten für Berater',
    relatedLinks: [
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Für Berater, die bei Google sichtbarer werden wollen.' },
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Die übergeordnete Leistungsseite für Website-Struktur und Conversion.' },
      { href: 'website-bringt-keine-anfragen.html', title: 'Website bringt keine Anfragen', text: 'Wenn Expertise da ist, aber online zu wenig Resonanz entsteht.' },
    ],
    faq: [
      { question: 'Warum ist Webdesign für Berater so sensibel?', answer: 'Weil Beratung stark über Vertrauen, Passung und klare Positionierung verkauft wird. Eine unklare Website kostet hier schnell Chancen.' },
      { question: 'Reicht eine schöne Website für Beratungen aus?', answer: 'Nein. Wichtig ist, dass Spezialisierung, Nutzen, Zielgruppe und nächster Schritt verständlich werden.' },
      { question: 'Kann eine Berater-Website gleichzeitig SEO und Vertrauen stärken?', answer: 'Ja. Wenn Inhalte klar strukturiert, zielgerichtet formuliert und technisch sauber umgesetzt sind, unterstützen sie beides.' },
    ],
  },
];

for (const page of servicePages) {
  renderPage(page);
}

for (const page of locationPages) {
  renderPage({
    fileName: page.fileName,
    title: page.title,
    description: page.description,
    eyebrow: page.city,
    h1: `Webdesign in ${page.city} für lokale Unternehmen mit mehr Anspruch an Sichtbarkeit und Anfragen`,
    introTitle: `Webdesign für Unternehmen in ${page.city}`,
    introText: `${page.localAngle} Die Website sollte deshalb nicht nur gut aussehen, sondern Leistungen klar erklären und den Weg zur Anfrage vereinfachen.`,
    points: [
      `Klarere Website für Unternehmen in ${page.city}`,
      'Bessere mobile Nutzerführung und mehr Vertrauen',
      'Stärkere Verbindung aus Sichtbarkeit und Anfrage',
      'Regionale Relevanz für Suchmaschinen und lokale Kunden',
    ],
    detailTitle: `Worauf es in ${page.city} besonders ankommt`,
    detailParagraphs: [
      `Für Unternehmen in ${page.city} lohnt sich Webdesign vor allem dann, wenn die Website nicht nur repräsentativ sein soll, sondern tatsächlich ein Werkzeug für Nachfrage, Sichtbarkeit und Vertrauen werden muss.`,
      'Deshalb ist diese Seite bewusst regional aufgeladen, ohne beliebig zu werden: lokale Relevanz, klare Leistungen und gute Kontaktführung stehen im Vordergrund.',
    ],
    relatedTitle: 'Passende regionale und fachliche Seiten',
    relatedLinks: [
      { href: 'webdesign-bielefeld.html', title: 'Webdesign Bielefeld', text: 'Die zentrale Leistungsseite für die Hauptregion.' },
      { href: 'seo-bielefeld.html', title: 'SEO Bielefeld', text: 'Für Unternehmen, die zusätzlich organisch besser gefunden werden wollen.' },
      { href: 'standorte.html', title: 'Standorte in OWL', text: 'Überblick über die regionale Ausrichtung rund um Bielefeld.' },
    ],
    faq: [
      { question: `Ist diese Seite nur für Unternehmen aus ${page.city}?`, answer: `Sie ist speziell auf ${page.city} ausgerichtet, kann aber auch für Unternehmen im direkten Umfeld relevant sein.` },
      { question: `Warum ist ${page.city} als eigener Standort sinnvoll?`, answer: 'Weil lokale Suchanfragen oft Leistung und Ort kombinieren. Eine eigenständige, regionale Seite hilft Suchmaschinen und Nutzern bei der Einordnung.' },
      { question: 'Geht es hier nur um Design?', answer: 'Nein. Die Seite verbindet Webdesign bewusst mit Sichtbarkeit, Vertrauen und Anfragen, weil diese Themen in der Praxis zusammenhängen.' },
    ],
  });
}

for (const page of industryPages) {
  renderPage(page);
}

console.log('SEO landing pages generated.');
