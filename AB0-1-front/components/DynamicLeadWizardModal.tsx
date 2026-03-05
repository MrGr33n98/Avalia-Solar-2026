'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import { LeadWizardEngine } from '@/src/modules/leadWizard/components/LeadWizardEngine';

type LeadWizardEventDetail = {
  categoryId?: number;
  preferredCompanyId?: number;
  source?: string;
};

export default function DynamicLeadWizardModal() {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [preferredCompanyId, setPreferredCompanyId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent<LeadWizardEventDetail>).detail || {}) as LeadWizardEventDetail;
      setCategoryId(detail.categoryId);
      setPreferredCompanyId(detail.preferredCompanyId);
      setOpen(true);
    };

    window.addEventListener('open-dynamic-lead-wizard', handler as EventListener);
    return () => window.removeEventListener('open-dynamic-lead-wizard', handler as EventListener);
  }, []);

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setCategoryId(undefined);
      setPreferredCompanyId(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] flex flex-col z-[10000] rounded-2xl border-none">
        <div className="bg-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Solicitar Orcamento
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-300">
                Preencha o formulario para receber contato das empresas mais aderentes ao seu projeto.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => handleClose(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6">
          {categoryId ? (
            <LeadWizardEngine
              categoryId={categoryId}
              preferredCompanyId={preferredCompanyId}
            />
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Nao foi possivel abrir o formulario
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                A categoria do wizard nao foi identificada para esta empresa. Tente novamente a partir da pagina da categoria.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
