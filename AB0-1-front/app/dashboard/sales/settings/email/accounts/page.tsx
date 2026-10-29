'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Plus,
  RefreshCw,
  Unplug,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesApi } from '@/lib/api/sales/client';
import type { InboxMailbox } from '@/lib/api/sales/types';

export default function EmailAccountsSettingsPage() {
  const [accounts, setAccounts] = useState<InboxMailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);

  // Connect Dialog State
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [region, setRegion] = useState('us');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await salesApi.getEmailConnections();
      setAccounts(list);
    } catch (err) {
      console.error('Falha ao listar contas:', err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await salesApi.syncEmailConnection(id, 'full');
      await loadAccounts();

      if (res.status === 'error') {
        toast.error(res.error || res.message || 'Falha ao sincronizar caixa Zoho Mail.');
        return;
      }

      const importedNow = typeof res.imported_now === 'number' ? res.imported_now : 0;
      const totalStored =
        typeof res.stored_messages === 'number'
          ? res.stored_messages
          : res.account?.stored_messages ?? res.account?.messages_imported ?? 0;
      const totalThreads =
        typeof res.stored_threads === 'number'
          ? res.stored_threads
          : res.account?.stored_threads ?? 0;

      toast.success(
        importedNow > 0
          ? `Sincronização concluída: +${importedNow} nova(s) mensagem(ns) (${totalStored} mensagens em ${totalThreads} conversas).`
          : `Sincronização concluída (${totalStored} mensagens em ${totalThreads} conversas).`
      );
    } catch (err: unknown) {
      await loadAccounts();
      const message =
        err instanceof Error ? err.message : 'Falha ao sincronizar conta Zoho Mail.';
      toast.error(message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (id: number) => {
    setDisconnectingId(id);
    try {
      await salesApi.disconnectEmailConnection(id);
      await loadAccounts();
      toast.success('Conta de e-mail desconectada.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao desconectar conta.';
      toast.error(message);
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleStartAuth = async () => {
    setIsAuthorizing(true);
    setErrorMsg('');
    try {
      const res = await salesApi.getZohoAuthorizeUrl(region, true);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error('Servidor não retornou a URL de autorização.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar conexão OAuth 2.0.';
      setErrorMsg(msg);
      setIsAuthorizing(false);
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Contas de E-mail & Caixas Conectadas"
        subtitle="Gerencie caixas Zoho Mail para sincronização bidirecional, envio e leitura com proteção contra vazamento de credenciais"
        helpTitle="Conexão Segura OAuth 2.0"
        helpDescription="As credenciais nunca passam pelo banco em texto plano. O Avalia Solar utiliza cofres de criptografia com chaves versionadas e tokens de uso único."
        extraHelpCards={[
          {
            title: 'Sincronização Idempotente',
            content:
              'A ingestão de e-mails respeita os Message-IDs padrão RFC. Nenhuma mensagem é duplicada durante re-sincronizações periódicas.',
          },
          {
            title: 'Envio Autorizado',
            content:
              'Respostas e novos e-mails enviados utilizam a API direta do provedor com a identidade autêntica da conta do vendedor.',
          },
        ]}
      >
        <div className="space-y-4 font-sans text-xs">
          {/* Top Bar with Return link & Connect button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/sales/emails"
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar à Inbox
              </Link>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-sky-600" />
                Caixas Cadastradas ({accounts.length})
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => setIsConnectOpen(true)}
              className="bg-[#0F62FE] hover:bg-[#0353E9] text-white h-8 text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Conectar Zoho Mail...</span>
            </Button>
          </div>

          {/* Accounts List */}
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
              <span>Carregando conexões de e-mail...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-md space-y-2">
              <Mail className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Nenhuma caixa de e-mail conectada</p>
              <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                Conecte sua conta corporativa Zoho Mail para liberar a sincronização bidirecional de mensagens e respostas diretas.
              </p>
              <Button
                size="sm"
                onClick={() => setIsConnectOpen(true)}
                className="mt-2 bg-[#0F62FE] hover:bg-[#0353E9] text-white text-xs h-8"
              >
                Conectar Primeira Caixa
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const isSyncingThis = syncingId === acc.id || acc.sync_status === 'syncing';
                const isDisconnectingThis = disconnectingId === acc.id;
                const isOAuthHealthy = acc.connection_status === 'healthy' && !acc.token_expired;
                const isNeedsReconnect = acc.connection_status === 'needs_reconnect' || acc.token_expired;
                const isSyncError = acc.sync_status === 'error';
                const isSyncDegraded = acc.sync_status === 'degraded';
                const isSyncHealthy = acc.sync_status === 'healthy';
                const storedMessages = acc.stored_messages ?? acc.messages_imported ?? 0;
                const storedThreads = acc.stored_threads ?? 0;

                return (
                  <div
                    key={acc.id}
                    className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{acc.email}</span>

                        {/* Status 1: Autenticação OAuth */}
                        {isOAuthHealthy ? (
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> OAuth Conectado
                          </Badge>
                        ) : isNeedsReconnect ? (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-600" /> Requer Reconexão OAuth
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700 text-[10px]">
                            OAuth: {acc.connection_status}
                          </Badge>
                        )}

                        {/* Status 2: Sincronização de Mensagens */}
                        {isSyncingThis ? (
                          <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 text-[10px] flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" /> Sincronizando...
                          </Badge>
                        ) : isSyncError ? (
                          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-800 text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600" /> Erro na Sincronização
                          </Badge>
                        ) : isSyncDegraded ? (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Sync Parcial / Rate Limit
                          </Badge>
                        ) : isSyncHealthy ? (
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sync Saudável
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600 text-[10px]">
                            Aguardando 1ª Sync
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>Provedor: <strong className="text-slate-700 uppercase">{acc.provider}</strong></span>
                        <span>•</span>
                        <span>Região: <strong className="text-slate-700 uppercase">{acc.provider_region || 'US'}</strong></span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Database className="w-3 h-3 text-slate-400" />
                          <strong>{storedMessages}</strong> mensagens em <strong>{storedThreads}</strong> conversas
                        </span>
                        {acc.last_synced_at && (
                          <>
                            <span>•</span>
                            <span>
                              Última sync:{' '}
                              {new Date(acc.last_synced_at).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </>
                        )}
                      </div>

                      {acc.sync_error && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 bg-red-50/80 border border-red-200 px-2 py-1 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                          <span>Falha registrada na última sincronização: {acc.sync_error}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSyncingThis || isDisconnectingThis}
                        onClick={() => handleSync(acc.id)}
                        className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-sky-600' : ''}`} />
                        <span>{isSyncingThis ? 'Sincronizando...' : 'Sincronizar'}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isDisconnectingThis || isSyncingThis}
                        onClick={() => handleDisconnect(acc.id)}
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                      >
                        <Unplug className="w-3.5 h-3.5" />
                        <span>Desconectar</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Conexão Zoho */}
        <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F62FE]" />
                Conectar Zoho Mail (OAuth 2.0)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Você será redirecionado para a página oficial do Zoho para autenticar com consentimento explícito.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">
                  Data Center / Região da Conta
                </label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">Estados Unidos / Global (.com)</SelectItem>
                    <SelectItem value="eu">União Europeia (.eu)</SelectItem>
                    <SelectItem value="in">Índia (.in)</SelectItem>
                    <SelectItem value="au">Austrália (.com.au)</SelectItem>
                    <SelectItem value="ca">Canadá (.ca)</SelectItem>
                    <SelectItem value="jp">Japão (.jp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Garantias de Privacidade e Segurança:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li>Nenhuma senha é enviada ou armazenada.</li>
                  <li>Tokens criptografados em repouso com cofre AES-256-GCM.</li>
                  <li>Isolamento estrito entre usuários e organizações.</li>
                </ul>
              </div>

              {errorMsg && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {errorMsg}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConnectOpen(false)}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isAuthorizing}
                onClick={handleStartAuth}
                className="bg-[#0F62FE] hover:bg-[#0353E9] text-white text-xs h-8 flex items-center gap-1.5"
              >
                {isAuthorizing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ir para Zoho</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
