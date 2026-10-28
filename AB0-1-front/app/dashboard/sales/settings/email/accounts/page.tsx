'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import { Button } from '@/components/ui/button';

type ConnectedAccount = {
  id: number;
  email: string;
  provider: string;
  sync_status: string;
  last_synced_at: string | null;
};
type AccountsResponse = { accounts: ConnectedAccount[] };

const states: Record<string, string> = {
  connected: 'Conta Zoho autorizada. A sincronização de mensagens ainda não está habilitada.',
  denied: 'Autorização cancelada no Zoho.',
  invalid_state: 'A autorização expirou ou é inválida. Tente novamente.',
  configuration_required: 'Configuração OAuth do servidor incompleta.',
  provider_error: 'Não foi possível conectar ao Zoho. Verifique a configuração e tente novamente.',
  mailbox_not_found: 'A autorização foi concluída, mas nenhuma caixa de e-mail foi encontrada.',
  already_connected: 'Esta conta já pertence a outro usuário do CRM.',
};

export default function ConnectedEmailAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/sales/email_connections', {
        credentials: 'include', cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Não foi possível listar as contas conectadas.');
      const data: AccountsResponse = await response.json();
      setAccounts(data.accounts ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar contas de e-mail.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('connection');
    if (status && Object.prototype.hasOwnProperty.call(states, status)) setNotice(states[status]);
    refresh();
  }, [refresh]);

  async function connectZoho() {
    setConnecting(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/sales/email_connections/zoho/authorize', {
        method: 'POST', credentials: 'include', headers: { Accept: 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || typeof data.authorization_url !== 'string') {
        throw new Error(data.message || 'Não foi possível iniciar a autorização Zoho.');
      }
      // Fixed provider URL returned by our authenticated API.
      const target = new URL(data.authorization_url);
      if (!/^accounts\.(zoho\.(com|eu|in|com\.au|jp)|zohocloud\.ca)$/.test(target.hostname) || target.protocol !== 'https:') {
        throw new Error('Destino OAuth inválido.');
      }
      window.location.assign(target.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na conexão com Zoho.');
      setConnecting(false);
    }
  }

  return (
    <SalesLayoutWrapper>
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
        <Link href="/dashboard/sales/settings/email" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Configurações de e-mail
        </Link>
        <OrganizationSettingLayout
          title="Contas de e-mail conectadas"
          subtitle="Conecte sua caixa existente sem alterar os registros MX ou o envio comercial pelo AWS SES."
          helpTitle="Segurança e permissões"
          helpDescription="A conexão utiliza OAuth 2.0. Você autoriza o acesso no Zoho; a senha da caixa nunca é informada ao CRM. A integração permanece pessoal até que o compartilhamento seja implementado."
          extraHelpCards={[{ title: 'Implantação por etapas', content: 'Esta fase conecta a conta e protege as credenciais. Recebimento, sincronização histórica, respostas e regras da Inbox serão habilitados em fases posteriores.' }]}
        >
          <div className="space-y-5">
            {notice && <p role="status" className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{notice}</p>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-sky-700" /><h2 className="text-base font-semibold text-slate-900">Endereços conectados</h2></div>
              <Button variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw size={15} className="mr-2" /> Atualizar
              </Button>
            </div>
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">Carregando contas…</p>
            ) : accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Mail className="mx-auto h-9 w-9 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-800">Nenhuma conta conectada</p>
                <p className="mt-1 text-sm text-slate-500">Autorize uma conta existente do Zoho para começar.</p>
              </div>
            ) : (
              <ul className="divide-y rounded-lg border border-slate-200">
                {accounts.map((account) => (
                  <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-900">{account.email}</p>
                      <p className="text-xs text-slate-500">{account.provider.toUpperCase()} · {account.sync_status}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-800"><CheckCircle2 size={15} /> Cadastrada</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck size={16} className="text-emerald-700" /> Conectar provedor</p>
              <Button onClick={connectZoho} disabled={connecting} className="bg-sky-700 hover:bg-sky-800">
                {connecting ? 'Redirecionando…' : 'Conectar Zoho Mail'} <ExternalLink size={14} className="ml-2" />
              </Button>
              <p className="mt-3 text-xs text-slate-500">Gmail e Outlook serão adicionados após a homologação do conector Zoho. Nenhum envio ou importação será executado nesta etapa.</p>
            </div>
          </div>
        </OrganizationSettingLayout>
      </div>
    </SalesLayoutWrapper>
  );
}
