'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Market = {
  id: number;
  name: string;
  currency: string;
};

export default function MarketsPage() {
  const [items, setItems] = useState<Market[]>([
    { id: 1, name: 'Brasil (BRL)', currency: 'BRL' },
    { id: 2, name: 'U.S. (USD)', currency: 'USD' },
  ]);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    setItems([...items, { id: Date.now(), name: name.trim(), currency: currency.toUpperCase() }]);
    setName('');
    setIsAdding(false);
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Markets"
        subtitle="Choose what currencies are available in your account"
        helpTitle="What is a market?"
        helpDescription="Products have unique pricing for each market. Each lead has a specific market, so attached products receive the appropriate pricing."
        extraHelpCards={[
          {
            title: 'Multiple currencies',
            content: 'Define a market with your currency type, then edit product pricing for that market.',
          },
          {
            title: 'Default markets',
            content: 'Every user can set a default market in their My Account page. When they create a new lead, it will default to this setting.',
          },
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-700">Markets ({items.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add market...</span>
              </button>
            )}
          </div>

          {isAdding && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Market name (e.g. América Latina)"
                className="h-8 text-xs bg-white flex-1"
                autoFocus
              />
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="Currency"
                className="h-8 text-xs bg-white w-20"
              />
              <Button size="sm" onClick={handleAdd} className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                Cancel
              </Button>
            </div>
          )}

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50/80 transition-colors">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">{item.currency}</span>
              </div>
            ))}
          </div>
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
