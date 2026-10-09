'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar as CalendarIcon,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  formatDate,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  proposalChatUrl,
} from '@/lib/marketplace-proposals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { CompanyMark } from './ProposalSummary';

const meetingTypes = [
  { value: 'video', label: 'Videoconferência', desc: 'Reunião online', icon: Video, badge: 'Recomendado' },
  { value: 'presence', label: 'Presencial', desc: 'Na sede da empresa', icon: Building2 },
  { value: 'site_visit', label: 'Visita técnica', desc: 'No local do projeto', icon: MapPin },
];

const availableTimeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

const meetingObjectives = [
  { id: 'technical', label: 'Esclarecer dúvidas técnicas' },
  { id: 'payment', label: 'Discutir condições de pagamento' },
  { id: 'deadline', label: 'Confirmar prazo de instalação' },
  { id: 'visit', label: 'Avaliar visita técnica' },
  { id: 'negotiation', label: 'Negociar ajustes na proposta' },
  { id: 'others', label: 'Outros' },
];

const statusLabels: Record<string, string> = {
  requested: 'Aguardando confirmação da empresa',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Realizada',
};

export function ProposalMeeting({
  proposal,
  onSaved,
}: {
  proposal: MarketplaceProposal;
  onSaved: (meeting: NonNullable<MarketplaceProposal['meetings']>[number]) => void;
}) {
  const [type, setType] = useState('video');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('15:00');
  const [meetingTitle, setMeetingTitle] = useState(
    `Reunião sobre a proposta ${proposal.version?.title || 'residencial'}`
  );
  const [message, setMessage] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(['technical', 'payment']);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const powerVal =
    getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'installed_power', 'potencia']) ||
    'Não informado';
  const genVal =
    getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao']) ||
    'Não informado';
  const deadlineVal =
    getProposalRawTerm(proposal, ['installation_deadline', 'installation_time', 'prazo']) ||
    'Não informado';
  const displayPrice = getProposalDisplayPrice(proposal);

  function toggleObjective(id: string) {
    setSelectedObjectives((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const scheduled = new Date(`${day}T${time}`);
    if (
      !day ||
      !time ||
      !Number.isFinite(scheduled.getTime()) ||
      scheduled.getTime() <= Date.now()
    ) {
      setError('Escolha uma data e um horário futuros para agendar a reunião.');
      return;
    }

    const compiledNotes = [
      meetingTitle ? `Título: ${meetingTitle}` : '',
      selectedObjectives.length ? `Objetivos: ${selectedObjectives.join(', ')}` : '',
      message ? `Mensagem: ${message}` : '',
    ].filter(Boolean).join('\n');

    setBusy(true);
    setError('');
    try {
      const { meeting } = await marketplaceProposalsApi.createMeeting(proposal.id, {
        meeting_type: type === 'presence' ? 'phone' : type,
        scheduled_at: scheduled.toISOString(),
        notes: compiledNotes,
      });
      onSaved(meeting);
      setSaved(true);
    } catch {
      setError('Não foi possível solicitar a reunião. Confira sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-blue-900 shadow-2xs">
        <Clock className="h-5 w-5 text-blue-600 shrink-0" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Duração estimada: 30 a 60 minutos</span>
          <span className="block text-blue-700 mt-0.5">
            A empresa será notificada e poderá confirmar ou sugerir outro horário se necessário.
          </span>
        </div>
      </div>

      {saved ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4 shadow-2xs">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="text-lg font-bold text-emerald-900">Reunião solicitada com sucesso!</h3>
          <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
            Sua preferência de data e horário foi enviada para a {proposal.company.name}. Acompanhe as confirmações aqui ou na conversa.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaved(false)}
            className="rounded-xl font-semibold text-xs border-emerald-300 text-emerald-800 bg-white"
          >
            Agendar nova reunião
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Scheduling Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Format Selection Cards (Videoconferência, Presencial, Visita técnica) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Selecione o formato da reunião
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {meetingTypes.map(({ value, label, desc, icon: Icon, badge }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      'relative flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all',
                      type === value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs'
                        : 'border-border/80 bg-card hover:border-border hover:bg-muted/40'
                    )}
                  >
                    {badge && (
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                        {badge}
                      </span>
                    )}
                    <Icon className={cn('h-6 w-6 mb-3', type === value ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <span className="block font-bold text-xs text-foreground">{label}</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">{desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
              {/* Date picker */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground block">
                  3. Selecione a data
                </label>
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={day ? new Date(`${day}T12:00:00`) : undefined}
                  onSelect={(selected) => {
                    if (selected)
                      setDay(
                        `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`
                      );
                  }}
                  disabled={busy ? true : { before: new Date(`${minDate}T00:00:00`) }}
                  className="w-full rounded-xl border border-border/60 p-2"
                  classNames={{
                    months: 'w-full',
                    month: 'w-full space-y-3',
                    head_row: 'grid grid-cols-7 text-center',
                    row: 'mt-1 grid grid-cols-7 text-center',
                    head_cell: 'text-center text-[10px] font-bold text-muted-foreground uppercase',
                    cell: 'min-w-0 text-center',
                    day: 'h-9 w-full min-w-0 rounded-lg text-xs hover:bg-muted font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    nav_button: 'h-8 w-8 rounded-lg border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground',
                  }}
                />
              </div>

              {/* Time Slots grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground block">
                  4. Selecione o horário
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={cn(
                        'h-10 rounded-xl border text-xs font-bold transition-all',
                        time === slot
                          ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                          : 'border-border/70 bg-card text-foreground hover:bg-muted/50'
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {day && (
                  <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 mt-3">
                    Data selecionada: <strong>{formatDate(day)}</strong> às <strong>{time}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Meeting Info Form */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                5. Informações da reunião
              </h4>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-foreground">
                  Título da reunião <span className="text-rose-500">*</span>
                  <Input
                    type="text"
                    required
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="mt-1.5 h-10 rounded-xl border-border text-xs"
                  />
                </label>

                <label className="block text-xs font-semibold text-foreground">
                  Mensagem para a empresa (opcional)
                  <Textarea
                    rows={3}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Olá, gostaria de conversar sobre os detalhes da proposta, condições de pagamento e prazo..."
                    className="mt-1.5 rounded-xl border-border text-xs"
                  />
                  <span className="block text-right text-[10px] text-muted-foreground mt-1">
                    {message.length}/500
                  </span>
                </label>
              </div>

              {/* Objectives Checkboxes */}
              <div className="space-y-3 border-t border-border/60 pt-4">
                <label className="text-xs font-bold text-foreground block">
                  6. Objetivos da reunião (opcional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {meetingObjectives.map((obj) => (
                    <label
                      key={obj.id}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-xs font-medium transition-all select-none',
                        selectedObjectives.includes(obj.id)
                          ? 'border-primary/50 bg-primary/5 text-foreground'
                          : 'border-border/60 bg-card text-muted-foreground hover:border-border'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedObjectives.includes(obj.id)}
                        onChange={() => toggleObjective(obj.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                      />
                      <span>{obj.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-destructive bg-destructive/10 p-3 rounded-xl">
                {error}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={busy || !day}
                size="lg"
                className="flex-1 gap-2 rounded-xl font-bold bg-primary shadow-xs"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{busy ? 'Confirmando…' : 'Confirmar reunião'}</span>
              </Button>
            </div>
          </div>

          {/* Right Sidebar Widgets (Company Card, Proposal Summary, Support) */}
          <div className="space-y-6">
            {/* Widget 1: Company Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <CompanyMark proposal={proposal} />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{proposal.company.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{getProposalLocation(proposal)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-border/60 pt-3">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  {Number(proposal.company.rating_avg || 4.8).toFixed(1)}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Empresa verificada
                </span>
              </div>
            </div>

            {/* Widget 2: Proposal Summary */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/60 pb-3">
                Resumo da proposta
              </h4>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Proposta</dt>
                  <dd className="font-mono font-bold text-foreground">{proposal.reference}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Potência do sistema</dt>
                  <dd className="font-bold text-foreground">{powerVal}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Geração estimada</dt>
                  <dd className="font-bold text-foreground">{genVal}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Valor total</dt>
                  <dd className="font-bold tabular-nums text-primary">{displayPrice.formatted}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Prazo de instalação</dt>
                  <dd className="font-medium text-foreground">{deadlineVal}</dd>
                </div>
              </dl>
            </div>

            {/* Widget 3: Help / Support */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Precisa de ajuda?</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fale com um consultor do Avalia Solar para entender qual a melhor data ou formato de reunião.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full font-semibold text-xs rounded-xl border-border">
                <Link href={proposalChatUrl(proposal)}>Conversar no WhatsApp</Link>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Existing Scheduled Meetings list */}
      {!!proposal.meetings?.length && (
        <section className="border-t border-border/60 pt-6 space-y-4">
          <h3 className="font-bold text-sm text-foreground">Suas reuniões agendadas</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proposal.meetings.map((meeting) => (
              <li key={meeting.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {meetingTypes.find((item) => item.value === meeting.meeting_type)?.label || 'Reunião'}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    {statusLabels[meeting.status] || meeting.status}
                  </span>
                </div>
                <p className="text-muted-foreground font-medium">
                  {formatDate(meeting.scheduled_at, true)}
                </p>
                {meeting.notes && <p className="text-muted-foreground text-[11px] whitespace-pre-line border-t border-border/40 pt-2">{meeting.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
