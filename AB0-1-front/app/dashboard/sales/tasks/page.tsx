'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type ApiTask = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  task_type: string;
  due_at?: string | null;
  completed_at?: string | null;
  owner_id?: number | null;
  sales_account_id?: number | null;
  sales_opportunity_id?: number | null;
  sales_contact_id?: number | null;
  account_name?: string | null;
  contact_name?: string | null;
  created_at: string;
};

type TaskSection = 'overdue' | 'today' | 'upcoming' | 'completed';

const TASK_TYPES = [
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Outro' },
];

const PRIORITIES = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

function toastMsg(message: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;color:white;background:${type === 'success' ? '#1e3a8a' : '#dc2626'};box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:opacity 0.3s;max-width:360px;`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => document.body.removeChild(el), 300);
  }, 3500);
}

function formatDue(due_at: string | null | undefined): { label: string; isOverdue: boolean; isToday: boolean } {
  if (!due_at) return { label: 'Sem prazo', isOverdue: false, isToday: false };
  const due = new Date(due_at);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const isOverdue = dueDay < today;
  const isToday = dueDay.getTime() === today.getTime();
  const label = isToday
    ? `Hoje, ${due.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { label, isOverdue, isToday };
}

function classifyTask(task: ApiTask): TaskSection {
  if (task.status === 'completed' || task.status === 'done') return 'completed';
  if (!task.due_at) return 'upcoming';
  const { isOverdue, isToday } = formatDue(task.due_at);
  if (isOverdue) return 'overdue';
  if (isToday) return 'today';
  return 'upcoming';
}

function TaskRow({
  task,
  onToggle,
  toggling,
}: {
  task: ApiTask;
  onToggle: (task: ApiTask) => void;
  toggling: boolean;
}) {
  const { label, isOverdue } = formatDue(task.due_at);
  const isDone = task.status === 'completed' || task.status === 'done';

  const typeIcon = () => {
    switch (task.task_type) {
      case 'call': return <Phone className="h-3.5 w-3.5 text-blue-700" />;
      case 'email': return <Mail className="h-3.5 w-3.5 text-indigo-700" />;
      case 'meeting': return <CalendarClock className="h-3.5 w-3.5 text-violet-700" />;
      default: return <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div
      data-testid={`task-row-${task.id}`}
      className={`flex items-start justify-between gap-4 rounded-lg p-3.5 transition hover:bg-slate-50 ${isDone ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          disabled={toggling}
          data-testid={`task-toggle-${task.id}`}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition disabled:opacity-50 ${
            isDone
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white hover:border-blue-700'
          }`}
          aria-label={isDone ? 'Reabrir tarefa' : 'Completar tarefa'}
        >
          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>

        <div>
          <p className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {task.account_name && (
              <span className="font-semibold text-blue-900">{task.account_name}</span>
            )}
            {task.contact_name && (
              <span className="text-slate-500">· {task.contact_name}</span>
            )}
            {task.due_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {label}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-1">{task.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {isOverdue && !isDone && (
          <Badge className="border-0 bg-red-100 text-[10px] font-bold text-red-800">Atrasada</Badge>
        )}
        <Badge variant="outline" className="flex items-center gap-1 border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-600">
          {typeIcon()}
          {task.task_type.replace('_', ' ')}
        </Badge>
        <Badge
          variant="outline"
          className={`border text-[10px] font-bold uppercase ${
            task.priority === 'high'
              ? 'border-red-200 bg-red-50 text-red-800'
              : task.priority === 'medium'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
        </Badge>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h3>
      <Badge variant="outline" className="border-slate-200 bg-white text-xs font-bold text-slate-700">
        {count}
      </Badge>
    </div>
  );
}

export default function SalesTasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [toggling, setToggling] = useState<number | null>(null);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('call');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueAt, setNewDueAt] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const qs = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') qs.set('status', statusFilter);
      if (query.trim()) qs.set('q', query.trim());

      const res = await fetch(`/api/v1/sales/tasks?${qs.toString()}`, { credentials: 'include' });

      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`Erro ${res.status} ao carregar tarefas.`);

      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (task: ApiTask) => {
    setToggling(task.id);
    const isDone = task.status === 'completed' || task.status === 'done';
    const newStatus = isDone ? 'pending' : 'completed';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, completed_at: isDone ? null : new Date().toISOString() } : t))
    );

    try {
      const res = await fetch(`/api/v1/sales/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ task: { status: newStatus } }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t))
        );
        toastMsg(data?.error?.message || `Erro ao atualizar tarefa (${res.status}).`, 'error');
        return;
      }

      const updated = await res.json();
      if (updated?.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated.task : t)));
      }

      toastMsg(newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta!', 'success');
    } catch (err) {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t))
      );
      toastMsg('Erro de rede ao atualizar tarefa.', 'error');
      console.error('[CRM] Task toggle error', err);
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setCreateError('O título da tarefa é obrigatório.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/v1/sales/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task: {
            title: newTitle.trim(),
            task_type: newType,
            priority: newPriority,
            due_at: newDueAt || null,
            description: newDescription.trim() || null,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          (data?.error?.fields ? Object.values(data.error.fields).flat().join('; ') : null) ||
          `Erro ao criar tarefa (${res.status}).`;
        setCreateError(msg);
        return;
      }

      const created = data.task as ApiTask;
      setTasks((prev) => [created, ...prev]);
      toastMsg('Tarefa criada com sucesso!', 'success');
      setIsNewOpen(false);
      setNewTitle('');
      setNewType('call');
      setNewPriority('medium');
      setNewDueAt('');
      setNewDescription('');
    } catch (err) {
      setCreateError('Erro de rede ao criar tarefa. Verifique sua conexão.');
      console.error('[CRM] Create task error', err);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = tasks.filter(
    (t) =>
      !query ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      (t.account_name && t.account_name.toLowerCase().includes(query.toLowerCase())) ||
      (t.contact_name && t.contact_name.toLowerCase().includes(query.toLowerCase()))
  );

  const sections = {
    overdue: filtered.filter((t) => classifyTask(t) === 'overdue'),
    today: filtered.filter((t) => classifyTask(t) === 'today'),
    upcoming: filtered.filter((t) => classifyTask(t) === 'upcoming'),
    completed: filtered.filter((t) => classifyTask(t) === 'completed'),
  };

  const pendingCount = filtered.filter((t) => t.status !== 'completed' && t.status !== 'done').length;

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ações Comerciais
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Tarefas & Follow-ups
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Controle diário de reuniões, ligações, e-mails e propostas para fechar mais negócios.
            </p>
          </div>

          <Button
            onClick={() => setIsNewOpen(true)}
            className="min-h-11 bg-blue-900 font-bold text-white shadow-sm hover:bg-blue-950"
            data-testid="create-task-btn"
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Tarefa
          </Button>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-slate-300 pl-9 min-h-10"
              placeholder="Buscar por título, empresa ou contato..."
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] border-slate-300 min-h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchTasks}
            disabled={loading}
            className="border-slate-300 min-h-10 min-w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Task List */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4">
            <CardTitle className="text-sm font-bold text-slate-900">Agenda de Prospecção Ativa</CardTitle>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 font-bold text-blue-900">
              {loading ? '...' : `${pendingCount} Pendentes`}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="tasks-loading">
                <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                <p className="text-sm text-slate-500">Carregando tarefas...</p>
              </div>
            ) : unauthorized ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="tasks-unauthorized">
                <XCircle className="h-9 w-9 text-amber-500" />
                <p className="font-semibold text-slate-900">Sessão expirada ou sem permissão</p>
                <a href="/auth/sign_in">
                  <Button className="bg-blue-900 font-bold hover:bg-blue-950">Fazer Login</Button>
                </a>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="tasks-error">
                <AlertCircle className="h-9 w-9 text-red-500" />
                <p className="font-semibold text-slate-900">{error}</p>
                <Button onClick={fetchTasks} variant="outline" className="font-semibold">
                  <RotateCw className="mr-2 h-4 w-4" /> Tentar Novamente
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="tasks-empty">
                <CheckCircle2 className="h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-700">
                  {query ? 'Nenhuma tarefa encontrada para essa busca.' : 'Nenhuma tarefa cadastrada ainda.'}
                </p>
                {!query && (
                  <Button
                    onClick={() => setIsNewOpen(true)}
                    className="bg-blue-900 font-semibold hover:bg-blue-950"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Criar Primeira Tarefa
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sections.overdue.length > 0 && (
                  <div>
                    <SectionHeader title="Atrasadas" count={sections.overdue.length} color="bg-red-500" />
                    {sections.overdue.map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={handleToggle} toggling={toggling === t.id} />
                    ))}
                  </div>
                )}
                {sections.today.length > 0 && (
                  <div>
                    <SectionHeader title="Para Hoje" count={sections.today.length} color="bg-amber-500" />
                    {sections.today.map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={handleToggle} toggling={toggling === t.id} />
                    ))}
                  </div>
                )}
                {sections.upcoming.length > 0 && (
                  <div>
                    <SectionHeader title="Próximas" count={sections.upcoming.length} color="bg-blue-500" />
                    {sections.upcoming.map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={handleToggle} toggling={toggling === t.id} />
                    ))}
                  </div>
                )}
                {sections.completed.length > 0 && (
                  <div>
                    <SectionHeader title="Concluídas" count={sections.completed.length} color="bg-emerald-500" />
                    {sections.completed.map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={handleToggle} toggling={toggling === t.id} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CREATE TASK DIALOG */}
      <Dialog
        open={isNewOpen}
        onOpenChange={(open) => {
          setIsNewOpen(open);
          if (!open) setCreateError(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Nova Tarefa Comercial</DialogTitle>
            <DialogDescription>
              Cadastre uma tarefa de prospecção, follow-up ou proposta para o CRM.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Título da Tarefa *</Label>
              <Input
                placeholder="Ex: Follow-up proposta enviada para cliente"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="border-slate-300"
                disabled={isCreating}
                data-testid="task-title-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Tipo</Label>
                <Select value={newType} onValueChange={setNewType} disabled={isCreating}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Prioridade</Label>
                <Select value={newPriority} onValueChange={setNewPriority} disabled={isCreating}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Prazo (data/hora)</Label>
              <Input
                type="datetime-local"
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
                className="border-slate-300"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Descrição (opcional)</Label>
              <Textarea
                placeholder="Contexto adicional ou roteiro da tarefa..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="border-slate-300 text-sm"
                rows={3}
                disabled={isCreating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewOpen(false)}
              className="border-slate-300"
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-blue-900 font-bold hover:bg-blue-950"
              disabled={isCreating}
              data-testid="task-save-btn"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar Tarefa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
