'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Bold,
  CheckCircle2,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Mail,
  Minus,
  Paperclip,
  Pencil,
  RotateCw,
  Search,
  Send,
  Sparkles,
  Underline,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  contactEmail?: string;
  contactName?: string;
  companyName?: string;
  onSuccess?: () => void;
}

const DEFAULT_TEMPLATES = [
  {
    id: 'first_contact',
    name: 'Primeiro Contato — Selo Verificado Avalia Solar',
    subject: 'Oportunidade de Selo Verificado e Perfil PRO no Avalia Solar',
    body: `Olá {{contact_name}},

Verifiquei o perfil da {{company_name}} no Avalia Solar e notei a excelente reputação e relevância no mercado de energia solar.

Gostaria de agendar uma breve conversa de 10 minutos para apresentar como o Selo Verificado pode aumentar a conversão de orçamentos e destacar sua empresa perante os clientes finais.

Qual o melhor dia e horário para conversarmos esta semana?

Atenciosamente,
Felipe — Equipe Comercial Avalia Solar`,
  },
  {
    id: 'solar_proposal',
    name: 'Proposta Comercial Usina Solar B2B',
    subject: 'Proposta Técnica & Estudo de Viabilidade Solar — {{company_name}}',
    body: `Prezado(a) {{contact_name}},

Conforme conversamos, segue em anexo o estudo técnico preliminar e a proposta comercial para a implementação do sistema fotovoltaico da {{company_name}}.

Pontos principais do projeto:
- Potência estimada: Usina Rooftop B2B
- Retorno sobre Investimento (Payback): ~3.2 anos
- Economia anual estimada: até 88% na fatura de energia

Estou à disposição para tirarmos dúvidas e ajustarmos a proposta.

Um abraço,
Felipe — Avalia Solar`,
  },
  {
    id: 'follow_up',
    name: 'Follow-up Pós-Reunião Técnica',
    subject: 'Acompanhamento da Proposta Comercial — Avalia Solar',
    body: `Olá {{contact_name}},

Espero que esteja bem.

Estou entrando em contato para acompanhar nossa conversa sobre a proposta para a {{company_name}}.

Conseguiu revisar o estudo com os demais membros do comitê de decisão?

Estou à disposição para alinhar os próximos passos.

Atenciosamente,
Felipe — Avalia Solar`,
  },
];

export default function SendEmailModal({
  open,
  onClose,
  opportunityId,
  contactEmail = '',
  contactName = '',
  companyName = '',
  onSuccess,
}: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email Fields
  const [toEmail, setToEmail] = useState(contactEmail || '');
  const [recipientName, setRecipientName] = useState(contactName || 'Contato');
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [relatedLead, setRelatedLead] = useState(companyName || 'Projeto Solar B2B');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Template Search & Selection
  const [searchTemplate, setSearchTemplate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [sendOption, setSendOption] = useState<'now' | 'task' | 'schedule'>('now');
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (contactEmail) setToEmail(contactEmail);
    if (contactName) setRecipientName(contactName);
    if (companyName) setRelatedLead(companyName);
  }, [contactEmail, contactName, companyName]);

  const filteredTemplates = DEFAULT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTemplate.toLowerCase())
  );

  const applyTemplate = (tmpl: (typeof DEFAULT_TEMPLATES)[0]) => {
    setSelectedTemplateId(tmpl.id);
    const sub = tmpl.subject
      .replace(/{{company_name}}/g, companyName || 'sua empresa')
      .replace(/{{contact_name}}/g, recipientName || 'Cliente');
    const bdy = tmpl.body
      .replace(/{{company_name}}/g, companyName || 'sua empresa')
      .replace(/{{contact_name}}/g, recipientName || 'Cliente');
    setSubject(sub);
    setBody(bdy);
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplateId(null);
    setSubject('');
    setBody('');
  };

  const handleFormatText = (tag: string) => {
    if (tag === 'bold') setBody((prev) => prev + ' **texto em negrito** ');
    if (tag === 'italic') setBody((prev) => prev + ' *texto em itálico* ');
    if (tag === 'underline') setBody((prev) => prev + ' <u>texto sublinhado</u> ');
    if (tag === 'list') setBody((prev) => prev + '\n- Item 1\n- Item 2\n');
    if (tag === 'link') {
      const url = prompt('Digite o link URL:', 'https://');
      if (url) setBody((prev) => prev + ` [link](${url}) `);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSendEmail = async (mode: 'now' | 'task' | 'schedule' = 'now') => {
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      return setError('Preencha os campos obrigatórios: Destinatário, Assunto e Mensagem.');
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('email[to_email]', toEmail);
      formData.append('email[subject]', subject);
      formData.append('email[body_text]', body);
      if (opportunityId) formData.append('email[sales_opportunity_id]', String(opportunityId));
      if (cc) formData.append('email[cc]', cc);
      if (bcc) formData.append('email[bcc]', bcc);
      formData.append('email[open_tracking_enabled]', 'true');
      formData.append('email[click_tracking_enabled]', 'true');

      attachments.forEach((file) => {
        formData.append('email[attachments][]', file);
      });

      const res = await fetch('/api/v1/sales/emails', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Falha ao enviar e-mail comercial.');
      }

      setSuccessMsg('E-mail comercial disparado com sucesso!');
      toast.success('E-mail enviado com sucesso!');

      setTimeout(() => {
        onClose();
        setLoading(false);
        setSuccessMsg(null);
        setSubject('');
        setBody('');
        setAttachments([]);
        onSuccess?.();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail comercial.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[960px] max-h-[90vh] flex flex-col p-0 bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border-slate-200">
        {/* MODAL HEADER (Matching Nutshell Benchmark Header) */}
        <DialogHeader className="px-6 py-3.5 border-b border-slate-200 flex flex-row items-center justify-between space-y-0 bg-white shrink-0">
          <DialogTitle className="text-base font-bold text-slate-800 tracking-tight">
            Send email to {recipientName ? `${recipientName} -` : '-'}
          </DialogTitle>
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* TWO-COLUMN MAIN BODY (32% LEFT SIDEBAR / 68% RIGHT COMPOSER) */}
        <div className="grid grid-cols-12 flex-1 min-h-[480px] max-h-[75vh] overflow-hidden">
          {/* LEFT SIDEBAR (Template selection & search) */}
          <div className="col-span-4 bg-slate-50/80 border-r border-slate-200 p-4 space-y-3 flex flex-col">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <Input
                placeholder="Search templates..."
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
                className="h-9 pl-8 text-xs border-slate-200 rounded-lg bg-white focus:bg-white"
              />
            </div>

            {/* Create email from scratch button */}
            <button
              type="button"
              onClick={handleCreateFromScratch}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedTemplateId === null
                  ? 'bg-slate-200/80 text-slate-900 font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Pencil className="w-3.5 h-3.5 text-slate-600" />
              <span>Create email from scratch</span>
            </button>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pt-1">
              {filteredTemplates.length === 0 ? (
                <div className="py-12 text-center text-xs space-y-1">
                  <p className="font-bold text-slate-600">No emails</p>
                  <button
                    type="button"
                    onClick={() => setSearchTemplate('')}
                    className="text-sky-600 font-semibold hover:underline"
                  >
                    See all templates
                  </button>
                </div>
              ) : (
                filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-sky-50 border-sky-300 text-sky-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-sky-600 shrink-0" />
                      <span className="font-bold truncate">{tmpl.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{tmpl.subject}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT MAIN PANEL (Email Composition Form) */}
          <div className="col-span-8 p-5 space-y-3 flex flex-col overflow-y-auto bg-white">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FROM ROW */}
            <div className="flex items-center text-xs pb-1 border-b border-slate-100">
              <span className="w-20 text-slate-400 font-medium">From</span>
              <div className="flex items-center gap-1 bg-slate-700 text-white px-2.5 py-0.5 rounded-md text-[11px] font-semibold">
                <span>Felipe &lt;felipehhenriquee@gmail.com&gt;</span>
              </div>
            </div>

            {/* TO ROW */}
            <div className="flex items-center text-xs pb-1 border-b border-slate-100 justify-between">
              <div className="flex items-center flex-1 gap-2">
                <span className="w-20 text-slate-400 font-medium">To</span>
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-md text-[11px] font-semibold">
                  <span>
                    {recipientName} &lt;{toEmail || 'sem-email@exemplo.com'}&gt;
                  </span>
                  <button type="button" onClick={() => setToEmail('')} className="text-slate-400 hover:text-slate-700 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCc(!showCc)}
                className="text-sky-600 font-bold hover:underline text-[11px]"
              >
                Cc
              </button>
            </div>

            {/* CC / BCC ROWS (TOGGLED) */}
            {showCc && (
              <div className="space-y-2 pb-1 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-400 font-medium">Cc</span>
                  <Input
                    placeholder="copia@empresa.com"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="h-7 text-xs border-slate-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-400 font-medium">Bcc</span>
                  <Input
                    placeholder="copia-oculta@empresa.com"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="h-7 text-xs border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* RELATED LEADS ROW */}
            <div className="flex items-center text-xs pb-1 border-b border-slate-100">
              <span className="w-20 text-slate-400 font-medium">Related leads</span>
              <Input
                value={relatedLead}
                onChange={(e) => setRelatedLead(e.target.value)}
                placeholder="Selecione ou busque o lead/oportunidade associado..."
                className="h-7 text-xs border-none shadow-none focus-visible:ring-0 p-0 font-medium text-slate-700"
              />
            </div>

            {/* SUBJECT ROW */}
            <div className="flex items-center text-xs pb-1 border-b border-slate-100">
              <span className="w-20 text-slate-400 font-medium">Subject</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Digite o assunto relevante do e-mail comercial..."
                className="h-7 text-xs border-none shadow-none focus-visible:ring-0 p-0 font-semibold text-slate-900"
              />
            </div>

            {/* BODY TEXTAREA */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escreva a mensagem do e-mail..."
                className="flex-1 text-xs border-slate-200 focus:border-sky-500 rounded-lg p-3 leading-relaxed font-sans resize-none"
              />

              {/* RICH TEXT TOOLBAR (At bottom of text box) */}
              <div className="flex items-center gap-1 pt-2 text-slate-600">
                <button
                  type="button"
                  onClick={() => handleFormatText('bold')}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-bold"
                  title="Bold (**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('italic')}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700"
                  title="Italic (*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('underline')}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700"
                  title="Underline (<u>)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('list')}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('link')}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700"
                  title="Insert Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <label className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer" title="Attach image">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleFileAttach} className="hidden" />
                </label>
                <label className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer" title="Attach file">
                  <Paperclip className="w-3.5 h-3.5" />
                  <input type="file" onChange={handleFileAttach} className="hidden" />
                </label>

                {attachments.length > 0 && (
                  <span className="text-[11px] font-bold text-sky-700 ml-2">
                    {attachments.length} anexo(s) adicionado(s)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER BAR (Matching Nutshell Benchmark Footer) */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-white shrink-0 text-xs">
          {/* Checkbox: Save as template after sending */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-sky-500"
            />
            <span>Save as template after sending</span>
          </label>

          {/* Primary Action: Split Send Button */}
          <div className="relative flex items-center">
            <Button
              type="button"
              onClick={() => handleSendEmail(sendOption)}
              disabled={loading}
              className="h-9 px-4 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-l-lg rounded-r-none shadow-2xs flex items-center gap-1.5"
            >
              {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{sendOption === 'now' ? 'Send' : sendOption === 'task' ? 'Send & complete task' : 'Schedule send'}</span>
            </Button>
            <button
              type="button"
              onClick={() => setSendMenuOpen(!sendMenuOpen)}
              disabled={loading}
              className="h-9 px-2 bg-sky-500 hover:bg-sky-600 text-white border-l border-sky-400 rounded-r-lg flex items-center justify-center"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Send Menu Dropdown */}
            {sendMenuOpen && (
              <div className="absolute right-0 bottom-11 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-48 text-xs font-semibold z-50">
                <button
                  type="button"
                  onClick={() => {
                    setSendOption('now');
                    setSendMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-800"
                >
                  Send now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendOption('task');
                    setSendMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-800"
                >
                  Send & complete task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendOption('schedule');
                    setSendMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-800"
                >
                  Schedule send...
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
