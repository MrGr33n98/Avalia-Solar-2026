import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, '.lighthouseci');
const OUTPUT = path.join(ROOT, '..', 'specs', '014-frontend-performance-remediation', 'lighthouse-lab.json');
const auditNames = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbt: 'total-blocking-time',
  ttfb: 'server-response-time',
  scripts: 'resource-summary:script:size',
};

if (!fs.existsSync(SOURCE)) {
  console.error('No .lighthouseci directory. Run npm run perf:lhci first.');
  process.exit(1);
}

const files = fs.readdirSync(SOURCE).filter((name) => name.endsWith('.json'));
const results = [];
for (const file of files) {
  const report = JSON.parse(fs.readFileSync(path.join(SOURCE, file), 'utf8'));
  if (!report.finalUrl || !report.audits) continue;
  const entry = {
    route: report.finalUrl,
    filename: file,
    fetchedAt: report.fetchTime || null,
    lighthouseVersion: report.lighthouseVersion || null,
    commit: process.env.GIT_SHA || process.env.GITHUB_SHA || null,
    performanceScore: report.categories?.performance?.score ?? null,
    audits: {},
  };
  for (const [label, key] of Object.entries(auditNames)) {
    entry.audits[label] = report.audits[key]?.numericValue ?? null;
  }
  results.push(entry);
}

if (!results.length) {
  console.error('No usable Lighthouse JSON reports were found; no baseline generated.');
  process.exit(1);
}
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), runs: results }, null, 2) + '\n');
console.log(`Exported ${results.length} REAL Lighthouse reports to ${OUTPUT}`);
console.log('The file is a lab sample, NOT field p75 RUM; copy aggregated evidence into metrics.md after review.');
