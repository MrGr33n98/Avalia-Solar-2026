'use client';

import { useState } from 'react';
import { Mail, Send, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type EmailComposerModalProps = {
  accountId: number;
  contactId: number;
  contactName?: string;
  contactEmail?: string;
  companyName?: string;
  opportunityId?: number;
  onSuccess?: () => void;
};

const TEMPLATES = [
  {
    id: 'first_contact',
    name: 'Primeiro Contato — Selo Verificado',
    subject: 'Oportunidade de Selo Verificado e Perfil PRO no Avalia Solar',
    body: `Olá {{contact_name}},

Verifiquei o perfil da {{company_name}} no Avalia Solar e notei a excelente reputação e relevância no mercado de energia solar.

Gostaria de agendar uma breve conversa de 10 minutos para apresentar como o Selo Verificado pode aumentar a conversão de orçamentos e destacar sua empresa perante os clientes finais.

Qual o melhor dia e horário para conversarmos esta semana?

Atenciosamente,
Equipe Comercial Avalia Solar`,
  },
  {
    id: 'follow_up',
    name: 'Follow-up Comercial — Proposta PRO',
    subject: 'Acompanhamento da Proposta Comercial — Avalia Solar',
    body: `Olá {{contact_name}},

Espero que esteja bem.

Estou entrando em contato para acompanhar nossa conversa sobre a contratação do Plano PRO para a {{company_name}}.

Conseguiu revisar a proposta e alinhar com os demais membros do comitê?

Estou à disposição para responder qualquer dúvida.

Um abraço,
Equipe Comercial Avalia Solar`,
  },
];

export default function EmailComposerModal({
  accountId,
  contactId,
  contactName = 'Contato',
  contactEmail = '',
  companyName = 'Empresa',
  opportunityId,
  onSuccess,
}: EmailComposerModalProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const applyTemplate = (templateId: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    let sub = tmpl.subject.replace(/{{company_name}}/g, companyName).replace(/{{contact_name}}/g, contactName);
    let bdy = tmpl.body.replace(/{{company_name}}/g, companyName).replace(/{{contact_name}}/g, contactName);

    setSubject(sub);
    setBody(bdy);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Por favor, preencha o assunto e o corpo do e-mail.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/sales/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: {
            sales_account_id: accountId,
            sales_contact_id: contactId,
            sales_opportunity_id: opportunityId,
            to_email: contactEmail,
            subject: subject,
            body_text: body,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Falha ao enviar e-mail comercial.');
      }

      setSuccessMsg('E-mail enfileirado para envio com sucesso!');
      setTimeout(() => {
        setOpen(false);
        setSuccessMsg(null);
        setSubject('');
        setBody('');
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar à API de e-mail.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="min-h-9 border-blue-300 text-blue-900 font-bold hover:bg-blue-50">
          <Mail className="mr-1.5 h-3.5 w-3.5" /> Enviar E-mail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white p-6 shadow-xl border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Mail className="h-4 w-4 text-blue-900" />
            Novo E-mail Comercial — {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          {/* Template Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Modelos de E-mail (Outreach Templates):</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <Button
                  key={tmpl.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(tmpl.id)}
                  className="h-7 text-[11px] border-slate-200 bg-slate-50 text-slate-800 hover:bg-blue-50 font-medium"
                >
                  <Sparkles className="mr-1 h-3 w-3 text-blue-700" /> {tmpl.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Para:</label>
              <Input value={`${contactName} <${contactEmail || 'sem-email@empresa.com'}>`} disabled className="bg-slate-100 font-medium text-slate-700 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Empresa / Lead:</label>
              <Input value={companyName} disabled className="bg-slate-100 font-medium text-slate-700 mt-1" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Assunto do E-mail:</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Digite o assunto relevante do e-mail..."
              className="mt-1 font-semibold text-slate-900 border-slate-300"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Corpo da Mensagem:</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Escreva sua mensagem comercial..."
              className="mt-1 font-mono text-slate-800 border-slate-300 text-xs leading-relaxed"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-900 font-bold text-white hover:bg-blue-950 min-w-[140px]"
            >
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Disparar E-mail
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
