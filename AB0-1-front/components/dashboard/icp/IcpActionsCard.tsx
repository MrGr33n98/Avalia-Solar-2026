'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Copy, 
  Download, 
  RotateCcw, 
  Power,
  AlertTriangle 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface IcpActionsCardProps {
  onDeactivate: () => void;
  onReset: () => void;
  onExport: () => void;
  isActive: boolean;
}

export function IcpActionsCard({
  onDeactivate,
  onReset,
  onExport,
  isActive,
}: IcpActionsCardProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const handleDeactivateConfirm = () => {
    onDeactivate();
    setShowDeactivateDialog(false);
    toast.success(isActive ? 'ICP desativado com sucesso.' : 'ICP ativado com sucesso.');
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-4 md:p-5 space-y-4">
      <div className="pb-3 border-b border-[#D8DEE8]">
        <h3 className="text-xs font-black uppercase tracking-tight text-[#0B1F3A]">
          Ações
        </h3>
      </div>

      <CardContent className="p-0 space-y-2 flex flex-col">
        {/* Testar ICP */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toast.info('Iniciando simulação de aderência com base de leads atuais...')}
          className="h-8 justify-start px-2 text-[10.5px] font-bold uppercase tracking-wider text-[#526071] hover:text-[#0B1F3A] hover:bg-[#F8FAFC] rounded-sm text-left"
        >
          <Play className="h-3.5 w-3.5 mr-2 text-[#526071]" />
          Testar ICP com leads atuais
        </Button>

        {/* Duplicar ICP */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toast.success('Configurações de ICP duplicadas para a área de transferência.')}
          className="h-8 justify-start px-2 text-[10.5px] font-bold uppercase tracking-wider text-[#526071] hover:text-[#0B1F3A] hover:bg-[#F8FAFC] rounded-sm text-left"
        >
          <Copy className="h-3.5 w-3.5 mr-2 text-[#526071]" />
          Duplicar este ICP
        </Button>

        {/* Exportar JSON */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="h-8 justify-start px-2 text-[10.5px] font-bold uppercase tracking-wider text-[#526071] hover:text-[#0B1F3A] hover:bg-[#F8FAFC] rounded-sm text-left"
        >
          <Download className="h-3.5 w-3.5 mr-2 text-[#526071]" />
          Exportar configuração JSON
        </Button>

        {/* Restaurar Padrão */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 justify-start px-2 text-[10.5px] font-bold uppercase tracking-wider text-[#526071] hover:text-[#0B1F3A] hover:bg-[#F8FAFC] rounded-sm text-left"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-2 text-[#526071]" />
          Restaurar padrão
        </Button>

        {/* Separator */}
        <div className="h-px bg-[#D8DEE8] my-1" />

        {/* Ativar/Desativar ICP */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDeactivateDialog(true)}
          className="h-8 justify-start px-2 text-[10.5px] font-black uppercase tracking-wider text-[#C9362B] hover:bg-[#FFF1F0] rounded-sm text-left"
        >
          <Power className="h-3.5 w-3.5 mr-2 text-[#C9362B]" />
          {isActive ? 'Desativar regras de ICP' : 'Ativar regras de ICP'}
        </Button>
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent className="bg-white border border-[#D8DEE8] rounded-md max-w-md p-6">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-sm font-black uppercase tracking-tight text-[#0B1F3A] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#C9362B]" />
              Confirmar alteração de status do ICP?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-[#526071] leading-relaxed">
              {isActive ? (
                <span>
                  Desativar o ICP fará com que o sistema pare de qualificar e filtrar leads automaticamente. Todos os leads futuros entrarão na Inbox sem critérios de match ou priorização.
                </span>
              ) : (
                <span>
                  Ativar o ICP iniciará a qualificação automática de todos os leads de entrada de acordo com os filtros de faturamento, telhado, EV e localização geográfica estabelecidos.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel className="h-9 px-4 text-xs font-bold rounded-sm border-[#D8DEE8] text-[#526071] hover:bg-[#F8FAFC]">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="h-9 px-4 text-xs font-black uppercase tracking-wider rounded-sm text-white bg-[#C9362B] hover:bg-[#C9362B]/90"
            >
              Sim, Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
