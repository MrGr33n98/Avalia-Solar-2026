'use client';

import { useState } from 'react';
import { CalendarClock, RotateCw } from 'lucide-react';
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
    if (!taskTitle.trim()) return setError('Task title is required');
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
      if (!res.ok) throw new Error('Failed to add task');
      setSuccessMsg('Task added successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setTaskTitle('');
        setTaskDueAt('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Add a task"
      size="md"
      heroIcon={<CalendarClock className="w-8 h-8 text-sky-600" />}
      showCustomizeFields={true}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            form="create-task-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Add task
          </Button>
        </>
      }
    >
      <form id="create-task-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Task title</Label>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Ex: Follow up on solar proposal with executive committee"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Priority</Label>
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:border-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Due date</Label>
          <Input
            type="date"
            value={taskDueAt}
            onChange={(e) => setTaskDueAt(e.target.value)}
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>
      </form>
    </CRMModal>
  );
}
