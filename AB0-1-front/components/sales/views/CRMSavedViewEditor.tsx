'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CRMFilterState } from '../filters/CRMAdvancedFilterPanel';
import { SavedViewItem } from './CRMEntityViewsSidebar';

interface CRMSavedViewEditorProps {
  open: boolean;
  onClose: () => void;
  activeFilters: CRMFilterState;
  initialView: SavedViewItem | null;
  onSaved: () => void;
}

export default function CRMSavedViewEditor({
  open,
  onClose,
  activeFilters,
  initialView,
  onSaved,
}: CRMSavedViewEditorProps) {
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialView) {
      setName(initialView.name || '');
      setIsShared(Boolean(initialView.is_shared));
    } else {
      setName('');
      setIsShared(false);
    }
    setError(null);
  }, [initialView, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Por favor, informe um nome para a visão.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      saved_view: {
        name: name.trim(),
        resource_type: 'account',
        filters: activeFilters,
        is_shared: isShared,
      },
    };

    try {
      const url = initialView
        ? `/api/v1/sales/saved_views/${initialView.id}`
        : '/api/v1/sales/saved_views';
      const method = initialView ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Não foi possível salvar a visão.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar visão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-200">
              <Bookmark className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {initialView ? 'Editar Visão Salva' : 'Salvar Visão Atual'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nome da Visão
            </Label>
            <Input
              placeholder="Ex: Integradores SP com E-mail"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-3 bg-slate-50">
            <Checkbox
              id="is_shared"
              checked={isShared}
              onCheckedChange={(checked) => setIsShared(Boolean(checked))}
            />
            <label htmlFor="is_shared" className="text-xs font-medium text-slate-700 cursor-pointer">
              Compartilhar com toda a empresa (outros usuários do tenant)
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={saving} className="min-h-[44px]">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold min-h-[44px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Visão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
