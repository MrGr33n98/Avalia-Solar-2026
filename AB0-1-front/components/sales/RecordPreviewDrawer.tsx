'use client';

import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Company360View from './Company360View';
import Contact360View from './Contact360View';

type RecordPreviewDrawerProps = {
  type: 'account' | 'contact' | 'opportunity';
  id: number;
  title: string;
  subtitle?: string;
};

export default function RecordPreviewDrawer({ type, id, title, subtitle }: RecordPreviewDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-blue-50">
          <Eye className="mr-1 h-3.5 w-3.5 text-blue-800" /> Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-white p-6 border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-blue-900 font-bold text-white text-[10px] uppercase">
              {type}
            </Badge>
            <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-3 text-xs">
          {subtitle && <p className="text-slate-600 font-medium">{subtitle}</p>}

          {type === 'account' && (
            <div className="space-y-3">
              <p className="text-slate-500">Visualização rápida da conta comercial. Abra a ficha completa de 360° para histórico e comitê.</p>
              <Company360View accountId={id} companyName={title} />
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-3">
              <p className="text-slate-500">Visualização rápida do contato comercial. Abra a ficha completa de 360° para mapa de papéis e comitês.</p>
              <Contact360View contactId={id} contactName={title} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
