'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface TemplateDeleteDialogProps {
  isOpen: boolean;
  templateName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function TemplateDeleteDialog({
  isOpen,
  templateName,
  onClose,
  onConfirm,
  loading = false,
}: TemplateDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-md bg-background rounded-lg shadow-xl border p-6 space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">Remover Template</h3>
            <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
        </div>

        <p className="text-sm text-foreground">
          Tem certeza de que deseja remover o template <strong className="font-semibold">&quot;{templateName}&quot;</strong>?
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Removendo...' : 'Sim, remover'}
          </Button>
        </div>
      </div>
    </div>
  );
}
