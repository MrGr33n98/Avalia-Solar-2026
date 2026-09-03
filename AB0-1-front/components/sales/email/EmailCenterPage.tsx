'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Inbox,
  Mail,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import EmailComposerModal from './EmailComposerModal';

type EmailEvent = { event_type?: string; occurred_at?: string; title?: string; at?: string };
type EmailMessage = {
  id: number;
  subject: string;
  from_email: string;
  to_email: string;
  status: string;
  body_text?: string;
  contact_name?: string;
  account_name?: string;
  open_count: number;
  click_count: number;
  events?: EmailEvent[];
};

export default function EmailCenterPage() {
  const [activeFolder, setActiveFolder] = useState<
    'inbox' | 'sent' | 'drafts' | 'scheduled' | 'templates' | 'analytics'
  >('inbox');
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMessages = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/v1/sales/emails?page=${page}&per_page=25`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (response.status !== 304 && !response.ok) {
        throw new Error('Não foi possível carregar os e-mails reais.');
      }
      const data = await response.json();
      const list: EmailMessage[] = data.emails ?? [];
      setMessages(list);
      setTotalPages(data.meta?.total_pages ?? 1);
      setSelectedMessage(
        (current: EmailMessage | null) =>
          list.find((item) => item.id === current?.id) ?? list[0] ?? null
      );
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar e-mails.');
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [page]);

  useEffect(() => {
    fetchMessages();
    const interval = window.setInterval(fetchMessages, 10000);
    return () => window.clearInterval(interval);
  }, [activeFolder, fetchMessages]);

  const filteredMessages = messages.filter((m) => {
    const folderMatches =
      activeFolder === 'inbox'
        ? true
        : activeFolder === 'sent'
          ? ['sent', 'delivered', 'bounced', 'failed'].includes(m.status)
          : activeFolder === 'drafts'
            ? m.status === 'draft'
            : activeFolder === 'scheduled'
              ? m.status === 'scheduled'
              : false;
    const queryMatches = search
      ? m.subject.toLowerCase().includes(search.toLowerCase()) ||
        m.to_email.toLowerCase().includes(search.toLowerCase())
      : true;
    return folderMatches && queryMatches;
  });

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col h-[calc(100vh-80px)] font-sans bg-slate-50/50 -m-6 p-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200/80 bg-white px-6 py-4 rounded-2xl shadow-2xs mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-100">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Plataforma de Mensageria CRM Unificada
                <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Dados reais
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Central de e-mails comerciais com rastreamento de aberturas, cliques e threads
                integradas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
              className="h-10 text-xs font-semibold text-slate-700 border-slate-200 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2 text-slate-500" /> Atualizar
            </Button>
            <Button
              onClick={() => setComposerOpen(true)}
              className="h-10 px-5 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Escrever E-mail
            </Button>
          </div>
        </div>

        {/* 3-PANE ARCHITECTURE */}
        <div className="grid grid-cols-12 gap-5 flex-1 overflow-hidden">
          {/* PANE 1: FOLDERS & NAVIGATION (2 Cols) */}
          <div className="col-span-12 md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-3 space-y-1.5 shadow-2xs flex flex-col justify-between">
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Caixas & Pastas
              </p>
              <button
                onClick={() => setActiveFolder('inbox')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeFolder === 'inbox'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-indigo-600" /> Entrada
                </span>
              </button>

              <button
                onClick={() => setActiveFolder('sent')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeFolder === 'sent'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-emerald-600" /> Enviados
                </span>
              </button>

              <button
                onClick={() => setActiveFolder('drafts')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeFolder === 'drafts'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-600" /> Rascunhos
                </span>
              </button>

              <button
                disabled
                aria-disabled="true"
                title="Disponível quando houver dados reais nesta caixa"
                onClick={() => setActiveFolder('scheduled')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeFolder === 'scheduled'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-sky-600" /> Agendados
                </span>
              </button>

              <button
                disabled
                aria-disabled="true"
                title="Disponível quando houver dados reais nesta caixa"
                onClick={() => setActiveFolder('templates')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeFolder === 'templates'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Modelos
                </span>
              </button>

              <button
                disabled
                aria-disabled="true"
                title="Disponível quando houver dados reais nesta caixa"
                onClick={() => setActiveFolder('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeFolder === 'analytics'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" /> Métricas
                </span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Status SES Provider
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Status não verificado nesta tela
              </span>
            </div>
          </div>

          {/* PANE 2: MESSAGES LIST (4 Cols) */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col shadow-2xs overflow-hidden">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <Input
                placeholder="Buscar por assunto ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 text-xs border-slate-200 bg-slate-50 focus:bg-white rounded-xl"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredMessages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMessage(m)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMessage?.id === m.id
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                      : 'border-slate-200/70 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {m.contact_name || m.to_email}
                    </span>
                    <span className="text-[10px] text-slate-400">14:30</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-1">{m.subject}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {m.body_text}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/80">
                    <span className="text-[10px] text-indigo-700 font-medium">
                      {m.account_name}
                    </span>
                    <div className="flex items-center gap-2">
                      {m.open_count > 0 && (
                        <span className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {m.open_count}
                        </span>
                      )}
                      {m.click_count > 0 && (
                        <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" /> {m.click_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </Button>
              <span className="text-slate-500">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>

          {/* PANE 3: THREAD VIEWER (6 Cols) */}
          <div className="col-span-12 md:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-2xs overflow-hidden">
            {error ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchMessages}>
                  Tentar novamente
                </Button>
              </div>
            ) : selectedMessage ? (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  {/* Header info */}
                  <div className="pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-bold text-slate-900 leading-snug">
                        {selectedMessage.subject}
                      </h2>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                        {(
                          {
                            queued: 'Enfileirado',
                            sending: 'Enviando',
                            sent: 'Enviado',
                            delivered: 'Entregue',
                            failed: 'Falhou',
                          } as Record<string, string>
                        )[selectedMessage.status] ||
                          selectedMessage.status ||
                          'Desconhecido'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">
                        {selectedMessage.contact_name}
                      </span>
                      <span className="text-slate-400">&lt;{selectedMessage.to_email}&gt;</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-indigo-700 font-medium">
                        {selectedMessage.account_name}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60 text-xs leading-relaxed text-slate-800 space-y-3 whitespace-pre-line font-sans">
                    {selectedMessage.body_text}
                  </div>

                  {/* Delivery & Engagement Events Timeline */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                      Eventos de Engajamento Real
                    </h4>
                    <div className="space-y-2">
                      {selectedMessage.events?.map((evt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs"
                        >
                          <span className="flex items-center gap-2 font-medium text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{' '}
                            {evt.event_type || evt.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {evt.occurred_at || evt.at}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Reply Box */}
                <div className="pt-4 border-t border-slate-100 mt-5">
                  <Input
                    placeholder="Escreva uma resposta rápida..."
                    className="h-11 text-xs border-slate-300 rounded-xl px-4"
                  />
                  <div className="flex justify-end mt-2.5">
                    <Button
                      size="sm"
                      onClick={() => setComposerOpen(true)}
                      className="h-9 px-4 bg-indigo-900 text-white font-bold text-xs rounded-lg"
                    >
                      Responder Thread
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Mail className="w-12 h-12 mb-2" />
                <p className="text-xs font-semibold">
                  Selecione uma mensagem para visualizar a conversa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPOSER MODAL */}
      <EmailComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSuccess={fetchMessages}
      />
    </SalesLayoutWrapper>
  );
}
