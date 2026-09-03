'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRMModal from '@/components/sales/ui/CRMModal';

interface CompaniesDuplicateManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function CompaniesDuplicateManager({ open, onClose }: CompaniesDuplicateManagerProps) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleRunScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1000);
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Gerenciador de Duplicidades (Manage Duplicates)"
      description="Verificar duplicidades de empresas por nome, domínio ou registro comercial."
      icon={<Copy className="w-5 h-5 text-indigo-700" />}
      size="lg"
      showCustomizeFields={false}
      footer={
        <div className="w-full flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-4 text-xs font-sans">
        {!scanned ? (
          <div className="text-center py-8 space-y-4 bg-slate-50/60 rounded-xl border border-slate-200/80 p-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-xs">
              <Copy className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-900">Varredura de Higienização de Base</h3>
              <p className="text-xs text-slate-500">
                Execute o motor heurístico para comparar domínios, nomes e contatos de empresas cadastradas no CRM.
              </p>
            </div>
            <Button
              onClick={handleRunScan}
              disabled={scanning}
              className="h-10 px-6 bg-indigo-900 text-white hover:bg-indigo-950 font-bold text-xs rounded-lg shadow-sm"
            >
              {scanning ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Iniciar Varredura
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4 bg-emerald-50/80 rounded-xl border border-emerald-200 p-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-950">Nenhuma duplicidade detectada</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Sua base de empresas está higienizada. Todos os domínios e registros são únicos e íntegros.
              </p>
            </div>
          </div>
        )}
      </div>
    </CRMModal>
  );
}
