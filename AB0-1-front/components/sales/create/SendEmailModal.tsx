'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Paperclip,
  Pencil,
  RotateCw,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { salesApi } from '@/lib/api/sales/client';
import { listEmailTemplates, previewEmailTemplate } from '@/lib/api/sales/emailTemplates';
import type { EmailTemplate } from '@/components/sales/campaigns/templates/types';
import { useAuth } from '@/contexts/AuthContext';
import AIWritingPanel from '@/components/sales/ai/writing/AIWritingPanel';
import { buildResponsiveSignatureHtml } from '@/app/dashboard/sales/settings/email/signature-utils';
import CRMRichTextEditor, { CRMRichTextEditorRef } from './CRMRichTextEditor';
import MultiEmailInput from './MultiEmailInput';

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

  // Email Fields (Suporte a múltiplos destinatários em chips)
  const [toEmails, setToEmails] = useState<string[]>(
    contactEmail && contactEmail !== 'sem-email@exemplo.com' && contactEmail.includes('@')
      ? [contactEmail.trim().toLowerCase()]
      : []
  );
  const [recipientName, setRecipientName] = useState(contactName || 'Contato');
  const [showCc, setShowCc] = useState(false);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [relatedLead, setRelatedLead] = useState(companyName || 'Projeto Solar B2B');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [body, setBody] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [previewSignatureOpen, setPreviewSignatureOpen] = useState(false);
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const editorRef = useRef<CRMRichTextEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Canonical Persisted Templates Catalog
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sendOption, setSendOption] = useState<'now' | 'task' | 'schedule'>('now');
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [windowState, setWindowState] = useState<'normal' | 'minimized' | 'maximized'>('normal');

  // Assinatura de E-mail Corporativa
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | 'default' | 'none'>(
    'default'
  );
  const [signatureMenuOpen, setSignatureMenuOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const isValid =
        contactEmail && contactEmail !== 'sem-email@exemplo.com' && contactEmail.includes('@');
      if (isValid) {
        setToEmails([contactEmail.trim().toLowerCase()]);
      } else {
        setToEmails([]);
      }
      if (contactName && contactName !== 'Contato') setRecipientName(contactName);
      if (companyName) setRelatedLead(companyName);

      // Carregar templates canônicos persistidos da empresa
      setLoadingTemplates(true);
      listEmailTemplates({ status: 'active', per_page: 50 })
        .then((res) => {
          setTemplates(res.templates || []);
        })
        .catch(() => {
          setTemplates([]);
        })
        .finally(() => {
          setLoadingTemplates(false);
        });

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

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      (t.subject_template || '').toLowerCase().includes(searchTemplate.toLowerCase())
  );

  const resolveMergeTags = useCallback(
    (text: string): string => {
      if (!text) return '';
      const rName = recipientName || contactName || 'Cliente';
      const rFirstName = rName.split(' ')[0] || rName;
      const cName = companyName || relatedLead || 'Sua Empresa';
      const sName = senderName || 'Consultor';
      const sFirstName = sName.split(' ')[0] || sName;

      return text
        .replace(/\{\{\s*(person|contact)\.first_name\s*\}\}/gi, rFirstName)
        .replace(/\{\{\s*(person|contact)\.name\s*\}\}/gi, rName)
        .replace(/\{\{\s*(company|account|lead)\.name\s*\}\}/gi, cName)
        .replace(/\{\{\s*(owner|user|sender)\.first_name\s*\}\}/gi, sFirstName)
        .replace(/\{\{\s*(owner|user|sender)\.name\s*\}\}/gi, sName)
        .replace(/\{\{\s*(owner|user|sender)\.email\s*\}\}/gi, senderEmail)
        .replace(/\{\{\s*opportunity\.value\s*\}\}/gi, 'R$ 0,00');
    },
    [recipientName, contactName, companyName, relatedLead, senderName, senderEmail]
  );

  const textToHtml = (text: string) => {
    if (!text) return '';
    return text
      .split('\n\n')
      .map((p) => `<p style="margin: 0 0 12px 0;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  const htmlToPlainText = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const parseBodyJson = (raw: unknown): Record<string, any> | null => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw as Record<string, any>;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  };

  const convertTemplateToHtml = useCallback(
    (tmpl: EmailTemplate): string => {
      let rawHtml = '';
      const parsedJson = parseBodyJson(tmpl.body_json);

      if (tmpl.body_html && tmpl.body_html.trim() && tmpl.body_html !== '<p><br></p>') {
        rawHtml = tmpl.body_html;
      } else if (parsedJson && Array.isArray(parsedJson.blocks) && parsedJson.blocks.length > 0) {
        rawHtml = parsedJson.blocks
          .map((b: any) => {
            const type = b.type || 'text';
            const props = b.props || {};

            switch (type) {
              case 'heading': {
                const lvl = Math.min(Math.max(Number(props.level) || 2, 1), 3);
                const txt = props.text || b.text || '';
                return `<h${lvl} style="margin: 14px 0 8px 0; font-weight: bold; color: #0f172a;">${txt}</h${lvl}>`;
              }
              case 'text': {
                let content = props.html || props.text || b.html || b.text || props.content || '';
                if (!content) return '';
                if (!content.trim().startsWith('<')) {
                  content = `<p style="margin: 0 0 12px 0; line-height: 1.6;">${content.replace(/\n/g, '<br/>')}</p>`;
                }
                return content;
              }
              case 'button': {
                const label = props.label || b.label || 'Clique aqui';
                const url = props.url || b.url || '#';
                const align = props.align || 'left';
                return `<div style="text-align: ${align}; margin: 16px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="background-color: #0284c7; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">${label}</a></div>`;
              }
              case 'image': {
                const src = props.url || props.src || props.public_url || b.src || '';
                const alt = props.alt || 'Imagem';
                const align = props.align || 'center';
                return src
                  ? `<div style="text-align: ${align}; margin: 14px 0;"><img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 6px;" /></div>`
                  : '';
              }
              case 'divider':
                return '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 18px 0;" />';
              case 'spacer': {
                const h = Number(props.height) || 20;
                return `<div style="height: ${h}px;"></div>`;
              }
              case 'html':
                return props.code || props.html || b.code || b.html || '';
              default:
                return props.text || props.html || '';
            }
          })
          .filter(Boolean)
          .join('\n');
      } else if (parsedJson && parsedJson.text) {
        rawHtml = `<p style="margin: 0 0 12px 0; line-height: 1.6;">${String(parsedJson.text).replace(/\n/g, '<br/>')}</p>`;
      }

      if (!rawHtml.trim()) {
        const rName = recipientName || contactName;
        const rFirstName = rName ? rName.split(' ')[0] : 'Cliente';
        rawHtml = `<p>Olá ${rFirstName},</p><p><br/></p>`;
      }

      return resolveMergeTags(rawHtml);
    },
    [recipientName, contactName, resolveMergeTags]
  );

  const applyTemplate = (tmpl: EmailTemplate) => {
    setSelectedTemplateId(tmpl.id);
    const resolvedSub = resolveMergeTags(tmpl.subject_template || '');
    const resolvedPre = resolveMergeTags(tmpl.preheader || '');
    const resolvedHtml = convertTemplateToHtml(tmpl);
    const resolvedText = htmlToPlainText(resolvedHtml);

    setSubject(resolvedSub);
    setPreheader(resolvedPre);
    setBody(resolvedText);
    setBodyHtml(resolvedHtml);

    // Atualização imperativa imediata do editor WYSIWYG
    if (editorRef.current) {
      editorRef.current.setHtml(resolvedHtml);
    }

    // Busca prévia no servidor em background para enriquecer dados se disponível
    if (tmpl.id) {
      const contextIds: Record<string, number> = {};
      if (contactId) contextIds.contact_id = contactId;
      if (accountId) contextIds.account_id = accountId;
      if (opportunityId) contextIds.opportunity_id = opportunityId;

      previewEmailTemplate(tmpl.id, {
        context_ids: Object.keys(contextIds).length > 0 ? contextIds : undefined,
      })
        .then((res) => {
          if (res?.preview?.body_html) {
            const serverHtml = res.preview.body_html;
            const serverText = res.preview.body_text || htmlToPlainText(serverHtml);
            setBodyHtml((current) => {
              if (current === resolvedHtml || !current) {
                editorRef.current?.setHtml(serverHtml);
                setBody(serverText);
                return serverHtml;
              }
              return current;
            });
          }
        })
        .catch(() => {
          // Mantém o HTML renderizado pelo cliente com resiliência
        });
    }

    toast.success(`Template "${tmpl.name}" carregado.`);
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplateId(null);
    setSubject('');
    setPreheader('');
    setBody('');
    setBodyHtml('');
    editorRef.current?.clear();
  };

  const insertMergeTag = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(tag);
    } else {
      setBody((prev) => prev + tag);
    }
  };

  const handleApplyAiSuggestion = (next: {
    subject?: string;
    preheader?: string;
    body?: string;
  }) => {
    if (next.subject !== undefined) setSubject(next.subject);
    if (next.preheader !== undefined) setPreheader(next.preheader);
    if (next.body !== undefined) {
      const isHtml = /<[a-z][\s\S]*>/i.test(next.body);
      const htmlValue = isHtml ? next.body : textToHtml(next.body);
      const plainValue = isHtml ? htmlToPlainText(next.body) : next.body;
      setBodyHtml(htmlValue);
      setBody(plainValue);
      if (editorRef.current) {
        editorRef.current.setHtml(htmlValue);
      }
    }
    toast.success('Sugestão da IA inserida no rascunho para sua revisão.');
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSendEmail = async (_mode: 'now' | 'task' | 'schedule' = 'now') => {
    if (toEmails.length === 0) {
      return setError('Informe ao menos um e-mail de destinatário válido.');
    }

    if (!subject.trim()) {
      return setError('Informe o assunto do e-mail comercial.');
    }

    const currentText = body || editorRef.current?.getText() || '';
    const currentHtml = bodyHtml || editorRef.current?.getHtml() || undefined;

    if (
      !currentText.trim() &&
      (!currentHtml || currentHtml === '<p><br></p>' || currentHtml === '')
    ) {
      return setError('Escreva a mensagem do e-mail.');
    }

    setLoading(true);
    setError(null);

    const normalizedContactEmail = contactEmail ? contactEmail.trim().toLowerCase() : '';
    const isOriginalContactEmail =
      Boolean(normalizedContactEmail) &&
      toEmails.length > 0 &&
      toEmails[0].trim().toLowerCase() === normalizedContactEmail;

    try {
      await salesApi.sendEmail({
        to_email: toEmails[0],
        to_emails: toEmails,
        subject,
        body_text: currentText,
        body_html: currentHtml,
        sales_opportunity_id: opportunityId || undefined,
        sales_contact_id: isOriginalContactEmail ? (contactId || undefined) : undefined,
        sales_account_id: accountId || undefined,
        cc: ccEmails.length ? ccEmails : undefined,
        bcc: bccEmails.length ? bccEmails : undefined,
        open_tracking_enabled: true,
        click_tracking_enabled: true,
        include_signature: includeSignature,
        sales_email_signature_id:
          typeof selectedSignatureId === 'number' ? selectedSignatureId : undefined,
        attachments: attachments.length ? attachments : undefined,
      });

      setSuccessMsg('E-mail comercial disparado com sucesso!');
      toast.success('E-mail enviado com sucesso!');

      setTimeout(() => {
        onClose();
        setLoading(false);
        setSuccessMsg(null);
        setSubject('');
        setPreheader('');
        setBody('');
        setBodyHtml('');
        editorRef.current?.clear();
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
            ? 'fixed inset-3 !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%] w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] flex flex-col p-0 bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border-slate-200 z-[9999]'
            : 'max-w-[1060px] w-[94vw] h-[86vh] max-h-[880px] flex flex-col p-0 bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border-slate-200'
        }
      >
        {/* MODAL HEADER */}
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
            <button
              type="button"
              onClick={() => setWindowState(windowState === 'minimized' ? 'normal' : 'minimized')}
              className="p-1 rounded-md hover:bg-slate-200 hover:text-slate-800 transition-colors"
              title={windowState === 'minimized' ? 'Restaurar janela' : 'Minimizar'}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

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

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-rose-100 hover:text-rose-700 transition-colors"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </DialogHeader>

        {windowState !== 'minimized' && (
          <>
            <div className="grid grid-cols-12 flex-1 min-h-[480px] max-h-[75vh] overflow-hidden">
              {/* LEFT SIDEBAR (Canonical Persisted Template Library) */}
              <div className="col-span-4 bg-slate-50/80 border-r border-slate-200 p-4 space-y-3 flex flex-col">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    placeholder="Buscar na biblioteca de templates..."
                    value={searchTemplate}
                    onChange={(e) => setSearchTemplate(e.target.value)}
                    className="h-9 pl-8 text-xs border-slate-200 rounded-lg bg-white focus:bg-white"
                  />
                </div>

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
                  <span>Escrever do zero</span>
                </button>

                <div className="flex-1 overflow-y-auto space-y-1.5 pt-1">
                  {loadingTemplates ? (
                    <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Carregando templates...</span>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="py-10 text-center text-xs space-y-1 text-slate-500">
                      <p className="font-semibold text-slate-600">Nenhum template encontrado</p>
                      {searchTemplate && (
                        <button
                          type="button"
                          onClick={() => setSearchTemplate('')}
                          className="text-sky-600 font-semibold hover:underline"
                        >
                          Limpar filtro
                        </button>
                      )}
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
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {tmpl.subject_template}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT MAIN PANEL */}
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
                    <span>
                      {senderName} &lt;{senderEmail}&gt;
                    </span>
                  </div>
                </div>

                {/* TO ROW (Multi-Email Chips) */}
                <div className="flex items-start text-xs pb-1 border-b border-slate-100 justify-between gap-2">
                  <div className="flex items-start flex-1 gap-2 min-w-0 pt-0.5">
                    <span className="w-20 text-slate-400 font-medium shrink-0 pt-1">To</span>
                    <MultiEmailInput
                      emails={toEmails}
                      onChange={setToEmails}
                      placeholder="Digite os e-mails e pressione Enter ou vírgula..."
                      autoFocus={toEmails.length === 0}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCc(!showCc)}
                    className="text-sky-600 font-bold hover:underline text-[11px] shrink-0 pt-1"
                  >
                    {showCc ? 'Ocultar Cc/Bcc' : 'Cc / Bcc'}
                  </button>
                </div>

                {/* CC / BCC ROWS (Multi-Email Chips) */}
                {showCc && (
                  <div className="space-y-2 pb-1 border-b border-slate-100 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-20 text-slate-400 font-medium shrink-0 pt-1">Cc</span>
                      <MultiEmailInput
                        emails={ccEmails}
                        onChange={setCcEmails}
                        placeholder="copia@empresa.com (Enter ou vírgula)..."
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-20 text-slate-400 font-medium shrink-0 pt-1">Bcc</span>
                      <MultiEmailInput
                        emails={bccEmails}
                        onChange={setBccEmails}
                        placeholder="copia-oculta@empresa.com (Enter ou vírgula)..."
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

                {/* MERGE TAGS & REAL AI WRITING STUDIO TOGGLE */}
                <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2 bg-slate-50/80 rounded-lg border border-slate-200/60 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">Tags:</span>
                    <button
                      type="button"
                      onClick={() => insertMergeTag('{{person.first_name}}')}
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
                      onClick={() => insertMergeTag('{{owner.name}}')}
                      className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-[11px] font-medium transition-colors shadow-2xs"
                    >
                      + Consultor
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAiStudioOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[11px] font-semibold hover:from-sky-700 hover:to-indigo-700 shadow-xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>
                        {aiStudioOpen ? 'Ocultar AI Studio' : '✨ AI Writing Studio (OpenRouter)'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* REAL OPENROUTER AI WRITING STUDIO PANEL */}
                {aiStudioOpen && (
                  <AIWritingPanel
                    contactId={contactId}
                    contactLabel={recipientName}
                    accountId={accountId}
                    accountLabel={companyName}
                    opportunityId={opportunityId}
                    currentSubject={subject}
                    currentPreheader={preheader}
                    currentBody={bodyHtml || body}
                    onApplyToDraft={handleApplyAiSuggestion}
                  />
                )}

                {/* RICH TEXT EDITOR */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-1">
                  <CRMRichTextEditor
                    ref={editorRef}
                    valueHtml={bodyHtml}
                    onChangeHtml={setBodyHtml}
                    onChangeText={setBody}
                    placeholder="Escreva a mensagem do e-mail..."
                    minHeight="320px"
                    className="flex-1 min-h-0"
                    onAttachFile={() => fileInputRef.current?.click()}
                    onAttachImage={() => imageInputRef.current?.click()}
                    attachmentsCount={attachments.length}
                    extraToolbarRight={
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSignatureMenuOpen(!signatureMenuOpen)}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                            includeSignature
                              ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                          title="Configurar Assinatura Comercial"
                        >
                          <Pencil
                            className={`w-3 h-3 ${
                              includeSignature ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate max-w-[130px]">
                            {includeSignature
                              ? signatures.find((s) => s.id === selectedSignatureId)?.name ||
                                'Assinatura Oficial'
                              : 'Sem assinatura'}
                          </span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>

                        {signatureMenuOpen && (
                          <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-lg bg-white border border-slate-200 shadow-xl p-1.5 z-[100] text-xs space-y-1">
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
                                includeSignature && selectedSignatureId === 'default'
                                  ? 'bg-amber-50/70 font-bold text-amber-950'
                                  : 'text-slate-700'
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
                                  includeSignature && selectedSignatureId === sig.id
                                    ? 'bg-amber-50/70 font-bold text-amber-950'
                                    : 'text-slate-700'
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
                                  !includeSignature
                                    ? 'font-bold text-slate-900 bg-slate-50'
                                    : 'text-slate-500'
                                }`}
                              >
                                <span>Não incluir assinatura</span>
                                {!includeSignature && (
                                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileAttach}
                    className="hidden"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileAttach}
                    className="hidden"
                  />

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px]"
                        >
                          <Paperclip className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="hover:text-rose-600 ml-1 p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ASSINATURA COMPACTA */}
                  <div className="shrink-0 mt-2 space-y-2">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            includeSignature ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-[11px] font-medium text-slate-600">
                          Assinatura no envio:
                        </span>
                        <span className="text-[11px] font-bold text-amber-950">
                          {includeSignature
                            ? signatures.find((s) => s.id === selectedSignatureId)?.name ||
                              'Oficial Avalia Solar (Felipe — Fundador)'
                            : 'Desativada'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {includeSignature && (
                          <button
                            type="button"
                            onClick={() => setPreviewSignatureOpen(!previewSignatureOpen)}
                            className="text-[11px] font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            {previewSignatureOpen ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            <span>
                              {previewSignatureOpen ? 'Ocultar preview' : 'Ver preview visual'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIncludeSignature(!includeSignature)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                        >
                          {includeSignature ? 'Desativar' : 'Ativar assinatura'}
                        </button>
                      </div>
                    </div>

                    {includeSignature && previewSignatureOpen && (
                      <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                        {typeof selectedSignatureId === 'number' &&
                        signatures.find((s) => s.id === selectedSignatureId)?.body_html ? (
                          <div
                            className="overflow-x-auto max-h-[160px] rounded border border-slate-200/70 bg-white p-2"
                            dangerouslySetInnerHTML={{
                              __html: signatures.find((s) => s.id === selectedSignatureId)!
                                .body_html,
                            }}
                          />
                        ) : (
                          <div
                            className="overflow-x-auto max-h-[180px] rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs text-left"
                            dangerouslySetInnerHTML={{
                              __html: buildResponsiveSignatureHtml({
                                fullName: senderName || 'Felipe Henrique',
                                roleTitle: 'Fundador do Avalia Solar',
                                email: senderEmail || 'felipe@avaliasolar.com.br',
                                phone: '(65) 99346-5055',
                              }),
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER BAR */}
            <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-white shrink-0 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-sky-500"
                />
                <span>Save as template after sending</span>
              </label>

              <div className="relative flex items-center">
                <Button
                  type="button"
                  onClick={() => handleSendEmail(sendOption)}
                  disabled={loading}
                  className="h-9 px-4 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-l-lg rounded-r-none shadow-2xs flex items-center gap-1.5"
                >
                  {loading ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {sendOption === 'now'
                      ? 'Send'
                      : sendOption === 'task'
                      ? 'Send & complete task'
                      : 'Schedule send'}
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSendMenuOpen(!sendMenuOpen)}
                  disabled={loading}
                  className="h-9 px-2 bg-sky-500 hover:bg-sky-600 text-white border-l border-sky-400 rounded-r-lg flex items-center justify-center"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

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
