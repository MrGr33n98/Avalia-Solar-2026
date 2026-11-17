'use client';

import React from 'react';
import { Shield, Eye, Bell, Info, Save } from 'lucide-react';
import { PrivacySettings } from '../types';

interface PrivacySettingsTabProps {
  settings: PrivacySettings;
}

/**
 * Somente leitura até existir endpoint que persista as preferências E APIs públicas
 * que as respeitem de forma consistente (ver GAP P1 no PDR da PR #164).
 */
const PRIVACY_EDITING_AVAILABLE = false;

const EMAIL_OPTIONS = [
  { id: 'immediately', label: 'Imediatamente', desc: 'A cada nova interação ou resposta' },
  { id: 'daily', label: 'Diariamente', desc: 'Resumo das novidades do dia' },
  { id: 'weekly', label: 'Semanalmente', desc: 'Destaques semanais do setor' },
  { id: 'never', label: 'Nunca', desc: 'Apenas alertas essenciais de segurança' },
] as const;

const VISIBILITY_OPTIONS = [
  {
    id: 'public',
    label: 'Público',
    desc: 'Seu perfil e avaliações podem ser encontrados por integradores e consumidores.',
  },
  {
    id: 'verified_only',
    label: 'Apenas Usuários e Empresas Verificadas',
    desc: 'Somente contas verificadas poderiam visualizar seus detalhes.',
  },
  { id: 'private', label: 'Privado', desc: 'Suas informações não apareceriam em buscas externas.' },
] as const;

export function PrivacySettingsTab({ settings }: PrivacySettingsTabProps) {
  const disabled = !PRIVACY_EDITING_AVAILABLE;

  return (
    <div className="space-y-8" data-testid="privacy-settings-tab">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Privacidade &amp; Configurações da Conta
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Controle como seus dados e avaliações são exibidos para outros usuários e empresas.
        </p>
      </div>

      {disabled && (
        <div
          role="status"
          className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300"
          data-testid="privacy-unavailable-notice"
        >
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="leading-relaxed">
            Estas preferências ainda não podem ser alteradas por aqui. Hoje, a forma como seu nome
            aparece nas avaliações segue os consentimentos registrados no seu cadastro e no envio de
            cada avaliação.
          </p>
        </div>
      )}

      {/* Anonimização */}
      <fieldset
        disabled={disabled}
        className="bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-4 disabled:opacity-60"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Shield className="w-3.5 h-3.5" />
              <span>Controle de Anonimização</span>
            </div>
            <h3 id="anonymize-label" className="text-base font-bold text-slate-900 dark:text-white">
              Ocultar meu sobrenome em avaliações públicas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Quando disponível, permitirá exibir apenas o primeiro nome e a inicial do sobrenome nas
              suas avaliações.
            </p>
          </div>

          <label className="relative inline-flex items-center shrink-0 mt-1 cursor-not-allowed">
            <input
              type="checkbox"
              checked={settings.anonymize_last_name === true}
              readOnly
              aria-labelledby="anonymize-label"
              className="sr-only peer"
              data-testid="anonymize-toggle"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </fieldset>

      {/* Frequência de Notificações / E-mails */}
      <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
        <legend className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-slate-400" />
          <span>Frequência de Notificações e Resumos por E-mail</span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {EMAIL_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                settings.email_frequency === option.id
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{option.label}</span>
                <input
                  type="radio"
                  name="email_frequency"
                  value={option.id}
                  checked={settings.email_frequency === option.id}
                  readOnly
                  className="text-blue-600 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{option.desc}</p>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Visibilidade Geral do Perfil */}
      <fieldset
        disabled={disabled}
        className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 disabled:opacity-60"
      >
        <legend className="sr-only">Visibilidade do Perfil de Avaliador</legend>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-400" />
          <span>Visibilidade do Perfil de Avaliador</span>
        </h3>

        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                settings.profile_visibility === item.id
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="radio"
                name="profile_visibility"
                value={item.id}
                checked={settings.profile_visibility === item.id}
                readOnly
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Barra de Ação */}
      <div className="flex items-center justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white shadow-sm opacity-50 cursor-not-allowed"
          data-testid="save-privacy-button"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Preferências</span>
        </button>
      </div>
    </div>
  );
}
