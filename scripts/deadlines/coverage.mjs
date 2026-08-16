import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeText } from './lib.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..', '..');
const dataDir = join(rootDir, 'data', 'schausteller-bewerbungsfristen');
const masterPath = join(dataDir, 'master.json');
const queuePath = join(dataDir, 'coverage', 'queue.json');

const nextOnly = process.argv.includes('--next');
const asJson = process.argv.includes('--json');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

if (!existsSync(queuePath)) {
  console.error('coverage/queue.json fehlt.');
  process.exit(1);
}

const master = existsSync(masterPath) ? readJson(masterPath) : { entries: [] };
const queue = readJson(queuePath);

// Staedtenamen tolerant vergleichen: Umlaute, Zusaetze wie "(Saale)" und
// Bindestriche sollen nicht zu falschen Luecken fuehren.
const normalizeCity = (value) => normalizeText(value)
  .toLocaleLowerCase('de-DE')
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/\(.*?\)/g, '')
  .replace(/\b(am|an|der|die|das|im|in|bei|vor|ob)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, '')
  .trim();

const entriesByCity = new Map();
for (const entry of master.entries || []) {
  const key = normalizeCity(entry.city);
  if (!key) continue;
  entriesByCity.set(key, (entriesByCity.get(key) || 0) + 1);
}

const units = queue.units.map((unit) => {
  const covered = [];
  const open = [];
  let entryCount = 0;

  for (const city of unit.cities) {
    const count = entriesByCity.get(normalizeCity(city)) || 0;
    entryCount += count;
    (count > 0 ? covered : open).push(city);
  }

  const share = unit.cities.length ? covered.length / unit.cities.length : 0;
  return { ...unit, entryCount, covered, open, share };
});

const totalEntries = (master.entries || []).length;
const target = queue.target_entries || 1000;
const totalCities = units.reduce((sum, unit) => sum + unit.cities.length, 0);
const coveredCities = units.reduce((sum, unit) => sum + unit.covered.length, 0);

if (asJson) {
  console.log(JSON.stringify({ totalEntries, target, totalCities, coveredCities, units }, null, 2));
  process.exit(0);
}

// Naechste Einheit: offen oder in Arbeit, hoechste Tier-Prioritaet, dann
// die mit den meisten noch offenen Staedten.
const candidates = units
  .filter((unit) => unit.status !== 'done')
  .sort((left, right) => left.tier - right.tier || right.open.length - left.open.length);

if (nextOnly) {
  const next = candidates[0];
  if (!next) {
    console.log('Alle Einheiten sind als done markiert.');
    process.exit(0);
  }
  console.log(`Naechste Einheit: ${next.id} - ${next.label} (${next.state}, Tier ${next.tier})`);
  console.log(`Offene Staedte (${next.open.length}): ${next.open.join(', ')}`);
  process.exit(0);
}

const bar = (share) => {
  const filled = Math.round(share * 20);
  return `${'#'.repeat(filled)}${'.'.repeat(20 - filled)}`;
};

console.log(`Eintraege: ${totalEntries} von ${target} (${Math.round((totalEntries / target) * 100)} %)`);
console.log(`Staedte in der Warteschlange: ${coveredCities} von ${totalCities} mit mindestens einem Eintrag\n`);

for (const unit of units) {
  const flag = unit.status === 'done' ? 'done' : unit.status === 'in_progress' ? 'laeuft' : 'offen';
  console.log(
    `${bar(unit.share)} ${String(unit.entryCount).padStart(4)} Eintr.  T${unit.tier}  ${flag.padEnd(7)} ${unit.id.padEnd(30)} ${unit.covered.length}/${unit.cities.length} Staedte`,
  );
}

const next = candidates[0];
if (next) {
  console.log(`\nNaechste Einheit: ${next.id} - ${next.label}`);
  console.log(`Offene Staedte (${next.open.length}): ${next.open.join(', ')}`);
}
