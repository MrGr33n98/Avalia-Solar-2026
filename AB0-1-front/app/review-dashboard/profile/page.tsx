'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardContext } from '../DashboardLayoutClient';
import { DashboardSkeleton } from '@/components/review-dashboard/DashboardSkeleton';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Linkedin,
  Instagram,
  CheckCircle2,
  CircleDot,
  Eye,
  Save,
  X,
} from 'lucide-react';

export default function MeuPerfilPage() {
  const { user } = useAuth();
  const { loading, solutions } = useDashboardContext();

  if (loading) return <DashboardSkeleton variant="page" />;

  const reviewsCount = 0;
  const profileItems = [
    { label: 'Informações pessoais', done: !!(user?.name && user?.email) },
    { label: 'Foto de perfil', done: !!user?.avatar_url },
    { label: 'Informações profissionais', done: !!(user as any)?.profession },
    { label: 'Localização', done: !!(user?.city && user?.state) },
    { label: 'Redes sociais', done: false },
    { label: 'Soluções que usa', done: solutions.length > 0, detail: `${solutions.length}/5` },
    { label: 'Primeira avaliação', done: reviewsCount > 0 },
  ];

  const completedCount = profileItems.filter((i) => i.done).length;
  const profileCompletion = Math.round((completedCount / profileItems.length) * 100);

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Meu perfil"
        description="Gerencie suas informações pessoais e profissionais."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Meu perfil' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Form principal */}
        <div className="space-y-6">
          {/* Informações pessoais */}
          <FormSection title="Informações pessoais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome completo" icon={User} value={user?.name || ''} />
              <FormField label="E-mail" icon={Mail} value={user?.email || ''} type="email" />
              <FormField label="Telefone" icon={Phone} value={user?.phone || ''} type="tel" />
              <FormField
                label="Data de nascimento"
                value=""
                placeholder="dd/mm/aaaa"
              />
            </div>
          </FormSection>

          {/* Foto de perfil */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Foto de perfil</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || 'Avatar'}
                    className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl font-bold">
                    {(user?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-600">JPG, PNG ou GIF. Max 5MB.</p>
                <div className="mt-2 flex gap-2">
                  <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                    Alterar foto
                  </button>
                  <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informações profissionais */}
          <FormSection title="Informações profissionais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Profissão" icon={Briefcase} value={(user as any)?.profession || ''} />
              <FormField label="Empresa" value="" placeholder="Onde você trabalha" />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Sobre você
                </label>
                <textarea
                  rows={3}
                  placeholder="Conte um pouco sobre sua experiência com energia solar..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                />
              </div>
            </div>
          </FormSection>

          {/* Localização */}
          <FormSection title="Localização">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Cidade" icon={MapPin} value={user?.city || ''} />
              <FormField label="Estado" value={user?.state || ''} />
              <FormField label="País" value="Brasil" />
            </div>
          </FormSection>

          {/* Redes sociais */}
          <FormSection title="Redes sociais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="LinkedIn" icon={Linkedin} value="" placeholder="linkedin.com/in/" />
              <FormField label="Instagram" icon={Instagram} value="" placeholder="@usuario" />
              <FormField label="Website" icon={Globe} value="" placeholder="https://" />
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Eye className="h-4 w-4" />
                Pré-visualizar
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <Save className="h-4 w-4" />
                Salvar alterações
              </button>
            </div>
          </div>
        </div>

        {/* Rail lateral — Progress */}
        <div className="space-y-6">
          {/* Progresso do perfil */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              {/* Circular progress */}
              <div className="relative h-14 w-14 shrink-0">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(profileCompletion / 100) * 150.8} 150.8`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                  {profileCompletion}%
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Perfil completo</p>
                <p className="text-xs text-slate-500">
                  {profileCompletion < 100 ? 'Continue assim!' : 'Excelente!'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {profileItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <CircleDot className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                  {item.detail && (
                    <span className="text-xs text-slate-400">{item.detail}</span>
                  )}
                  <span
                    className={`text-xs font-medium ${item.done ? 'text-green-600' : 'text-slate-400'}`}
                  >
                    {item.done ? 'Completo' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="#"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Completar perfil →
            </a>
          </div>

          {/* Dica */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2 shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Dica rápida</p>
                <p className="mt-1 text-xs text-blue-700 leading-4">
                  Perfis completos recebem até 2x mais visualizações. Adicione foto, localização e
                  redes sociais.
                </p>
                <a
                  href="#"
                  className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Saber mais →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function FormField({
  label,
  icon: Icon,
  value,
  placeholder,
  type = 'text',
}: {
  label: string;
  icon?: typeof User;
  value: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        )}
        <input
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 ${
            Icon ? 'pl-9' : 'pl-3'
          }`}
        />
      </div>
    </div>
  );
}
