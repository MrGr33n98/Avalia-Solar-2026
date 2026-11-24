import { useState, type ReactNode } from 'react';

export function BrandSections({ sections }: { sections: { id: string; label: string; content: ReactNode }[] }) {
  const [selected, setSelected] = useState('overview');
  const visible = sections.filter((section) => section.content != null);
  const active = visible.find((section) => section.id === selected);
  if (!visible.length) return null;
  return (
    <div className="as-stack">
      <nav aria-label="Seções da empresa" className="as-row" style={{ overflowX: 'auto', padding: '2px 2px 4px' }}>
        {[{ id: 'overview', label: 'Visão geral' }, ...visible].map((section) => (
          <button key={section.id} type="button" className="as-btn"
            style={{ flexShrink: 0, fontWeight: (active?.id ?? 'overview') === section.id ? 700 : 400 }}
            aria-pressed={(active?.id ?? 'overview') === section.id}
            onClick={() => setSelected(section.id)}>{section.label}</button>
        ))}
      </nav>
      {active ? active.content : visible.map((section) => <div key={section.id}>{section.content}</div>)}
    </div>
  );
}
