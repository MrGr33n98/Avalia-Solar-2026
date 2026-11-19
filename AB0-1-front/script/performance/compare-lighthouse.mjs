#!/usr/bin/env node
/**
 * Compare actual Lighthouse LHR JSON folders from before and after deployment.
 *
 * Exit 2 = baseline or sample-size missing, Exit 1 = measurable regression,
 * Exit 0 = all measurable lab gates passed.
 * INP and real-user p75 require independent RUM analysis; not inferred here.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function arg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}
function fatal(message, code = 2) {
  console.error(message);
  process.exit(code);
}
const before = arg('--before');
const after = arg('--after');
if (!before || !after) fatal('Usage: node compare-lighthouse.mjs --before <baseline-lhr-dir> --after <candidate-lhr-dir>');
function readReports(dir) {
  const result = new Map();
  function scan(folder) {
    if (!fs.existsSync(folder)) fatal(`Missing measured Lighthouse directory: ${folder}`);
    for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const filename = path.join(folder, item.name);
      if (item.isDirectory()) { scan(filename); continue; }
      if (!item.name.endsWith('.report.json')) continue;
      const report = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (!report.finalUrl || !report.audits || !report.configSettings) continue;
      const url = new URL(report.finalUrl);
      const key = `${url.pathname}${url.search}|${report.configSettings.formFactor}`;
      const raw = result.get(key) || [];
      raw.push(report);
      result.set(key, raw);
    }
  }
  scan(path.resolve(dir));
  return result;
}
function audit(report, id) {
  if (id === 'scripts') {
    const summary = report.audits['resource-summary']?.details?.items || [];
    const entry = summary.find((x) => x.resourceType === 'script');
    return typeof entry?.transferSize === 'number' ? entry.transferSize : undefined;
  }
  if (id === 'performance') return report.categories?.performance?.score;
  return report.audits[id]?.numericValue;
}
const fields = {
  LCP: 'largest-contentful-paint',
  FCP: 'first-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
  TTFBProxy: 'server-response-time',
  Scripts: 'scripts',
  LH: 'performance',
};
const budgets = { LCP: 2500, FCP: 2000, CLS: 0.1, TBT: 500, TTFBProxy: 600, Scripts: 450000 };
function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
const baseline = readReports(before);
const candidate = readReports(after);
let missing = false;
let regressions = 0;
let checks = 0;
for (const [key, oldReports] of baseline) {
  const newReports = candidate.get(key);
  if (!newReports || oldReports.length < 3 || newReports.length < 3) {
    console.error(`MISSING: ${key} requires at least three comparable before/after runs`);
    missing = true;
    continue;
  }
  for (const [label, id] of Object.entries(fields)) {
    const old = oldReports.map((r) => audit(r, id)).filter(Number.isFinite);
    const next = newReports.map((r) => audit(r, id)).filter(Number.isFinite);
    if (old.length < 3 || next.length < 3) {
      console.error(`MISSING: ${key} / ${label} metric has insufficient observations`);
      missing = true;
      continue;
    }
    const b = median(old);
    const a = median(next);
    // For performance score higher is better; all timing/bytes lower is better.
    const change = label === 'LH' ? (b ? ((b - a) / b) : 0) : (b ? ((a - b) / b) : (a > 0 ? Infinity : 0));
    const regression = change > 0.05;
    const budgetFail = label === 'LH' ? a < 0.8 : a > budgets[label];
    checks += 1;
    if (regression || budgetFail) regressions += 1;
    console.log(`${regression || budgetFail ? 'FAIL' : 'PASS'} ${key} ${label} before=${b.toFixed(2)} after=${a.toFixed(2)} delta=${(change*100).toFixed(1)}% budget=${budgetFail ? 'fail' : 'ok'}`);
  }
}
if (!checks || missing) fatal('Measurements are incomplete: no rollout verdict can be issued.', 2);
if (regressions) fatal(`${regressions} regression/budget failures across ${checks} lab comparisons.`, 1);
console.log(`PASS: ${checks} laboratory comparisons. RUM p75 INP/LCP/TTFB still require field verification.`);
