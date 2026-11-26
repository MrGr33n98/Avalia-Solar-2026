import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const DIST_DIR = path.join(PKG_ROOT, 'dist');
const BACKEND_PUBLIC_DIR =
  process.env.MCP_UI_OUT_DIR || path.join(REPO_ROOT, 'AB0-1-back', 'public', 'mcp-ui');

const MAX_GZIP_BYTES = 120 * 1024; // 120 KB gzip budget per self-contained entry

const SURFACES = [
  { id: 'search', entry: 'entries/search.html', uri: 'ui://avalia-solar/search/v1.html' },
  { id: 'profile', entry: 'entries/profile.html', uri: 'ui://avalia-solar/profile/v1.html' },
  { id: 'reputation', entry: 'entries/reputation.html', uri: 'ui://avalia-solar/reputation/v1.html' },
  { id: 'compare', entry: 'entries/compare.html', uri: 'ui://avalia-solar/compare/v1.html' },
  { id: 'categories', entry: 'entries/categories.html', uri: 'ui://avalia-solar/categories/v1.html' },
  { id: 'storefront', entry: 'entries/storefront.html', uri: 'ui://avalia-solar/storefront/v1.html' },
];

async function run() {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.mkdir(BACKEND_PUBLIC_DIR, { recursive: true });

  const resources = {};

  for (const surface of SURFACES) {
    const surfaceOutDir = path.join(DIST_DIR, surface.id);
    await build({
      root: PKG_ROOT,
      configFile: false,
      logLevel: 'warn',
      plugins: [react(), viteSingleFile()],
      build: {
        outDir: surfaceOutDir,
        emptyOutDir: true,
        minify: 'esbuild',
        sourcemap: false,
        cssCodeSplit: false,
        // Singlefile não tem chunks para pré-carregar; o polyfill era código morto (Spec 021).
        modulePreload: { polyfill: false },
        rollupOptions: {
          input: path.join(PKG_ROOT, surface.entry),
        },
      },
    });

    const builtHtmlPath = path.join(surfaceOutDir, surface.entry);
    const html = await fs.readFile(builtHtmlPath, 'utf8');
    const cleanOutHtml = path.join(DIST_DIR, `${surface.id}.v1.html`);
    await fs.writeFile(cleanOutHtml, html, 'utf8');
    await fs.rm(surfaceOutDir, { recursive: true, force: true });

    const rawBytes = Buffer.byteLength(html, 'utf8');
    const gzipBytes = zlib.gzipSync(html, { level: 9 }).byteLength;
    const sha256 = crypto.createHash('sha256').update(html).digest('hex');

    if (gzipBytes > MAX_GZIP_BYTES) {
      throw new Error(
        `Bundle budget exceeded for ${surface.id}: ${gzipBytes} B gzip > ${MAX_GZIP_BYTES} B limit`
      );
    }

    const backendFile = path.join(BACKEND_PUBLIC_DIR, `${surface.id}.v1.html`);
    await fs.writeFile(backendFile, html, 'utf8');

    resources[surface.id] = {
      uri: surface.uri,
      file: `${surface.id}.v1.html`,
      mimeType: 'text/html;profile=mcp-app',
      sha256,
      rawBytes,
      gzipBytes,
    };

    console.log(
      `[mcp-ui build] ${surface.id}: raw=${(rawBytes / 1024).toFixed(1)}KB gzip=${(
        gzipBytes / 1024
      ).toFixed(1)}KB sha256=${sha256.slice(0, 12)}`
    );
  }

  const manifest = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    resources,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  await fs.writeFile(path.join(DIST_DIR, 'manifest.json'), manifestJson, 'utf8');
  await fs.writeFile(path.join(BACKEND_PUBLIC_DIR, 'manifest.json'), manifestJson, 'utf8');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

