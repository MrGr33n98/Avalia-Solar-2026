#!/usr/bin/env node
// T042 — instala itens do registry em projetos descartáveis (React 18 + TS) via
// `shadcn add`, servindo generated/r apenas em 127.0.0.1, e valida com tsc.
// Requer `npm run build` antes. Não toca no pacote produtivo.
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHADCN = 'shadcn@4.13.0';
const execFileAsync = promisify(execFile);
const ITEMS = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['solar-company-list', 'company-comparison-table', 'review-distribution'];

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const registryDir = path.join(root, 'generated', 'r');
const mcpUi = path.resolve(root, '..', 'mcp-ui');
const sandboxRoot = path.join(root, '.install-sandbox');

if (!fs.existsSync(registryDir)) {
  console.error('generated/r ausente: rode npm run build');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const name = path.basename(decodeURIComponent((req.url ?? '').split('?')[0]));
  const file = path.join(registryDir, name);
  if (!name.endsWith('.json') || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' }).end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const pkg = JSON.parse(fs.readFileSync(path.join(mcpUi, 'package.json'), 'utf8'));
const results = [];
fs.rmSync(sandboxRoot, { recursive: true, force: true });

try {
  for (const item of ITEMS) {
    const dir = path.join(sandboxRoot, item);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: `sandbox-${item}`,
      private: true,
      type: 'module',
      dependencies: pkg.dependencies,
      devDependencies: { typescript: pkg.devDependencies.typescript, '@types/react': pkg.devDependencies['@types/react'], '@types/react-dom': pkg.devDependencies['@types/react-dom'] },
    }, null, 2));
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { target: 'ES2020', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true, baseUrl: '.', paths: { '@/*': ['src/*'] }, types: [] },
      include: ['src'],
    }, null, 2));
    fs.writeFileSync(path.join(dir, 'src', 'index.css'), '');
    fs.writeFileSync(path.join(dir, 'components.json'), JSON.stringify({
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'new-york',
      rsc: false,
      tsx: true,
      tailwind: { config: '', css: 'src/index.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
      aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
      registries: { '@avalia-solar': `http://127.0.0.1:${port}/{name}.json` },
    }, null, 2));
    // Reaproveita as dependências já instaladas do pacote (sem rede para deps).
    fs.symlinkSync(path.join(mcpUi, 'node_modules'), path.join(dir, 'node_modules'), 'dir');

    const started = Date.now();
    let status = 'PASS';
    let detail = '';
    try {
      // Assíncrono: o servidor HTTP do registry roda neste mesmo processo (execFileSync causava deadlock).
      const child = execFileAsync('npx', ['--yes', SHADCN, 'add', `@avalia-solar/${item}`, '-y', '-c', dir], {
        env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' },
        timeout: 240_000,
      });
      child.child.stdin?.end();
      await child;
    } catch (error) {
      // shadcn pode falhar só no passo de npm install; arquivos são verificados abaixo.
      detail = `shadcn add exit ${error.status}: ${String(error.stderr ?? '').split('\n').filter(Boolean).slice(-2).join(' | ')}`;
    }
    const installed = fs.existsSync(path.join(dir, 'src', 'avalia-solar'))
      ? execFileSync('find', ['src/avalia-solar', '-type', 'f'], { cwd: dir }).toString().trim().split('\n').sort()
      : [];
    if (installed.length === 0) status = 'FAIL';
    if (status === 'PASS') {
      try {
        execFileSync(path.join(mcpUi, 'node_modules', '.bin', 'tsc'), ['-p', dir], { stdio: 'pipe' });
      } catch (error) {
        status = 'FAIL';
        detail += ` tsc: ${String(error.stdout ?? '').split('\n').slice(0, 3).join(' | ')}`;
      }
    }
    results.push({ item, status, files: installed, ms: Date.now() - started, detail: detail.trim() });
  }
} finally {
  server.close();
}

console.log(JSON.stringify(results, null, 2));
process.exit(results.every((r) => r.status === 'PASS') ? 0 : 1);
