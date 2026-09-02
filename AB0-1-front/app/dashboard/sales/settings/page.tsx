'use client';

import { useEffect, useState } from 'react';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Taxonomy = { id: number; kind: string; name: string; slug: string };

export default function SalesSettingsPage() {
  const [items, setItems] = useState<Taxonomy[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/taxonomies', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar taxonomias.');
        return response.json();
      })
      .then((data) => {
        setItems(data.taxonomies ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="General Setup & Taxonomies"
        subtitle="Manage baseline organizational categories and taxonomy definitions for Avalia Solar CRM"
        helpTitle="What are taxonomies?"
        helpDescription="Taxonomies group companies, leads, and products into canonical categories like Company Types, Industries, Markets, and Tags across the CRM."
        extraHelpCards={[
          {
            title: 'API Integration',
            content: 'Taxonomies created here are served directly via /api/v1/sales/taxonomies and can be managed programmatically.',
          },
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-700">Canonical Taxonomies ({items.length})</span>
          </div>

          {state === 'loading' && <p className="py-8 text-center text-xs text-slate-500">Loading taxonomies...</p>}
          {state === 'error' && <p className="py-8 text-center text-xs text-red-600">Failed to load taxonomies.</p>}
          {state === 'ready' && items.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-500">No custom taxonomies registered yet.</p>
          )}

          {state === 'ready' && items.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-100 p-3 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase text-slate-400">{item.kind}</p>
                  <p className="mt-0.5 font-medium text-xs text-slate-800">{item.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.slug}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
