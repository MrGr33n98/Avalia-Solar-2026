'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Plus,
  Check,
  Copy,
  Star,
  Trash2,
  Edit2,
  ExternalLink,
  Send,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { salesApi, ApiContactMethod, ContactMethodKind } from '@/lib/api/sales/client';

export interface ContactMethodsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: number;
  contactName: string;
  initialMethods?: ApiContactMethod[];
  onMethodsUpdated?: (methods: ApiContactMethod[]) => void;
  onSendEmail?: (email: string) => void;
  onCall?: (phone: string) => void;
  onWhatsApp?: (whatsapp: string) => void;
}

const KIND_CONFIG: Record<
  ContactMethodKind,
  { label: string; icon: React.ElementType; placeholder: string; tileClass: string }
> = {
  email: {
    label: 'E-mail',
    icon: Mail,
    placeholder: 'nome@exemplo.com.br',
    tileClass: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  phone: {
    label: 'Telefone',
    icon: Phone,
    placeholder: '(11) 98765-4321',
    tileClass: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    placeholder: '(11) 98765-4321',
    tileClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Globe,
    placeholder: 'linkedin.com/in/perfil',
    tileClass: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  },
  instagram: {
    label: 'Instagram',
    icon: Globe,
    placeholder: 'instagram.com/perfil ou @perfil',
    tileClass: 'text-pink-700 bg-pink-50 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  },
  website: {
    label: 'Website',
    icon: Globe,
    placeholder: 'https://exemplo.com.br',
    tileClass: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  },
};

const LABEL_PRESETS = ['Trabalho', 'Pessoal', 'Comercial', 'Outro'];

type FilterTab = 'all' | 'emails' | 'phones' | 'social';

export function ContactMethodsModal({
  open,
  onOpenChange,
  contactId,
  contactName,
  initialMethods = [],
  onMethodsUpdated,
  onSendEmail,
  onCall,
  onWhatsApp,
}: ContactMethodsModalProps) {
  const [methods, setMethods] = useState<ApiContactMethod[]>(initialMethods);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<number | null>(null);

  // Formulário de Adicionar / Editar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ApiContactMethod | null>(null);
  const [formKind, setFormKind] = useState<ContactMethodKind>('email');
  const [formValue, setFormValue] = useState('');
  const [formLabel, setFormLabel] = useState('Trabalho');
  const [customLabel, setCustomLabel] = useState('');
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Confirmação de Arquivamento
  const [archivingMethod, setArchivingMethod] = useState<ApiContactMethod | null>(null);
  const [replacementId, setReplacementId] = useState<number | undefined>(undefined);

  const kindSelectId = useId();
  const valueInputId = useId();
  const labelSelectId = useId();

  // Carregar métodos da API ao abrir o modal
  useEffect(() => {
    if (open && contactId) {
      setLoading(true);
      setError(null);
      salesApi
        .getContactMethods(contactId)
        .then((data) => {
          setMethods(data);
          onMethodsUpdated?.(data);
        })
        .catch((err) => {
          setError(err?.message || 'Erro ao carregar canais de contato.');
        })
        .finally(() => setLoading(false));
    }
  }, [open, contactId]);

  const handleCopy = (method: ApiContactMethod) => {
    navigator.clipboard.writeText(method.value);
    setCopyFeedback(method.id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const openAddForm = (defaultKind: ContactMethodKind = 'email') => {
    setEditingMethod(null);
    setFormKind(defaultKind);
    setFormValue('');
    setFormLabel('Trabalho');
    setCustomLabel('');
    setFormIsPrimary(methods.filter((m) => m.kind === defaultKind).length === 0);
    setError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (method: ApiContactMethod) => {
    setEditingMethod(method);
    setFormKind(method.kind);
    setFormValue(method.value);
    if (LABEL_PRESETS.includes(method.label)) {
      setFormLabel(method.label);
      setCustomLabel('');
    } else {
      setFormLabel('Outro');
      setCustomLabel(method.label);
    }
    setFormIsPrimary(method.is_primary);
    setError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) {
      setError('Por favor, informe o valor do canal de contato.');
      return;
    }

    const finalLabel = formLabel === 'Outro' && customLabel.trim() ? customLabel.trim() : formLabel;

    setSubmitting(true);
    setError(null);

    try {
      if (editingMethod) {
        const updated = await salesApi.updateContactMethod(contactId, editingMethod.id, {
          kind: formKind,
          value: formValue.trim(),
          label: finalLabel,
          is_primary: formIsPrimary,
        });

        const nextList = methods.map((m) => {
          if (m.id === updated.id) return updated;
          if (formIsPrimary && m.kind === formKind && m.id !== updated.id) {
            return { ...m, is_primary: false };
          }
          return m;
        });

        setMethods(nextList);
        onMethodsUpdated?.(nextList);
      } else {
        const created = await salesApi.createContactMethod(contactId, {
          kind: formKind,
          value: formValue.trim(),
          label: finalLabel,
          is_primary: formIsPrimary,
        });

        const nextList = formIsPrimary
          ? methods
              .map((m) => (m.kind === formKind ? { ...m, is_primary: false } : m))
              .concat(created)
          : [...methods, created];

        setMethods(nextList);
        onMethodsUpdated?.(nextList);
      }

      setIsFormOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar canal de contato.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (method: ApiContactMethod) => {
    if (method.is_primary) return;
    setActionLoadingId(method.id);
    setError(null);

    try {
      const updated = await salesApi.setPrimaryContactMethod(contactId, method.id);
      const nextList = methods.map((m) => {
        if (m.kind === method.kind) {
          return { ...m, is_primary: m.id === updated.id };
        }
        return m;
      });
      setMethods(nextList);
      onMethodsUpdated?.(nextList);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível definir como principal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingMethod) return;
    setActionLoadingId(archivingMethod.id);
    setError(null);

    try {
      await salesApi.archiveContactMethod(contactId, archivingMethod.id, replacementId);
      const remaining = methods.filter((m) => m.id !== archivingMethod.id);
      const nextList = archivingMethod.is_primary && replacementId
        ? remaining.map((m) => (m.id === replacementId ? { ...m, is_primary: true } : m))
        : remaining;

      setMethods(nextList);
      onMethodsUpdated?.(nextList);
      setArchivingMethod(null);
      setReplacementId(undefined);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível arquivar o canal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const emailCount = useMemo(() => methods.filter((m) => m.kind === 'email').length, [methods]);
  const phoneCount = useMemo(
    () => methods.filter((m) => m.kind === 'phone' || m.kind === 'whatsapp').length,
    [methods]
  );
  const socialCount = useMemo(
    () => methods.filter((m) => ['linkedin', 'instagram', 'website'].includes(m.kind)).length,
    [methods]
  );

  const activeKindsToDisplay = useMemo((): ContactMethodKind[] => {
    switch (activeTab) {
      case 'emails':
        return ['email'];
      case 'phones':
        return ['phone', 'whatsapp'];
      case 'social':
        return ['linkedin', 'instagram', 'website'];
      case 'all':
      default:
        return ['email', 'phone', 'whatsapp', 'linkedin', 'instagram', 'website'];
    }
  }, [activeTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
        <TooltipProvider delayDuration={150}>
          {/* CABEÇALHO IBM CARBON ENTERPRISE */}
          <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  CRM · Central de Pessoas & Contatos
                </span>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Gerenciar Informações de Contato
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-0.5">
                  <span>Canais de contato de</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{contactName}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {methods.length} {methods.length === 1 ? 'canal cadastrado' : 'canais cadastrados'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    Exatamente 1 principal ativo por tipo
                  </span>
                </DialogDescription>
              </div>

              {!isFormOpen && !archivingMethod && (
                <Button
                  type="button"
                  onClick={() => openAddForm('email')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-2 h-9 px-4 rounded-md shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" /> Adicionar Canal
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* ALERTA DE ERRO / NOTIFICAÇÃO CARBON */}
          {error && (
            <div className="p-4 rounded-lg border-l-4 border-l-rose-500 border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5 rounded transition"
                aria-label="Fechar erro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. FORMULÁRIO DE ADIÇÃO OU EDIÇÃO (CARBON FORM SPEC) */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="p-6 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg space-y-5 animate-in fade-in-50 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {editingMethod ? 'Editar Canal de Contato' : 'Novo Canal de Contato'}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha os dados do canal. O valor será validado e normalizado no servidor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded transition"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={kindSelectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipo de Canal <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id={kindSelectId}
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as ContactMethodKind)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                  >
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="website">Website</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={labelSelectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Rótulo / Classificação <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id={labelSelectId}
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                  >
                    {LABEL_PRESETS.map((lbl) => (
                      <option key={lbl} value={lbl}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formLabel === 'Outro' && (
                <div className="space-y-1.5">
                  <label htmlFor="custom-label" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome do Rótulo Customizado <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="custom-label"
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Ex: Pessoal Secundário, Suporte, Matriz..."
                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor={valueInputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Valor ({KIND_CONFIG[formKind].label}) <span className="text-rose-500">*</span>
                </label>
                <input
                  id={valueInputId}
                  type={formKind === 'email' ? 'email' : 'text'}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder={KIND_CONFIG[formKind].placeholder}
                  required
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                  autoFocus
                />
              </div>

              {/* CHECKBOX CARD COM PROJEÇÃO DO CANAL PRINCIPAL */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold block">
                      Definir como principal para este canal ({KIND_CONFIG[formKind].label})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Ao marcar, este canal se tornará o contato padrão deste tipo e atualizará as projeções legadas do CRM.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 text-xs font-semibold gap-2 shadow-xs transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Salvar Canal'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* 2. CONFIRMAÇÃO DE ARQUIVAMENTO COM ESCOLHA DE SUBSTITUTO (CARBON WARNING) */}
          {archivingMethod && (
            <div className="p-5 rounded-lg border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 space-y-4 animate-in fade-in-50 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Arquivar canal de contato
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Tem certeza que deseja arquivar{' '}
                <strong className="text-slate-900 dark:text-white">{archivingMethod.value}</strong> (
                {KIND_CONFIG[archivingMethod.kind].label})? O histórico de mensagens e envios será mantido intacto.
              </p>

              {archivingMethod.is_primary && (
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-md space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Este é o canal principal atual. Escolha um substituto:
                  </p>
                  {methods.filter((m) => m.kind === archivingMethod.kind && m.id !== archivingMethod.id).length > 0 ? (
                    <select
                      value={replacementId || ''}
                      onChange={(e) => setReplacementId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Selecione o próximo canal principal...</option>
                      {methods
                        .filter((m) => m.kind === archivingMethod.kind && m.id !== archivingMethod.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.value} ({m.label})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                      Nenhum outro canal deste tipo cadastrado. A projeção principal ficará vazia.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setArchivingMethod(null)}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={actionLoadingId === archivingMethod.id}
                  onClick={handleConfirmArchive}
                  className="h-9 px-4 text-xs font-semibold gap-2 shadow-xs"
                >
                  {actionLoadingId === archivingMethod.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Arquivando...
                    </>
                  ) : (
                    'Confirmar Arquivamento'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* 3. TABS DE NAVEGAÇÃO IBM CARBON */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as FilterTab)}
            className="w-full space-y-4"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-lg h-auto gap-1">
              <TabsTrigger
                value="all"
                className="text-xs font-medium py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs transition-all"
              >
                Todos ({methods.length})
              </TabsTrigger>
              <TabsTrigger
                value="emails"
                className="text-xs font-medium py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs transition-all"
              >
                E-mails ({emailCount})
              </TabsTrigger>
              <TabsTrigger
                value="phones"
                className="text-xs font-medium py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs transition-all"
              >
                Telefones ({phoneCount})
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="text-xs font-medium py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs transition-all"
              >
                Redes & Web ({socialCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Carregando canais de contato...
                  </span>
                </div>
              ) : (
                <div className="space-y-6 pt-1">
                  {activeKindsToDisplay.map((kind) => {
                    const kindMethods = methods.filter((m) => m.kind === kind);
                    const config = KIND_CONFIG[kind];
                    const Icon = config.icon;

                    return (
                      <div key={kind} className="space-y-3">
                        {/* CABEÇALHO DO TIPO COM RITMO 8PX */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Icon className="w-4 h-4 text-slate-500" />
                              {config.label}s
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                              {kindMethods.length}
                            </span>
                          </div>

                          {!isFormOpen && (
                            <button
                              type="button"
                              onClick={() => openAddForm(kind)}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 transition px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adicionar {config.label}
                            </button>
                          )}
                        </div>

                        {kindMethods.length === 0 ? (
                          <div className="p-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-slate-400 italic">
                              Nenhum {config.label.toLowerCase()} cadastrado.
                            </p>
                            {!isFormOpen && (
                              <button
                                type="button"
                                onClick={() => openAddForm(kind)}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                + Adicionar agora
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {kindMethods.map((method) => {
                              const isCopied = copyFeedback === method.id;
                              const isBusy = actionLoadingId === method.id;

                              return (
                                <div
                                  key={method.id}
                                  className={`p-4 sm:p-4.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 ${
                                    method.is_primary
                                      ? 'border-l-4 border-l-blue-600 border-slate-200 dark:border-slate-700 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  {/* LADO ESQUERDO: ÍCONE + VALOR + METADADOS */}
                                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                    <div
                                      className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${config.tileClass}`}
                                    >
                                      <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight break-all select-all">
                                          {method.value}
                                        </span>

                                        {method.is_primary && (
                                          <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm">
                                            Principal
                                          </Badge>
                                        )}

                                        <span className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm font-medium border border-slate-200/80 dark:border-slate-700">
                                          {method.label}
                                        </span>
                                      </div>

                                      {method.normalized_value &&
                                        method.normalized_value !== method.value && (
                                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block">
                                            Normalizado: {method.normalized_value}
                                          </span>
                                        )}
                                    </div>
                                  </div>

                                  {/* LADO DIREITO: BARRA DE AÇÕES COM TOOLTIPS */}
                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    {/* Ação Contextual Rápida com Rótulo e Ícone */}
                                    {method.kind === 'email' && onSendEmail && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() => onSendEmail(method.value)}
                                            className="h-8 px-3 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                            title="Enviar e-mail para este endereço"
                                            aria-label="Enviar e-mail"
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Enviar</span>
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Enviar e-mail</TooltipContent>
                                      </Tooltip>
                                    )}

                                    {method.kind === 'phone' && onCall && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() => onCall(method.value)}
                                            className="h-8 px-3 rounded-md bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                            title="Ligar para este número"
                                            aria-label="Ligar"
                                          >
                                            <Phone className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Ligar</span>
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Efetuar chamada</TooltipContent>
                                      </Tooltip>
                                    )}

                                    {method.kind === 'whatsapp' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <a
                                            href={`https://wa.me/${method.normalized_value?.replace(/\D/g, '') || method.value.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-8 px-3 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                            title="Abrir WhatsApp"
                                            aria-label="Abrir WhatsApp"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">WhatsApp</span>
                                          </a>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Abrir conversa no WhatsApp</TooltipContent>
                                      </Tooltip>
                                    )}

                                    {['linkedin', 'instagram', 'website'].includes(method.kind) && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <a
                                            href={
                                              method.value.startsWith('http')
                                                ? method.value
                                                : `https://${method.value}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-8 px-3 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                            title="Abrir link em nova aba"
                                            aria-label="Abrir link"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Abrir</span>
                                          </a>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Abrir em nova aba segura</TooltipContent>
                                      </Tooltip>
                                    )}

                                    <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                                    {/* Copiar valor */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(method)}
                                          className="w-8 h-8 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                          title="Copiar valor"
                                          aria-label="Copiar valor"
                                        >
                                          {isCopied ? (
                                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                          ) : (
                                            <Copy className="w-4 h-4" />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        {isCopied ? 'Copiado!' : 'Copiar valor'}
                                      </TooltipContent>
                                    </Tooltip>

                                    {/* Tornar Principal */}
                                    {!method.is_primary && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleSetPrimary(method)}
                                            className="w-8 h-8 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-center transition disabled:opacity-50"
                                            title="Tornar este canal o principal"
                                            aria-label="Tornar principal"
                                          >
                                            {isBusy ? (
                                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                            ) : (
                                              <Star className="w-4 h-4" />
                                            )}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Definir como principal</TooltipContent>
                                      </Tooltip>
                                    )}

                                    {/* Editar */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => openEditForm(method)}
                                          className="w-8 h-8 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                          title="Editar"
                                          aria-label="Editar canal"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Editar informações</TooltipContent>
                                    </Tooltip>

                                    {/* Arquivar */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => setArchivingMethod(method)}
                                          className="w-8 h-8 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition"
                                          title="Arquivar canal"
                                          aria-label="Arquivar canal"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Arquivar este canal</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

export default ContactMethodsModal;
