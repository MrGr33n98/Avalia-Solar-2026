const timeoutMs = 200;

const state = {
  updatedAt: Date.now(),
  data: [{ id: 1, name: 'cached' }],
};

const ttlMs = 50;
const staleMs = 24 * 60 * 60 * 1000;

const durationMs = async (fn) => {
  const start = Date.now();
  const result = await fn();
  return { ms: Date.now() - start, result };
};

const getWithSWR = async (fetcher, fallback = []) => {
  const age = Date.now() - state.updatedAt;
  if (age <= ttlMs) {
    return { data: state.data, source: 'fresh_cache' };
  }
  if (age <= ttlMs + staleMs) {
    // Serve stale immediately, refresh async
    fetcher()
      .then((data) => {
        state.data = data;
        state.updatedAt = Date.now();
      })
      .catch(() => {});
    return { data: state.data, source: 'stale_cache' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const data = await fetcher(controller.signal);
    clearTimeout(timeout);
    state.data = data;
    state.updatedAt = Date.now();
    return { data, source: 'network' };
  } catch {
    return { data: state.data ?? fallback, source: 'fallback' };
  }
};

const assertLt = (value, threshold, label) => {
  if (value >= threshold) {
    throw new Error(`${label} expected < ${threshold}ms, got ${value}ms`);
  }
};

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const highLatency = await durationMs(async () =>
    getWithSWR(async () => await new Promise((resolve) => setTimeout(() => resolve([{ id: 2 }]), 500)))
  );

  const offline = await durationMs(async () =>
    getWithSWR(async () => {
      throw new Error('offline');
    })
  );

  assertLt(highLatency.ms, 100, 'High-latency stale response');
  assertLt(offline.ms, 100, 'Offline stale response');

  console.log(
    JSON.stringify(
      {
        scenarios: {
          highLatencyMs: highLatency.ms,
          offlineMs: offline.ms,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[simulate-home-cache-fallback] failed:', error.message);
  process.exitCode = 1;
});
