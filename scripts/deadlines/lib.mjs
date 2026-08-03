import { URL } from 'node:url';

export const FRIST_ENTRY_FIELDS = [
  'id',
  'event_name',
  'event_type',
  'city',
  'state',
  'country',
  'venue_or_area',
  'application_deadline_iso',
  'application_deadline_text',
  'event_date_range_text',
  'application_mode',
  'postal_address',
  'contact_name',
  'contact_email',
  'contact_phone',
  'source_url',
  'source_domain',
  'source_kind',
  'last_verified_at',
  'agent_batch_id',
  'confidence_status',
  'notes',
];

export const CONFIDENCE_STATUSES = ['verified', 'partial', 'needs_review'];
export const PUBLISHABLE_STATUSES = ['verified', 'partial'];

export const GERMAN_STATES = [
  ['baden-wuerttemberg', 'Baden-Württemberg'],
  ['bayern', 'Bayern'],
  ['berlin', 'Berlin'],
  ['brandenburg', 'Brandenburg'],
  ['bremen', 'Bremen'],
  ['hamburg', 'Hamburg'],
  ['hessen', 'Hessen'],
  ['mecklenburg-vorpommern', 'Mecklenburg-Vorpommern'],
  ['niedersachsen', 'Niedersachsen'],
  ['nordrhein-westfalen', 'Nordrhein-Westfalen'],
  ['rheinland-pfalz', 'Rheinland-Pfalz'],
  ['saarland', 'Saarland'],
  ['sachsen', 'Sachsen'],
  ['sachsen-anhalt', 'Sachsen-Anhalt'],
  ['schleswig-holstein', 'Schleswig-Holstein'],
  ['thueringen', 'Thüringen'],
];

const REQUIRED_COMMON_FIELDS = [
  'id',
  'event_name',
  'city',
  'state',
  'country',
  'source_url',
  'source_domain',
  'source_kind',
  'last_verified_at',
  'agent_batch_id',
  'confidence_status',
];

const REQUIRED_PUBLISHABLE_FIELDS = [
  'application_deadline_iso',
  'application_deadline_text',
];

const VERIFIED_DETAIL_FIELDS = [
  'event_type',
  'venue_or_area',
  'event_date_range_text',
  'application_mode',
  'postal_address',
];

const STATUS_PRIORITY = {
  needs_review: 0,
  partial: 1,
  verified: 2,
};

export const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

const normalizeIdentityText = (value) => normalizeText(value)
  .toLocaleLowerCase('de-DE')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const normalizeEntry = (entry, fallbackBatchId = '') => {
  const normalized = Object.fromEntries(
    FRIST_ENTRY_FIELDS.map((field) => [field, normalizeText(entry?.[field])]),
  );

  normalized.country ||= 'DE';
  normalized.source_kind ||= 'official';
  normalized.agent_batch_id ||= fallbackBatchId;

  if (!normalized.source_domain && normalized.source_url) {
    try {
      normalized.source_domain = new URL(normalized.source_url).hostname.replace(/^www\./, '');
    } catch (_) {}
  }

  return normalized;
};

export const validateEntry = (entry, options = {}) => {
  const { allowNeedsReview = true } = options;
  const normalized = normalizeEntry(entry);
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_COMMON_FIELDS) {
    if (!normalized[field]) errors.push(`${field} fehlt`);
  }

  if (!CONFIDENCE_STATUSES.includes(normalized.confidence_status)) {
    errors.push(`confidence_status muss ${CONFIDENCE_STATUSES.join(', ')} sein`);
  }

  if (!allowNeedsReview && normalized.confidence_status === 'needs_review') {
    errors.push('needs_review ist in diesem Datensatz nicht erlaubt');
  }

  if (normalized.country !== 'DE') errors.push('country muss DE sein');
  if (normalized.source_kind !== 'official') errors.push('source_kind muss official sein');

  if (normalized.source_url) {
    try {
      const source = new URL(normalized.source_url);
      if (!['http:', 'https:'].includes(source.protocol)) errors.push('source_url muss HTTP(S) verwenden');
      const sourceDomain = source.hostname.replace(/^www\./, '');
      if (normalized.source_domain && sourceDomain !== normalized.source_domain.replace(/^www\./, '')) {
        errors.push('source_domain passt nicht zu source_url');
      }
    } catch (_) {
      errors.push('source_url ist keine gueltige URL');
    }
  }

  if (normalized.last_verified_at && !isValidIsoDate(normalized.last_verified_at)) {
    errors.push('last_verified_at ist kein gueltiges ISO-Datum');
  }

  const publishableStatus = PUBLISHABLE_STATUSES.includes(normalized.confidence_status);
  if (publishableStatus) {
    for (const field of REQUIRED_PUBLISHABLE_FIELDS) {
      if (!normalized[field]) errors.push(`${field} fehlt fuer einen veroeffentlichbaren Eintrag`);
    }
  }

  if (normalized.application_deadline_iso && !isValidIsoDate(normalized.application_deadline_iso)) {
    errors.push('application_deadline_iso ist kein gueltiges ISO-Datum');
  }

  if (normalized.confidence_status === 'verified') {
    for (const field of VERIFIED_DETAIL_FIELDS) {
      if (!normalized[field]) warnings.push(`${field} fehlt bei verified`);
    }
  }

  return { normalized, errors, warnings, valid: errors.length === 0 };
};

export const isPublishableEntry = (entry) => {
  const result = validateEntry(entry);
  return result.valid && PUBLISHABLE_STATUSES.includes(result.normalized.confidence_status);
};

export const createDedupeKey = (entry) => [
  normalizeIdentityText(entry.event_name),
  normalizeIdentityText(entry.city),
  normalizeText(entry.application_deadline_iso),
].join('|');

const pickPreferredEntry = (left, right) => {
  const priorityDifference = (STATUS_PRIORITY[right.confidence_status] ?? -1)
    - (STATUS_PRIORITY[left.confidence_status] ?? -1);
  if (priorityDifference > 0) return [right, left];
  if (priorityDifference < 0) return [left, right];
  if (right.last_verified_at > left.last_verified_at) return [right, left];
  return [left, right];
};

const joinUniqueNotes = (...values) => [...new Set(values.flatMap((value) => (
  normalizeText(value) ? normalizeText(value).split(' | ') : []
)))].join(' | ');

export const mergeDuplicateEntries = (leftEntry, rightEntry) => {
  const left = normalizeEntry(leftEntry);
  const right = normalizeEntry(rightEntry);
  const [preferred, secondary] = pickPreferredEntry(left, right);
  const merged = {};

  for (const field of FRIST_ENTRY_FIELDS) {
    merged[field] = preferred[field] || secondary[field] || '';
  }

  merged.notes = joinUniqueNotes(preferred.notes, secondary.notes);
  return merged;
};

export const deduplicateEntries = (entries) => {
  const deduplicatedById = new Map();
  for (const rawEntry of entries) {
    const entry = normalizeEntry(rawEntry);
    const existing = deduplicatedById.get(entry.id);
    deduplicatedById.set(entry.id, existing ? mergeDuplicateEntries(existing, entry) : entry);
  }

  const deduplicated = new Map();

  for (const entry of deduplicatedById.values()) {
    const key = createDedupeKey(entry);
    const existing = deduplicated.get(key);
    deduplicated.set(key, existing ? mergeDuplicateEntries(existing, entry) : entry);
  }

  return [...deduplicated.values()];
};

const deadlineTime = (entry) => new Date(`${entry.application_deadline_iso}T12:00:00Z`).getTime();

export const sortEntriesByDeadline = (entries, options = {}) => {
  const { today = new Date(), includePast = true } = options;
  const todayIso = new Date(today).toISOString().slice(0, 10);
  const valid = entries.filter((entry) => isValidIsoDate(entry.application_deadline_iso));
  const filtered = includePast
    ? valid
    : valid.filter((entry) => entry.application_deadline_iso >= todayIso);

  return [...filtered].sort((left, right) => {
    const leftPast = left.application_deadline_iso < todayIso;
    const rightPast = right.application_deadline_iso < todayIso;
    if (leftPast !== rightPast) return leftPast ? 1 : -1;
    return deadlineTime(left) - deadlineTime(right)
      || left.event_name.localeCompare(right.event_name, 'de');
  });
};

export const getNextOpenEntry = (entries, today = new Date()) => (
  sortEntriesByDeadline(entries, { today, includePast: false })[0] || null
);

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const entriesToCsv = (entries) => [
  FRIST_ENTRY_FIELDS.map(csvCell).join(','),
  ...entries.map((entry) => FRIST_ENTRY_FIELDS.map((field) => csvCell(entry[field])).join(',')),
].join('\n') + '\n';

export const validateBatch = (batch) => {
  const errors = [];
  if (!normalizeText(batch?.batch_id)) errors.push('batch_id fehlt');
  if (!Array.isArray(batch?.region_scope) || !batch.region_scope.length) errors.push('region_scope fehlt');
  if (!Array.isArray(batch?.search_terms) || !batch.search_terms.length) errors.push('search_terms fehlt');
  if (!Number.isInteger(batch?.max_expected_results) || batch.max_expected_results < 1 || batch.max_expected_results > 100) {
    errors.push('max_expected_results muss zwischen 1 und 100 liegen');
  }
  if (batch?.source_policy !== 'official_only') errors.push('source_policy muss official_only sein');
  if (!isValidIsoDate(normalizeText(batch?.researched_at))) errors.push('researched_at ist kein gueltiges ISO-Datum');
  if (!Array.isArray(batch?.entries)) errors.push('entries muss ein Array sein');
  if (!Array.isArray(batch?.rejected_candidates)) errors.push('rejected_candidates muss ein Array sein');
  if (!Array.isArray(batch?.review_candidates)) errors.push('review_candidates muss ein Array sein');
  return { valid: errors.length === 0, errors };
};

export const createResearchJobs = (waveId, options = {}) => {
  const { maxExpectedResults = 50, states = GERMAN_STATES } = options;
  if (!normalizeText(waveId)) throw new Error('waveId fehlt');

  return states.map(([stateSlug, stateName]) => ({
    batch_id: `${waveId}-${stateSlug}`,
    region_scope: [stateName],
    search_terms: [
      `Schausteller Bewerbung Volksfest ${stateName}`,
      `Kirmes Jahrmarkt Dult Bewerbungsschluss ${stateName}`,
      `Stadtfest Weihnachtsmarkt Standplatz Bewerbung Frist ${stateName}`,
    ],
    max_expected_results: maxExpectedResults,
    source_policy: 'official_only',
  }));
};

export const consolidateData = ({ masterEntries = [], batches = [] }) => {
  const batchEntries = batches.flatMap((batch) => {
    const validation = validateBatch(batch);
    if (!validation.valid) {
      throw new Error(`Batch ${batch?.batch_id || '(ohne ID)'}: ${validation.errors.join('; ')}`);
    }
    return batch.entries.map((entry) => {
      if (entry.agent_batch_id && entry.agent_batch_id !== batch.batch_id) {
        throw new Error(`Batch ${batch.batch_id}: Eintrag ${entry.id || '(ohne ID)'} hat eine abweichende agent_batch_id`);
      }
      return normalizeEntry(entry, batch.batch_id);
    });
  });

  const candidates = deduplicateEntries([...masterEntries, ...batchEntries]);
  const errors = [];
  const warnings = [];

  for (const entry of candidates) {
    const result = validateEntry(entry);
    for (const error of result.errors) errors.push(`${entry.id || '(ohne id)'}: ${error}`);
    for (const warning of result.warnings) warnings.push(`${entry.id}: ${warning}`);
  }

  const datedEntries = sortEntriesByDeadline(candidates, {
    today: new Date('1970-01-01T12:00:00Z'),
    includePast: true,
  });
  const undatedEntries = candidates
    .filter((entry) => !isValidIsoDate(entry.application_deadline_iso))
    .sort((left, right) => left.event_name.localeCompare(right.event_name, 'de'));
  const entries = [...datedEntries, ...undatedEntries];
  const publishableEntries = entries.filter(isPublishableEntry);

  return { entries, publishableEntries, errors, warnings };
};
