'use client';

import React, { useState } from 'react';
import { Shield, Eye, Bell, Lock, CheckCircle2, Loader2, Save } from 'lucide-react';
import { PrivacySettings } from '../types';

interface PrivacySettingsTabProps {
  initialSettings: PrivacySettings;
  userFullName: string;
  onSave: (settings: PrivacySettings) => Promise<void>;
}

export function PrivacySettingsTab({
  initialSettings,
  userFullName,
  onSave,
}: PrivacySettingsTabProps) {
  const [settings, setSettings] = useState<PrivacySettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calcula o nome anonimizado: Ex "Felipe Henriques" -> "Felipe H."
  const anonymizedPreview = React.useMemo(() => {
    const parts = userFullName.trim().split(/\s+/);
    if (parts.length <= 1) return userFullName;
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
  }, [userFullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSave(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // erro tratado no toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" data-testid="privacy-settings-tab">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Privacidade & Configurações da Conta
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Controle como seus dados e avaliações são exibidos para outros usuários e empresas.
        </p>
      </div>

      {/* Recurso Exclusivo G2: Anonimização Inteligente */}
      <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Shield className="w-3.5 h-3.5" />
              <span>Controle de Anonimização</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ocultar meu sobrenome em avaliações públicas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Quando ativado, o portal protege seu nome completo nas avaliações exibindo apenas o primeiro nome e a inicial do sobrenome, mantendo sua credibilidade sem expor sua identidade pessoal.
            </p>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={settings.anonymize_last_name}
              onChange={(e) =>
                setSettings({ ...settings, anonymize_last_name: e.target.checked })
              }
              className="sr-only peer"
              data-testid="anonymize-toggle"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Live Preview Card */}
        <div className="pt-3 border-t border-blue-100/60 dark:border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Pré-visualização pública da assinatura:</span>
          <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
            {settings.anonymize_last_name ? anonymizedPreview : userFullName}
          </span>
        </div>
      </div>

      {/* Frequência de Notificações / E-mails */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <span>Frequência de Notificações e Resumos por E-mail</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'immediately', label: 'Imediatamente', desc: 'A cada nova interação ou resposta' },
            { id: 'daily', label: 'Diariamente', desc: 'Resumo das novidades do dia' },
            { id: 'weekly', label: 'Semanalmente', desc: 'Destaques semanais do setor' },
            { id: 'never', label: 'Nunca', desc: 'Apenas alertas essenciais de segurança' },
          ].map((option) => (
            <label
              key={option.id}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                settings.email_frequency === option.id
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{option.label}</span>
                <input
                  type="radio"
                  name="email_frequency"
                  value={option.id}
                  checked={settings.email_frequency === option.id}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      email_frequency: option.id as PrivacySettings['email_frequency'],
                    })
                  }
                  className="text-blue-600 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {option.desc}
              </p>
            </label>
          ))}
        </div>
      </div>

      {/* Visibilidade Geral do Perfil */}
      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-400" />
          <span>Visibilidade do Perfil de Avaliador</span>
        </h3>

        <div className="space-y-2">
          {[
            {
              id: 'public',
              label: 'Público (Recomendado)',
              desc: 'Seu perfil e avaliações podem ser encontrados por integradores e consumidores.',
            },
            {
              id: 'verified_only',
              label: 'Apenas Usuários e Empresas Verificadas',
              desc: 'Somente integradores com selo de verificação podem visualizar seus detalhes.',
            },
            {
              id: 'private',
              label: 'Privado',
              desc: 'Suas informações não aparecem em buscas externas.',
            },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                settings.profile_visibility === item.id
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <input
                type="radio"
                name="profile_visibility"
                value={item.id}
                checked={settings.profile_visibility === item.id}
                onChange={() =>
                  setSettings({
                    ...settings,
                    profile_visibility: item.id as PrivacySettings['profile_visibility'],
                  })
                }
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {item.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {item.desc}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Barra de Ação */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
        <div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              Preferências salvas com sucesso!
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
          data-testid="save-privacy-button"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Preferências</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

