'use client';

import type { ShareFormat } from '@/lib/share/shareTypes';

const formats: Array<{ value: ShareFormat; label: string }> = [
  { value: 'link', label: 'Link' },
  { value: 'feed', label: 'Instagram Feed' },
  { value: 'story', label: 'Instagram Story' },
  { value: 'card', label: 'Card' },
];

export function SocialFormatSelector({ value, onChange }: { value: ShareFormat; onChange: (value: ShareFormat) => void }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-700">
      Formato
      <select value={value} onChange={(event) => onChange(event.target.value as ShareFormat)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal">
        {formats.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
      </select>
    </label>
  );
}
