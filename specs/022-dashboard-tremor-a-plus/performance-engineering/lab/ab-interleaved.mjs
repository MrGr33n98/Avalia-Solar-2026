// Spec 022 — comparação A/B intercalada (lab). Dois servidores de produção no ar
// (A = antes, B = depois); cada par roda A e B em sequência, alternando a ordem,
// para que a carga da máquina afete os dois lados igualmente.
// Uso: FRONT_DIR=... LAB_OUT=... LAB_A=http://127.0.0.1:3101 LAB_B=http://127.0.0.1:3100 \
//      [LAB_MOBILE=1] node ab-interleaved.mjs <label> <pares>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = process.env.LAB_OUT;
const LABEL = process.argv[2] || 'ab';
const PAIRS = Number(process.argv[3] || 10);
const A = process.env.LAB_A;
const B = process.env.LAB_B;

function runOne(base, side, i) {
  const out = path.join(OUT, `${LABEL}-${side}`);
  execFileSync(process.execPath, [path.join(HERE, 'cpu-profile.mjs'), `${LABEL}-${side}-${i}`, '1'], {
    env: { ...process.env, LAB_BASE: base, LAB_OUT: out },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const summary = JSON.parse(fs.readFileSync(path.join(out, `${LABEL}-${side}-${i}-summary.json`), 'utf8'));
  return { ...summary.runsDetail[0], load1: os.loadavg()[0] };
}

const KEYS = ['tbtMs', 'longTaskSumMs', 'maxLongTaskMs', 'scriptMs', 'styleMs', 'layoutMs', 'shellMs', 'domNodes'];
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

fs.mkdirSync(OUT, { recursive: true });
const pairs = [];
for (let i = 0; i < PAIRS; i++) {
  const order = i % 2 === 0 ? ['A', 'B'] : ['B', 'A'];
  const r = {};
  for (const side of order) r[side] = runOne(side === 'A' ? A : B, side, i);
  pairs.push(r);
  console.error(`par ${i + 1}/${PAIRS}: tbt A=${r.A.tbtMs} B=${r.B.tbtMs} load=${r.A.load1.toFixed(1)}`);
}

const report = { label: LABEL, mobile: process.env.LAB_MOBILE === '1', pairs: PAIRS, metrics: {} };
for (const k of KEYS) {
  const a = pairs.map((p) => p.A[k]).filter((x) => x != null);
  const b = pairs.map((p) => p.B[k]).filter((x) => x != null);
  const diffs = pairs.filter((p) => p.A[k] != null && p.B[k] != null).map((p) => p.B[k] - p.A[k]);
  const wins = diffs.filter((d) => d < 0).length;
  report.metrics[k] = {
    medianA: median(a), medianB: median(b),
    deltaPct: median(a) ? Math.round(((median(b) - median(a)) / median(a)) * 1000) / 10 : null,
    medianPairedDiff: median(diffs),
    pairsBetter: `${wins}/${diffs.length}`,
  };
}
fs.writeFileSync(path.join(OUT, `${LABEL}-ab.json`), JSON.stringify({ ...report, raw: pairs }, null, 2));
console.log(JSON.stringify(report, null, 2));
