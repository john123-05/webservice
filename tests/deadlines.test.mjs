import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FRIST_ENTRY_FIELDS,
  consolidateData,
  createResearchJobs,
  deduplicateEntries,
  entriesToCsv,
  getNextOpenEntry,
  isPublishableEntry,
  sortEntriesByDeadline,
  validateEntry,
} from '../scripts/deadlines/lib.mjs';

const makeEntry = (overrides = {}) => ({
  id: 'testfest-2027-teststadt',
  event_name: 'Testfest 2027',
  event_type: 'Stadtfest',
  city: 'Teststadt',
  state: 'Nordrhein-Westfalen',
  country: 'DE',
  venue_or_area: 'Marktplatz',
  application_deadline_iso: '2026-10-15',
  application_deadline_text: '15.10.2026',
  event_date_range_text: '01.06.-03.06.2027',
  application_mode: 'Online',
  postal_address: 'Marktplatz 1, 12345 Teststadt',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  source_url: 'https://www.teststadt.de/testfest/bewerbung',
  source_domain: 'teststadt.de',
  source_kind: 'official',
  last_verified_at: '2026-08-02',
  agent_batch_id: 'test-batch',
  confidence_status: 'verified',
  notes: '',
  ...overrides,
});

const makeBatch = (entries, overrides = {}) => ({
  batch_id: 'test-batch',
  region_scope: ['Nordrhein-Westfalen'],
  search_terms: ['Testfest Bewerbung'],
  max_expected_results: 50,
  source_policy: 'official_only',
  researched_at: '2026-08-02',
  entries,
  rejected_candidates: [],
  review_candidates: [],
  ...overrides,
});

test('sortiert offene Fristen zuerst und vergangene Fristen zuletzt', () => {
  const entries = [
    makeEntry({ id: 'past', event_name: 'Vergangen', application_deadline_iso: '2026-07-01' }),
    makeEntry({ id: 'later', event_name: 'Später', application_deadline_iso: '2026-11-01' }),
    makeEntry({ id: 'next', event_name: 'Als Nächstes', application_deadline_iso: '2026-08-15' }),
  ];

  const sorted = sortEntriesByDeadline(entries, { today: new Date('2026-08-03T12:00:00Z') });
  assert.deepEqual(sorted.map((entry) => entry.id), ['next', 'later', 'past']);
  assert.equal(getNextOpenEntry(entries, new Date('2026-08-03T12:00:00Z')).id, 'next');
});

test('liefert keine vergangene Frist als nächste offene Frist', () => {
  const next = getNextOpenEntry([
    makeEntry({ application_deadline_iso: '2026-07-01' }),
  ], new Date('2026-08-03T12:00:00Z'));
  assert.equal(next, null);
});

test('fehlende optionale Ansprechpartner bleiben gültig', () => {
  const result = validateEntry(makeEntry());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('führt gleiche Veranstaltungen trotz unterschiedlicher offizieller Quellen zusammen', () => {
  const first = makeEntry({
    source_url: 'https://www.teststadt.de/testfest/bewerbung',
    source_domain: 'teststadt.de',
    contact_email: '',
  });
  const second = makeEntry({
    id: 'anderer-technischer-schluessel',
    source_url: 'https://veranstalter-testfest.de/ausschreibung',
    source_domain: 'veranstalter-testfest.de',
    contact_email: 'markt@teststadt.de',
    last_verified_at: '2026-08-03',
  });

  const merged = deduplicateEntries([first, second]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].source_domain, 'veranstalter-testfest.de');
  assert.equal(merged[0].contact_email, 'markt@teststadt.de');
});

test('führt präzisierte Zwischenstände mit derselben stabilen ID zusammen', () => {
  const draft = makeEntry({ event_name: 'Testfest' });
  const verified = makeEntry({
    event_name: 'Testfest 2027',
    event_date_range_text: '10.06.-12.06.2027',
    last_verified_at: '2026-08-03',
  });
  const merged = deduplicateEntries([draft, verified]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].event_name, 'Testfest 2027');
});

test('weist nicht-offizielle und ungültige Quellen zurück', () => {
  const wrongKind = validateEntry(makeEntry({ source_kind: 'press' }));
  const wrongDomain = validateEntry(makeEntry({ source_domain: 'example.org' }));
  assert.equal(wrongKind.valid, false);
  assert.equal(wrongDomain.valid, false);
});

test('fängt ungültige oder nicht parsebare Datumsangaben ab', () => {
  const invalid = validateEntry(makeEntry({ application_deadline_iso: '2026-02-31' }));
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(' '), /application_deadline_iso/);
});

test('needs_review bleibt im Master, aber nicht im Web-Datensatz', () => {
  const candidate = makeEntry({
    id: 'review',
    application_deadline_iso: '',
    application_deadline_text: '',
    confidence_status: 'needs_review',
  });
  const result = consolidateData({ batches: [makeBatch([candidate])] });
  assert.equal(result.errors.length, 0);
  assert.equal(result.entries.length, 1);
  assert.equal(result.publishableEntries.length, 0);
  assert.equal(isPublishableEntry(candidate), false);
});

test('konsolidiert mehrere Batches konfliktfrei', () => {
  const partial = makeEntry({ confidence_status: 'partial', postal_address: '' });
  const verified = makeEntry({
    confidence_status: 'verified',
    agent_batch_id: 'second-batch',
    contact_phone: '01234 567890',
    last_verified_at: '2026-08-03',
  });
  const result = consolidateData({
    batches: [
      makeBatch([partial]),
      makeBatch([verified], { batch_id: 'second-batch' }),
    ],
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].confidence_status, 'verified');
  assert.equal(result.entries[0].contact_phone, '01234 567890');
});

test('verwirft einen Batch mit falscher Quellenrichtlinie', () => {
  assert.throws(
    () => consolidateData({ batches: [makeBatch([], { source_policy: 'mixed' })] }),
    /official_only/,
  );
});

test('erzeugt eine deutschlandweite Welle mit 16 getrennten Agenten-Jobs', () => {
  const jobs = createResearchJobs('de-wave-001');
  assert.equal(jobs.length, 16);
  assert.equal(new Set(jobs.map((job) => job.batch_id)).size, 16);
  assert.ok(jobs.every((job) => job.source_policy === 'official_only'));
  assert.ok(jobs.every((job) => job.max_expected_results === 50));
});

test('verhindert Einträge mit einer fremden agent_batch_id', () => {
  const entry = makeEntry({ agent_batch_id: 'anderer-batch' });
  assert.throws(
    () => consolidateData({ batches: [makeBatch([entry])] }),
    /abweichende agent_batch_id/,
  );
});

test('CSV-Export hat stabile Spaltenfolge und escaped Inhalte', () => {
  const csv = entriesToCsv([makeEntry({ notes: 'Mit Komma, und "Zitat"' })]);
  const [header, row] = csv.trimEnd().split('\n');
  assert.equal(header, FRIST_ENTRY_FIELDS.join(','));
  assert.match(row, /"Mit Komma, und ""Zitat"""$/);
});

test('leerer und großer Datensatz werden ohne Sonderfall konsolidiert', () => {
  assert.deepEqual(consolidateData({}).entries, []);
  const entries = Array.from({ length: 1000 }, (_, index) => makeEntry({
    id: `event-${index}`,
    event_name: `Veranstaltung ${index}`,
    city: `Stadt ${index}`,
  }));
  const result = consolidateData({ batches: [makeBatch(entries)] });
  assert.equal(result.errors.length, 0);
  assert.equal(result.entries.length, 1000);
});
