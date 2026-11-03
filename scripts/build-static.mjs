import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanInternalUrl, isNoindexHtml, normalizeHtmlUrls } from './site-urls.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const domain = 'https://impress-rank.de';

const copyTargets = [
  'styles.css',
  'app.js',
  'blog',
  'assets',
  'data/schausteller-bewerbungsfristen/web.json',
  '_redirects',
];

const rootLevelStaticAssetPattern = /\.(png|jpe?g|webp|svg|mp4)$/i;

const excludedAssetNames = new Set([
  'copy_8CFABB7F-FE02-47D9-8733-8B9B9EEA93AC.MOV',
]);

const ensureDir = (path) => {
  mkdirSync(path, { recursive: true });
};

const isRootLevelStaticEntry = (entry) => {
  if (entry.startsWith('dist')) return false;
  if (entry.endsWith('.html')) return true;
  return rootLevelStaticAssetPattern.test(entry);
};

const copyRecursive = (sourceRelativePath) => {
  const sourcePath = join(rootDir, sourceRelativePath);
  const destPath = join(distDir, sourceRelativePath);

  if (!existsSync(sourcePath)) return;

  const sourceStat = statSync(sourcePath);
  if (sourceStat.isDirectory()) {
    ensureDir(destPath);
    for (const entry of readdirSync(sourcePath)) {
      if (excludedAssetNames.has(entry)) continue;
      copyRecursive(join(sourceRelativePath, entry));
    }
    return;
  }

  ensureDir(dirname(destPath));
  if (sourcePath.endsWith('.html')) {
    writeFileSync(destPath, normalizeHtmlUrls(readFileSync(sourcePath, 'utf8')));
  } else {
    cpSync(sourcePath, destPath);
  }
};

rmSync(distDir, { recursive: true, force: true });
ensureDir(distDir);

for (const entry of readdirSync(rootDir)) {
  if (isRootLevelStaticEntry(entry)) {
    copyRecursive(entry);
  }
}

for (const target of copyTargets) {
  copyRecursive(target);
}

const sitemapExcluded = new Set(['impressum.html', 'datenschutz.html', 'kontakt.html', 'formular.html']);
const sitemapPaths = [];
const htmlPaths = [];

const collectSitemapPaths = (relativePath = '') => {
  const currentDir = join(distDir, relativePath);
  for (const entry of readdirSync(currentDir)) {
    const entryPath = join(currentDir, entry);
    const nextRelativePath = relativePath ? join(relativePath, entry) : entry;
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      collectSitemapPaths(nextRelativePath);
      continue;
    }

    if (!entry.endsWith('.html')) continue;
    htmlPaths.push(`/${nextRelativePath.replace(/\\/g, '/')}`);
    if (sitemapExcluded.has(entry)) continue;
    if (isNoindexHtml(readFileSync(entryPath, 'utf8'))) continue;

    const urlPath = nextRelativePath
      .replace(/\\/g, '/')
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '.html');
    sitemapPaths.push(cleanInternalUrl(`/${urlPath}`));
  }
};

collectSitemapPaths();

// Explicit routes also cover nested English articles; suffix splats are not
// supported by Netlify. Keep existing domain/funnel rules ahead of these rules.
const sourceRedirects = existsSync(join(rootDir, '_redirects'))
  ? readFileSync(join(rootDir, '_redirects'), 'utf8').trimEnd()
  : '';
const htmlRedirects = htmlPaths.sort().map((path) => `${path} ${cleanInternalUrl(path)} 301!`);
writeFileSync(join(distDir, '_redirects'), `${sourceRedirects}\n\n# Canonical page URLs (generated)\n${htmlRedirects.join('\n')}\n`);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(sitemapPaths)]
  .sort()
  .map((path) => {
    return `  <url><loc>${domain}${path}</loc></url>`;
  })
  .join('\n')}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;

const llmsTxt = `# ${domain}

> ${domain} ist die Website von ImpressRank.

Wichtige Themen:
- Webdesign in Bielefeld
- SEO in Bielefeld
- Online Marketing in Bielefeld
- Website Relaunch, Webentwicklung und Backend Entwicklung
- Local SEO und Websites für lokale Unternehmen in OWL

Wichtige Einstiegsseiten:
- ${domain}/
- ${domain}/leistungen.html
- ${domain}/standorte.html
- ${domain}/webdesign-handwerker-bielefeld.html
- ${domain}/webdesign-praxen-bielefeld.html
- ${domain}/webdesign-dienstleister-bielefeld.html
- ${domain}/webdesign-beratung-bielefeld.html
- ${domain}/webdesign-bielefeld.html
- ${domain}/website-erstellen-lassen-bielefeld.html
- ${domain}/seo-bielefeld.html
- ${domain}/seo-bad-salzuflen.html
- ${domain}/online-marketing-bielefeld.html
- ${domain}/online-marketing-bad-salzuflen.html
- ${domain}/website-relaunch-bielefeld.html
- ${domain}/local-seo-bielefeld.html
- ${domain}/webentwicklung-bielefeld.html
- ${domain}/backend-entwicklung-bielefeld.html
- ${domain}/website-bringt-keine-anfragen.html
- ${domain}/website-wird-bei-google-nicht-gefunden.html
- ${domain}/anfrage.html

Regionen:
- Bielefeld
- Bad Salzuflen
- Gütersloh
- Detmold
- Leopoldshöhe
- Oerlinghausen
- Verl
- Lage
- Schloß Holte-Stukenbrock
`;

writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml);
writeFileSync(join(distDir, 'robots.txt'), robotsTxt);
writeFileSync(join(distDir, 'llms.txt'), normalizeHtmlUrls(llmsTxt));

console.log('Static site copied to dist/');
