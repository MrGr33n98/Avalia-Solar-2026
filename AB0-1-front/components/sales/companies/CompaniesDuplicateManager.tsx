'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, RotateCw, GitMerge, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CRMModal from '@/components/sales/ui/CRMModal';

interface DuplicateGroup {
  reason: string;
  master_account_id: number;
  accounts: {
    id: number;
    name: string;
    domain: string | null;
    city: string | null;
    state: string | null;
    created_at: string;
    owner_name: string;
    contacts_count: number;
    opps_count: number;
  }[];
}

interface CompaniesDuplicateManagerProps {
  open: boolean;
  onClose: () => void;
  onMerged?: () => void;
}

export default function CompaniesDuplicateManager({
  open,
  onClose,
  onMerged,
}: CompaniesDuplicateManagerProps) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [mergingId, setMergingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/accounts/duplicates', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar duplicidades no servidor.');
      const data = await res.json();
      setGroups(data.duplicate_groups || []);
      setScanned(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar à API de duplicidades.');
    } finally {
      setScanning(false);
    }
  };

  const handleMerge = async (masterId: number, duplicateId: number) => {
    if (!confirm('Deseja mesclar esta empresa na conta principal? Contatos e oportunidades serão consolidados.')) {
      return;
    }
    setMergingId(duplicateId);
    try {
      const res = await fetch('/api/v1/sales/accounts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          master_account_id: masterId,
          duplicate_account_id: duplicateId,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Falha ao mesclar empresas.');

      // Refresh scan
      handleRunScan();
      onMerged?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao mesclar empresas.');
    } finally {
      setMergingId(null);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Gerenciador de Duplicidades Heurístico"
      description="Identifique e mescle empresas duplicadas com base em domínio, nome e contatos."
      icon={<Copy className="w-5 h-5 text-amber-600" />}
      size="lg"
      showCustomizeFields={false}
      footer={
        <div className="w-full flex justify-between items-center">
          {scanned && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunScan}
              disabled={scanning}
              className="text-xs"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1 ${scanning ? 'animate-spin' : ''}`} />
              Re-escanear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-3 text-xs font-sans">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!scanned ? (
          <div className="text-center py-8 space-y-4 bg-slate-50/60 rounded-xl border border-slate-200/80 p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Copy className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-900">Varredura de Higienização de Base</h3>
              <p className="text-xs text-slate-500">
                Execute o motor heurístico real para comparar domínios, nomes e contatos de empresas cadastradas no CRM.
              </p>
            </div>
            <Button
              onClick={handleRunScan}
              disabled={scanning}
              className="h-10 px-6 bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs rounded-lg shadow-sm"
            >
              {scanning ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Iniciar Varredura Heurística
            </Button>
          </div>
        ) : groups.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-800">
                Grupos de Duplicidades Encontrados: {groups.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {groups.map((group, gIdx) => (
                <div key={gIdx} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-semibold">
                      {group.reason}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      {group.accounts.length} registros conflitantes
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.accounts.map((acc, aIdx) => {
                      const isMaster = acc.id === group.master_account_id;
                      return (
                        <div
                          key={acc.id}
                          className={`flex items-center justify-between rounded-lg p-3 bg-white border ${
                            isMaster ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{acc.name}</span>
                              {isMaster ? (
                                <Badge className="bg-amber-500 text-white text-[10px] py-0 px-1.5">
                                  Principal (Master)
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  Duplicada
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex gap-3">
                              <span>ID: #{acc.id}</span>
                              {acc.domain && <span>Domínio: {acc.domain}</span>}
                              {acc.city && <span>{acc.city}/{acc.state}</span>}
                              <span>Contatos: {acc.contacts_count}</span>
                              <span>Oportunidades: {acc.opps_count}</span>
                            </div>
                          </div>

                          {!isMaster && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={mergingId === acc.id}
                              onClick={() => handleMerge(group.master_account_id, acc.id)}
                              className="h-8 text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100"
                            >
                              <GitMerge className={`w-3.5 h-3.5 mr-1 ${mergingId === acc.id ? 'animate-spin' : ''}`} />
                              {mergingId === acc.id ? 'Mesclando...' : 'Mesclar no Master'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CRMModal>
  );
}
