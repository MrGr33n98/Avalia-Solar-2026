import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLAYGROUND_ITEMS } from '../../playground/items';

const registry = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../ui-registry/registry.json'), 'utf8')
) as { items: { name: string; type: string; files: { path: string }[] }[] };

describe('Spec 021 — registry × playground × build', () => {
  it('todo bloco do registry tem preview no playground e vice-versa', () => {
    const blocks = registry.items.filter((item) => item.type === 'registry:block').map((item) => item.name).sort();
    expect(PLAYGROUND_ITEMS.map((item) => item.name).sort()).toEqual(blocks);
  });

  it('nenhuma superfície MCP importa playground ou fixtures', () => {
    const entriesDir = path.resolve(__dirname, '../../src');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'fixtures') walk(full);
          continue;
        }
        const text = fs.readFileSync(full, 'utf8');
        if (/from ['"][^'"]*(playground|fixtures)/.test(text)) offenders.push(path.relative(entriesDir, full));
      }
    };
    walk(entriesDir);
    expect(offenders).toEqual([]);
  });

  it('build das superfícies não inclui o playground', () => {
    const build = fs.readFileSync(path.resolve(__dirname, '../../scripts/build.mjs'), 'utf8');
    expect(build).not.toMatch(/playground/);
  });
});
