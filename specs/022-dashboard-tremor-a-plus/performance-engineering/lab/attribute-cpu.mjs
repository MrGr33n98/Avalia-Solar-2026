// Spec 022 — atribui self-time de .cpuprofile (CDP) a módulos de origem via source maps.
// Uso: FRONT_DIR=... node attribute-cpu.mjs <out.json> <a.cpuprofile> [b.cpuprofile ...]
// Agrega a mediana entre perfis. Requer build com productionBrowserSourceMaps (lab).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { SourceMapConsumer } = require('source-map-js');
const STATIC_DIR = path.join(process.env.FRONT_DIR, '.next');

const consumers = new Map();
function consumerFor(url) {
  const m = url.match(/\/_next\/(static\/.+\.js)(?:\?.*)?$/);
  if (!m) return null;
  if (consumers.has(m[1])) return consumers.get(m[1]);
  const mapFile = path.join(STATIC_DIR, `${m[1]}.map`);
  let c = null;
  if (fs.existsSync(mapFile)) c = new SourceMapConsumer(JSON.parse(fs.readFileSync(mapFile, 'utf8')));
  consumers.set(m[1], c);
  return c;
}

// Normaliza o caminho de origem para um "módulo" legível.
function moduleOf(source) {
  if (!source) return '(sem source map)';
  const s = source.replace(/^webpack:\/\/(_N_E\/)?/, '').replace(/^\.\//, '');
  const nm = s.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (nm) return `npm:${nm[1]}`;
  return s.split('?')[0];
}

const SPECIAL = ['(idle)', '(program)', '(garbage collector)', '(root)'];
const isAppModule = (mod) => !!mod && !mod.startsWith('npm:') && !mod.startsWith('(') && !mod.startsWith('chunk:')
  && !mod.startsWith('url:') && !mod.startsWith('webpack/');

function attribute(profile) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const parentOf = new Map();
  for (const n of profile.nodes) for (const c of n.children || []) parentOf.set(c, n.id);
  const resolved = new Map();
  const resolve = (id) => {
    if (resolved.has(id)) return resolved.get(id);
    const cf = byId.get(id).callFrame;
    let r = { mod: '(native/vm)', fn: cf.functionName || '(anon)' };
    if (SPECIAL.includes(cf.functionName)) r = { mod: cf.functionName, fn: cf.functionName };
    else if (cf.url) {
      const c = consumerFor(cf.url);
      if (c && cf.lineNumber >= 0) {
        const pos = c.originalPositionFor({ line: cf.lineNumber + 1, column: Math.max(0, cf.columnNumber) });
        r = { mod: moduleOf(pos.source), fn: pos.name || r.fn };
      } else {
        r = { mod: cf.url.includes('/_next/') ? `chunk:${cf.url.split('/').pop()}` : `url:${new URL(cf.url).pathname}`, fn: r.fn };
      }
    }
    resolved.set(id, r);
    return r;
  };
  const ownerOf = (id) => {
    let cur = id;
    while (cur !== undefined) {
      const r = resolve(cur);
      if (isAppModule(r.mod)) return `${r.mod} :: ${r.fn}`;
      cur = parentOf.get(cur);
    }
    return '(sem dono no app)';
  };
  const byOwner = new Map();
  const selfUs = new Map();
  const { samples, timeDeltas } = profile;
  for (let i = 0; i < samples.length; i++) {
    const dt = timeDeltas[i + 1] ?? 0;
    selfUs.set(samples[i], (selfUs.get(samples[i]) || 0) + dt);
  }
  const byModule = new Map();
  const byFn = new Map();
  let totalUs = 0;
  for (const [id, us] of selfUs) {
    const { mod, fn } = resolve(id);
    if (mod !== '(idle)') totalUs += us;
    byModule.set(mod, (byModule.get(mod) || 0) + us);
    const key = `${mod} :: ${fn}`;
    byFn.set(key, (byFn.get(key) || 0) + us);
    if (!SPECIAL.includes(mod)) {
      const owner = ownerOf(id);
      byOwner.set(owner, (byOwner.get(owner) || 0) + us);
    }
  }
  return { totalUs, byModule, byFn, byOwner };
}

const [outFile, ...profiles] = process.argv.slice(2);
const results = profiles.map((p) => attribute(JSON.parse(fs.readFileSync(p, 'utf8'))));
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
};
function combine(field) {
  const keys = new Set(results.flatMap((r) => [...r[field].keys()]));
  return [...keys]
    .map((k) => ({ key: k, ms: Math.round(median(results.map((r) => r[field].get(k) || 0)) / 1000) }))
    .filter((x) => x.ms > 0)
    .sort((a, b) => b.ms - a.ms);
}
const totalMs = Math.round(median(results.map((r) => r.totalUs)) / 1000);
const modules = combine('byModule');
const functions = combine('byFn');
const owners = combine('byOwner');
fs.writeFileSync(outFile, JSON.stringify({ profiles: profiles.length, totalBusyMs: totalMs, modules, functions, owners }, null, 2));
console.log(`busy(mediana, sem idle)=${totalMs}ms em ${profiles.length} perfis`);
console.log('--- top módulos (self ms) ---');
modules.slice(0, 25).forEach((m) => console.log(`${String(m.ms).padStart(6)}  ${m.key}`));
console.log('--- top donos no app (self ms de tudo abaixo deles) ---');
owners.slice(0, 25).forEach((m) => console.log(`${String(m.ms).padStart(6)}  ${m.key}`));
console.log('--- top funções (self ms) ---');
functions.slice(0, 25).forEach((m) => console.log(`${String(m.ms).padStart(6)}  ${m.key}`));
