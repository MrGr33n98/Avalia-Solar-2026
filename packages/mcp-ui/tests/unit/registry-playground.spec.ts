/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { PLAYGROUND_ITEMS } from '../../playground/items';
import registryJson from '../../../ui-registry/registry.json?raw';
import buildScript from '../../scripts/build.mjs?raw';

const registry = JSON.parse(registryJson) as { items: { name: string; type: string }[] };
const sources = import.meta.glob('../../src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

describe('Spec 021 — registry × playground × build', () => {
  it('todo bloco do registry tem preview no playground e vice-versa', () => {
    const blocks = registry.items.filter((item) => item.type === 'registry:block').map((item) => item.name).sort();
    expect(PLAYGROUND_ITEMS.map((item) => item.name).sort()).toEqual(blocks);
  });

  it('nenhuma superfície MCP importa playground ou fixtures', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.includes('/fixtures/'))
      .filter(([, text]) => /from ['"][^'"]*(playground|fixtures)/.test(text))
      .map(([file]) => file);
    expect(Object.keys(sources).length).toBeGreaterThan(10);
    expect(offenders).toEqual([]);
  });

  it('build das superfícies não inclui o playground', () => {
    expect(buildScript).not.toMatch(/playground/);
  });
});
