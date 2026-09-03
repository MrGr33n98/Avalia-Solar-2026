'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CRMModal from '@/components/sales/ui/CRMModal';
import { CRMFormField, CRMFormRow } from '@/components/sales/ui/CRMForm';
import AccountCombobox from './AccountCombobox';
import ContactCombobox from './ContactCombobox';
import { useCreateOpportunityMutation } from '@/lib/api/sales/mutations';
import { useSalesPipelines } from '@/lib/api/sales/queries';

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateOpportunityDialog({ open, onOpenChange, onSuccess }: CreateOpportunityDialogProps) {
  const { data: pipelines } = useSalesPipelines();
  const stages = pipelines?.[0]?.stages || [];

  const createMutation = useCreateOpportunityMutation();

  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [isInlineAccount, setIsInlineAccount] = useState(false);
  const [inlineAccountName, setInlineAccountName] = useState('');
  const [inlineAccountDomain, setInlineAccountDomain] = useState('');
  const [isInlineContact, setIsInlineContact] = useState(false);
  const [inlineContactFirstName, setInlineContactFirstName] = useState('');
  const [inlineContactEmail, setInlineContactEmail] = useState('');

  const [newName, setNewName] = useState('');
  const [newStage, setNewStage] = useState('lead_inbound');
  const [newValue, setNewValue] = useState('');

  const isCreating = createMutation.isPending;

  const handleClose = () => {
    onOpenChange(false);
    setCreateError(null);
  };

  const handleCreateNewOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!selectedAccountId && !isInlineAccount) {
      return setCreateError('Selecione uma Empresa (Account) ou crie uma nova inline.');
    }
    if (isInlineAccount && !inlineAccountName.trim()) {
      return setCreateError('Digite o nome da nova empresa.');
    }
    if (!newName.trim()) {
      return setCreateError('Nome da Oportunidade é obrigatório.');
    }

    const valueCents = newValue ? Math.round(parseFloat(newValue.replace(',', '.')) * 100) : 0;

    const payload: any = {
      name: newName,
      stage_key: newStage,
      value_cents: isNaN(valueCents) ? 0 : valueCents,
      currency: 'BRL',
      status: 'open',
    };

    if (selectedAccountId) payload.sales_account_id = Number(selectedAccountId);
    if (selectedContactId) payload.primary_contact_id = Number(selectedContactId);

    if (isInlineAccount) {
      payload.account = { name: inlineAccountName, domain: inlineAccountDomain };
    }
    if (isInlineContact) {
      payload.contact = { first_name: inlineContactFirstName, email: inlineContactEmail };
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
        setNewName('');
        setNewValue('');
        setSelectedAccountId('');
        setSelectedContactId('');
        setIsInlineAccount(false);
        setInlineAccountName('');
        setInlineAccountDomain('');
        setIsInlineContact(false);
        setInlineContactFirstName('');
        setInlineContactEmail('');
        onSuccess?.();
      },
      onError: (err: any) => {
        setCreateError(err.message || 'Erro ao criar oportunidade');
      },
    });
  };

  return (
    <CRMModal
      open={open}
      onClose={handleClose}
      title="Nova Oportunidade Comercial"
      description="Cadastre um novo lead B2B vinculado obrigatoriamente a uma Empresa no seu pipeline."
      size="lg"
      heroIcon={<Target className="w-8 h-8 text-indigo-700" />}
      showCustomizeFields={true}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isCreating}
            className="h-10 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-opportunity-form"
            disabled={isCreating}
            className="h-10 px-5 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg shadow-sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar Oportunidade'
            )}
          </Button>
        </>
      }
    >
      <form id="create-opportunity-form" onSubmit={handleCreateNewOpportunity} className="space-y-5 font-sans">
        {createError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{createError}</span>
          </div>
        )}

        {/* 2-Column Row: Empresa (Account) + Contato Principal */}
        <CRMFormRow cols={2}>
          {/* EMPRESA (ACCOUNT) COMBOMBOX & INLINE CREATION */}
          <CRMFormField label="Empresa (Account)" required>
            {!isInlineAccount ? (
              <AccountCombobox
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                onInlineCreate={() => {
                  setIsInlineAccount(true);
                  setSelectedAccountId('');
                }}
                disabled={isCreating}
              />
            ) : (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">Criar Nova Empresa</span>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsInlineAccount(false)} className="h-6 text-[11px] px-1 text-slate-500">
                    Cancelar
                  </Button>
                </div>
                <Input
                  placeholder="Nome da empresa *"
                  value={inlineAccountName}
                  onChange={(e) => setInlineAccountName(e.target.value)}
                  className="h-9 border-slate-300 text-xs bg-white rounded-md"
                />
                <Input
                  placeholder="Domínio (ex: empresa.com.br)"
                  value={inlineAccountDomain}
                  onChange={(e) => setInlineAccountDomain(e.target.value)}
                  className="h-9 border-slate-300 text-xs bg-white rounded-md"
                />
              </div>
            )}
          </CRMFormField>

          {/* CONTATO PRINCIPAL COMBOMBOX & INLINE CREATION */}
          <CRMFormField label="Contato Principal">
            {!isInlineContact ? (
              <ContactCombobox
                accountId={selectedAccountId}
                value={selectedContactId}
                onChange={setSelectedContactId}
                onInlineCreate={() => {
                  setIsInlineContact(true);
                  setSelectedContactId('');
                }}
                disabled={isCreating}
              />
            ) : (
              <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900">Criar Novo Contato</span>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsInlineContact(false)} className="h-6 text-[11px] px-1 text-slate-500">
                    Cancelar
                  </Button>
                </div>
                <Input
                  placeholder="Nome completo do contato *"
                  value={inlineContactFirstName}
                  onChange={(e) => setInlineContactFirstName(e.target.value)}
                  className="h-9 border-slate-300 text-xs bg-white rounded-md"
                />
                <Input
                  placeholder="E-mail profissional"
                  value={inlineContactEmail}
                  onChange={(e) => setInlineContactEmail(e.target.value)}
                  className="h-9 border-slate-300 text-xs bg-white rounded-md"
                />
              </div>
            )}
          </CRMFormField>
        </CRMFormRow>

        {/* NOME DA OPORTUNIDADE */}
        <CRMFormField label="Nome da Oportunidade" required>
          <Input
            placeholder="Ex: Projeto Rooftop Solar 100kWp — Usina Indústria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            disabled={isCreating}
            required
          />
        </CRMFormField>

        {/* 2-Column Row: Estágio Inicial + Valor Estimado */}
        <CRMFormRow cols={2}>
          <CRMFormField label="Estágio Inicial">
            <Select value={newStage} onValueChange={setNewStage} disabled={isCreating}>
              <SelectTrigger className="h-10 border-slate-300 text-xs rounded-lg px-3.5">
                <SelectValue placeholder="Selecione estágio" />
              </SelectTrigger>
              <SelectContent>
                {stages.filter((s: any) => s.key !== 'won' && s.key !== 'lost').map((s: any) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.name || s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CRMFormField>

          <CRMFormField label="Valor Estimado (R$)">
            <Input
              placeholder="Ex: 150000"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
              disabled={isCreating}
            />
          </CRMFormField>
        </CRMFormRow>
      </form>
    </CRMModal>
  );
}
