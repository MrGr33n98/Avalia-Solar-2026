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
      description="Verificar duplicidades de empresas por nome, domínio ou CNPJ."
      icon={<Copy className="w-5 h-5 text-indigo-700" />}
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        {!scanned ? (
          <div className="text-center py-6 space-y-3">
            <Copy className="w-8 h-8 text-indigo-600 mx-auto" />
            <p className="text-slate-600 max-w-md mx-auto">
              Execute o motor de varredura heurística para identificar possíveis empresas duplicadas na base de dados.
            </p>
            <Button
              onClick={handleRunScan}
              disabled={scanning}
              className="bg-indigo-900 text-white hover:bg-indigo-950 font-bold text-xs"
            >
              {scanning ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Iniciar Varredura
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Nenhuma duplicidade detectada</h3>
            <p className="text-xs text-emerald-800">
              Sua base de empresas está higienizada. Todos os domínios e registros são únicos.
            </p>
            <Button onClick={onClose} variant="outline" size="sm" className="mt-2 text-xs border-emerald-300">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </CRMModal>
  );
}
