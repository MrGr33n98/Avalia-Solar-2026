'use client';

import React, { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PersonalDetails, ProfessionalDetails, ProfileSavePayload } from '../types';

interface ProfileDetailsTabProps {
  initialPersonal: PersonalDetails;
  initialProfessional: ProfessionalDetails;
  /** Deve rejeitar quando a persistência falhar; o sucesso só é exibido após resolver. */
  onSave: (data: ProfileSavePayload) => Promise<void>;
}

const MAX_NAME = 120;
const MAX_HEADLINE = 160;
const MAX_SUMMARY = 2000;
const MAX_COMPANY = 160;

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const disabledClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-400 cursor-not-allowed';
const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';
const UNAVAILABLE_HINT = 'Campo ainda não disponível para salvamento.';

export function validateProfileDetails({ personal, professional }: ProfileSavePayload): string | null {
  if (!personal.first_name.trim()) return 'Informe seu nome.';
  if (`${personal.first_name} ${personal.last_name}`.trim().length > MAX_NAME) {
    return `Nome completo deve ter até ${MAX_NAME} caracteres.`;
  }
  if (personal.headline.length > MAX_HEADLINE) return `Título deve ter até ${MAX_HEADLINE} caracteres.`;
  if (personal.summary.length > MAX_SUMMARY) return `Biografia deve ter até ${MAX_SUMMARY} caracteres.`;
  if (professional.company_name.length > MAX_COMPANY) return `Empresa deve ter até ${MAX_COMPANY} caracteres.`;
  return null;
}

export function ProfileDetailsTab({
  initialPersonal,
  initialProfessional,
  onSave,
}: ProfileDetailsTabProps) {
  const [personal, setPersonal] = useState<PersonalDetails>(initialPersonal);
  const [professional, setProfessional] = useState<ProfessionalDetails>(initialProfessional);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPersonal(initialPersonal), [initialPersonal]);
  useEffect(() => setProfessional(initialProfessional), [initialProfessional]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { personal, professional };
    const validationError = validateProfileDetails(payload);
    setSavedSuccess(false);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" data-testid="profile-details-form" noValidate>
      {/* Cabeçalho da Seção */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dados do Perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie suas informações no portal Avalia Solar.
        </p>
      </div>

      {/* Bloco 1: Dados Pessoais */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Informações Pessoais</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-first-name" className={labelClass}>
              Nome
            </label>
            <input
              id="profile-first-name"
              type="text"
              value={personal.first_name}
              onChange={(e) => setPersonal({ ...personal, first_name: e.target.value })}
              className={inputClass}
              maxLength={MAX_NAME}
              required
            />
          </div>

          <div>
            <label htmlFor="profile-last-name" className={labelClass}>
              Sobrenome
            </label>
            <input
              id="profile-last-name"
              type="text"
              value={personal.last_name}
              onChange={(e) => setPersonal({ ...personal, last_name: e.target.value })}
              className={inputClass}
              maxLength={MAX_NAME}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-pronouns" className={labelClass}>
              Pronomes
            </label>
            <select id="profile-pronouns" disabled className={disabledClass} value="">
              <option value="">Não disponível</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">{UNAVAILABLE_HINT}</p>
          </div>

          <div>
            <label htmlFor="profile-region" className={labelClass}>
              Região / Estado
            </label>
            <input
              id="profile-region"
              type="text"
              value={personal.region}
              readOnly
              disabled
              placeholder="Não informado"
              className={disabledClass}
            />
            <p className="text-[11px] text-slate-400 mt-1">Definido no cadastro da conta.</p>
          </div>
        </div>

        <div>
          <label htmlFor="profile-headline" className={labelClass}>
            Título Profissional (Headline)
          </label>
          <input
            id="profile-headline"
            type="text"
            value={personal.headline}
            onChange={(e) => setPersonal({ ...personal, headline: e.target.value })}
            placeholder="Ex: Engenheiro Eletricista | Projetos Fotovoltaicos"
            className={inputClass}
            maxLength={MAX_HEADLINE}
          />
          <p className="text-[11px] text-slate-400 mt-1">Salvo como profissão no seu perfil de avaliador.</p>
        </div>

        <div>
          <label htmlFor="profile-summary" className={labelClass}>
            Biografia &amp; Resumo da Atuação
          </label>
          <textarea
            id="profile-summary"
            rows={4}
            value={personal.summary}
            onChange={(e) => setPersonal({ ...personal, summary: e.target.value })}
            placeholder="Conte um pouco sobre sua experiência com energia solar..."
            className={`${inputClass} resize-y`}
            maxLength={MAX_SUMMARY}
          />
        </div>
      </div>

      {/* Bloco 2: Dados Profissionais */}
      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Detalhes Profissionais</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-company" className={labelClass}>
              Empresa
            </label>
            <input
              id="profile-company"
              type="text"
              value={professional.company_name}
              onChange={(e) => setProfessional({ ...professional, company_name: e.target.value })}
              placeholder="Não informado"
              className={inputClass}
              maxLength={MAX_COMPANY}
            />
          </div>

          <div>
            <label htmlFor="profile-industry" className={labelClass}>
              Setor de Atuação
            </label>
            <input id="profile-industry" type="text" disabled placeholder="Não disponível" className={disabledClass} />
            <p className="text-[11px] text-slate-400 mt-1">{UNAVAILABLE_HINT}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-company-size" className={labelClass}>
              Porte da Empresa
            </label>
            <select id="profile-company-size" disabled className={disabledClass} value="">
              <option value="">Não disponível</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">{UNAVAILABLE_HINT}</p>
          </div>

          <div>
            <label htmlFor="profile-role-function" className={labelClass}>
              Cargo / Função Técnica
            </label>
            <input
              id="profile-role-function"
              type="text"
              disabled
              placeholder="Não disponível"
              className={disabledClass}
            />
            <p className="text-[11px] text-slate-400 mt-1">{UNAVAILABLE_HINT}</p>
          </div>
        </div>
      </div>

      {/* Barra de Ação de Salvamento */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div aria-live="polite">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              Alterações salvas com sucesso!
            </span>
          )}
          {error && (
            <span
              role="alert"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600"
              data-testid="profile-save-error"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 shrink-0"
          data-testid="save-profile-button"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
