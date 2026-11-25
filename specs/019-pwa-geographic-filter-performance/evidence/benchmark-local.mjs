import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const apiBase = (process.env.SPEC019_API_BASE || 'http://127.0.0.1:23001/api/v1').replace(/\/+$/, '');
const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'benchmark-local-after.json'
);
const measuredSamples = 30;
const warmupSamples = 5;

async function measure(url, headers = {}) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    headers,
  });
  const timeToHeadersMs = performance.now() - startedAt;
  const body = await response.arrayBuffer();

  return {
    status: response.status,
    timeToHeadersMs,
    runtimeMs: Number(response.headers.get('x-runtime')) * 1000 || null,
    bodyBytes: body.byteLength,
    cacheControl: response.headers.get('cache-control'),
    etag: response.headers.get('etag'),
    revision: response.headers.get('x-locations-version'),
  };
}

function percentile(values, p) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(p * sorted.length) - 1] ?? null;
}

function summarize(samples) {
  const timings = samples.map((sample) => sample.timeToHeadersMs);
  const runtimes = samples.map((sample) => sample.runtimeMs).filter(Number.isFinite);
  return {
    sampleCount: samples.length,
    statuses: Object.fromEntries(
      [...new Set(samples.map((sample) => sample.status))].map((status) => [
        String(status),
        samples.filter((sample) => sample.status === status).length,
      ])
    ),
    timeToHeadersMs: {
      p50: percentile(timings, 0.5),
      p95: percentile(timings, 0.95),
      max: Math.max(...timings),
    },
    railsRuntimeMs: runtimes.length
      ? {
          p50: percentile(runtimes, 0.5),
          p95: percentile(runtimes, 0.95),
          max: Math.max(...runtimes),
        }
      : null,
    bodyBytes: [...new Set(samples.map((sample) => sample.bodyBytes))],
    cacheControl: [...new Set(samples.map((sample) => sample.cacheControl))],
  };
}

const citiesUrl = `${apiBase}/companies/cities?state=SC`;
const initial = await measure(citiesUrl);
if (initial.status !== 200 || !initial.etag || !initial.revision) {
  throw new Error(
    `Amostra inicial inválida: status=${initial.status}, etag=${Boolean(initial.etag)}, revision=${Boolean(initial.revision)}`
  );
}

for (let index = 0; index < warmupSamples; index += 1) await measure(citiesUrl);
const publicGetSamples = [];
for (let index = 0; index < measuredSamples; index += 1) {
  publicGetSamples.push(await measure(citiesUrl));
}

const conditionalSamples = [];
for (let index = 0; index < measuredSamples; index += 1) {
  conditionalSamples.push(await measure(citiesUrl, { 'If-None-Match': initial.etag }));
}

const report = {
  generatedAt: new Date().toISOString(),
  branch: 'feat/019-pwa-geographic-filter-performance',
  head: process.env.SPEC019_HEAD || 'f1d6f42586d1614a54cc975bdc3ca9b62c62de57',
  environment: 'isolated local Rails test container; public GET over loopback',
  apiBase,
  state: 'SC',
  revision: initial.revision,
  warmupSamples,
  results: {
    publicGet200: summarize(publicGetSamples),
    conditionalGet304: summarize(conditionalSamples),
  },
  limits: {
    measuredSamplesPerCase: measuredSamples,
    ttfbMeaning: 'time from fetch start until response headers are available',
    comparison: 'no comparable baseline was available; these are after-change local measurements only',
  },
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
