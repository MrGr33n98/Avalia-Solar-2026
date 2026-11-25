import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/design/tokens.css';
import '../src/design/motion.css';
import { HostProvider } from '../src/bridge/host-adapter';
import { PLAYGROUND_ITEMS, type PreviewState } from './items';

const WIDTHS = [280, 320, 360, 390, 480, 720, 960, 1120] as const;
const STATES: PreviewState[] = ['ready', 'loading', 'empty', 'error'];

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const width = Number(params.get('width'));
  return {
    item: params.get('item') ?? PLAYGROUND_ITEMS[0].name,
    theme: params.get('theme') === 'dark' ? 'dark' : 'light',
    width: (WIDTHS as readonly number[]).includes(width) ? width : 720,
    state: (STATES.includes(params.get('state') as PreviewState) ? params.get('state') : 'ready') as PreviewState,
  } as const;
}

const Playground: React.FC = () => {
  const initial = useMemo(readParams, []);
  const [itemName, setItemName] = useState<string>(initial.item);
  const [theme, setTheme] = useState<'light' | 'dark'>(initial.theme);
  const [width, setWidth] = useState<number>(initial.width);
  const [state, setState] = useState<PreviewState>(initial.state);
  const item = PLAYGROUND_ITEMS.find((entry) => entry.name === itemName) ?? PLAYGROUND_ITEMS[0];

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap', fontFamily: 'var(--as-font)' }}>
      <nav aria-label="Itens do registry" style={{ minWidth: 200 }}>
        <p role="note" style={{ fontWeight: 700, color: 'var(--as-danger)', margin: '0 0 8px' }}>
          FIXTURE / NÃO PRODUÇÃO
        </p>
        {(['Marketplace', 'Trust'] as const).map((group) => (
          <section key={group}>
            <h2 style={{ fontSize: 13, margin: '12px 0 4px' }}>{group}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {PLAYGROUND_ITEMS.filter((entry) => entry.group === group).map((entry) => (
                <li key={entry.name}>
                  <button
                    type="button"
                    className="as-btn as-btn-ghost"
                    aria-current={entry.name === item.name ? 'page' : undefined}
                    onClick={() => setItemName(entry.name)}
                  >
                    {entry.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <main style={{ flex: 1, minWidth: 0 }}>
        <div className="as-row as-wrap" style={{ marginBottom: 12 }}>
          <label>
            Tema{' '}
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>
          <label>
            Largura{' '}
            <select value={width} onChange={(e) => setWidth(Number(e.target.value))}>
              {WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado{' '}
            <select value={state} onChange={(e) => setState(e.target.value as PreviewState)}>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div data-theme={theme} data-testid="preview" style={{ width, maxWidth: '100%', background: 'var(--as-bg)', color: 'var(--as-text)' }}>
          <section className="as-frame as-stack" aria-label={`Preview ${item.name}`} data-registry-preview={item.name}>
            {item.render(state)}
          </section>
        </div>
      </main>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <HostProvider appName="avalia-solar-playground">
      <Playground />
    </HostProvider>
  );
}
