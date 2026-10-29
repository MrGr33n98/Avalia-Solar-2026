'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Send,
  Tag as TagIcon,
  Zap,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactMethodsModal } from './ContactMethodsModal';
import { ApiContactMethod } from '@/lib/api/sales/client';
import { useVoiceCallOptional } from '@/contexts/VoiceCallContext';

export interface OpportunityItem {
  id: number;
  name?: string;
  opportunity_name?: string;
  value_cents?: number;
  currency?: string;
  stage_name?: string;
  status?: string;
  probability?: number;
  expected_close_date?: string | null;
}

export interface TagItem {
  id: number;
  name: string;
  color?: string;
}

type CustomFieldValue = string | number | boolean;

interface PersonSummarySidebarProps {
  contactId?: number;
  contactName?: string;
  contactMethods?: ApiContactMethod[];
  onContactMethodsUpdated?: (methods: ApiContactMethod[]) => void;
  onSendEmailWithAddress?: (email: string) => void;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  territory?: string;
  lastContactAt?: string | null;
  createdVia?: string;
  tags?: TagItem[];
  opportunities?: OpportunityItem[];
  customFields?: Record<string, CustomFieldValue>;
  attachments?: Array<{ name: string; size: string; date: string; url?: string }>;
  engagement?: {
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
  };
  onSendEmail: () => void;
  onSendWhatsApp: () => void;
  onCall: () => void;
  onUpdateTags: (tagNames: string[]) => Promise<void>;
  onUpdateCustomFields: (fields: Record<string, CustomFieldValue>) => Promise<void>;
}

export default function PersonSummarySidebar({
  contactId,
  contactName,
  contactMethods = [],
  onContactMethodsUpdated,
  onSendEmailWithAddress,
  email,
  phone,
  whatsapp,
  territory = 'Sudeste - SP',
  lastContactAt,
  createdVia = 'Formulário Solar',
  tags = [],
  opportunities = [],
  customFields = {},
  attachments = [],
  engagement = { sent: 3, delivered: 3, opens: 2, clicks: 1 },
  onSendEmail,
  onSendWhatsApp,
  onCall,
  onUpdateTags,
  onUpdateCustomFields,
}: PersonSummarySidebarProps) {
  const voiceCall = useVoiceCallOptional();

  // Contact Methods modal & state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [methods, setMethods] = useState<ApiContactMethod[]>(contactMethods);

  useEffect(() => {
    if (contactMethods) {
      setMethods(contactMethods);
    }
  }, [contactMethods]);

  // Tags state
  const [currentTags, setCurrentTags] = useState<TagItem[]>(tags);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Custom Fields tabs & edit
  const [customFieldFilter, setCustomFieldFilter] = useState<'all' | 'filled' | 'empty'>('all');
  const [fields, setFields] = useState<Record<string, CustomFieldValue>>(customFields);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState('');

  // Attachments state (Zero-mock: use real attachments)
  const [fileList] = useState(attachments);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const triggerVoiceCall = (targetPhone: string) => {
    if (voiceCall) {
      void voiceCall.startCall({
        phoneNumber: targetPhone,
        contactId,
        contactName: contactName || undefined,
      });
      return;
    }
    onCall();
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const name = newTagName.trim();
    const updatedTagNames = [...currentTags.map((t) => t.name), name];
    setCurrentTags((prev) => [...prev, { id: Date.now(), name, color: '#4f46e5' }]);
    setNewTagName('');
    setIsAddingTag(false);
    try {
      await onUpdateTags(updatedTagNames);
    } catch {
      // ignore
    }
  };

  const handleSaveField = async (key: string) => {
    const updated = { ...fields, [key]: editingFieldValue };
    setFields(updated);
    setEditingFieldKey(null);
    try {
      await onUpdateCustomFields(updated);
    } catch {
      // ignore
    }
  };

  const formatRelativeContact = (dateStr?: string | null) => {
    if (!dateStr) return 'Nunca contatado';
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  };

  const openOpportunities = opportunities.filter((o) => o.status !== 'won' && o.status !== 'lost');

  return (
    <div className="space-y-4">
      {/* 1. PERSON SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
          Person Summary
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-400">Territory:</span>
            <span className="font-semibold text-slate-800">{territory}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-400">Last contacted:</span>
            <span className="font-semibold text-slate-800">{formatRelativeContact(lastContactAt)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-400">Created via:</span>
            <span className="font-semibold text-slate-800">{createdVia}</span>
          </div>

          {/* Tags */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                <TagIcon className="w-3 h-3 text-slate-400" /> Tags
              </span>
              {!isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add tag
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {currentTags.map((tag) => (
                <Badge
                  key={tag.id}
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold px-2 py-0.5"
                >
                  {tag.name}
                </Badge>
              ))}

              {isAddingTag && (
                <div className="flex items-center gap-1 w-full pt-1">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Nome da tag..."
                    className="text-[11px] px-2 py-1 rounded border border-indigo-300 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddTag} className="h-6 text-[10px] px-2 bg-indigo-600">
                    OK
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTACT INFO (1-Click Actions & Multicanal) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact Info
          </h3>
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5 transition"
            aria-label="Adicionar ou gerenciar canais de contato"
          >
            + Add info
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {methods.length > 0 ? (
            // RENDERIZAÇÃO MULTICANAL PERSISTIDA
            <div className="space-y-2">
              {/* E-mails */}
              {methods.filter((m) => m.kind === 'email').map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                    m.is_primary ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{m.value}</span>
                    {m.is_primary && (
                      <span className="text-[9px] bg-sky-600 text-white font-bold px-1 rounded">
                        Principal
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">({m.label})</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.value, `email_${m.id}`)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                      title="Copiar e-mail"
                    >
                      {copyFeedback === `email_${m.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => (onSendEmailWithAddress ? onSendEmailWithAddress(m.value) : onSendEmail())}
                      className="p-1 text-sky-600 hover:text-sky-800 rounded transition"
                      title="Enviar e-mail para este endereço"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Telefones */}
              {methods.filter((m) => m.kind === 'phone').map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                    m.is_primary ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{m.value}</span>
                    {m.is_primary && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1 rounded">
                        Principal
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">({m.label})</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.value, `phone_${m.id}`)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                      title="Copiar telefone"
                    >
                      {copyFeedback === `phone_${m.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerVoiceCall(m.value)}
                      className="p-1 text-emerald-600 hover:text-emerald-800 rounded transition cursor-pointer"
                      title="Ligar via CRM VoIP"
                    >
                      <Phone className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* WhatsApps */}
              {methods.filter((m) => m.kind === 'whatsapp').map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-emerald-900 font-semibold truncate">
                      WhatsApp: {m.value}
                    </span>
                    {m.is_primary && (
                      <span className="text-[9px] bg-emerald-700 text-white font-bold px-1 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://wa.me/${m.normalized_value?.replace(/\D/g, '') || m.value.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-emerald-700 hover:text-emerald-900 rounded transition"
                    title="Abrir WhatsApp"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}

              {/* Redes Sociais & Websites */}
              {methods.filter((m) => ['linkedin', 'instagram', 'website'].includes(m.kind)).map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-indigo-50/40 border border-indigo-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                    <span className="text-indigo-950 font-medium truncate capitalize">
                      {m.kind}: {m.value}
                    </span>
                  </div>
                  <a
                    href={m.value.startsWith('http') ? m.value : `https://${m.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-indigo-700 hover:text-indigo-900 rounded transition"
                    title="Abrir link externo seguro"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            // FALLBACK RETROCOMPATÍVEL LEGADO
            <>
              {email ? (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{email}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(email, 'email')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                      title="Copiar e-mail"
                    >
                      {copyFeedback === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={onSendEmail}
                      className="p-1 text-sky-600 hover:text-sky-800 rounded transition"
                      title="Enviar e-mail"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Nenhum e-mail cadastrado.</p>
              )}

              {phone && (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{phone}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(phone, 'phone')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                      title="Copiar telefone"
                    >
                      {copyFeedback === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerVoiceCall(phone)}
                      className="p-1 text-emerald-600 hover:text-emerald-800 rounded transition cursor-pointer"
                      title="Ligar via CRM VoIP"
                    >
                      <Phone className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {whatsapp && (
                <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-emerald-900 font-semibold truncate">WhatsApp: {whatsapp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onSendWhatsApp}
                    className="p-1 text-emerald-700 hover:text-emerald-900 rounded transition"
                    title="Abrir WhatsApp"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. LEADS (Oportunidades Solares) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Leads (Oportunidades)
            </h3>
          </div>
          <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold">
            Open {openOpportunities.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {openOpportunities.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">Nenhuma oportunidade solar aberta.</p>
          ) : (
            openOpportunities.map((opp) => {
              const oppName = opp.name || opp.opportunity_name || 'Projeto Solar Fotovoltaico';
              const valueFormatted = opp.value_cents
                ? `R$ ${(opp.value_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'R$ Sob Consulta';

              return (
                <Link
                  key={opp.id}
                  href={`/dashboard/sales/pipeline`}
                  className="block p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-colors space-y-1 group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                    {oppName}
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-700">{valueFormatted}</span>
                    <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700">
                      {opp.stage_name || 'Qualificação'}
                    </Badge>
                  </div>
                </Link>
              );
            })
          )}

          <Link href="/dashboard/sales/pipeline" className="block pt-1">
            <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed text-slate-600 font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create a lead
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. EMAIL ENGAGEMENT */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
          Email Engagement
        </h3>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
            <span className="text-lg font-bold text-sky-950 block">{engagement.delivered}</span>
            <span className="text-[10px] font-semibold text-sky-700 uppercase">Entregues</span>
          </div>

          <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="text-lg font-bold text-emerald-950 block">
              {engagement.delivered > 0 ? `${Math.round((engagement.opens / engagement.delivered) * 100)}%` : '0%'}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 uppercase">Abertura</span>
          </div>

          <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
            <span className="text-lg font-bold text-purple-950 block">{engagement.clicks}</span>
            <span className="text-[10px] font-semibold text-purple-700 uppercase">Cliques</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-lg font-bold text-slate-900 block">{engagement.sent}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Envios</span>
          </div>
        </div>
      </div>

      {/* 5. ATTACHMENTS (Faturas de Luz, Telhado, Propostas) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Attachments ({fileList.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => alert('Para anexar arquivos, selecione a conta de energia em formato PDF ou fotos do local.')}
            className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold"
          >
            Upload
          </button>
        </div>

        <div className="space-y-1.5">
          {fileList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">Nenhum arquivo anexado.</p>
          ) : (
            fileList.map((file, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between gap-2 text-xs transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-[11px]">{file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {file.size} • {file.date}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 cursor-pointer hover:text-indigo-600" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. CUSTOM FIELDS (Dados Técnicos Solares) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
            Custom Fields
          </h3>

          <div className="flex items-center bg-slate-100 p-0.5 rounded text-[10px] font-semibold">
            {(['all', 'filled', 'empty'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCustomFieldFilter(tab)}
                className={`px-1.5 py-0.5 rounded capitalize ${
                  customFieldFilter === tab ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {Object.keys(fields).length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">Nenhum campo personalizado cadastrado.</p>
          ) : (
            Object.entries(fields).map(([key, val]) => {
            const isFilled = !!val && String(val).trim().length > 0;
            if (customFieldFilter === 'filled' && !isFilled) return null;
            if (customFieldFilter === 'empty' && isFilled) return null;

            const isEditing = editingFieldKey === key;

            return (
              <div key={key} className="space-y-1 border-b border-slate-50 pb-2">
                <span className="text-[10px] font-semibold text-slate-400 block">{key}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingFieldValue}
                      onChange={(e) => setEditingFieldValue(e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-indigo-300 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveField(key)}
                      className="h-6 text-[10px] px-2 bg-indigo-600"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setEditingFieldKey(key);
                      setEditingFieldValue(String(val ?? ''));
                    }}
                    className="cursor-pointer group flex items-center justify-between"
                  >
                    <span className={val ? 'font-medium text-slate-800' : 'text-slate-300 italic'}>
                      {val || 'Definir...'}
                    </span>
                    <span className="text-[10px] text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                      Editar
                    </span>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      {contactId && (
        <ContactMethodsModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
          contactId={contactId}
          contactName={contactName || 'Contato'}
          initialMethods={methods}
          onMethodsUpdated={(updated) => {
            setMethods(updated);
            onContactMethodsUpdated?.(updated);
          }}
          onSendEmail={(targetEmail) => {
            if (onSendEmailWithAddress) {
              onSendEmailWithAddress(targetEmail);
            } else {
              onSendEmail();
            }
          }}
          onCall={(targetPhone) => {
            setIsContactModalOpen(false);
            triggerVoiceCall(targetPhone);
          }}
          onWhatsApp={(targetWhatsApp) => {
            const digits = targetWhatsApp.replace(/\D/g, '');
            window.open(
              `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`,
              '_blank',
              'noopener,noreferrer'
            );
          }}
        />
      )}
    </div>
  );
}
