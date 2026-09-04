'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

interface TaxonomyItem {
  id: number;
  kind: string;
  name: string;
  slug?: string;
}

interface TaxonomySettingPageProps {
  kind: 'activity_types' | 'industries' | 'territories' | 'markets';
  title: string;
  subtitle: string;
  helpTitle: string;
  helpDescription: string;
  defaultItems: string[];
}

export default function TaxonomySettingPage({
  kind,
  title,
  subtitle,
  helpTitle,
  helpDescription,
  defaultItems,
}: TaxonomySettingPageProps) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/sales/taxonomies?kind=${kind}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter itens.');
      const data = await res.json();
      const loaded: TaxonomyItem[] = data.taxonomies || [];
      if (loaded.length === 0) {
        setItems(defaultItems.map((name, i) => ({ id: i + 1, kind, name })));
      } else {
        setItems(loaded);
      }
    } catch {
      setItems(defaultItems.map((name, i) => ({ id: i + 1, kind, name })));
    } finally {
      setLoading(false);
    }
  }, [kind, defaultItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const name = newName.trim();
    try {
      const res = await fetch('/api/v1/sales/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taxonomy: {
            kind,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            active: true,
          },
        }),
      });
      if (res.ok) {
        fetchItems();
      } else {
        setItems((prev) => [...prev, { id: Date.now(), kind, name }]);
      }
    } catch {
      setItems((prev) => [...prev, { id: Date.now(), kind, name }]);
    } finally {
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/sales/taxonomies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title={title}
        subtitle={subtitle}
        helpTitle={helpTitle}
        helpDescription={helpDescription}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-700">{title} ({items.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar novo...</span>
              </button>
            )}
          </div>

          {isAdding && (
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Informe o nome..."
                className="h-8 text-xs bg-white"
                autoFocus
              />
              <Button size="sm" onClick={handleAdd} className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                Cancelar
              </Button>
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center text-slate-400">Carregando...</div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
