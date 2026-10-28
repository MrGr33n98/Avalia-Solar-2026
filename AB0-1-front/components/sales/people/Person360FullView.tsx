'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateActivityModal from '@/components/sales/create/CreateActivityModal';
import CreateTaskModal from '@/components/sales/create/CreateTaskModal';
import SendEmailModal from '@/components/sales/create/SendEmailModal';
import CreateCompanyModal from '@/components/sales/create/CreateCompanyModal';

import PersonMapHero from '@/components/sales/people/PersonMapHero';
import PersonHeaderCard from '@/components/sales/people/PersonHeaderCard';
import PersonActionBar from '@/components/sales/people/PersonActionBar';
import PersonCompaniesCard from '@/components/sales/people/PersonCompaniesCard';
import PersonTasksCard from '@/components/sales/people/PersonTasksCard';
import PersonActivitiesCard from '@/components/sales/people/PersonActivitiesCard';
import PersonEmailsSequencesCard from '@/components/sales/people/PersonEmailsSequencesCard';
import PersonTimelineCard, { TimelineEvent } from '@/components/sales/people/PersonTimelineCard';
import PersonSummarySidebar from '@/components/sales/people/PersonSummarySidebar';

import { salesApi, ApiContactMethod } from '@/lib/api/sales/client';

interface ContactDetail {
  id: number;
  first_name: string;
  last_name?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
  decision_role?: string | null;
  owner_name?: string;
  bio?: string;
  territory?: string;
  created_via?: string;
  account_city?: string | null;
  account_state?: string | null;
  sales_account_id?: number | null;
  account?: {
    id: number;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  employments?: Array<{
    id: number;
    sales_account_id?: number;
    account_name?: string;
    job_title?: string;
    department?: string;
    seniority?: string;
    relationship_type?: string;
    is_current?: boolean;
    is_primary?: boolean;
    city?: string | null;
    state?: string | null;
  }>;
  opportunities?: Array<{
    id: number;
    name?: string;
    value_cents?: number;
    currency?: string;
    stage_name?: string;
    status?: string;
    probability?: number;
    expected_close_date?: string | null;
  }>;
  buying_opportunities?: Array<{
    id: number;
    opportunity_id?: number;
    opportunity_name?: string;
    value_cents?: number;
    stage_name?: string;
    status?: string;
    probability?: number;
    role?: string;
    support_level?: string;
  }>;
  tasks?: Array<{
    id: number;
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    task_type?: string;
    due_at?: string | null;
    completed_at?: string | null;
  }>;
  activities?: Array<{
    id: number;
    activity_type: string;
    subject: string;
    body?: string | null;
    description?: string | null;
    occurred_at: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    color?: string;
  }>;
  contact_methods?: ApiContactMethod[];
  custom_fields?: Record<string, string | number | boolean>;
  attachments?: Array<{ name: string; size: string; date: string; url?: string }>;
  last_contact_at?: string | null;
}

export default function Person360FullView({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [engagement, setEngagement] = useState<{ sent: number; delivered: number; opens: number; clicks: number }>({
    sent: 0,
    delivered: 0,
    opens: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<'activity' | 'email' | 'task' | 'add_company' | null>(null);
  const [selectedEmailAddress, setSelectedEmailAddress] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchPersonData = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/v1/sales/contacts/${contactId}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/v1/sales/contacts/${contactId}/timeline`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/v1/sales/contacts/${contactId}/engagement`, { credentials: 'include' })
        .then((r) => r.json())
        .catch(() => ({ engagement: { sent: 0, delivered: 0, opens: 0, clicks: 0 } })),
    ])
      .then(([contactRes, timelineRes, engagementRes]) => {
        setContact(contactRes.contact ?? null);
        setTimeline(timelineRes.timeline ?? []);
        if (engagementRes?.engagement) {
          setEngagement(engagementRes.engagement);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os detalhes do contato.');
      })
      .finally(() => setLoading(false));
  }, [contactId]);

  useEffect(() => {
    fetchPersonData();
  }, [fetchPersonData]);

  const handleSaveNote = async () => {
    if (!noteText.trim() || !contact) return;
    setSubmittingNote(true);
    try {
      await salesApi.createActivity({
        activity_type: 'note',
        subject: 'Nota Comercial',
        body: noteText,
        sales_contact_id: contact.id,
        sales_account_id: contact.account?.id,
      });
      setNoteText('');
      fetchPersonData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar nota.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUpdateBio = async (newBio: string) => {
    if (!contact) return;
    await salesApi.updateContact(contact.id, {
      metadata: { bio: newBio },
    });
    setContact((prev) => (prev ? { ...prev, bio: newBio } : null));
  };

  const handleUpdateTags = async (tagNames: string[]) => {
    if (!contact) return;
    await salesApi.updateContact(contact.id, {
      tag_names: tagNames,
    });
    fetchPersonData();
  };

  const handleUpdateCustomFields = async (updatedFields: Record<string, string | number | boolean>) => {
    if (!contact) return;
    await salesApi.updateContact(contact.id, {
      metadata: { custom_fields: updatedFields },
    });
    setContact((prev) => (prev ? { ...prev, custom_fields: updatedFields } : null));
  };

  const handleToggleTask = async (taskId: number, newStatus: string) => {
    await salesApi.updateTask(taskId, {
      status: newStatus,
    });
    fetchPersonData();
  };

  const handleScrollToNote = () => {
    const el = document.getElementById('write-note-composer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const textarea = el.querySelector('textarea');
      if (textarea) textarea.focus();
    }
  };

  const handleSendText = () => {
    if (!contact?.whatsapp && !contact?.phone) {
      alert('Nenhum número de WhatsApp ou telefone cadastrado.');
      return;
    }
    const cleanNum = (contact.whatsapp || contact.phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNum}?text=Olá%20${encodeURIComponent(contact.first_name)},%20tudo%20bem?`, '_blank');
  };

  const handleCall = () => {
    if (!contact?.phone && !contact?.whatsapp) {
      alert('Nenhum número de telefone cadastrado.');
      return;
    }
    window.location.href = `tel:${contact.phone || contact.whatsapp}`;
  };

  if (loading) {
    return (
      <SalesLayoutWrapper>
        <div className="py-24 text-center space-y-3">
          <RotateCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Carregando Perfil Person 360° no padrão Nutshell CRM...</p>
        </div>
      </SalesLayoutWrapper>
    );
  }

  if (error || !contact) {
    return (
      <SalesLayoutWrapper>
        <div className="py-20 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <p className="text-sm font-bold text-slate-900">{error || 'Pessoa não encontrada.'}</p>
          <Link href="/dashboard/sales/people">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar para Pessoas
            </Button>
          </Link>
        </div>
      </SalesLayoutWrapper>
    );
  }

  // Combine opportunities from direct + buying committee
  const allOpps = [
    ...(contact.opportunities || []),
    ...(contact.buying_opportunities?.map((bo) => ({
      id: bo.opportunity_id || bo.id,
      name: bo.opportunity_name,
      value_cents: bo.value_cents,
      stage_name: bo.stage_name,
      status: bo.status,
      probability: bo.probability,
    })) || []),
  ].filter((o, idx, self) => idx === self.findIndex((t) => t.id === o.id));

  return (
    <SalesLayoutWrapper>
      <div className="space-y-4 font-sans max-w-none pb-12">
        {/* Navigation Breadcrumb Back */}
        <div>
          <Link
            href="/dashboard/sales/people"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar para lista de Pessoas
          </Link>
        </div>

        {/* 1. HERO BANNER: Map Banner */}
        <PersonMapHero
          name={contact.name}
          city={contact.account_city || contact.account?.city}
          state={contact.account_state || contact.account?.state}
          companyName={contact.account?.name}
        />

        {/* 2. IDENTITY HEADER CARD */}
        <PersonHeaderCard
          contactId={contact.id}
          name={contact.name}
          firstName={contact.first_name}
          lastName={contact.last_name}
          jobTitle={contact.job_title}
          decisionRole={contact.decision_role}
          bio={contact.bio}
          ownerName={contact.owner_name}
          account={contact.account}
          onUpdateBio={handleUpdateBio}
        />

        {/* 3. QUICK ACTION BAR (5 Horizontal Buttons) */}
        <PersonActionBar
          onLogActivity={() => setActiveModal('activity')}
          onWriteNote={handleScrollToNote}
          onSendEmail={() => setActiveModal('email')}
          onSendText={handleSendText}
          onCallContact={handleCall}
          phone={contact.phone}
          whatsapp={contact.whatsapp}
        />

        {/* 4. CLEAN 2-COLUMN GRID (Principal 68% / Sidebar 32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
          {/* MAIN COLUMN */}
          <div className="space-y-4 min-w-0">
            {/* 4.1 Companies Card */}
            <PersonCompaniesCard
              companies={contact.employments || []}
              primaryAccount={contact.account}
              jobTitle={contact.job_title}
              onAddCompany={() => setActiveModal('add_company')}
            />

            {/* 4.2 Tasks Card */}
            <PersonTasksCard
              tasks={contact.tasks || []}
              onToggleTask={handleToggleTask}
              onAddTask={() => setActiveModal('task')}
            />

            {/* 4.3 Activities Card */}
            <PersonActivitiesCard
              activities={contact.activities || []}
              onScheduleActivity={() => setActiveModal('activity')}
            />

            {/* 4.4 Emails & Sequences Card */}
            <PersonEmailsSequencesCard
              onEnroll={() => setActiveModal('email')}
            />

            {/* 4.5 Timeline & Notes Feed */}
            <PersonTimelineCard
              timeline={timeline}
              contactEmail={contact.email}
              noteText={noteText}
              onChangeNoteText={setNoteText}
              onSaveNote={handleSaveNote}
              submittingNote={submittingNote}
            />
          </div>

          {/* SIDEBAR COLUMN (360° Info) */}
          <div className="space-y-4 lg:sticky lg:top-14">
            <PersonSummarySidebar
              contactId={contact.id}
              contactName={contact.name}
              contactMethods={contact.contact_methods || []}
              onContactMethodsUpdated={(updated) => {
                setContact((prev) => (prev ? { ...prev, contact_methods: updated } : null));
              }}
              onSendEmailWithAddress={(targetEmail) => {
                setSelectedEmailAddress(targetEmail);
                setActiveModal('email');
              }}
              email={contact.email}
              phone={contact.phone}
              whatsapp={contact.whatsapp}
              territory={contact.territory || [contact.account?.city, contact.account?.state].filter(Boolean).join(' - ')}
              lastContactAt={contact.last_contact_at}
              createdVia={contact.created_via}
              tags={contact.tags || []}
              opportunities={allOpps}
              customFields={contact.custom_fields || {}}
              attachments={contact.attachments || []}
              engagement={engagement}
              onSendEmail={() => setActiveModal('email')}
              onSendWhatsApp={handleSendText}
              onCall={handleCall}
              onUpdateTags={handleUpdateTags}
              onUpdateCustomFields={handleUpdateCustomFields}
            />
          </div>
        </div>

        {/* MODALS */}
        <CreateActivityModal
          open={activeModal === 'activity'}
          onClose={() => setActiveModal(null)}
          contactId={contact.id}
          accountId={contact.account?.id}
          onSuccess={fetchPersonData}
        />

        <SendEmailModal
          open={activeModal === 'email'}
          onClose={() => {
            setActiveModal(null);
            setSelectedEmailAddress(null);
          }}
          contactId={contact.id}
          accountId={contact.account?.id}
          contactEmail={selectedEmailAddress || contact.email || ''}
          contactName={contact.name}
          companyName={contact.account?.name}
          onSuccess={fetchPersonData}
        />

        <CreateTaskModal
          open={activeModal === 'task'}
          onClose={() => setActiveModal(null)}
          accountId={contact.account?.id || contact.sales_account_id || contact.employments?.find((e) => e.is_primary)?.sales_account_id || undefined}
          contactId={contact.id}
          onSuccess={fetchPersonData}
        />

        <CreateCompanyModal
          open={activeModal === 'add_company'}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchPersonData}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
