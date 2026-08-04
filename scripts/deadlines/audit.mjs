import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..', '..');
const dataDir = join(rootDir, 'data', 'schausteller-bewerbungsfristen');
const masterPath = join(dataDir, 'master.json');

const checkLinks = process.argv.includes('--links');
const today = new Date().toISOString().slice(0, 10);

const master = existsSync(masterPath)
  ? JSON.parse(readFileSync(masterPath, 'utf8'))
  : { entries: [] };
const entries = master.entries || [];

let problems = 0;
const report = (label, list, render = (x) => x) => {
  if (!list.length) {
    console.log(`OK   ${label}`);
    return;
  }
  problems += list.length;
  console.log(`WARN ${label}: ${list.length}`);
  for (const item of list.slice(0, 12)) console.log(`       ${render(item)}`);
  if (list.length > 12) console.log(`       ... und ${list.length - 12} weitere`);
};

console.log(`Datensatz: ${entries.length} Eintraege, Stichtag ${today}\n`);

// 1. Abgelaufene Fristen - gehoeren nicht mehr in einen Kalender offener Fristen.
report(
  'Frist bereits abgelaufen',
  entries.filter((e) => e.application_deadline_iso < today),
  (e) => `${e.application_deadline_iso} ${e.event_name}`,
);

// 2. Doppelte IDs - waeren ein Fehler in der Deduplizierung.
const idCounts = entries.reduce((map, e) => map.set(e.id, (map.get(e.id) || 0) + 1), new Map());
report(
  'doppelte IDs',
  [...idCounts].filter(([, count]) => count > 1),
  ([id, count]) => `${id} (${count}x)`,
);

// 3. Bundeslaender ausserhalb der kanonischen Liste.
const STATES = new Set(['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen']);
report(
  'unbekanntes Bundesland',
  entries.filter((e) => !STATES.has(e.state)),
  (e) => `${e.state} (${e.event_name})`,
);

// 4. ASCII-Umschriften in nutzersichtbaren Feldern.
const BAD_TOKENS = ['fruehling', 'fruehjahr', 'huette', 'geschaefte', 'kraemer', 'maerkte',
  'schuetzen', 'weihnachtsmaerkte', 'staende', 'standplaetze', 'buerger', 'jaehrlich'];
report(
  'ASCII-Umschrift in Name, Typ oder Ort',
  entries.filter((e) => {
    const hay = `${e.event_name} ${e.event_type} ${e.city} ${e.venue_or_area}`.toLowerCase();
    return BAD_TOKENS.some((token) => hay.includes(token));
  }),
  (e) => `${e.event_name} [${e.city}]`,
);

// 5. Kontaktarmut - ohne Kontaktweg kann sich niemand bewerben.
report(
  'weder E-Mail noch Telefon noch Anschrift',
  entries.filter((e) => !e.contact_email && !e.contact_phone && !e.postal_address),
  (e) => `${e.event_name} [${e.city}]`,
);

// 6. Stimmt der Fristtext mit dem ISO-Datum ueberein? Ein Auseinanderlaufen
// von angezeigtem Text und sortiertem Datum ist der gefaehrlichste Fehler,
// weil der Kalender dann nach einem anderen Tag sortiert als er anzeigt.
// Deutsche und englische Monatsnamen, weil einige Messequellen englisch sind.
const MONTHS = ['januar|january', 'februar|february', 'märz|march', 'april', 'mai|may',
  'juni|june', 'juli|july', 'august', 'september', 'oktober|october',
  'november', 'dezember|december'];

const textMatchesDate = (entry) => {
  const [year, month, day] = entry.application_deadline_iso.split('-');
  const text = entry.application_deadline_text.toLowerCase();
  if (!text) return true;

  const dayNum = String(Number(day));
  const monthNum = String(Number(month));
  const monthName = MONTHS[Number(month) - 1];

  // Akzeptiert "30.11.2026", "30.11.", "30. November 2026" und "30. November".
  const numeric = new RegExp(`\\b0?${dayNum}\\s*\\.\\s*0?${monthNum}\\s*\\.`);
  // "30. November", "30 June" und "November 30" werden akzeptiert.
  const written = new RegExp(`\\b0?${dayNum}\\s*\\.?\\s*(${monthName})|(${monthName})\\s+0?${dayNum}\\b`);
  if (numeric.test(text) || written.test(text)) return true;

  // Manche Texte nennen nur das Jahr plus eine Regel; dann reicht das Jahr.
  return !text.includes(year) ? false : numeric.test(text) || written.test(text);
};

report(
  'Fristtext nennt ein anderes Datum als das ISO-Feld',
  entries.filter((e) => !textMatchesDate(e)),
  (e) => `${e.application_deadline_iso} <> "${e.application_deadline_text.slice(0, 90)}" [${e.event_name}]`,
);

console.log(`\n${problems ? `${problems} Auffaelligkeiten` : 'Keine Auffaelligkeiten'}.`);

if (!checkLinks) {
  console.log('\nTipp: --links prueft zusaetzlich alle Quell-URLs (dauert einige Minuten).');
  process.exit(problems ? 0 : 0);
}

// 7. Erreichbarkeit der Quellen. Bewusst optional, weil langsam und
// abhaengig von Netz und Rate Limits der Staedte.
const urls = [...new Set(entries.map((e) => e.source_url))];
console.log(`\nPruefe ${urls.length} Quell-URLs ...`);
const results = [];
const queue = [...urls];

const worker = async () => {
  while (queue.length) {
    const url = queue.pop();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImpressRankLinkCheck/1.0)' },
      });
      results.push([response.status, url]);
    } catch (error) {
      results.push([error.name === 'AbortError' ? 'TIMEOUT' : 'ERR', url]);
    } finally {
      clearTimeout(timer);
    }
  }
};

await Promise.all(Array.from({ length: 10 }, worker));

// 403 und 429 sind Blockaden der Betreiber, keine toten Links.
const dead = results.filter(([status]) => status === 404 || status === 410 || status === 'ERR');
const blocked = results.filter(([status]) => status === 403 || status === 429 || status === 'TIMEOUT');
console.log(`erreichbar: ${results.filter(([s]) => s === 200).length}, blockiert: ${blocked.length}, tot: ${dead.length}`);
for (const [status, url] of dead) console.log(`  TOT  ${status}  ${url}`);
for (const [status, url] of blocked) console.log(`  ---  ${status}  ${url}`);
