#!/usr/bin/env node
// Validação do registry @avalia-solar (Spec 021 / T041).
// Somente leitura: não instala, não publica, não acessa rede.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_TYPES = new Set(['registry:lib', 'registry:block', 'registry:ui', 'registry:style', 'registry:file']);
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAMESPACE = '@avalia-solar/';
const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /sk_(?:live|test)_[A-Za-z0-9]{16,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
];

function packageName(spec) {
  if (spec.startsWith('@')) return spec.split('@').slice(0, 2).join('@');
  return spec.split('@')[0];
}

function isSafeRelative(p) {
  return typeof p === 'string' && p.length > 0 && !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..');
}

function relativeImports(source) {
  const found = new Set();
  const re = /(?:from\s+|import\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source))) found.add(match[1]);
  return [...found];
}

function resolveImport(fromFile, spec, available) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  return ['', '.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map((ext) => base + ext).find((c) => available.has(c));
}

export function validateRegistry(registry, { sourceRoot, readFile = (f) => fs.readFileSync(f, 'utf8') }) {
  const errors = [];
  const pkg = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'));
  const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const items = Array.isArray(registry.items) ? registry.items : [];
  const byName = new Map();

  if (registry.name !== 'avalia-solar') errors.push('registry: name deve ser avalia-solar');

  for (const item of items) {
    if (!KEBAB.test(item.name ?? '')) errors.push(`${item.name}: nome deve ser kebab-case: ${item.name}`);
    if (byName.has(item.name)) errors.push(`registry: nome duplicado: ${item.name}`);
    byName.set(item.name, item);
  }

  for (const item of items) {
    const tag = item.name;
    if (!ALLOWED_TYPES.has(item.type)) errors.push(`${tag}: tipo não suportado ${item.type}`);
    if (!item.title || !item.description) errors.push(`${tag}: title/description obrigatórios`);
    if (!item.meta?.version) errors.push(`${tag}: meta.version ausente`);
    if (!item.meta?.license) errors.push(`${tag}: meta.license ausente`);
    if (!Array.isArray(item.files) || item.files.length === 0) errors.push(`${tag}: sem arquivos`);

    for (const dep of item.dependencies ?? []) {
      if (!declared.has(packageName(dep))) errors.push(`${tag}: dependência npm fora do pacote: ${packageName(dep)}`);
    }
    for (const dep of item.registryDependencies ?? []) {
      if (!dep.startsWith(NAMESPACE) || !byName.has(dep.slice(NAMESPACE.length))) {
        errors.push(`${tag}: dependência de registry desconhecida ${dep}`);
      }
    }

    for (const file of item.files ?? []) {
      if (!isSafeRelative(file.path)) {
        errors.push(`${tag}: caminho inválido ${file.path}`);
        continue;
      }
      if (!isSafeRelative(file.target)) errors.push(`${tag}: target inválido ${file.target}`);
      if (/(^|\/)fixtures\//.test(file.path)) errors.push(`${tag}: fixtures não podem ser distribuídas (${file.path})`);
      if (file.path.endsWith('.map')) errors.push(`${tag}: sourcemap não pode ser distribuído (${file.path})`);
      const abs = path.join(sourceRoot, file.path);
      if (!fs.existsSync(abs)) {
        errors.push(`${tag}: arquivo inexistente ${file.path}`);
        continue;
      }
      const content = readFile(abs);
      if (SECRET_PATTERNS.some((re) => re.test(content))) errors.push(`${tag}: possível segredo em ${file.path}`);
    }
  }

  // Fecho de imports: todo import relativo precisa estar no próprio item ou em suas dependências transitivas.
  const closure = (name, seen = new Set()) => {
    if (seen.has(name) || !byName.has(name)) return seen;
    seen.add(name);
    for (const dep of byName.get(name).registryDependencies ?? []) closure(dep.slice(NAMESPACE.length), seen);
    return seen;
  };
  for (const item of items) {
    const available = new Set();
    for (const name of closure(item.name)) for (const f of byName.get(name).files ?? []) available.add(f.path);
    for (const file of item.files ?? []) {
      const abs = path.join(sourceRoot, file.path ?? '');
      if (!isSafeRelative(file.path) || !fs.existsSync(abs)) continue;
      for (const spec of relativeImports(readFile(abs))) {
        if (!resolveImport(file.path, spec, available)) errors.push(`${item.name}: import relativo não coberto ${spec} em ${file.path}`);
      }
    }
  }

  return errors;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const registry = JSON.parse(fs.readFileSync(path.join(here, '..', 'registry.json'), 'utf8'));
  const errors = validateRegistry(registry, { sourceRoot: path.join(here, '..', '..', 'mcp-ui') });
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`[ui-registry] ${registry.items.length} itens válidos`);
}
