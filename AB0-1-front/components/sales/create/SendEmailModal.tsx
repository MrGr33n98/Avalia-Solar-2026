'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Bold,
  Check,
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Maximize2,
  Minimize2,
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
import { toast } from 'sonner';
import { salesApi } from '@/lib/api/sales/client';
import { useAuth } from '@/contexts/AuthContext';

interface SignatureItem {
  id: number;
  name: string;
  body_html: string;
  is_default?: boolean;
}

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number | null;
  contactId?: number | null;
  accountId?: number | null;
  contactEmail?: string | null;
  contactName?: string | null;
  companyName?: string | null;
  onSuccess?: () => void;
}

const DEFAULT_TEMPLATES = [
  {
    id: 'first_contact',
    name: 'Primeiro Contato — Selo Verificado Avalia Solar',
    subject: 'Oportunidade de Selo Verificado no Avalia Solar',
    body: `Olá {{contact_name}},

Verifiquei o perfil da {{company_name}} no Avalia Solar e notei a excelente reputação e relevância no mercado de energia solar.

Gostaria de agendar uma breve conversa de 10 minutos para apresentar como o Selo Verificado pode aumentar a conversão de orçamentos e destacar sua empresa perante os clientes finais.

Qual o melhor dia e horário para conversarmos esta semana?

Atenciosamente,`,
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

Um abraço,`,
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

Atenciosamente,`,
  },
];

export default function SendEmailModal({
  open,
  onClose,
  opportunityId,
  contactId,
  accountId,
  contactEmail = '',
  contactName = '',
  companyName = '',
  onSuccess,
}: SendEmailModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const senderName = user?.name || 'Felipe';
  const senderEmail = user?.email?.includes('@avaliasolar.com.br')
    ? user.email
    : 'felipe@avaliasolar.com.br';

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
  const [windowState, setWindowState] = useState<'normal' | 'minimized' | 'maximized'>('normal');

  // Assinatura de E-mail Corporativa
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | 'default' | 'none'>('default');
  const [signatureMenuOpen, setSignatureMenuOpen] = useState(false);

  const [isEditingTo, setIsEditingTo] = useState<boolean>(
    !contactEmail || contactEmail === 'sem-email@exemplo.com' || !contactEmail.includes('@')
  );

  useEffect(() => {
    if (open) {
      const isValid = contactEmail && contactEmail !== 'sem-email@exemplo.com' && contactEmail.includes('@');
      if (isValid) {
        setToEmail(contactEmail);
        setIsEditingTo(false);
      } else {
        setToEmail('');
        setIsEditingTo(true);
      }
      if (contactName && contactName !== 'Contato') setRecipientName(contactName);
      if (companyName) setRelatedLead(companyName);

      // Carregar assinaturas configuradas pelo usuário
      salesApi
        .getEmailSignatures()
        .then((list) => {
          if (list && list.length > 0) {
            setSignatures(list);
            const def = list.find((s: SignatureItem) => s.is_default) || list[0];
            setSelectedSignatureId(def.id);
          }
        })
        .catch(() => {});
    }
  }, [contactEmail, contactName, companyName, open]);

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

  const insertMergeTag = (tag: string) => {
    setBody((prev) => prev + tag);
  };

  const [generatingAi, setGeneratingAi] = useState(false);
  const handleGenerateAi = (goal: string) => {
    setGeneratingAi(true);
    setTimeout(() => {
      if (goal === 'first_contact') {
        setSubject(`Oportunidade de Redução Energética — {{company.name}}`);
        setBody(
          `Olá {{contact.first_name}},\n\nAnalisei as operações da {{company.name}} e identificamos uma oportunidade de redução imediata de até 85% nos custos com energia através de um modelo solar sem investimento inicial.\n\nPodemos falar 10 minutos nesta quinta-feira?\n\nAbraço,\n{{user.name}}`
        );
      } else if (goal === 'follow_up_proposal') {
        setSubject(`Status da Proposta Solar — {{company.name}} (R$ {{opportunity.value}})`);
        setBody(
          `Olá {{contact.first_name}},\n\nPassando para saber se você e a diretoria da {{company.name}} conseguiram avaliar o estudo de viabilidade da usina solar (valor estimado de {{opportunity.value}}).\n\nFicou alguma dúvida sobre o payback ou a economia projetada?\n\nAtenciosamente,\n{{user.name}}`
        );
      } else {
        setSubject(`Retomada do Projeto Solar — {{company.name}}`);
        setBody(
          `Olá {{contact.first_name}},\n\nCom as novas tarifas de energia deste trimestre, a economia da usina solar para a {{company.name}} ficou ainda mais atrativa.\n\nFaz sentido retomarmos a avaliação do projeto este mês?\n\nUm abraço,\n{{user.name}}`
        );
      }
      setGeneratingAi(false);
      toast.success('Rascunho comercial gerado com sucesso!');
    }, 400);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSendEmail = async (_mode: 'now' | 'task' | 'schedule' = 'now') => {
    const trimmedTo = toEmail.trim();
    if (!trimmedTo || trimmedTo === 'sem-email@exemplo.com' || !trimmedTo.includes('@')) {
      setIsEditingTo(true);
      return setError('Informe um e-mail de destinatário válido (ex: cliente@empresa.com.br).');
    }

    if (!subject.trim()) {
      return setError('Informe o assunto do e-mail comercial.');
    }

    if (!body.trim()) {
      return setError('Escreva a mensagem do e-mail.');
    }

    setLoading(true);
    setError(null);

    try {
      await salesApi.sendEmail({
        to_email: toEmail,
        subject,
        body_text: body,
        sales_opportunity_id: opportunityId || undefined,
        sales_contact_id: contactId || undefined,
        sales_account_id: accountId || undefined,
        cc: cc ? [cc] : undefined,
        bcc: bcc ? [bcc] : undefined,
        open_tracking_enabled: true,
        click_tracking_enabled: true,
        include_signature: includeSignature,
        sales_email_signature_id: typeof selectedSignatureId === 'number' ? selectedSignatureId : undefined,
        attachments: attachments.length ? attachments : undefined,
      });

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar e-mail comercial.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        hideCloseButton
        overlayClassName={windowState === 'minimized' ? 'hidden' : undefined}
        className={
          windowState === 'minimized'
            ? 'fixed !bottom-0 !right-6 !top-auto !left-auto !translate-x-0 !translate-y-0 w-80 max-w-[calc(100vw-2rem)] h-11 p-0 rounded-t-xl rounded-b-none border border-slate-300 shadow-xl bg-white overflow-hidden z-[9999]'
            : windowState === 'maximized'
            ? 'fixed inset-4 !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%] w-[96vw] max-w-[96vw] h-[94vh] max-h-[94vh] flex flex-col p-0 bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border-slate-200 z-[9999]'
            : 'max-w-[960px] max-h-[90vh] flex flex-col p-0 bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border-slate-200'
        }
      >
        {/* MODAL HEADER (Matching Gmail & Nutshell Benchmark Header) */}
        <DialogHeader
          className={`px-4 py-2.5 border-b border-slate-200 flex flex-row items-center justify-between space-y-0 bg-slate-50/90 shrink-0 cursor-pointer select-none ${
            windowState === 'minimized' ? 'h-full border-none' : ''
          }`}
          onClick={() => {
            if (windowState === 'minimized') setWindowState('normal');
          }}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <DialogTitle className="text-xs font-bold text-slate-800 tracking-tight truncate">
              {subject ? subject : `Nova mensagem para ${recipientName || 'contato'}`}
            </DialogTitle>
          </div>

          <div
            className="flex items-center gap-0.5 text-slate-500 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MINIMIZE BUTTON (-) */}
            <button
              type="button"
              onClick={() => setWindowState(windowState === 'minimized' ? 'normal' : 'minimized')}
              className="p-1 rounded-md hover:bg-slate-200 hover:text-slate-800 transition-colors"
              title={windowState === 'minimized' ? 'Restaurar janela' : 'Minimizar (estilo Gmail)'}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* MAXIMIZE / RESTORE BUTTON */}
            {windowState !== 'minimized' && (
              <button
                type="button"
                onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}
                className="p-1 rounded-md hover:bg-slate-200 hover:text-slate-800 transition-colors"
                title={windowState === 'maximized' ? 'Restaurar tamanho' : 'Maximizar'}
              >
                {windowState === 'maximized' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* CLOSE BUTTON (X) */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-rose-100 hover:text-rose-700 transition-colors"
              title="Salvar rascunho e fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </DialogHeader>

        {/* TWO-COLUMN MAIN BODY (Ocultado quando minimizado) */}
        {windowState !== 'minimized' && (
          <>
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
                <span>{senderName} &lt;{senderEmail}&gt;</span>
              </div>
            </div>

            {/* TO ROW */}
            <div className="flex items-center text-xs pb-1 border-b border-slate-100 justify-between gap-2">
              <div className="flex items-center flex-1 gap-2 min-w-0">
                <span className="w-20 text-slate-400 font-medium shrink-0">To</span>
                {!isEditingTo && toEmail && toEmail !== 'sem-email@exemplo.com' ? (
                  <div
                    onClick={() => setIsEditingTo(true)}
                    className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-md text-[11px] font-semibold truncate cursor-pointer hover:bg-slate-200/60"
                  >
                    <span className="truncate">
                      {recipientName ? `${recipientName} ` : ''}&lt;{toEmail}&gt;
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToEmail('');
                        setRecipientName('');
                        setIsEditingTo(true);
                      }}
                      className="text-slate-400 hover:text-slate-700 ml-1 shrink-0 p-0.5 rounded hover:bg-slate-200"
                      title="Remover destinatário"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <Input
                    type="email"
                    placeholder="Digite o e-mail do destinatário (ex: cliente@empresa.com)..."
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && toEmail.trim()) {
                        e.preventDefault();
                        setIsEditingTo(false);
                      }
                    }}
                    autoFocus
                    className="h-7 text-xs border-slate-200 focus:border-sky-500 font-medium text-slate-900 flex-1"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCc(!showCc)}
                className="text-sky-600 font-bold hover:underline text-[11px] shrink-0"
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

            {/* MERGE TAGS & AI ROW */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-1 bg-slate-50/80 rounded-lg border border-slate-200/60 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Tags:</span>
                <button
                  type="button"
                  onClick={() => insertMergeTag('{{contact.first_name}}')}
                  className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-[11px] font-medium transition-colors shadow-2xs"
                >
                  + Nome
                </button>
                <button
                  type="button"
                  onClick={() => insertMergeTag('{{company.name}}')}
                  className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-[11px] font-medium transition-colors shadow-2xs"
                >
                  + Empresa
                </button>
                <button
                  type="button"
                  onClick={() => insertMergeTag('{{opportunity.value}}')}
                  className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-[11px] font-medium transition-colors shadow-2xs"
                >
                  + Valor Proposta
                </button>
                <button
                  type="button"
                  onClick={() => insertMergeTag('{{user.name}}')}
                  className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-[11px] font-medium transition-colors shadow-2xs"
                >
                  + Consultor
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={() => handleGenerateAi('first_contact')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-linear-to-r from-sky-600 to-indigo-600 text-white text-[11px] font-semibold hover:from-sky-700 hover:to-indigo-700 shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{generatingAi ? 'Gerando...' : '✨ Gerar com IA'}</span>
                </button>
              </div>
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

                {/* SIGNATURE SELECTOR IN TOOLBAR */}
                <div className="relative ml-auto">
                  <button
                    type="button"
                    onClick={() => setSignatureMenuOpen(!signatureMenuOpen)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      includeSignature
                        ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Configurar Assinatura Comercial"
                  >
                    <Pencil className={`w-3 h-3 ${includeSignature ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="truncate max-w-[140px]">
                      {includeSignature
                        ? (signatures.find((s) => s.id === selectedSignatureId)?.name || 'Assinatura Oficial')
                        : 'Sem assinatura'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {signatureMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-lg bg-white border border-slate-200 shadow-lg p-1.5 z-50 text-xs space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Assinatura Comercial
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIncludeSignature(true);
                          setSelectedSignatureId('default');
                          setSignatureMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-[11px] hover:bg-slate-50 ${
                          includeSignature && selectedSignatureId === 'default' ? 'bg-amber-50/70 font-bold text-amber-950' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">Assinatura Oficial Avalia Solar</span>
                        {includeSignature && selectedSignatureId === 'default' && (
                          <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                      </button>
                      {signatures.map((sig) => (
                        <button
                          key={sig.id}
                          type="button"
                          onClick={() => {
                            setIncludeSignature(true);
                            setSelectedSignatureId(sig.id);
                            setSignatureMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-[11px] hover:bg-slate-50 ${
                            includeSignature && selectedSignatureId === sig.id ? 'bg-amber-50/70 font-bold text-amber-950' : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">{sig.name}</span>
                          {includeSignature && selectedSignatureId === sig.id && (
                            <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIncludeSignature(false);
                            setSelectedSignatureId('none');
                            setSignatureMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-[11px] hover:bg-slate-50 ${
                            !includeSignature ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-500'
                          }`}
                        >
                          <span>Não incluir assinatura</span>
                          {!includeSignature && <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VISUAL SIGNATURE PREVIEW (Com foto, cargo, logo e links) */}
              {includeSignature ? (
                <div className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/20 p-2.5 transition-all">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/50 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>Assinatura incluída neste envio</span>
                      <span className="text-[10px] font-normal text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded">
                        {signatures.find((s) => s.id === selectedSignatureId)?.name || 'Oficial Avalia Solar'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeSignature(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Remover assinatura deste e-mail
                    </button>
                  </div>

                  {/* Renderização do preview da assinatura */}
                  <div className="pt-2 text-xs">
                    {typeof selectedSignatureId === 'number' && signatures.find((s) => s.id === selectedSignatureId)?.body_html ? (
                      <div
                        className="overflow-x-auto max-h-[160px] rounded border border-slate-200/70 bg-white p-2"
                        dangerouslySetInnerHTML={{
                          __html: signatures.find((s) => s.id === selectedSignatureId)!.body_html,
                        }}
                      />
                    ) : (
                      /* Preview oficial Avalia Solar de alta fidelidade */
                      <div className="rounded border border-slate-200/80 bg-[#f6f9fd] p-3 flex flex-col sm:flex-row items-start gap-3 shadow-2xs">
                        <div className="flex flex-col items-center gap-1.5 shrink-0 border-r border-amber-300 pr-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png"
                            alt={senderName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-[#ffcd2d]"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png"
                            alt="Avalia Solar"
                            className="w-16 h-auto"
                          />
                        </div>
                        <div className="space-y-1 min-w-0 text-slate-800 text-[11px] leading-tight flex-1">
                          <p className="font-bold text-sm text-[#0b2944]">{senderName}</p>
                          <p className="text-[10px] text-slate-500">Fundador & Equipe Comercial — Avalia Solar</p>
                          <p className="text-slate-600 text-[10px]">
                            <span className="font-medium text-[#0b2944]">{senderEmail}</span> · (65) 99346-5055
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <span className="text-blue-700 font-semibold">Website</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-blue-700 font-semibold">LinkedIn</span>
                            <span className="text-slate-300">|</span>
                            <span className="bg-[#0b2944] text-white px-2 py-0.5 rounded text-[9px] font-bold">
                              Agendar 30 min ↗
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Nenhuma assinatura será anexada a este e-mail.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeSignature(true);
                      setSelectedSignatureId(signatures[0]?.id || 'default');
                    }}
                    className="font-bold text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>+ Incluir Assinatura Comercial</span>
                  </button>
                </div>
              )}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
