'use client';

import { useEffect, useState } from 'react';
import { Building2, Check, RotateCw, User, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CRMModal from '@/components/sales/ui/CRMModal';
import CRMCompanySelect, { CompanyOption } from '@/components/sales/ui/CRMCompanySelect';
import { salesApi } from '@/lib/api/sales/client';

interface AttachCompanyPersonModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId: number;
  currentAccount?: { id: number; name: string } | null;
  currentContactId?: number | null;
  onSuccess?: () => void;
}

export default function AttachCompanyPersonModal({
  open,
  onClose,
  opportunityId,
  currentAccount,
  currentContactId,
  onSuccess,
}: AttachCompanyPersonModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'select'>('create');

  // Company state
  const [companyNameInput, setCompanyNameInput] = useState(currentAccount?.name || '');
  const [selectedAccount, setSelectedAccount] = useState<CompanyOption | null>(
    currentAccount ? { id: currentAccount.id, name: currentAccount.name } : null
  );

  // New person state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [decisionRole, setDecisionRole] = useState('decision_maker');

  // Select existing person state
  const [existingContacts, setExistingContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(currentContactId || null);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Set primary contact flag
  const [setAsPrimary, setSetAsPrimary] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      if (currentAccount) {
        setCompanyNameInput(currentAccount.name);
        setSelectedAccount({ id: currentAccount.id, name: currentAccount.name });
      }
      setSelectedContactId(currentContactId || null);
    }
  }, [open, currentAccount, currentContactId]);

  // Load existing contacts when company changes or select tab chosen
  useEffect(() => {
    if (open && selectedAccount?.id) {
      setLoadingContacts(true);
      salesApi
        .getContacts({ sales_account_id: selectedAccount.id })
        .then((contacts) => {
          setExistingContacts(contacts || []);
          if (contacts?.length > 0 && !selectedContactId) {
            setSelectedContactId(contacts[0].id);
          }
        })
        .catch(() => setExistingContacts([]))
        .finally(() => setLoadingContacts(false));
    }
  }, [open, selectedAccount, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let accountId = selectedAccount?.id;
      let targetContactId = selectedContactId;

      // 1. If user entered a new company name without selecting an ID
      if (!accountId && companyNameInput.trim()) {
        const newAccount = await salesApi.createAccount({ name: companyNameInput.trim() });
        accountId = newAccount.id;
      }

      // 2. Handle Contact Creation / Selection
      if (mode === 'create') {
        if (!firstName.trim()) {
          throw new Error('O primeiro nome da pessoa é obrigatório.');
        }

        const newContact = await salesApi.createContact({
          sales_account_id: accountId,
          company_name: companyNameInput.trim() || undefined,
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          job_title: jobTitle.trim() || undefined,
          decision_role: decisionRole,
        });

        targetContactId = newContact.id;
        if (newContact.sales_account_id && !accountId) {
          accountId = newContact.sales_account_id;
        }
      }

      // 3. Link Contact and Account to Opportunity
      const updatePayload: Record<string, any> = {};
      if (accountId) {
        updatePayload.sales_account_id = accountId;
      }
      if (setAsPrimary && targetContactId) {
        updatePayload.primary_contact_id = targetContactId;
      }

      if (Object.keys(updatePayload).length > 0) {
        await salesApi.updateOpportunity(opportunityId, updatePayload);
      }

      // Dispatch event and cleanup
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm:opportunity-updated'));
        window.dispatchEvent(new CustomEvent('crm:contact-created'));
      }

      onSuccess?.();
      onClose();
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setJobTitle('');
    } catch (err: any) {
      console.error('Erro ao vincular pessoa/empresa:', err);
      setError(err.message || 'Erro ao vincular pessoa à empresa e oportunidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Adicionar Pessoa & Empresa ao Lead"
      description="Cadastre ou associe um contato e empresa responsável por esta oportunidade comercial."
      size="md"
      heroIcon={<UserPlus className="w-7 h-7 text-sky-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={setAsPrimary}
              onChange={(e) => setSetAsPrimary(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 accent-sky-600"
            />
            <span>Definir como contato principal deste lead</span>
          </label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4"
            >
              {loading ? <RotateCw className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              Salvar e Vincular
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: COMPANY SELECTION */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Empresa Vinculada</span>
          </label>
          <CRMCompanySelect
            value={companyNameInput}
            selectedAccount={selectedAccount}
            onChange={(name, acc) => {
              setCompanyNameInput(name);
              setSelectedAccount(acc || null);
            }}
            placeholder="Buscar empresa existente ou digitar nova..."
          />
        </div>

        {/* STEP 2: PERSON MODE TOGGLE */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-600" />
              <span>Contato / Pessoa</span>
            </label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                  mode === 'create' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Criar Nova Pessoa
              </button>

              {selectedAccount?.id && existingContacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                    mode === 'select' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Selecionar Existente ({existingContacts.length})
                </button>
              )}
            </div>
          </div>

          {/* MODE A: CREATE NEW PERSON */}
          {mode === 'create' && (
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Carlos"
                    className="h-8 text-xs bg-white border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sobrenome</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Mendes"
                    className="h-8 text-xs bg-white border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail Comercial</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com.br"
                    className="h-8 text-xs bg-white border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="h-8 text-xs bg-white border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cargo / Função</label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Diretor de Operações"
                    className="h-8 text-xs bg-white border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Papel na Decisão</label>
                  <select
                    value={decisionRole}
                    onChange={(e) => setDecisionRole(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 font-medium text-slate-800"
                  >
                    <option value="decision_maker">Tomador de Decisão</option>
                    <option value="influencer">Influenciador Técnico</option>
                    <option value="champion">Defensor / Sponsor</option>
                    <option value="end_user">Usuário Final</option>
                    <option value="evaluator">Avaliador Financeiro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: SELECT EXISTING PERSON */}
          {mode === 'select' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Selecione o contato da empresa:
              </label>
              {loadingContacts ? (
                <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  Carregando contatos da empresa...
                </div>
              ) : existingContacts.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">Nenhum contato encontrado para esta empresa.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {existingContacts.map((c: any) => {
                    const isSelected = selectedContactId === c.id;
                    const contactName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContactId(c.id)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 font-bold text-sky-950'
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-sky-600" />
                          <div>
                            <p>{contactName}</p>
                            {c.email && <p className="text-[10px] text-slate-500 font-normal">{c.email}</p>}
                          </div>
                        </div>
                        {c.job_title && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {c.job_title}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </CRMModal>
  );
}
