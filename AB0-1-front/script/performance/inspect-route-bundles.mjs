#!/usr/bin/env node
/**
 * Spec 014: read actual Next.js build manifests and inspect initial client
 * chunks for heavy *named* dependencies. Report names + on-disk bytes.
 * This is a build artifact audit, not a substitute for network transfer bytes
 * or runtime Lighthouse measurements.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (key, defaultValue) => {
  const index = args.indexOf(key);
  return index >= 0 ? args[index + 1] : defaultValue;
};
const root = path.resolve(option('--build', '.next'));
const output = option('--output', '');
const manifestPath = path.join(root, 'app-build-manifest.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing ${manifestPath}; run a production Next.js build first.`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pages = manifest.pages || {};
const routes = ['/page', '/search/page', '/companies/page', '/products/page', '/companies/[id]/page'];
const heavy = [/leaflet/i, /react-leaflet/i, /MapProvider/i, /SearchMapPanel/i, /MediaGallery/i, /posthog/i, /sentry/i];
const lines = [
  '# Spec 014 — Initial JS route chunks (measured build manifest)',
  '',
  `Build directory: ${root}`,
  '',
  '> These are *on-disk, uncompressed* initial files from the build manifest, not Lighthouse script transfer bytes. Chunk naming varies by webpack optimization; missing heavy names does not prove absence of heavy code.',
  '',
  '| Route | Manifest entry | Initial JS files | Uncompressed build bytes | Named heavy chunks |',
  '|---|---|---:|---:|---|',
];
let valid = 0;
for (const route of routes) {
  const files = pages[route] || [];
  const js = files.filter((name) => name.endsWith('.js'));
  if (files.length) valid += 1;
  const bytes = js.reduce((total, relative) => {
    const location = path.resolve(root, relative.replace(/^\/_next\//, ''));
    return total + (fs.existsSync(location) ? fs.statSync(location).size : 0);
  }, 0);
  const suspect = js.filter((name) => heavy.some((pattern) => pattern.test(name)));
  lines.push(`| ${route} | ${files.length ? 'yes' : 'missing'} | ${js.length} | ${bytes} | ${suspect.join(', ') || 'none by filename'} |`);
}
lines.push('', 'Next checks: inspect the webpack module analyzer and Lighthouse network waterfall (with request initiators), verify zero pre-map Leaflet load, and ensure tabs are genuinely intent-triggered.', '');
if (!valid) throw new Error('No requested App Router entries in build manifest');
const text = lines.join('\n');
if (output) {
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(path.resolve(output), text, 'utf8');
} else {
  process.stdout.write(text);
}
