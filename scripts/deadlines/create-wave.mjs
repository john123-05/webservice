import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createResearchJobs } from './lib.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..', '..');
const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
};

const today = new Date().toISOString().slice(0, 10);
const waveId = valueAfter('--wave-id') || `de-wave-${today}`;
const maxExpectedResults = Number(valueAfter('--max-results') || 50);

if (!/^[a-z0-9-]+$/.test(waveId)) {
  throw new Error('wave-id darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten');
}
if (!Number.isInteger(maxExpectedResults) || maxExpectedResults < 1 || maxExpectedResults > 100) {
  throw new Error('max-results muss zwischen 1 und 100 liegen');
}

const outputDir = join(
  rootDir,
  'data',
  'schausteller-bewerbungsfristen',
  'research-jobs',
  waveId,
);
mkdirSync(outputDir, { recursive: true });

const jobs = createResearchJobs(waveId, { maxExpectedResults });
for (const job of jobs) {
  const stateSlug = job.batch_id.slice(waveId.length + 1);
  writeFileSync(join(outputDir, `${stateSlug}.json`), `${JSON.stringify(job, null, 2)}\n`);
}

console.log(`${jobs.length} Research-Jobs in ${outputDir} erzeugt.`);
