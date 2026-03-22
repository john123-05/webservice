import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

const copyTargets = [
  'index.html',
  'kontakt.html',
  'projekte.html',
  'impressum.html',
  'datenschutz.html',
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

for (const target of copyTargets) {
  copyRecursive(target);
}

console.log('Static site copied to dist/');
