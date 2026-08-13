'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type SolutionType = 'company' | 'product' | 'service' | 'technology';

interface AddUserSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (solution: { id: string; name: string; type: SolutionType; category: string; verified: boolean; companyId?: string }) => void | Promise<void>;
}

export function AddUserSolutionModal({ open, onOpenChange, onAdd }: AddUserSolutionModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Energia Solar');
  const [type, setType] = useState<SolutionType>('technology');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setCategory('Energia Solar'); setType('technology'); };
  const handleSubmit = async () => {
    if (!name.trim() || !category.trim()) { toast.error('Informe nome e categoria.'); return; }
    setSaving(true);
    try {
      await onAdd({ id: name.trim(), name: name.trim(), type, category: category.trim(), verified: false });
      reset(); onOpenChange(false);
    } finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="rounded-2xl sm:max-w-lg bg-white p-6">
      <DialogHeader><DialogTitle>Adicionar solução sustentável</DialogTitle><DialogDescription>Cadastre solução realmente utilizada. Validação pode ocorrer depois.</DialogDescription></DialogHeader>
      <div className="space-y-4 py-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da solução" />
        <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" />
        <select value={type} onChange={(e) => setType(e.target.value as SolutionType)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
          <option value="company">Empresa</option><option value="product">Produto</option><option value="service">Serviço</option><option value="technology">Tecnologia</option>
        </select>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={saving} onClick={handleSubmit}>{saving ? 'Salvando...' : 'Adicionar'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
