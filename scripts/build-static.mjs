import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const domain = 'https://webservice-studios.com';

const copyTargets = [
  'styles.css',
  'app.js',
  'blog',
  'assets',
];

const excludedAssetNames = new Set([
  'copy_8CFABB7F-FE02-47D9-8733-8B9B9EEA93AC.MOV',
]);

const ensureDir = (path) => {
  mkdirSync(path, { recursive: true });
};

const isRootLevelStaticPage = (entry) => {
  if (!entry.endsWith('.html')) return false;
  if (entry.startsWith('dist')) return false;
  return true;
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
  cpSync(sourcePath, destPath);
};

rmSync(distDir, { recursive: true, force: true });
ensureDir(distDir);

for (const entry of readdirSync(rootDir)) {
  if (isRootLevelStaticPage(entry)) {
    copyRecursive(entry);
  }
}

for (const target of copyTargets) {
  copyRecursive(target);
}

const sitemapExcluded = new Set(['impressum.html', 'datenschutz.html', 'kontakt.html']);
const sitemapPaths = [];

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
    if (sitemapExcluded.has(entry)) continue;

    const urlPath = nextRelativePath
      .replace(/\\/g, '/')
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '.html');
    sitemapPaths.push(urlPath);
  }
};

collectSitemapPaths();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths
  .sort()
  .map((path) => {
    const normalizedPath = path === '' ? '' : `/${path}`;
    const loc = normalizedPath.endsWith('/index') ? normalizedPath.slice(0, -5) : normalizedPath;
    return `  <url><loc>${domain}${loc}</loc></url>`;
  })
  .join('\n')}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;

const llmsTxt = `# ${domain}

> ${domain} ist die Website von Webservice.Studios.

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
- ${domain}/seo-bielefeld.html
- ${domain}/online-marketing-bielefeld.html
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
writeFileSync(join(distDir, 'llms.txt'), llmsTxt);

console.log('Static site copied to dist/');
