#!/usr/bin/env node
// Gera os JSONs do registry em generated/r (ignorado pelo Git). Não publica nada.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRegistry } from './validate.mjs';

const SHADCN = 'shadcn@4.13.0';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceRoot = path.resolve(root, '..', 'mcp-ui');
const outDir = path.join(root, 'generated', 'r');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));

const errors = validateRegistry(registry, { sourceRoot });
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

fs.rmSync(path.join(root, 'generated'), { recursive: true, force: true });
execFileSync(
  'npx',
  ['--yes', SHADCN, 'build', path.join(root, 'registry.json'), '-c', sourceRoot, '-o', outDir],
  { stdio: 'inherit' }
);

const index = { registry: registry.name, shadcn: SHADCN, items: {} };
for (const file of fs.readdirSync(outDir).sort()) {
  const raw = fs.readFileSync(path.join(outDir, file));
  const text = raw.toString('utf8');
  if (/sourceMappingURL|\/home\/|\/Users\/|[A-Z]:\\\\/.test(text)) {
    console.error(`[ui-registry] ${file}: contém sourcemap ou caminho absoluto`);
    process.exit(1);
  }
  index.items[file] = { sha256: crypto.createHash('sha256').update(raw).digest('hex'), bytes: raw.length };
}
fs.writeFileSync(path.join(root, 'generated', 'index.json'), JSON.stringify(index, null, 2));
console.log(`[ui-registry] ${Object.keys(index.items).length} arquivos gerados em generated/r`);
