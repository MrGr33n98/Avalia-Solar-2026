#!/usr/bin/env node
/**
 * Summarize real Lighthouse .report.json files (no synthetic data).
 * Usage: npm run perf:report -- --input .lighthouseci --output ../specs/014.../lighthouse-runs.md
 * Only lab medians / worst are derived. Never mislabel these values as RUM p75.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const readArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const input = path.resolve(readArg('--input', '.lighthouseci'));
const output = readArg('--output', '');
const environment = readArg('--environment', 'unspecified');
const commit = readArg('--commit', process.env.GITHUB_SHA || 'unspecified');
function walk(folder) {
  if (!fs.existsSync(folder)) throw new Error(`Lighthouse folder does not exist: ${folder}`);
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(folder, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
const files = walk(input).filter((file) => file.endsWith('.report.json'));
if (!files.length) throw new Error('No .report.json files collected. Run Lighthouse CI first.');

const extract = (lhr, id) => {
  if (id === 'script') {
    const summary = lhr.audits?.['resource-summary']?.details?.items || [];
    const entry = summary.find((item) => item.resourceType === 'script');
    return Number.isFinite(entry?.transferSize) ? entry.transferSize : null;
  }
  const value = lhr.audits?.[id]?.numericValue;
  return Number.isFinite(value) ? value : null;
};
const metrics = {
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  TBT: 'total-blocking-time',
  CLS: 'cumulative-layout-shift',
  TTFBProxy: 'server-response-time',
  ScriptTransferBytes: 'script',
};
const byRoute = new Map();
for (const file of files) {
  const lhr = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!lhr.finalUrl || !lhr.audits || !lhr.configSettings) continue;
  const url = new URL(lhr.finalUrl);
  const device = lhr.configSettings.formFactor || 'unspecified';
  const key = `${url.pathname}${url.search} [${device}]`;
  const record = { url: key, values: Object.fromEntries(Object.entries(metrics).map(
    ([label, id]) => [label, extract(lhr, id)]
  )) };
  const items = byRoute.get(key) || [];
  items.push(record);
  byRoute.set(key, items);
}
if (!byRoute.size) throw new Error('No valid Lighthouse LHR reports found.');

const median = (values) => {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const fmt = (num) => Number.isFinite(num) ? String(Math.round(num * 100) / 100) : 'n/d';
const lines = [
  '# Spec 014 — Lighthouse CI observed laboratory summary',
  '',
  `Environment: ${environment} · Commit: ${commit}`,
  '',
  '> Generated from measured Lighthouse .report.json files; not RUM p75. "Worst" means max value.',
  '',
  '| Route/device | Runs | FCP med/worst ms | LCP med/worst ms | TBT med/worst ms | CLS med/worst | Script transfer med/worst bytes | TTFB lab proxy med/worst ms |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
];
for (const [key, records] of [...byRoute].sort(([a], [b]) => a.localeCompare(b))) {
  const vals = (field) => records.map((record) => record.values[field]).filter(Number.isFinite);
  const pair = (field) => {
    const data = vals(field);
    return data.length ? `${fmt(median(data))} / ${fmt(Math.max(...data))}` : 'n/d';
  };
  lines.push(`| ${key} | ${records.length} | ${pair('FCP')} | ${pair('LCP')} | ${pair('TBT')} | ${pair('CLS')} | ${pair('ScriptTransferBytes')} | ${pair('TTFBProxy')} |`);
}
lines.push('', 'Record the Lighthouse and browser versions, device throttling, timestamp, release SHA and CPU/network profile separately. Require >=3 comparable runs; do not compare unrelated environments.', '');
const markdown = lines.join('\n');
if (output) {
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(path.resolve(output), markdown, 'utf8');
} else {
  process.stdout.write(markdown);
}
