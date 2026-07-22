'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IcpMobileActionBarProps {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  isDirty: boolean;
}

export function IcpMobileActionBar({
  onBack,
  onSave,
  saving,
  isDirty,
}: IcpMobileActionBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#D8DEE8] px-4 py-3 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={onBack}
        className="h-11 px-4 text-xs font-bold rounded-sm border-[#D8DEE8] text-[#526071] hover:bg-[#F8FAFC] flex-1"
      >
        <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
        Voltar
      </Button>

      <Button
        type="button"
        size="default"
        onClick={onSave}
        disabled={saving || !isDirty}
        className={cn(
          'h-11 px-6 text-xs font-black uppercase tracking-wider rounded-sm text-white flex-1 transition-all',
          isDirty ? 'bg-[#1F5EFF] hover:bg-[#1749CC]' : 'bg-[#526071] opacity-60 cursor-not-allowed'
        )}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Gravando
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-1.5" />
            Salvar regras
          </>
        )}
      </Button>
    </div>
  );
}
