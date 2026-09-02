'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type TaskItem = {
  id: number;
  title: string;
  company: string;
  type: 'call' | 'email' | 'meeting' | 'proposal';
  dueDate: string;
  isOverdue?: boolean;
  done: boolean;
};

export default function SalesTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 1, title: 'Follow-up faturas de energia e alinhamento comercial', company: 'Solar Tech Indústria', type: 'call', dueDate: 'Hoje, 14:00', isOverdue: true, done: false },
    { id: 2, title: 'Enviar minuta do contrato de Usina Usufruída', company: 'Hospital São Lucas', type: 'proposal', dueDate: 'Hoje, 16:30', done: false },
    { id: 3, title: 'Reunião de Diagnóstico Técnico e dimensionamento kWh', company: 'Mercado Real LTDA', type: 'meeting', dueDate: 'Amanhã, 10:00', done: false },
    { id: 4, title: 'Confirmar recebimento da proposta formal', company: 'Engenharia Sol Nascente', type: 'email', dueDate: '04/09/2026', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ações Comerciais</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Tarefas & Follow-ups</h1>
            <p className="mt-1 text-sm text-slate-600">
              Controle diário de reuniões, ligações, e-mails e envio de propostas para fechar mais negócios.
            </p>
          </div>

          <Button className="min-h-11 bg-blue-900 font-bold text-white shadow-sm hover:bg-blue-950">
            <Plus className="mr-2 h-4 w-4" /> Criar Tarefa
          </Button>
        </header>

        {/* Task List */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Agenda de Prospecção Ativa</CardTitle>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 font-bold text-blue-900">
              {tasks.filter((t) => !t.done).length} Pendentes
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-4 p-3.5 transition hover:bg-slate-50 ${
                    task.done ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition ${
                        task.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white hover:border-blue-700'
                      }`}
                    >
                      {task.done && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <div>
                      <p className={`text-sm font-bold ${task.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <strong className="text-blue-900">{task.company}</strong> · {task.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.isOverdue && !task.done && (
                      <Badge className="border-0 bg-red-100 text-red-800 text-[10px] font-bold">
                        Atrasada
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] uppercase font-semibold text-slate-600">
                      {task.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
