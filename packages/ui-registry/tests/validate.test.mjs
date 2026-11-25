import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateRegistry } from '../scripts/validate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.resolve(here, '..', 'registry.json');
const sourceRoot = path.resolve(here, '..', '..', 'mcp-ui');
const load = () => JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const run = (registry) => validateRegistry(registry, { sourceRoot });

const block = (overrides = {}) => ({
  name: 'tmp-block',
  type: 'registry:block',
  title: 'Tmp',
  description: 'Tmp',
  files: [{ path: 'src/blocks/ReviewDistribution.tsx', type: 'registry:file', target: 'src/avalia-solar/blocks/Tmp.tsx' }],
  meta: { version: '0.1.0', license: 'UNLICENSED', distribution: 'internal', status: 'implemented' },
  ...overrides,
});

test('registry real é válido e cobre os blocos do MVP', () => {
  const registry = load();
  assert.deepEqual(run(registry), []);
  const names = registry.items.map((item) => item.name);
  for (const name of ['solar-company-card', 'solar-company-list', 'company-comparison-table', 'review-distribution', 'evidence-card']) {
    assert.ok(names.includes(name), name);
  }
});

test('rejeita nome duplicado e nome fora de kebab-case', () => {
  const registry = load();
  registry.items.push(block({ name: 'solar-company-card' }), block({ name: 'Bad_Name' }));
  const errors = run(registry).join('\n');
  assert.match(errors, /duplicado: solar-company-card/);
  assert.match(errors, /kebab-case: Bad_Name/);
});

test('rejeita traversal, caminho absoluto e arquivo inexistente', () => {
  const registry = load();
  registry.items.push(
    block({ name: 'a1', files: [{ path: '../AB0-1-back/config/master.key', type: 'registry:file', target: 'x' }] }),
    block({ name: 'a2', files: [{ path: '/etc/passwd', type: 'registry:file', target: 'x' }] }),
    block({ name: 'a3', files: [{ path: 'src/blocks/Nope.tsx', type: 'registry:file', target: 'src/avalia-solar/x.tsx' }] }),
    block({ name: 'a4', files: [{ path: 'src/blocks/EvidenceCard.tsx', type: 'registry:file', target: '../outside.tsx' }] })
  );
  const errors = run(registry).join('\n');
  assert.match(errors, /a1: caminho inválido/);
  assert.match(errors, /a2: caminho inválido/);
  assert.match(errors, /a3: arquivo inexistente/);
  assert.match(errors, /a4: target inválido/);
});

test('rejeita fixtures, sourcemaps e conteúdo com segredo', () => {
  const registry = load();
  registry.items.push(
    block({ name: 'b1', files: [{ path: 'src/fixtures/staging-fixtures.ts', type: 'registry:file', target: 'src/avalia-solar/f.ts' }] }),
    block({ name: 'b2', files: [{ path: 'dist/search.v1.html.map', type: 'registry:file', target: 'src/avalia-solar/x.map' }] })
  );
  const errors = run(registry).join('\n');
  assert.match(errors, /b1: fixtures não podem ser distribuídas/);
  assert.match(errors, /b2: sourcemap não pode ser distribuído/);
  const secretErrors = validateRegistry(load(), {
    sourceRoot,
    readFile: (file) => (file.endsWith('EvidenceCard.tsx') ? 'const t = "ghp_' + 'a'.repeat(36) + '";' : fs.readFileSync(file, 'utf8')),
  }).join('\n');
  assert.match(secretErrors, /evidence-card: possível segredo/);
});

test('exige dependências de registry existentes e fecho de imports relativos', () => {
  const registry = load();
  registry.items.push(
    block({ name: 'c1', registryDependencies: ['@avalia-solar/nao-existe'] }),
    block({ name: 'c2', files: [{ path: 'src/blocks/SolarCompanyList.tsx', type: 'registry:file', target: 'src/avalia-solar/blocks/SolarCompanyList.tsx' }] })
  );
  const errors = run(registry).join('\n');
  assert.match(errors, /c1: dependência de registry desconhecida @avalia-solar\/nao-existe/);
  assert.match(errors, /c2: import relativo não coberto \.\/SolarCompanyCard/);
});

test('exige dependência npm declarada no pacote e metadados de licença/versão', () => {
  const registry = load();
  registry.items.push(
    block({ name: 'd1', dependencies: ['left-pad@1.0.0'] }),
    block({ name: 'd2', meta: { version: '0.1.0' } })
  );
  const errors = run(registry).join('\n');
  assert.match(errors, /d1: dependência npm fora do pacote: left-pad/);
  assert.match(errors, /d2: meta\.license ausente/);
});
