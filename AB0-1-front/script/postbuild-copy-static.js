/**
 * Ensure standalone build ships static assets (CSS/JS) so pages keep styling.
 * Copies `.next/static` into `.next/standalone/.next/static`.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '.next', 'static');
const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
const dest = path.join(standaloneDir, '.next', 'static');

function copyRecursive(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

// Check if source static directory exists
if (!fs.existsSync(src)) {
  console.warn(`[postbuild-copy-static] Source static dir not found: ${src}`);
  console.warn('[postbuild-copy-static] This is expected if build failed. Skipping copy.');
  process.exit(0);
}

// Check if standalone directory exists (it should if output: 'standalone' is set)
if (!fs.existsSync(standaloneDir)) {
  console.warn(`[postbuild-copy-static] Standalone dir not found: ${standaloneDir}`);
  console.warn('[postbuild-copy-static] Make sure next.config.js has output: "standalone"');
  process.exit(0);
}

try {
  copyRecursive(src, dest);
  console.log(`[postbuild-copy-static] ✅ Copied static assets to ${dest}`);
} catch (err) {
  console.error('[postbuild-copy-static] ⚠️ Failed to copy static assets', err);
  // Don't fail the build, just warn
  console.warn('[postbuild-copy-static] Continuing despite copy failure...');
  process.exit(0);
}
