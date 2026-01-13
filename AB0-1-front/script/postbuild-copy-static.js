/**
 * Ensure standalone build ships static assets (CSS/JS) so pages keep styling.
 * Copies `.next/static` into `.next/standalone/.next/static`.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '.next', 'static');
const dest = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');

function copyRecursive(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

if (!fs.existsSync(src)) {
  console.warn(`[postbuild-copy-static] Source static dir not found: ${src}`);
  process.exit(0);
}

try {
  copyRecursive(src, dest);
  console.log(`[postbuild-copy-static] Copied static assets to ${dest}`);
} catch (err) {
  console.error('[postbuild-copy-static] Failed to copy static assets', err);
  process.exitCode = 1;
}
