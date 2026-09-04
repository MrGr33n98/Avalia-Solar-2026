'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Mail, Paperclip, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';
import { CRMFormField } from '@/components/sales/ui/CRMForm';
import { salesApi } from '@/lib/api/sales/client';
import { toast } from 'sonner';

interface EmailTemplate { id: number; name: string; subject_template?: string; body_html?: string }

interface EmailComposerModalProps {
  open: boolean;
  onClose: () => void;
  defaultToEmail?: string;
  defaultContactId?: number;
  defaultAccountId?: number;
  defaultOpportunityId?: number;
  defaultSubject?: string;
  onSuccess?: () => void;
}

export default function EmailComposerModal({
  open,
  onClose,
  defaultToEmail = '',
  defaultContactId,
  defaultAccountId,
  defaultOpportunityId,
  defaultSubject = '',
  onSuccess,
}: EmailComposerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toEmail, setToEmail] = useState(defaultToEmail);
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyText, setBodyText] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => { if (open) salesApi.getEmailTemplates().then(setTemplates).catch(() => setTemplates([])); }, [open]);

  const handleInsertVariable = (variable: string) => {
    setBodyText((prev) => `${prev} {{${variable}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) return setError('E-mail do destinatário é obrigatório.');
    if (!subject.trim()) return setError('Assunto da mensagem é obrigatório.');
    if (!bodyText.trim())
      return setError('Corpo do e-mail não pode ficar em branco (Política Fail-Closed).');

    setLoading(true);
    setError(null);

    try {
      await salesApi.sendEmail({
        to_email: toEmail,
        subject: subject,
        body_text: bodyText,
        body_html: `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
        sales_contact_id: defaultContactId,
        sales_account_id: defaultAccountId,
        sales_opportunity_id: defaultOpportunityId,
        cc: ccEmail
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        bcc: bccEmail
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        open_tracking_enabled: trackOpens,
        click_tracking_enabled: trackClicks,
        attachments,
      });

      toast.success('E-mail enfileirado. Aguardando confirmação do provedor.');
      setTimeout(() => {
        onClose();
        setLoading(false);
        setBodyText('');
        setSubject('');
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail comercial.');
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Novo E-mail Comercial"
      description="Enviar mensagem estruturada rastreável via plataforma de mensageria CRM."
      size="lg"
      heroIcon={<Mail className="w-8 h-8 text-indigo-700" />}
      showCustomizeFields={false}
      footer={
        <div className="w-full flex items-center justify-between font-sans">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={trackOpens}
                onChange={(e) => setTrackOpens(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              Track Abertura
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={trackClicks}
                onChange={(e) => setTrackClicks(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              Track Cliques
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-email-form"
              disabled={loading}
              className="h-9 px-6 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-md shadow-md flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}{' '}
              Enviar Mensagem
            </Button>
          </div>
        </div>
      }
    >
      <form id="create-email-form" onSubmit={handleSubmit} className="space-y-3 font-sans">
        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Recipients */}
        <div className="space-y-4">
          <CRMFormField label="Para (Destinatário)" required>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="destinatario@cliente.com.br"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-md px-4 flex-1"
                required
              />
              {!showCc && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCc(true)}
                  className="h-9 text-xs font-semibold text-slate-600 border-slate-200 rounded-md px-3"
                >
                  + Cc
                </Button>
              )}
            </div>
          </CRMFormField>

          {showCc && (
            <CRMFormField label="Cc (Cópia)">
              <Input
                type="email"
                placeholder="copia@empresa.com.br"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-md px-4"
              />
              {!showBcc && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowBcc(true)}
                  className="mt-1 h-7 text-[11px]"
                >
                  + Bcc
                </Button>
              )}
            </CRMFormField>
          )}

          {showBcc && (
            <CRMFormField label="Bcc (Cópia oculta)">
              <Input
                type="email"
                placeholder="oculta@empresa.com.br"
                value={bccEmail}
                onChange={(e) => setBccEmail(e.target.value)}
                className="h-9 text-xs border-slate-300 rounded-md px-4"
              />
            </CRMFormField>
          )}

          <CRMFormField label="Anexos">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-600 hover:bg-slate-50">
              <Paperclip className="h-4 w-4" />
              <span>
                {attachments.length
                  ? `${attachments.length} arquivo(s) selecionado(s)`
                  : 'Adicionar arquivos (máx. 10MB cada)'}
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setAttachments(Array.from(e.target.files ?? []).slice(0, 10))}
              />
            </label>
          </CRMFormField>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
            <div className="mb-1 text-[11px] font-semibold text-slate-600">Templates salvos</div>
            {templates.length === 0 ? <p className="text-[11px] text-slate-400">Nenhum template disponível.</p> : <div className="flex flex-wrap gap-1">{templates.map((template) => <button key={template.id} type="button" onClick={() => { setSubject(template.subject_template || ""); setBodyText(template.body_html || ""); }} className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">{template.name}</button>)}</div>}
          </div>

          {/* Subject */}
          <CRMFormField label="Assunto" required>
            <Input
              placeholder="Ex: Proposta Comercial de Usina Solar 100kWp"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs border-slate-300 rounded-md px-4 font-semibold text-slate-900"
              required
            />
          </CRMFormField>

          {/* Variable Helper Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Variáveis Dinâmicas:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsertVariable('person.first_name')}
              className="h-7 text-[11px] px-2.5 bg-slate-50 border-slate-200 text-slate-700 rounded-lg"
            >
              Primeiro Nome
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsertVariable('company.name')}
              className="h-7 text-[11px] px-2.5 bg-slate-50 border-slate-200 text-slate-700 rounded-lg"
            >
              Nome Empresa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsertVariable('lead.value')}
              className="h-7 text-[11px] px-2.5 bg-slate-50 border-slate-200 text-slate-700 rounded-lg"
            >
              Valor Proposta
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsertVariable('owner.name')}
              className="h-7 text-[11px] px-2.5 bg-slate-50 border-slate-200 text-slate-700 rounded-lg"
            >
              Vendedor
            </Button>
          </div>

          {/* Body Editor */}
          <CRMFormField label="Corpo da Mensagem" required>
            <Textarea
              placeholder="Escreva sua mensagem comercial aqui..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="text-xs border-slate-300 rounded-md p-4 min-h-[180px] resize-y font-sans leading-relaxed focus:border-indigo-600"
              required
            />
          </CRMFormField>
        </div>
      </form>
    </CRMModal>
  );
}
