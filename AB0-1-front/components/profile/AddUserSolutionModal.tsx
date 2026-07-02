'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2, Cpu, Wrench, Zap, CheckCircle2, CirclePlus } from 'lucide-react';
import { toast } from 'sonner';

// Banco de dados MOCK local para simular a pesquisa do backend
const MOCK_DATABASE = [
  // Empresas
  { id: 'voltaia-brasil', name: 'Voltaia Brasil', type: 'company', category: 'Energia Solar', verified: true, companyId: '1' },
  { id: 'greentech-solar', name: 'GreenTech Solar', type: 'company', category: 'Energia Solar', verified: true, companyId: '2' },
  { id: 'byd-dealership', name: 'BYD Concessionária', type: 'company', category: 'Mobilidade Elétrica', verified: true, companyId: '3' },
  { id: 'solis-installers', name: 'Solis Installers', type: 'company', category: 'Energia Solar', verified: false, companyId: '4' },
  
  // Produtos
  { id: 'solis-5kw', name: 'Inversor Solis 5kW', type: 'product', category: 'Energia Solar', verified: true },
  { id: 'fronius-10kw', name: 'Inversor Fronius Symo 10kW', type: 'product', category: 'Energia Solar', verified: true },
  { id: 'canadian-550w', name: 'Canadian Solar 550W', type: 'product', category: 'Energia Solar', verified: true },
  { id: 'byd-dolphin', name: 'BYD Dolphin', type: 'product', category: 'Mobilidade Elétrica', verified: true },
  { id: 'juicebox-32a', name: 'JuiceBox 32A', type: 'product', category: 'Mobilidade Elétrica', verified: true },
  
  // Serviços
  { id: 'panel-cleaning', name: 'Limpeza de Painéis Solares', type: 'service', category: 'Energia Solar', verified: false },
  { id: 'inverter-maintenance', name: 'Manutenção Preventiva de Inversor', type: 'service', category: 'Energia Solar', verified: true },
  { id: 'solar-subscription', name: 'Assinatura de Energia Solar Coletiva', type: 'service', category: 'Energia Solar', verified: true },
  
  // Tecnologias
  { id: 'residential-solar-system', name: 'Sistema Solar Residencial', type: 'technology', category: 'Energia Solar', verified: true },
  { id: 'battery-backup-system', name: 'Sistema de Backup por Bateria', type: 'technology', category: 'Bateria & Armazenamento', verified: true },
  { id: 'wallbox-charger', name: 'Wallbox JuiceBox', type: 'technology', category: 'Mobilidade Elétrica', verified: true },
];

interface AddUserSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (solution: {
    id: string;
    name: string;
    type: 'company' | 'product' | 'service' | 'technology';
    category: string;
    verified: boolean;
    companyId?: string;
  }) => void;
}

type TabType = 'all' | 'company' | 'product' | 'service' | 'technology';

export function AddUserSolutionModal({ open, onOpenChange, onAdd }: AddUserSolutionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  // Filtragem e Pesquisa
  const filteredResults = useMemo(() => {
    return MOCK_DATABASE.filter((item) => {
      const matchesTab = activeTab === 'all' || item.type === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.category.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  const handleConfirm = () => {
    const selected = MOCK_DATABASE.find((item) => item.id === selectedId);
    if (!selected) return;

    setLoading(true);
    // Simula tempo de rede
    setTimeout(() => {
      onAdd({
        id: selected.id,
        name: selected.name,
        type: selected.type as any,
        category: selected.category,
        verified: selected.verified,
        companyId: selected.companyId,
      });
      setLoading(false);
      onOpenChange(false);
      setSelectedId(null);
      setSearch('');
      setActiveTab('all');
      toast.success('Solução adicionada com sucesso!');
    }, 400);
  };

  const handleRequestNew = () => {
    toast.success('Sua solicitação de cadastro para a nova solução foi enviada para análise da nossa equipe!');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building2 className="h-4 w-4 text-emerald-600" />;
      case 'product':
        return <Cpu className="h-4 w-4 text-sky-500" />;
      case 'service':
        return <Wrench className="h-4 w-4 text-amber-500" />;
      case 'technology':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Cpu className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg bg-white p-6 shadow-xl border border-gray-100">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold text-gray-900">
            Adicionar solução sustentável
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Informe empresas, produtos ou tecnologias que você utiliza para personalizar sua experiência.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs de Categoria */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-2">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'company', label: 'Empresa' },
            { id: 'product', label: 'Produto' },
            { id: 'service', label: 'Serviço' },
            { id: 'technology', label: 'Tecnologia' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 border ${
                activeTab === tab.id
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar empresa, produto, inversor, painel, wallbox..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 rounded-lg border-gray-200 focus-visible:ring-emerald-500 text-xs"
          />
        </div>

        {/* Lista de Resultados */}
        <div className="mt-3 max-h-[220px] overflow-y-auto rounded-xl border border-gray-150 p-1 space-y-1 bg-slate-50/50">
          {filteredResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 font-medium">
              Nenhum resultado encontrado.
            </div>
          ) : (
            filteredResults.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-all border ${
                  selectedId === item.id
                    ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                    : 'bg-white border-gray-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {item.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.verified && (
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                      Verificado
                    </span>
                  )}
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedId === item.id
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedId === item.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Rodapé / Solicitar cadastro */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-gray-100">
          <span className="text-[10px] font-semibold text-gray-500">Não encontrou o que procura?</span>
          <Button
            variant="ghost"
            onClick={handleRequestNew}
            className="h-8 rounded-lg px-2.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50"
          >
            <CirclePlus className="mr-1 h-3.5 w-3.5" />
            Solicitar cadastro
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg h-9 text-xs font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId || loading}
            className="rounded-lg h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white min-w-[120px]"
          >
            {loading ? 'Adicionando...' : 'Adicionar Solução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
