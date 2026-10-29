'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mail,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { salesApi } from '@/lib/api/sales/client';
import type {
  InboxMailbox,
  InboxThreadSummary,
  InboxThreadDetail,
  InboxCounts,
  InboxMessageItem,
} from '@/lib/api/sales/types';

import InboxConnectionBanner from './InboxConnectionBanner';
import InboxSidebar from './InboxSidebar';
import InboxThreadList from './InboxThreadList';
import InboxConversation from './InboxConversation';
import InboxContactContext from './InboxContactContext';

const DEFAULT_COUNTS: InboxCounts = {
  inbox: 0,
  sent: 0,
  open: 0,
  pending: 0,
  resolved: 0,
  archived: 0,
  drafts: 0,
  unread: 0,
  all: 0,
};

export default function SalesInboxWorkspace() {
  const [mailboxes, setMailboxes] = useState<InboxMailbox[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [threads, setThreads] = useState<InboxThreadSummary[]>([]);
  const [counts, setCounts] = useState<InboxCounts>(DEFAULT_COUNTS);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [threadDetail, setThreadDetail] = useState<InboxThreadDetail | null>(null);

  const [isThreadsLoading, setIsThreadsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isContextOpen, setIsContextOpen] = useState<boolean>(true);
  const autoSyncedMailboxIds = useRef<Set<number>>(new Set());

  // Connect Zoho Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectRegion, setConnectRegion] = useState('us');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  // 1. Load Mailbox Connections
  const loadMailboxes = useCallback(async () => {
    try {
      const list = await salesApi.getEmailConnections();
      setMailboxes(list);
      if (list.length > 0 && selectedMailboxId === null) {
        setSelectedMailboxId(list[0].id);
      }
      return list;
    } catch (err) {
      console.error('Falha ao carregar conexões de e-mail:', err);
      return [];
    }
  }, [selectedMailboxId]);

  useEffect(() => {
    loadMailboxes();
  }, [loadMailboxes]);

  // 2. Load Threads
  const loadThreads = useCallback(async () => {
    setIsThreadsLoading(true);
    try {
      const res = await salesApi.getInboxThreads({
        mailbox_id: selectedMailboxId ?? undefined,
        folder: selectedFolder,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        per_page: 25,
      });

      setThreads(res.threads ?? []);
      setCounts(res.counts ?? DEFAULT_COUNTS);

      if (res.threads && res.threads.length > 0 && !selectedThreadId) {
        setSelectedThreadId(res.threads[0].id);
      }
    } catch (err) {
      console.error('Falha ao carregar threads:', err);
      setThreads([]);
    } finally {
      setIsThreadsLoading(false);
    }
  }, [selectedMailboxId, selectedFolder, statusFilter, searchQuery, selectedThreadId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // 3. Load Thread Detail
  const loadThreadDetail = useCallback(async (id: number) => {
    setIsDetailLoading(true);
    try {
      const detail = await salesApi.getInboxThread(id);
      setThreadDetail(detail);
    } catch (err) {
      console.error('Falha ao carregar detalhe da thread:', err);
      setThreadDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    } else {
      setThreadDetail(null);
    }
  }, [selectedThreadId, loadThreadDetail]);

  // 4. Handle Sync (with immediate completion wait & toast)
  const handleSync = useCallback(async (id: number, silent = false) => {
    setIsSyncing(true);
    try {
      const res: any = await salesApi.syncEmailConnection(id, 'incremental');
      await loadMailboxes();
      await loadThreads();
      if (selectedThreadId) {
        await loadThreadDetail(selectedThreadId);
      }
      if (!silent) {
        if (res?.status === 'error') {
          toast.error(res?.message || 'Erro ao sincronizar caixa Zoho Mail.');
        } else {
          const imported = typeof res?.imported_now === 'number' ? res.imported_now : null;
          toast.success(
            imported && imported > 0
              ? `Sincronização concluída (${imported} nova(s) mensagem(ns) importada(s)).`
              : 'Caixa Zoho Mail sincronizada e atualizada!'
          );
        }
      }
    } catch (err) {
      console.error('Falha ao acionar sincronização:', err);
      if (!silent) {
        toast.error('Não foi possível sincronizar a caixa de e-mail agora.');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [loadMailboxes, loadThreads, loadThreadDetail, selectedThreadId]);

  // Auto-sync na abertura quando a caixa conectada nunca sincronizou ou está sem mensagens importadas
  useEffect(() => {
    const active = mailboxes.find((m) => m.id === selectedMailboxId) ?? mailboxes[0];
    if (!active) return;
    if (autoSyncedMailboxIds.current.has(active.id)) return;

    const shouldAutoSync =
      active.connection_status === 'healthy' &&
      (!active.last_synced_at || active.messages_imported === 0 || active.sync_status === 'error');

    if (shouldAutoSync) {
      autoSyncedMailboxIds.current.add(active.id);
      handleSync(active.id, true);
    }
  }, [mailboxes, selectedMailboxId, handleSync]);

  // 5. Connect Zoho Authorization Flow
  const handleStartZohoAuth = async () => {
    setIsConnecting(true);
    setConnectError('');
    try {
      const res = await salesApi.getZohoAuthorizeUrl(connectRegion, true);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error('URL de autorização não retornada pelo servidor.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar autorização Zoho OAuth 2.0.';
      setConnectError(msg);
      setIsConnecting(false);
    }
  };

  // 6. Reply Sent Handler
  const handleReplySent = (newMessage: InboxMessageItem) => {
    if (threadDetail) {
      setThreadDetail({
        ...threadDetail,
        messages: [...(threadDetail.messages || []), newMessage],
      });
    }
    loadThreads();
  };

  const activeMailbox = mailboxes.find((m) => m.id === selectedMailboxId) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] min-h-[600px] bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Top Warning/Health Banner */}
      <InboxConnectionBanner
        mailboxes={mailboxes}
        activeMailbox={activeMailbox}
        onSync={(id) => handleSync(id, false)}
        onConnectClick={() => setIsConnectModalOpen(true)}
      />

      {/* 3-Panel Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel 1: Sidebar (Mailbox Selector & Folders) */}
        <InboxSidebar
          mailboxes={mailboxes}
          selectedMailboxId={selectedMailboxId}
          onSelectMailbox={setSelectedMailboxId}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          counts={counts}
          onSync={(id) => handleSync(id, false)}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
          isSyncing={isSyncing}
        />

        {/* Panel 2: Threads List (Search, Status Filter & Cards) */}
        <div
          className={`${
            selectedThreadId ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-96 flex-col shrink-0`}
        >
          <InboxThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelectThread={(id) => setSelectedThreadId(id)}
            statusFilter={statusFilter}
            onSelectStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isThreadsLoading}
          />
        </div>

        {/* Panel 3: Conversation Timeline & Reply Composer */}
        <div
          className={`${
            selectedThreadId ? 'flex' : 'hidden lg:flex'
          } flex-1 overflow-hidden relative`}
        >
          {isDetailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
              <span className="w-6 h-6 border-2 border-[#0F62FE] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-slate-500">Carregando conversa...</p>
            </div>
          ) : threadDetail ? (
            <div className="flex-1 flex overflow-hidden">
              <InboxConversation
                thread={threadDetail}
                senderMailboxEmail={activeMailbox?.email}
                onBack={() => setSelectedThreadId(null)}
                onThreadUpdated={(updated) => {
                  setThreadDetail(updated);
                  loadThreads();
                }}
                onReplySent={handleReplySent}
                onToggleContext={() => setIsContextOpen(!isContextOpen)}
                isContextOpen={isContextOpen}
              />

              {/* Panel 4: Right CRM Contact & Opportunity Context */}
              {isContextOpen && (
                <InboxContactContext
                  thread={threadDetail}
                  onClose={() => setIsContextOpen(false)}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
              <Mail className="w-10 h-10 stroke-[1.2] text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Nenhuma conversa selecionada</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Selecione uma mensagem na lista ao lado para ler o histórico completo e responder.
              </p>
              {activeMailbox && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSyncing}
                  onClick={() => handleSync(activeMailbox.id, false)}
                  className="mt-4 text-xs h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0F62FE]' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando com Zoho Mail...' : 'Sincronizar Caixa Agora'}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connect Zoho Mail Modal */}
      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0F62FE]" />
              Conectar Caixa Zoho Mail
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Inicie a autorização OAuth 2.0 segura. O Avalia Solar nunca armazena sua senha de e-mail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">
                Região do Servidor Zoho
              </label>
              <Select value={connectRegion} onValueChange={setConnectRegion}>
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
              <p className="text-[10px] text-slate-400">
                Selecione o data center correspondente à sua conta corporativa Zoho.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
              <p className="font-semibold text-slate-800">Permissões Solicitadas:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Leitura de caixas de entrada e enviados (ZohoMail.messages.READ)</li>
                <li>Envio de respostas autorizadas (ZohoMail.messages.CREATE)</li>
                <li>Identificação da conta autorizada (ZohoMail.accounts.READ)</li>
              </ul>
            </div>

            {connectError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{connectError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConnectModalOpen(false)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isConnecting}
              onClick={handleStartZohoAuth}
              className="bg-[#0F62FE] hover:bg-[#0353E9] text-white text-xs h-8 flex items-center gap-1.5"
            >
              {isConnecting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Prosseguir para Zoho</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
