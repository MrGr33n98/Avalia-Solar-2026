'use client';

import { useState, type FormEvent } from 'react';
import { CalendarClock, MapPin, Phone, Video } from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import { formatDate } from '@/lib/marketplace-proposals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const meetingTypes = [
  { value: 'video', label: 'Videochamada', icon: Video },
  { value: 'phone', label: 'Ligação', icon: Phone },
  { value: 'site_visit', label: 'Visita técnica', icon: MapPin },
];
const statusLabels: Record<string, string> = { requested: 'Aguardando confirmação da empresa', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Realizada' };

export function ProposalMeeting({ proposal, onSaved }: { proposal: MarketplaceProposal; onSaved: (meeting: NonNullable<MarketplaceProposal['meetings']>[number]) => void }) {
  const [type, setType] = useState('video');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const scheduled = new Date(`${day}T${time}`);
    if (!day || !time || !Number.isFinite(scheduled.getTime()) || scheduled.getTime() <= Date.now()) {
      setError('Escolha uma data e um horário futuros para solicitar a reunião.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { meeting } = await marketplaceProposalsApi.createMeeting(proposal.id, { meeting_type: type, scheduled_at: scheduled.toISOString(), notes: notes.trim() });
      onSaved(meeting);
      setSaved(true);
    } catch { setError('Não foi possível solicitar a reunião. Confira sua conexão e tente novamente.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    {saved ? <div role="status" className="rounded-xl bg-primary/5 p-5"><CalendarClock className="h-7 w-7 text-primary" /><h3 className="mt-3 font-semibold">Reunião solicitada</h3><p className="mt-2 text-sm text-muted-foreground">Sua preferência foi enviada. A empresa ainda precisa confirmar o horário.</p><Button variant="outline" className="mt-4" onClick={() => { setSaved(false); setDay(''); setTime(''); setNotes(''); }}>Solicitar outra reunião</Button></div> : <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy}><legend className="mb-3 text-sm font-medium">Como você prefere conversar?</legend><div className="grid grid-cols-3 gap-2">{meetingTypes.map(({ value, label, icon: Icon }) => <label key={value} className={cn('flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-1 py-3 text-center text-[11px] sm:text-xs', type === value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground')}><input type="radio" name="meeting-type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only peer" /><Icon className="h-5 w-5 peer-focus-visible:outline peer-focus-visible:outline-2" /><span>{label}</span></label>)}</div></fieldset>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block text-sm font-medium" htmlFor="meeting-day">Data<Input id="meeting-day" type="date" required min={minDate} value={day} onChange={(event) => setDay(event.target.value)} disabled={busy} className="mt-2 min-w-0" /></label><label className="block text-sm font-medium" htmlFor="meeting-time">Horário<Input id="meeting-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} disabled={busy} className="mt-2" /></label></div>
      <p className="text-xs text-muted-foreground">Horário local do seu dispositivo. A disponibilidade será confirmada pela empresa.</p>
      <label className="block text-sm font-medium" htmlFor="meeting-notes">Observações (opcional)<Textarea id="meeting-notes" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={busy} placeholder="Ex.: gostaria de esclarecer o prazo de instalação." className="mt-2" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Enviando solicitação…' : 'Solicitar reunião'}</Button>
    </form>}
    {!!proposal.meetings?.length && <section className="border-t border-border pt-5"><h3 className="font-semibold">Suas reuniões</h3><ul className="mt-3 divide-y divide-border">{proposal.meetings.map((meeting) => <li key={meeting.id} className="py-3 text-sm"><p className="font-medium">{meetingTypes.find((item) => item.value === meeting.meeting_type)?.label || 'Reunião'} · {formatDate(meeting.scheduled_at, true)}</p><p className="mt-1 text-muted-foreground">{statusLabels[meeting.status] || meeting.status}</p>{meeting.notes && <p className="mt-2 whitespace-pre-line">{meeting.notes}</p>}</li>)}</ul></section>}
  </div>;
}
