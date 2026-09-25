'use client';

import { useEffect, useState } from 'react';
import { requestApi } from '@/lib/api-campaigns';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Sequence = { id: number; name: string; description?: string; active: boolean; steps: { id: number; position: number; delay_days: number; step_type: string; email_template_id?: number }[] };
type Template = { id: number; name: string; subject_template: string; status: string };
type Enrollment = { id: number; sequence_id: number; sequence_name: string; contact_id: number; contact_name: string; status: string; current_step: number; steps_count: number; next_action_at: string | null; stop_reason: string | null };
export default function SequencesPage() {
  const [data, setData] = useState<Sequence[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [stepType, setStepType] = useState('email');
  const [templateId, setTemplateId] = useState('');
  const [delayDays, setDelayDays] = useState(0);
  const [contactId, setContactId] = useState('');
  const [enrollmentSequenceId, setEnrollmentSequenceId] = useState('');
  const [busyEnrollmentId, setBusyEnrollmentId] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([
      requestApi<{ sequences: Sequence[] }>('/email_sequences', { signal: controller.signal }),
      requestApi<{ templates: Template[] }>('/email_templates?status=active', { signal: controller.signal }),
      requestApi<{ enrollments: Enrollment[] }>('/email_sequence_enrollments', { signal: controller.signal }),
    ])
      .then(([sequenceResult, templateResult, enrollmentResult]) => {
        if (!controller.signal.aborted) {
          setData(sequenceResult.sequences);
          setTemplates(templateResult.templates);
          setEnrollments(enrollmentResult.enrollments);
        }
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message || 'Falha ao carregar sequências.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  async function createSequence() {
    setSaving(true); setError('');
    try {
      const step = { position: 0, delay_days: delayDays, step_type: stepType, ...(stepType === 'email' ? { email_template_id: Number(templateId) } : {}) };
      await requestApi('/email_sequences', { method: 'POST', body: JSON.stringify({ sequence: { name: name.trim(), description, active: true, steps_attributes: [step] } }) });
      setName(''); setDescription(''); setRetry((value) => value + 1);
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao criar sequência.'); }
    finally { setSaving(false); }
  }
  async function enrollContact() {
    if (!contactId || !enrollmentSequenceId) return;
    setSaving(true); setError('');
    try {
      await requestApi('/email_sequence_enrollments', { method: 'POST', body: JSON.stringify({ enrollment: { sequence_id: Number(enrollmentSequenceId), contact_id: Number(contactId) } }) });
      setContactId(''); setRetry((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao incluir contato na cadência.'); }
    finally { setSaving(false); }
  }
  async function transitionEnrollment(enrollment: Enrollment, action: 'pause' | 'resume' | 'stop') {
    setBusyEnrollmentId(enrollment.id); setError('');
    try {
      await requestApi(`/email_sequence_enrollments/${enrollment.id}/${action}`, { method: 'POST' });
      setRetry((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao atualizar cadência.'); }
    finally { setBusyEnrollmentId(null); }
  }
  return <WorkspaceFrame title="Sequências Drip">
    <p>Cadências usam templates ativos e tarefas manuais. Respostas automáticas ainda dependem de uma integração inbound de e-mail.</p>
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby="new-sequence-heading">
      <h2 id="new-sequence-heading" className="font-semibold">Criar cadência</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Nome<Input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="text-sm">Descrição<Input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="text-sm">Primeira etapa<select className="block rounded border p-2" value={stepType} onChange={(event) => setStepType(event.target.value)}><option value="email">E-mail</option><option value="task">Tarefa</option><option value="call_task">Ligação</option></select></label>
        {stepType === 'email' && <label className="text-sm">Template ativo<select className="block rounded border p-2" value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Selecione</option>{templates.filter((template) => template.status === 'active').map((template) => <option key={template.id} value={template.id}>{template.name} · {template.subject_template}</option>)}</select></label>}
        <label className="text-sm">Aguardar dias<Input type="number" min="0" value={delayDays} onChange={(event) => setDelayDays(Number(event.target.value) || 0)} /></label>
        <Button disabled={!name.trim() || (stepType === 'email' && !templateId) || saving} onClick={() => void createSequence()}>{saving ? 'Salvando...' : 'Criar cadência'}</Button>
      </div>
    </section>
    {loading && <p role="status">Carregando sequências...</p>}
    {error && <div role="alert"><p>{error}</p><Button onClick={() => setRetry(retry + 1)}>Tentar novamente</Button></div>}
    {!loading && !error && <section className="space-y-3" aria-labelledby="sequences-heading"><h2 id="sequences-heading" className="font-semibold">Cadências</h2>{data.length === 0 ? <p>Nenhuma sequência cadastrada.</p> : data.map((sequence) => <article key={sequence.id} className="space-y-2 rounded border p-4">
      <h2 className="font-semibold">{sequence.name}</h2><p>{sequence.description}</p>
      <p>{sequence.active ? 'Ativa' : 'Inativa'}</p>
      <ol>{sequence.steps.map((step) => <li key={step.id}>Etapa {step.position + 1}: {step.step_type === 'call_task' ? 'Ligação' : step.step_type === 'task' ? 'Tarefa' : 'E-mail'}; aguarda {step.delay_days} dias{step.email_template_id ? `; template ${templates.find((template) => template.id === step.email_template_id)?.name || step.email_template_id}` : ''}.</li>)}</ol>
    </article>)}</section>}
    {!loading && !error && <section className="space-y-3 rounded-lg border p-4" aria-labelledby="enroll-contact-heading">
      <h2 id="enroll-contact-heading" className="font-semibold">Incluir contato</h2>
      {data.length === 0 ? <p>Crie uma cadência antes de incluir contatos.</p> : <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Cadência<select className="block rounded border p-2" value={enrollmentSequenceId} onChange={(event) => setEnrollmentSequenceId(event.target.value)}><option value="">Selecione</option>{data.filter((sequence) => sequence.active).map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.name}</option>)}</select></label>
        <label className="text-sm">ID do contato no CRM<Input inputMode="numeric" value={contactId} onChange={(event) => setContactId(event.target.value.replace(/\D/g, ''))} /></label>
        <Button disabled={!enrollmentSequenceId || !contactId || saving} onClick={() => void enrollContact()}>{saving ? 'Salvando...' : 'Incluir contato'}</Button>
      </div>}
    </section>}
    {!loading && !error && <section className="space-y-3" aria-labelledby="enrollments-heading"><h2 id="enrollments-heading" className="font-semibold">Contatos em cadências</h2>{enrollments.length === 0 ? <p>Nenhum contato inscrito.</p> : enrollments.map((enrollment) => <article key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-4">
      <div><h3 className="font-medium">{enrollment.contact_name} · {enrollment.sequence_name}</h3><p>Etapa {enrollment.current_step + 1}/{enrollment.steps_count} · {enrollment.status}{enrollment.next_action_at ? ` · próxima ação ${new Date(enrollment.next_action_at).toLocaleString('pt-BR')}` : ''}{enrollment.stop_reason ? ` · motivo: ${enrollment.stop_reason}` : ''}</p></div>
      <div className="flex gap-2">{enrollment.status === 'active' && <Button variant="outline" disabled={busyEnrollmentId === enrollment.id} onClick={() => void transitionEnrollment(enrollment, 'pause')}>Pausar</Button>}{enrollment.status === 'paused' && <Button variant="outline" disabled={busyEnrollmentId === enrollment.id} onClick={() => void transitionEnrollment(enrollment, 'resume')}>Retomar</Button>}{['active', 'paused'].includes(enrollment.status) && <Button variant="destructive" disabled={busyEnrollmentId === enrollment.id} onClick={() => void transitionEnrollment(enrollment, 'stop')}>Parar</Button>}</div>
    </article>)}</section>}
  </WorkspaceFrame>;
}
