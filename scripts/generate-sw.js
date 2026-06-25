import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(__dirname, 'sw.template.js');
const OUT_SW = path.join(ROOT, 'public', 'sw.js');
const OUT_VERSION = path.join(ROOT, '.sw-version');
const OUT_DIST_SW = path.join(ROOT, 'dist', 'sw.js');

function getBuildVersion() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return Date.now().toString(36);
  }
}

const version = getBuildVersion();
const swContent = fs.readFileSync(TEMPLATE_PATH, 'utf8').replace(/__BUILD_VERSION__/g, version);

fs.writeFileSync(OUT_SW, swContent);
fs.writeFileSync(OUT_VERSION, `${version}\n`);

if (fs.existsSync(path.join(ROOT, 'dist'))) {
  fs.writeFileSync(OUT_DIST_SW, swContent);
}

console.log(`Service worker generated — cache: unifolio-images-${version}`);
