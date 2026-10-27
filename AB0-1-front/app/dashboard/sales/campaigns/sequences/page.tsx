'use client';

import { useEffect, useState } from 'react';
import { requestApi } from '@/lib/api-campaigns';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Clock,
  Mail,
  Phone,
  CheckSquare,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Zap,
  Play,
  Pause,
  StopCircle,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

type StepDraft = {
  position: number;
  delay_days: number;
  step_type: 'email' | 'task' | 'call_task';
  email_template_id?: number;
};

type Sequence = {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  steps: {
    id: number;
    position: number;
    delay_days: number;
    step_type: string;
    email_template_id?: number;
  }[];
};

type Template = { id: number; name: string; subject_template: string; status: string };

type Enrollment = {
  id: number;
  sequence_id: number;
  sequence_name: string;
  contact_id: number;
  contact_name: string;
  status: string;
  current_step: number;
  steps_count: number;
  next_action_at: string | null;
  stop_reason: string | null;
};

export default function SequencesPage() {
  const [data, setData] = useState<Sequence[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  // New Sequence Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([
    { position: 0, delay_days: 0, step_type: 'email', email_template_id: undefined },
    { position: 1, delay_days: 3, step_type: 'email', email_template_id: undefined },
    { position: 2, delay_days: 4, step_type: 'call_task', email_template_id: undefined },
  ]);

  // Enrollment Form
  const [contactId, setContactId] = useState('');
  const [enrollmentSequenceId, setEnrollmentSequenceId] = useState('');
  const [busyEnrollmentId, setBusyEnrollmentId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      requestApi<{ sequences: Sequence[] }>('/email_sequences', { signal: controller.signal }),
      requestApi<{ templates: Template[] }>('/email_templates?status=active', { signal: controller.signal }),
      requestApi<{ enrollments: Enrollment[] }>('/email_sequence_enrollments', { signal: controller.signal }),
    ])
      .then(([sequenceResult, templateResult, enrollmentResult]) => {
        if (!controller.signal.aborted) {
          setData(sequenceResult.sequences || []);
          setTemplates(templateResult.templates || []);
          setEnrollments(enrollmentResult.enrollments || []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message || 'Falha ao carregar sequências.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        position: prev.length,
        delay_days: 2,
        step_type: 'email',
        email_template_id: undefined,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      toast.error('A sequência deve conter pelo menos uma etapa.');
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, idx) => ({ ...s, position: idx })));
  };

  const updateStep = (index: number, updates: Partial<StepDraft>) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  async function createSequence() {
    if (!name.trim()) {
      return toast.error('Informe um nome para a sequência.');
    }
    const invalidEmailStep = steps.find((s) => s.step_type === 'email' && !s.email_template_id);
    if (invalidEmailStep) {
      return toast.error('Selecione um template de e-mail para todos os passos de envio.');
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        sequence: {
          name: name.trim(),
          description: description.trim(),
          active: true,
          steps_attributes: steps.map((s, idx) => ({
            position: idx,
            delay_days: s.delay_days,
            step_type: s.step_type,
            ...(s.step_type === 'email' ? { email_template_id: Number(s.email_template_id) } : {}),
          })),
        },
      };

      await requestApi('/email_sequences', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setName('');
      setDescription('');
      setSteps([
        { position: 0, delay_days: 0, step_type: 'email', email_template_id: undefined },
        { position: 1, delay_days: 3, step_type: 'email', email_template_id: undefined },
      ]);
      setRetry((v) => v + 1);
      toast.success('Cadência comercial criada com sucesso!');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Falha ao criar sequência.');
    } finally {
      setSaving(false);
    }
  }

  async function enrollContact() {
    if (!contactId || !enrollmentSequenceId) return;
    setSaving(true);
    setError('');
    try {
      await requestApi('/email_sequence_enrollments', {
        method: 'POST',
        body: JSON.stringify({
          enrollment: {
            sequence_id: Number(enrollmentSequenceId),
            contact_id: Number(contactId),
          },
        }),
      });
      setContactId('');
      setRetry((value) => value + 1);
      toast.success('Contato inscrito na cadência!');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Falha ao incluir contato na cadência.');
    } finally {
      setSaving(false);
    }
  }

  async function transitionEnrollment(enrollment: Enrollment, action: 'pause' | 'resume' | 'stop') {
    setBusyEnrollmentId(enrollment.id);
    setError('');
    try {
      await requestApi(`/email_sequence_enrollments/${enrollment.id}/${action}`, { method: 'POST' });
      setRetry((value) => value + 1);
      toast.success(`Cadência ${action === 'pause' ? 'pausada' : action === 'resume' ? 'retomada' : 'encerrada'}.`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar cadência.');
    } finally {
      setBusyEnrollmentId(null);
    }
  }

  return (
    <WorkspaceFrame title="Sequências de Vendas 1-to-1 (Sales Cadences)">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Construtor de Sequências & Cadências (Timeline Builder)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Configure automações de follow-up com réguas de prazo customizáveis (delays), tarefas de ligação e
              pausa imediata automática caso o comprador solar responda ou feche negócio.
            </p>
          </div>
        </div>

        {/* TIMELINE BUILDER CARD */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-600" />
              Nova Cadência com Linha do Tempo
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Defina o nome, a descrição e os passos sequenciais com seus respectivos atrasos (delays).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome da Cadência</label>
                <Input
                  placeholder="Ex: Follow-up Pós-Apresentação de Usina Solar Rooftop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição Comercial</label>
                <Input
                  placeholder="Ex: Cadência consultiva de 3 passos para decisores C-Level"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* TIMELINE STEPS BUILDER */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Etapas da Sequência ({steps.length} passos)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  className="h-7 text-xs gap-1 border-sky-200 text-sky-700 hover:bg-sky-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Passo
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          value={step.step_type}
                          onChange={(e) => updateStep(idx, { step_type: e.target.value as any })}
                        >
                          <option value="email">✉️ E-mail Automático</option>
                          <option value="call_task">📞 Tarefa de Ligação</option>
                          <option value="task">📋 Tarefa Manual</option>
                        </select>
                      </div>

                      {step.step_type === 'email' && (
                        <div className="flex-1 min-w-[200px]">
                          <select
                            className="w-full h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            value={step.email_template_id || ''}
                            onChange={(e) => updateStep(idx, { email_template_id: Number(e.target.value) || undefined })}
                          >
                            <option value="">Selecione o Template de E-mail</option>
                            {templates
                              .filter((t) => t.status === 'active')
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Aguardar</span>
                        <input
                          type="number"
                          min="0"
                          value={step.delay_days}
                          onChange={(e) => updateStep(idx, { delay_days: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-12 h-6 rounded border border-slate-200 px-1 text-center font-bold text-xs"
                        />
                        <span>dias</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                        title="Remover passo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                disabled={!name.trim() || saving}
                onClick={() => void createSequence()}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-9 px-4 font-semibold gap-1.5"
              >
                {saving ? 'Criando Sequência...' : 'Salvar Cadência Completa'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* EXISTING SEQUENCES LIST */}
        <section className="space-y-3" aria-labelledby="sequences-heading">
          <h2 id="sequences-heading" className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-600" />
            Cadências Cadastradas ({data.length})
          </h2>

          {loading ? (
            <p className="text-xs text-slate-400">Carregando cadências...</p>
          ) : data.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma cadência configurada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((sequence) => (
                <div
                  key={sequence.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{sequence.name}</h3>
                      {sequence.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{sequence.description}</p>
                      )}
                    </div>
                    <Badge variant={sequence.active ? 'default' : 'outline'} className="text-[10px]">
                      {sequence.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600 text-[11px] block mb-1">Passos da régua:</span>
                    {sequence.steps.map((step) => {
                      const tmpl = templates.find((t) => t.id === step.email_template_id);
                      return (
                        <div key={step.id} className="flex items-center gap-2 text-slate-700">
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {step.position + 1}
                          </span>
                          <span className="font-medium">
                            {step.step_type === 'email' ? '✉️ E-mail' : step.step_type === 'call_task' ? '📞 Ligação' : '📋 Tarefa'}
                          </span>
                          {tmpl && <span className="text-slate-500 truncate">({tmpl.name})</span>}
                          <span className="text-slate-400 text-[11px] ml-auto shrink-0">+{step.delay_days}d</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* INSCREVER CONTATO MANUAl */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-slate-800">Inscrever Contato Manualmente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cadência Ativa</label>
              <select
                className="w-full h-8 rounded border border-slate-300 p-1.5 text-xs bg-white"
                value={enrollmentSequenceId}
                onChange={(e) => setEnrollmentSequenceId(e.target.value)}
              >
                <option value="">Selecione a Cadência</option>
                {data
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="w-48">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">ID do Contato no CRM</label>
              <Input
                inputMode="numeric"
                placeholder="Ex: 142"
                value={contactId}
                onChange={(e) => setContactId(e.target.value.replace(/\D/g, ''))}
                className="h-8 text-xs"
              />
            </div>
            <Button
              disabled={!enrollmentSequenceId || !contactId || saving}
              onClick={() => void enrollContact()}
              className="h-8 text-xs bg-sky-600 hover:bg-sky-700 font-semibold"
            >
              {saving ? 'Inscrevendo...' : 'Inscrever na Régua'}
            </Button>
          </CardContent>
        </Card>

        {/* CONTATOS EM CADÊNCIA */}
        <section className="space-y-3" aria-labelledby="enrollments-heading">
          <h2 id="enrollments-heading" className="text-sm font-bold text-slate-800">
            Contatos Inscritos em Cadências ({enrollments.length})
          </h2>

          {enrollments.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum contato em cadência no momento.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 text-xs">
                      {enrollment.contact_name} · <span className="text-sky-700">{enrollment.sequence_name}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Passo {enrollment.current_step + 1}/{enrollment.steps_count} · Status:{' '}
                      <span className="font-semibold text-slate-700">{enrollment.status}</span>
                      {enrollment.next_action_at && (
                        <span> · Próxima ação: {new Date(enrollment.next_action_at).toLocaleString('pt-BR')}</span>
                      )}
                      {enrollment.stop_reason && (
                        <span className="text-amber-600"> · Motivo: {enrollment.stop_reason}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {enrollment.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyEnrollmentId === enrollment.id}
                        onClick={() => void transitionEnrollment(enrollment, 'pause')}
                        className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pausar
                      </Button>
                    )}
                    {enrollment.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyEnrollmentId === enrollment.id}
                        onClick={() => void transitionEnrollment(enrollment, 'resume')}
                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Retomar
                      </Button>
                    )}
                    {['active', 'paused'].includes(enrollment.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyEnrollmentId === enrollment.id}
                        onClick={() => void transitionEnrollment(enrollment, 'stop')}
                        className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                      >
                        <StopCircle className="w-3 h-3 mr-1" />
                        Parar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceFrame>
  );
}
