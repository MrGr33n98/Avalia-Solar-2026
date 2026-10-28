'use client';

import React, { useState, useEffect, useId } from 'react';
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
  { label: string; icon: React.ElementType; placeholder: string; color: string }
> = {
  email: {
    label: 'E-mail',
    icon: Mail,
    placeholder: 'nome@exemplo.com.br',
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  phone: {
    label: 'Telefone',
    icon: Phone,
    placeholder: '(11) 98765-4321',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    placeholder: '(11) 98765-4321',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Globe,
    placeholder: 'linkedin.com/in/perfil',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  instagram: {
    label: 'Instagram',
    icon: Globe,
    placeholder: 'instagram.com/perfil ou @perfil',
    color: 'text-pink-600 bg-pink-50 border-pink-200',
  },
  website: {
    label: 'Website',
    icon: Globe,
    placeholder: 'https://exemplo.com.br',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
};

const LABEL_PRESETS = ['Trabalho', 'Pessoal', 'Comercial', 'Outro'];

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

  const groupedKinds: ContactMethodKind[] = ['email', 'phone', 'whatsapp', 'linkedin', 'instagram', 'website'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto p-5">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Gerenciar Informações de Contato
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Canais de contato de <span className="font-semibold text-slate-700">{contactName}</span>
              </DialogDescription>
            </div>
            {!isFormOpen && !archivingMethod && (
              <Button
                type="button"
                size="sm"
                onClick={() => openAddForm('email')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 h-8 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Canal
              </Button>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 my-2 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. FORMULÁRIO DE ADIÇÃO OU EDIÇÃO */}
        {isFormOpen && (
          <form
            onSubmit={handleSave}
            className="my-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in-50"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="font-bold text-xs text-slate-800">
                {editingMethod ? 'Editar Canal de Contato' : 'Novo Canal de Contato'}
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor={kindSelectId} className="block font-semibold text-slate-700 mb-1">
                  Tipo de Canal
                </label>
                <select
                  id={kindSelectId}
                  value={formKind}
                  onChange={(e) => setFormKind(e.target.value as ContactMethodKind)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="website">Website</option>
                </select>
              </div>

              <div>
                <label htmlFor={labelSelectId} className="block font-semibold text-slate-700 mb-1">
                  Rótulo
                </label>
                <select
                  id={labelSelectId}
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              <div>
                <label htmlFor="custom-label" className="block font-semibold text-slate-700 mb-1 text-xs">
                  Nome do Rótulo Customizado
                </label>
                <input
                  id="custom-label"
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Ex: Pessoal Secundário, Suporte..."
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label htmlFor={valueInputId} className="block font-semibold text-slate-700 mb-1 text-xs">
                Valor ({KIND_CONFIG[formKind].label})
              </label>
              <input
                id={valueInputId}
                type={formKind === 'email' ? 'email' : 'text'}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={KIND_CONFIG[formKind].placeholder}
                required
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={formIsPrimary}
                onChange={(e) => setFormIsPrimary(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Definir como principal para este canal ({KIND_CONFIG[formKind].label})
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="h-8 text-xs font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold gap-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Canal'
                )}
              </Button>
            </div>
          </form>
        )}

        {/* 2. CONFIRMAÇÃO DE ARQUIVAMENTO COM ESCOLHA DE SUBSTITUTO */}
        {archivingMethod && (
          <div className="my-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 animate-in fade-in-50 text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Arquivar canal de contato
            </div>
            <p className="text-slate-600">
              Tem certeza que deseja arquivar{' '}
              <strong className="text-slate-900">{archivingMethod.value}</strong> (
              {KIND_CONFIG[archivingMethod.kind].label})?
            </p>

            {archivingMethod.is_primary && (
              <div className="p-2.5 bg-white border border-amber-200 rounded-lg space-y-2">
                <p className="font-semibold text-slate-800">
                  Este é o canal principal atual. Escolha um substituto:
                </p>
                {methods.filter((m) => m.kind === archivingMethod.kind && m.id !== archivingMethod.id).length > 0 ? (
                  <select
                    value={replacementId || ''}
                    onChange={(e) => setReplacementId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs bg-white"
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
                  <p className="text-[11px] text-amber-700 italic">
                    Nenhum outro canal deste tipo cadastrado. A projeção principal ficará vazia.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setArchivingMethod(null)}
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={actionLoadingId === archivingMethod.id}
                onClick={handleConfirmArchive}
                className="h-8 text-xs font-semibold gap-1"
              >
                {actionLoadingId === archivingMethod.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Arquivando...
                  </>
                ) : (
                  'Confirmar Arquivamento'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 3. LISTAGEM AGRUPADA POR TIPO */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Carregando canais de contato...</span>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {groupedKinds.map((kind) => {
              const kindMethods = methods.filter((m) => m.kind === kind);
              const config = KIND_CONFIG[kind];
              const Icon = config.icon;

              return (
                <div key={kind} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider pb-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" /> {config.label}s ({kindMethods.length})
                    </span>
                    {!isFormOpen && (
                      <button
                        type="button"
                        onClick={() => openAddForm(kind)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold normal-case flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    )}
                  </div>

                  {kindMethods.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1 pl-1">
                      Nenhum {config.label.toLowerCase()} cadastrado.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {kindMethods.map((method) => {
                        const isCopied = copyFeedback === method.id;
                        const isBusy = actionLoadingId === method.id;

                        return (
                          <div
                            key={method.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              method.is_primary
                                ? 'bg-indigo-50/40 border-indigo-200'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {method.value}
                                  </span>
                                  {method.is_primary && (
                                    <Badge className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0 h-4">
                                      Principal
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                    {method.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Ações por item */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Copiar */}
                              <button
                                type="button"
                                onClick={() => handleCopy(method)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center transition border border-transparent hover:border-slate-200"
                                title="Copiar valor"
                                aria-label="Copiar valor"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Ação Contextual (Email / Call / WhatsApp / Link) */}
                              {method.kind === 'email' && onSendEmail && (
                                <button
                                  type="button"
                                  onClick={() => onSendEmail(method.value)}
                                  className="w-7 h-7 rounded-lg text-sky-600 hover:bg-sky-50 flex items-center justify-center transition"
                                  title="Enviar e-mail para este endereço"
                                  aria-label="Enviar e-mail"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {method.kind === 'phone' && onCall && (
                                <button
                                  type="button"
                                  onClick={() => onCall(method.value)}
                                  className="w-7 h-7 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition"
                                  title="Ligar para este número"
                                  aria-label="Ligar"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {method.kind === 'whatsapp' && (
                                <a
                                  href={`https://wa.me/${method.normalized_value?.replace(/\D/g, '') || method.value.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-7 h-7 rounded-lg text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition"
                                  title="Abrir WhatsApp"
                                  aria-label="Abrir WhatsApp"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {['linkedin', 'instagram', 'website'].includes(method.kind) && (
                                <a
                                  href={
                                    method.value.startsWith('http')
                                      ? method.value
                                      : `https://${method.value}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-7 h-7 rounded-lg text-indigo-700 hover:bg-indigo-50 flex items-center justify-center transition"
                                  title="Abrir link em nova aba"
                                  aria-label="Abrir link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Tornar Principal */}
                              {!method.is_primary && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleSetPrimary(method)}
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition disabled:opacity-50"
                                  title="Tornar este canal o principal"
                                  aria-label="Tornar principal"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Star className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {/* Editar */}
                              <button
                                type="button"
                                onClick={() => openEditForm(method)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center transition border border-transparent hover:border-slate-200"
                                title="Editar"
                                aria-label="Editar canal"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Arquivar */}
                              <button
                                type="button"
                                onClick={() => setArchivingMethod(method)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                                title="Arquivar canal"
                                aria-label="Arquivar canal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
      </DialogContent>
    </Dialog>
  );
}

export default ContactMethodsModal;
