'use client';

import React, { useState } from 'react';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { PersonalDetails, ProfessionalDetails } from '../types';

interface ProfileDetailsTabProps {
  initialPersonal: PersonalDetails;
  initialProfessional: ProfessionalDetails;
  onSave: (data: { personal: PersonalDetails; professional: ProfessionalDetails }) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSave({ personal, professional });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // erro tratado pelo toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" data-testid="profile-details-form">
      {/* Cabeçalho da Seção */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dados do Perfil
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie suas informações públicas e corporativas no portal Avalia Solar.
        </p>
      </div>

      {/* Bloco 1: Dados Pessoais */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Informações Pessoais</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome
            </label>
            <input
              type="text"
              value={personal.first_name}
              onChange={(e) => setPersonal({ ...personal, first_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sobrenome
            </label>
            <input
              type="text"
              value={personal.last_name}
              onChange={(e) => setPersonal({ ...personal, last_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pronomes
            </label>
            <select
              value={personal.pronouns}
              onChange={(e) => setPersonal({ ...personal, pronouns: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="He/Him">Ele / Dele (He/Him)</option>
              <option value="She/Her">Ela / Dela (She/Her)</option>
              <option value="They/Them">Neutro (They/Them)</option>
              <option value="Other">Outro / Prefiro não informar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Região / Estado
            </label>
            <input
              type="text"
              value={personal.region}
              onChange={(e) => setPersonal({ ...personal, region: e.target.value })}
              placeholder="Ex: São Paulo, SP ou Brasil"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Título Profissional (Headline)
          </label>
          <input
            type="text"
            value={personal.headline}
            onChange={(e) => setPersonal({ ...personal, headline: e.target.value })}
            placeholder="Ex: Fundador & Especialista em Homologação Solar | Avalia Solar"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Esse título aparecerá em destaque nas suas avaliações públicas e cotações.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Biografia & Resumo da Atuação
          </label>
          <textarea
            rows={4}
            value={personal.summary}
            onChange={(e) => setPersonal({ ...personal, summary: e.target.value })}
            placeholder="Conte um pouco sobre sua experiência técnica com instalações e projetos solares..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
          />
        </div>
      </div>

      {/* Bloco 2: Dados Profissionais B2B */}
      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Detalhes Profissionais</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Empresa
            </label>
            <input
              type="text"
              value={professional.company_name}
              onChange={(e) => setProfessional({ ...professional, company_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Setor de Atuação
            </label>
            <input
              type="text"
              value={professional.industry}
              onChange={(e) => setProfessional({ ...professional, industry: e.target.value })}
              placeholder="Ex: Energia Solar & Renováveis"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Porte da Empresa
            </label>
            <select
              value={professional.company_size}
              onChange={(e) => setProfessional({ ...professional, company_size: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="1-10">1 a 10 funcionários (Integrador Local)</option>
              <option value="11-50">11 a 50 funcionários (Regional)</option>
              <option value="51-200">51 a 200 funcionários (Nacional)</option>
              <option value="201+">Mais de 200 funcionários (Grande Porte)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cargo / Função Técnica
            </label>
            <input
              type="text"
              value={professional.role_function}
              onChange={(e) => setProfessional({ ...professional, role_function: e.target.value })}
              placeholder="Ex: Engenheiro Eletricista / Diretor Técnico"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Barra de Ação de Salvamento */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
        <div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              Alterações salvas com sucesso!
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
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

