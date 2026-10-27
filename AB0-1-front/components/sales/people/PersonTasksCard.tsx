'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Clock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  task_type?: string;
  due_at?: string | null;
  completed_at?: string | null;
}

interface PersonTasksCardProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: number, newStatus: string) => Promise<void>;
  onAddTask: () => void;
}

export default function PersonTasksCard({ tasks = [], onToggleTask, onAddTask }: PersonTasksCardProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'done' && !t.completed_at);
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'done' || !!t.completed_at);

  const currentList = activeTab === 'open' ? openTasks : completedTasks;

  const handleToggle = async (task: TaskItem) => {
    const isCompleted = task.status === 'completed' || task.status === 'done' || !!task.completed_at;
    const targetStatus = isCompleted ? 'pending' : 'completed';
    setTogglingId(task.id);
    try {
      await onToggleTask(task.id, targetStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return { formatted, isOverdue };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header with Tabs & Add Task */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Tasks</h2>
          </div>

          {/* Open / Completed Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('open')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeTab === 'open' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Open ({openTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeTab === 'completed'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedTasks.length})
            </button>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onAddTask}
          className="h-7 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add task
        </Button>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-100">
        {currentList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            {activeTab === 'open'
              ? 'Nenhuma tarefa pendente para esta pessoa.'
              : 'Nenhuma tarefa concluída ainda.'}
          </div>
        ) : (
          currentList.map((task) => {
            const isCompleted = task.status === 'completed' || task.status === 'done' || !!task.completed_at;
            const dueInfo = formatDueDate(task.due_at);

            return (
              <div
                key={task.id}
                className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={togglingId === task.id}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition shrink-0"
                    title={isCompleted ? 'Reabrir tarefa' : 'Marcar como concluída'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 hover:fill-indigo-50" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`text-xs font-semibold ${
                        isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {dueInfo && (
                        <span
                          className={`text-[10px] font-semibold flex items-center gap-1 ${
                            dueInfo.isOverdue && !isCompleted ? 'text-rose-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {dueInfo.isOverdue && !isCompleted ? 'Atrasada: ' : 'Vence: '}
                          {dueInfo.formatted}
                        </span>
                      )}

                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 capitalize ${
                            task.priority === 'high'
                              ? 'border-rose-200 text-rose-700 bg-rose-50'
                              : task.priority === 'medium'
                              ? 'border-amber-200 text-amber-700 bg-amber-50'
                              : 'border-slate-200 text-slate-600 bg-slate-50'
                          }`}
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
