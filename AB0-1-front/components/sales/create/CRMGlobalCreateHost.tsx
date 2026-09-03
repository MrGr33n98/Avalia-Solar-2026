'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  Plus,
  RotateCw,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { salesApi } from '@/lib/api/sales/client';

interface CRMGlobalCreateHostProps {
  modalType: string | null;
  onClose: () => void;
}

export default function CRMGlobalCreateHost({ modalType, onClose }: CRMGlobalCreateHostProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  const [contactFirstName, setContactFirstName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueAt, setTaskDueAt] = useState('');

  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('answered');

  const [emailSubject, setEmailSubject] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailBody, setEmailBody] = useState('');

  if (!modalType) return null;

  if (modalType === 'import') {
    onClose();
    router.push('/dashboard/sales/import');
    return null;
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return setError('Nome da empresa é obrigatório');
    setLoading(true);
    setError(null);
    try {
      await salesApi.createAccount({ name: companyName, domain: companyDomain, phone: companyPhone });
      setSuccessMsg('Empresa cadastrada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFirstName.trim()) return setError('Nome é obrigatório');
    setLoading(true);
    setError(null);
    try {
      await salesApi.createContact({ first_name: contactFirstName, email: contactEmail, job_title: contactJobTitle });
      setSuccessMsg('Contato cadastrado com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return setError('Título da tarefa é obrigatório');
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/v1/sales/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task: {
            title: taskTitle,
            priority: taskPriority,
            due_at: taskDueAt || undefined,
            status: 'pending',
          },
        }),
      });
      setSuccessMsg('Tarefa criada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Modal Empresa */}
      <Dialog open={modalType === 'company'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[600px] p-6">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-blue-900">
              <Building2 className="w-5 h-5" />
              <DialogTitle className="text-xl font-bold">Criar Nova Empresa</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Adicionar nova conta B2B / cliente corporativo no CRM.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCompany} className="space-y-4 pt-3">
            {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
            {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nome da Empresa *</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Usinas & Engenharia Solar S/A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Domínio</Label>
                <Input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="empresa.com.br"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Telefone Comercial</Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="(11) 3000-0000"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-900 text-white hover:bg-blue-950 font-bold">
                {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Salvar Empresa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Contato */}
      <Dialog open={modalType === 'contact'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[600px] p-6">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Users className="w-5 h-5" />
              <DialogTitle className="text-xl font-bold">Criar Novo Contato</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Cadastrar novo decisor ou contato comercial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateContact} className="space-y-4 pt-3">
            {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
            {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nome do Contato *</Label>
              <Input
                value={contactFirstName}
                onChange={(e) => setContactFirstName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">E-mail</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="carlos@empresa.com.br"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Cargo / Função</Label>
                <Input
                  value={contactJobTitle}
                  onChange={(e) => setContactJobTitle(e.target.value)}
                  placeholder="Diretor Operacional"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold">
                {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Salvar Contato
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Tarefa */}
      <Dialog open={modalType === 'task'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[580px] p-6">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sky-700">
              <CalendarClock className="w-5 h-5" />
              <DialogTitle className="text-xl font-bold">Nova Tarefa / Follow-up</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Agendar tarefa de acompanhamento no CRM.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-3">
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
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white"
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
        </DialogContent>
      </Dialog>
    </>
  );
}
