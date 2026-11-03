import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import vm from 'node:vm';
import { cleanInternalUrl, isNoindexHtml, normalizeHtmlUrls } from '../scripts/site-urls.mjs';

test('public URLs keep queries, anchors, directory blogs and external destinations', () => {
  assert.equal(cleanInternalUrl('https://impress-rank.de/seo.html?source=test#preise'), 'https://impress-rank.de/seo?source=test#preise');
  assert.equal(cleanInternalUrl('/index.html'), '/');
  assert.equal(cleanInternalUrl('index.html'), './');
  assert.equal(cleanInternalUrl('/blog/beispiel/index.html'), '/blog/beispiel/');
  assert.equal(cleanInternalUrl('/blog/beispiel/index-en.html'), '/blog/beispiel/index-en');
  assert.equal(cleanInternalUrl('https://example.com/file.html'), 'https://example.com/file.html');
  assert.equal(cleanInternalUrl('mailto:test@example.com'), 'mailto:test@example.com');
});

test('canonical, social and structured-data URLs agree without changing asset URLs', () => {
  const input = '<link rel="canonical" href="https://impress-rank.de/seo.html"><a href="anfrage.html#form">Kontakt</a><link href="styles.css"><script>{"url":"https://impress-rank.de/seo.html#service"}</script>';
  const output = normalizeHtmlUrls(input);
  assert.match(output, /href="https:\/\/impress-rank.de\/seo"/);
  assert.match(output, /href="anfrage#form"/);
  assert.match(output, /href="styles.css"/);
  assert.match(output, /"url":"https:\/\/impress-rank.de\/seo#service"/);
  assert.equal(normalizeHtmlUrls(output), output);
});

test('sitemap exclusion recognizes noindex regardless of attribute order', () => {
  assert.equal(isNoindexHtml('<meta content="noindex,follow" name="robots">'), true);
  assert.equal(isNoindexHtml("<meta name='googlebot' content='NOINDEX'>"), true);
  assert.equal(isNoindexHtml('<meta name="robots" content="index,follow">'), false);
});

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const languageCode = app.slice(app.indexOf('const getLanguageTargets ='), app.indexOf('const trackConsentedLead ='));
test('language switch works for short pages, legacy URLs and directory articles', () => {
  for (const [path, de, en] of [
    ['/anfrage', '/anfrage', '/anfrage-en'],
    ['/seo-en', '/seo', '/seo-en'],
    ['/seo-en.html', '/seo', '/seo-en'],
    ['/', '/', '/index-en'],
    ['/index-en', '/', '/index-en'],
    ['/blog/beispiel/', '/blog/beispiel/', '/blog/beispiel/index-en'],
    ['/blog/beispiel/index-en', '/blog/beispiel/', '/blog/beispiel/index-en'],
  ]) {
    const context = { window: { location: { pathname: path } } };
    const targets = vm.runInNewContext(`${languageCode}\ngetLanguageTargets()`, context);
    assert.equal(targets.de, de, path);
    assert.equal(targets.en, en, path);
  }
});

const trackingCode = app.slice(app.indexOf('const trackConsentedLead ='), app.indexOf('const initLanguageSwitch ='));
test('a confirmed inquiry is measured only with analytics consent and without personal data', () => {
  for (const consent of [null, 'declined', 'accepted']) {
    const calls = [];
    const context = {
      localStorage: { getItem: () => consent },
      window: { location: { pathname: '/anfrage' }, gtag: (...args) => calls.push(args) },
    };
    vm.runInNewContext(`${trackingCode}\ntrackConsentedLead({dataset:{formSource:'anfrage'}, email:'private@example.com'})`, context);
    assert.equal(calls.length, consent === 'accepted' ? 1 : 0);
    if (calls.length) {
      assert.equal(calls[0][1], 'generate_lead');
      assert.equal(JSON.stringify(calls).includes('private@example.com'), false);
    }
  }
});

test('blocked analytics storage cannot break successful inquiry handling', () => {
  assert.doesNotThrow(() => vm.runInNewContext(`${trackingCode}\ntrackConsentedLead({dataset:{}})`, {
    localStorage: { getItem: () => { throw new Error('blocked'); } },
  }));
});

test('analytics fallback loads the existing measurement property once after consent', () => {
  const start = app.indexOf('  const loadAnalytics = () =>');
  const end = app.indexOf('  const applyConsent =', start);
  const scripts = [];
  const window = {};
  const context = {
    window,
    document: { createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) } },
    loadClarity() {}, loadMetaPixel() {}, initAnalyticsTracking() {},
  };
  vm.runInNewContext(`${app.slice(start, end)}\nloadAnalytics(); loadAnalytics();`, context);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /id=G-JWEQYND20F$/);
  assert.equal(window.dataLayer[0][0], 'consent');
  assert.equal(window.dataLayer[0][2].analytics_storage, 'granted');
  assert.equal(window.dataLayer[0][2].ad_storage, 'denied');
});

test('form success is measured after acceptance; failure is not; newsletter opt-out is preserved', async () => {
  const formCode = app.slice(app.indexOf('const initLeadForms ='), app.indexOf('const initSeoSwitcher ='));
  for (const [ok, checked] of [[true, false], [true, true], [false, false]]) {
    let submit;
    let payload;
    let leads = 0;
    const status = { dataset: {}, scrollIntoView() {} };
    const button = { textContent: 'Senden', setAttribute() {}, removeAttribute() {} };
    const form = {
      dataset: { formSource: 'videoanalyse' },
      querySelector: (selector) => selector === '[data-form-status]' ? status
        : selector === 'button[type="submit"]' ? button
        : selector.includes('consent_marketing') ? { checked } : null,
      addEventListener: (_, callback) => { submit = callback; },
      reset() {},
    };
    const context = {
      document: { querySelectorAll: () => [form] },
      getLocale: () => 'de',
      window: { location: { pathname: '/naechster-schritt' } },
      FormData: class { entries() { return [['firstname', 'Test'], ...(checked ? [['consent_marketing', 'on']] : [])]; } },
      postToCrm() {},
      trackConsentedLead: () => { leads++; },
      fetch: async (_, options) => { payload = JSON.parse(options.body); return { ok, status: ok ? 200 : 500 }; },
    };
    vm.runInNewContext(`${formCode}\ninitLeadForms()`, context);
    await submit({ preventDefault() {} });
    assert.equal(leads, ok ? 1 : 0);
    assert.equal(payload.angemeldet, checked ? 'ja' : 'nein');
    assert.equal(status.dataset.state, ok ? 'success' : 'error');
  }
});

test('static build produces matching canonical URLs, excludes private pages and keeps nested redirects', () => {
  const dir = mkdtempSync(join(tmpdir(), 'impressrank-seo-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'blog', 'beispiel'), { recursive: true });
    for (const name of ['build-static.mjs', 'site-urls.mjs']) {
      copyFileSync(new URL(`../scripts/${name}`, import.meta.url), join(dir, 'scripts', name));
    }
    writeFileSync(join(dir, 'index.html'), '<link rel="canonical" href="https://impress-rank.de/"><a href="seo.html">SEO</a>');
    writeFileSync(join(dir, 'seo.html'), '<link rel="canonical" href="https://impress-rank.de/seo.html">');
    writeFileSync(join(dir, 'intern.html'), '<meta content="noindex,follow" name="robots">');
    writeFileSync(join(dir, 'blog', 'beispiel', 'index-en.html'), '<link rel="canonical" href="https://impress-rank.de/blog/beispiel/index-en.html">');
    writeFileSync(join(dir, '_redirects'), '/vk /?utm_source=qr 302\n');
    execFileSync(process.execPath, [join(dir, 'scripts', 'build-static.mjs')]);
    const sitemap = readFileSync(join(dir, 'dist', 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /<loc>https:\/\/impress-rank.de\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/impress-rank.de\/seo<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/impress-rank.de\/blog\/beispiel\/index-en<\/loc>/);
    assert.doesNotMatch(sitemap, /intern|\.html/);
    const redirects = readFileSync(join(dir, 'dist', '_redirects'), 'utf8');
    assert.match(redirects, /\/vk \/\?utm_source=qr 302/);
    assert.match(redirects, /\/index.html \/ 301!/);
    assert.match(redirects, /\/blog\/beispiel\/index-en.html \/blog\/beispiel\/index-en 301!/);
    assert.match(readFileSync(join(dir, 'dist', 'index.html'), 'utf8'), /href="seo"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
