// Spec 021 / T043 — playground interno do registry. Gera somente dist/playground.html
// (ignorado pelo Git) para uso em 127.0.0.1. Nunca escreve em AB0-1-back/public nem no manifest.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_TMP = path.join(PKG_ROOT, 'dist', '.playground');
const OUT_FILE = path.join(PKG_ROOT, 'dist', 'playground.html');

await build({
  root: path.join(PKG_ROOT, 'playground'),
  configFile: false,
  logLevel: 'warn',
  plugins: [react(), viteSingleFile()],
  build: { outDir: OUT_TMP, emptyOutDir: true, minify: 'esbuild', sourcemap: false, modulePreload: { polyfill: false } },
});
await fs.copyFile(path.join(OUT_TMP, 'index.html'), OUT_FILE);
await fs.rm(OUT_TMP, { recursive: true, force: true });
console.log(`[mcp-ui playground] ${path.relative(PKG_ROOT, OUT_FILE)}`);
