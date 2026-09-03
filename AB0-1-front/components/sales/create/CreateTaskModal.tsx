'use client';

import { useState } from 'react';
import { CalendarClock, Plus, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CRMModal from '@/components/sales/ui/CRMModal';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  accountId?: number;
  onSuccess?: () => void;
}

export default function CreateTaskModal({ open, onClose, opportunityId, accountId, onSuccess }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueAt, setTaskDueAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return setError('Título da tarefa é obrigatório');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task: {
            title: taskTitle,
            priority: taskPriority,
            due_at: taskDueAt || undefined,
            status: 'pending',
            sales_opportunity_id: opportunityId,
            sales_account_id: accountId,
          },
        }),
      });
      if (!res.ok) throw new Error('Falha ao agendar tarefa');
      setSuccessMsg('Tarefa criada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setTaskTitle('');
        setTaskDueAt('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Nova Tarefa / Follow-up"
      description="Agendar compromisso ou acompanhamento no CRM."
      icon={<CalendarClock className="w-5 h-5 text-sky-700" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Título da Tarefa *</Label>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Ex: Enviar proposta revisada para diretoria"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Prioridade</Label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white focus:outline-hidden"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Data Limite (Due Date)</Label>
            <Input
              type="date"
              value={taskDueAt}
              onChange={(e) => setTaskDueAt(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-sky-700 text-white hover:bg-sky-800 font-bold">
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Criar Tarefa
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
