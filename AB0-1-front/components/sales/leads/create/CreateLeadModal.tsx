'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Building2, Flame, Loader2, Plus, Settings, Target, User, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AccountCombobox from '@/components/sales/opportunities/AccountCombobox';
import ContactCombobox from '@/components/sales/opportunities/ContactCombobox';
import { salesApi } from '@/lib/api/sales/client';
import { useSalesPipelines } from '@/lib/api/sales/queries';
import { toast } from 'sonner';

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateLeadModal({ open, onClose, onSuccess }: CreateLeadModalProps) {
  const { data: pipelines } = useSalesPipelines();
  const stages = pipelines?.[0]?.stages || [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageKey, setStageKey] = useState('prospect');
  const [temperature, setTemperature] = useState<'cold' | 'warm' | 'hot'>('cold');
  const [ownerId, setOwnerId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [valueCents, setValueCents] = useState('');
  const [probability, setProbability] = useState('20');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<number[]>([]);

  // Inline Account & Contact Creation
  const [isInlineAccount, setIsInlineAccount] = useState(false);
  const [inlineAccountName, setInlineAccountName] = useState('');
  const [inlineAccountDomain, setInlineAccountDomain] = useState('');

  // Sources & Competitors options from backend
  const [sources, setSources] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      salesApi.getSources().then(setSources).catch(console.error);
      salesApi.getCompetitors().then(setCompetitors).catch(console.error);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Nome do Lead é obrigatório.');
    if (!selectedAccountId && !isInlineAccount) return setError('Empresa (Account) é obrigatória.');
    if (isInlineAccount && !inlineAccountName.trim()) return setError('Digite o nome da empresa.');

    setLoading(true);
    setError(null);

    try {
      const parsedValue = valueCents ? Math.round(parseFloat(valueCents.replace(',', '.')) * 100) : 0;

      const payload: any = {
        name,
        stage_key: stageKey,
        temperature,
        value_cents: isNaN(parsedValue) ? 0 : parsedValue,
        probability: probability ? Number(probability) : 20,
        expected_close_date: expectedCloseDate || null,
        source_id: sourceId ? Number(sourceId) : null,
        competitor_ids: selectedCompetitorIds,
      };

      if (selectedAccountId) payload.sales_account_id = Number(selectedAccountId);
      if (selectedContactId) payload.contact_ids = [Number(selectedContactId)];

      if (isInlineAccount) {
        payload.account = { name: inlineAccountName, domain: inlineAccountDomain };
      }

      await salesApi.createLead(payload);

      toast.success('Lead criado com sucesso!');
      setTimeout(() => {
        onClose();
        setLoading(false);
        onSuccess?.();
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar lead comercial.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[540px] max-h-[90vh] flex flex-col p-0 bg-white rounded-3xl shadow-2xl overflow-hidden font-sans border-slate-200">
        {/* FIXED HEADER */}
        <DialogHeader className="px-7 py-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-900 border border-indigo-100/80">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">Adicionar Lead</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">Cadastre um novo lead B2B no pipeline comercial.</DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast.info('Painel de Personalização de Campos ativado')}
            className="h-8 text-xs font-semibold bg-slate-50 border-slate-200 text-slate-700 rounded-xl"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Personalizar campos
          </Button>
        </DialogHeader>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto p-7 space-y-5">
          <form id="create-lead-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Nome do Lead */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Nome do Lead <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ex: Projeto Usina Rooftop Solar 200kWp — Usina Indústria"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 text-xs font-medium border-slate-300 rounded-xl px-4 focus:border-indigo-600"
                required
              />
            </div>

            {/* Hot Lead 🔥 Toggle & Temperature */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Flame className={`w-4 h-4 ${temperature === 'hot' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} /> Lead Quente 🔥
              </span>
              <div className="flex items-center gap-1.5">
                {(['cold', 'warm', 'hot'] as const).map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemperature(temp)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                      temperature === temp
                        ? temp === 'hot'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : temp === 'warm'
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {temp === 'hot' ? 'Quente 🔥' : temp === 'warm' ? 'Morno' : 'Frio'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline & Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Pipeline</label>
                <Select value={pipelineId || String(pipelines?.[0]?.id || '')} onValueChange={setPipelineId}>
                  <SelectTrigger className="h-11 border-slate-300 text-xs rounded-xl px-4 bg-white">
                    <SelectValue placeholder="Selecione pipeline" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {pipelines?.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Estágio Inicial</label>
                <Select value={stageKey} onValueChange={setStageKey}>
                  <SelectTrigger className="h-11 border-slate-300 text-xs rounded-xl px-4 bg-white">
                    <SelectValue placeholder="Selecione estágio" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stages.filter((s: any) => s.key !== 'won' && s.key !== 'lost').map((s: any) => (
                      <SelectItem key={s.key} value={s.key} className="text-xs">
                        {s.name || s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valor Estimado & Confiança % */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Valor Estimado (R$)</label>
                <Input
                  placeholder="Ex: 250000"
                  value={valueCents}
                  onChange={(e) => setValueCents(e.target.value)}
                  className="h-11 text-xs border-slate-300 rounded-xl px-4"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Confiança (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="20"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                  className="h-11 text-xs border-slate-300 rounded-xl px-4"
                />
              </div>
            </div>

            {/* Previsão de Fechamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Previsão de Fechamento</label>
              <Input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="h-11 text-xs border-slate-300 rounded-xl px-4"
              />
            </div>

            {/* Empresa (Account) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Empresa (Account) <span className="text-red-500">*</span>
              </label>
              {!isInlineAccount ? (
                <AccountCombobox
                  value={selectedAccountId}
                  onChange={setSelectedAccountId}
                  onInlineCreate={() => {
                    setIsInlineAccount(true);
                    setSelectedAccountId('');
                  }}
                />
              ) : (
                <div className="p-3.5 border border-indigo-200 bg-indigo-50/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Criar Nova Empresa</span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setIsInlineAccount(false)} className="h-6 text-[11px] px-1 text-slate-500">
                      Cancelar
                    </Button>
                  </div>
                  <Input
                    placeholder="Nome da empresa *"
                    value={inlineAccountName}
                    onChange={(e) => setInlineAccountName(e.target.value)}
                    className="h-9 text-xs bg-white border-slate-300 rounded-lg px-3"
                  />
                </div>
              )}
            </div>

            {/* Contato Principal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Pessoa (Contato Principal)</label>
              <ContactCombobox
                accountId={selectedAccountId}
                value={selectedContactId}
                onChange={setSelectedContactId}
                onInlineCreate={() => toast.info('Cadastro de contato inline')}
              />
            </div>

            {/* Origem (Source) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Origem do Lead</label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="h-11 border-slate-300 text-xs rounded-xl px-4 bg-white">
                  <SelectValue placeholder="Selecione origem..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {sources.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        {/* FIXED FOOTER */}
        <div className="px-7 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0 font-sans">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-11 px-5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-lead-form"
            disabled={loading}
            className="h-11 px-6 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl shadow-md flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Lead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
