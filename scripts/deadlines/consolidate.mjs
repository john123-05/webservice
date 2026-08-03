import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consolidateData, entriesToCsv } from './lib.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..', '..');
const dataDir = join(rootDir, 'data', 'schausteller-bewerbungsfristen');
const batchDir = join(dataDir, 'batches');
const masterPath = join(dataDir, 'master.json');
const webPath = join(dataDir, 'web.json');
const csvPath = join(dataDir, 'export.csv');
const researchLogPath = join(dataDir, 'research-log.json');
const exclusionsPath = join(dataDir, 'excluded-entries.json');
const checkOnly = process.argv.includes('--check');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const master = existsSync(masterPath) ? readJson(masterPath) : { entries: [] };
const excludedIds = new Set(
  existsSync(exclusionsPath) ? (readJson(exclusionsPath).ids || []) : [],
);
const batchPaths = existsSync(batchDir)
  ? readdirSync(batchDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => join(batchDir, fileName))
  : [];
const batches = batchPaths.map(readJson).map((batch) => ({
  ...batch,
  entries: Array.isArray(batch.entries)
    ? batch.entries.filter((entry) => !excludedIds.has(entry.id))
    : batch.entries,
}));

const { entries, publishableEntries, errors, warnings } = consolidateData({
  masterEntries: (master.entries || []).filter((entry) => !excludedIds.has(entry.id)),
  batches,
});

if (errors.length) {
  console.error('Fristen-Daten sind ungueltig:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const latestVerification = entries.reduce(
    (latest, entry) => entry.last_verified_at > latest ? entry.last_verified_at : latest,
    '',
  );
  const discardedCandidates = batches.flatMap((batch) => (
    (batch.rejected_candidates || []).map((candidate) => ({ ...candidate, agent_batch_id: batch.batch_id }))
  ));
  const reviewCandidates = batches.flatMap((batch) => (
    (batch.review_candidates || []).map((candidate) => ({ ...candidate, agent_batch_id: batch.batch_id }))
  ));

  if (!checkOnly) {
    mkdirSync(dataDir, { recursive: true });
    writeJson(masterPath, {
      schema_version: 1,
      updated_at: latestVerification,
      entries,
    });
    writeJson(webPath, {
      schema_version: 1,
      updated_at: latestVerification,
      entries: publishableEntries,
    });
    writeFileSync(csvPath, entriesToCsv(entries));
    writeJson(researchLogPath, {
      schema_version: 1,
      updated_at: latestVerification,
      rejected_candidates: discardedCandidates,
      review_candidates: reviewCandidates,
    });
  }

  console.log(
    `${entries.length} Master-Eintraege, ${publishableEntries.length} veroeffentlichbar, `
    + `${warnings.length} Warnungen${checkOnly ? ' (nur geprueft)' : ' (Exporte aktualisiert)'}.`,
  );
  for (const warning of warnings) console.warn(`- ${warning}`);
}
