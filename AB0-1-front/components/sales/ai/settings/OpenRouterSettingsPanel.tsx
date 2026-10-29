'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  DollarSign,
  Key,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getAiProviders,
  getAiSettings,
  getAiUsage,
  testOpenRouterConnection,
  updateAiSettings,
  updateOpenRouterCredentials,
} from '@/lib/api/sales/ai';
import type {
  CrmAiModelProfile,
  CrmAiProviderInfo,
  CrmAiSetting,
  CrmAiUsageResponse,
  OpenRouterCatalogModel,
} from '@/lib/api/sales/aiTypes';

const FEATURE_LABELS: Record<string, { title: string; description: string }> = {
  email_first_touch: {
    title: 'Primeiro Contato (E-mail)',
    description: 'Geração de abordagem comercial inicial com assunto, preheader e corpo.',
  },
  email_rewrite: {
    title: 'Reescrita de Rascunho',
    description: 'Ajuste de tom, concisão, clareza e CTA em rascunhos de e-mail.',
  },
  subject_options: {
    title: 'Opções de Assunto & Preheader',
    description: 'Geração de 3 alternativas de assunto/preheader para escolha humana.',
  },
  template_create: {
    title: 'Criação de Template por Briefing',
    description: 'Geração estruturada de template em blocos compatíveis com o editor.',
  },
  template_block_edit: {
    title: 'Edição de Bloco de Template',
    description: 'Reescrita assistida de blocos individuais do TemplateEditor.',
  },
  inbox_summary: {
    title: 'Resumo de Thread (Inbox Zoho)',
    description: 'Síntese factual de conversas com referências de mensagens.',
  },
  inbox_reply: {
    title: 'Sugestão de Resposta (Inbox Zoho)',
    description: 'Rascunho de resposta comercial inserido para revisão.',
  },
  person_briefing: {
    title: 'Briefing de Pessoa (Person 360)',
    description: 'Resumo contextual do contato e perguntas de descoberta.',
  },
  account_briefing: {
    title: 'Resumo de Conta (Account CRM)',
    description: 'Perfil comercial resumido e identificação de lacunas de cadastro.',
  },
  opportunity_recap: {
    title: 'Recap de Oportunidade 360',
    description: 'Resumo factual da timeline com evidências internas.',
  },
  opportunity_next_step: {
    title: 'Próxima Ação Sugerida',
    description: 'Recomendação de próximo passo comercial sem mover o pipeline.',
  },
  sequence_planner: {
    title: 'Planejador de Cadência',
    description: 'Proposta de sequência multi-etapa (inicia sempre inativa).',
  },
  campaign_preflight: {
    title: 'Auditoria Pré-Envio de Campanha',
    description: 'QA de variáveis, links, alegações e clareza antes de disparo.',
  },
  call_script: {
    title: 'Roteiro de Ligação',
    description: 'Perguntas de qualificação e objeções prováveis para chamadas.',
  },
};

const CONTEXT_FIELD_LABELS: Record<string, string> = {
  contact_basic: 'Dados básicos do contato (nome, cargo, departamento)',
  account_basic: 'Dados básicos da conta/empresa no CRM (nome, setor, porte, UF)',
  opportunity_summary: 'Resumo da oportunidade (etapa, valor estimado, status)',
  recent_activities: 'Últimas atividades comerciais registradas no CRM',
  thread_messages: 'Mensagens recentes da thread de e-mail selecionada',
};

export default function OpenRouterSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);

  const [provider, setProvider] = useState<CrmAiProviderInfo | null>(null);
  const [settings, setSettings] = useState<CrmAiSetting | null>(null);
  const [profiles, setProfiles] = useState<CrmAiModelProfile[]>([]);
  const [catalog, setCatalog] = useState<OpenRouterCatalogModel[]>([]);
  const [usage, setUsage] = useState<CrmAiUsageResponse | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [newApiKey, setNewApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    try {
      const [provRes, setRes, usageRes] = await Promise.all([
        getAiProviders(),
        getAiSettings(),
        getAiUsage(),
      ]);
      setProvider(provRes.providers[0] || null);
      setSettings(setRes.settings);
      setProfiles(setRes.model_profiles || []);
      setCatalog(setRes.catalog || provRes.catalog || []);
      setCanEdit(Boolean(setRes.can_edit));
      setUsage(usageRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível carregar as configurações do CRM AI Studio.';
      setBanner({
        type: 'error',
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRotateKey = async () => {
    if (!newApiKey.trim()) return;
    setRotatingKey(true);
    setBanner(null);
    try {
      const res = await updateOpenRouterCredentials({ api_key: newApiKey.trim() });
      setNewApiKey('');
      setShowKeyInput(false);
      setBanner({ type: 'success', text: res.message });
      await loadAll();
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao salvar a chave OpenRouter.',
      });
    } finally {
      setRotatingKey(false);
    }
  };

  const handleRevokeKey = async () => {
    setRotatingKey(true);
    setBanner(null);
    try {
      const res = await updateOpenRouterCredentials({ revoke: true });
      setBanner({ type: 'success', text: res.message });
      await loadAll();
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao revogar a chave OpenRouter.',
      });
    } finally {
      setRotatingKey(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setBanner(null);
    try {
      const res = await testOpenRouterConnection({
        api_key: newApiKey.trim() || undefined,
      });
      setBanner({
        type: 'success',
        text: `${res.message} Modelo verificado: ${res.tested_model}`,
      });
      await loadAll();
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao testar conexão com o OpenRouter.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleProfileChange = (
    feature: string,
    field: keyof CrmAiModelProfile,
    value: string | number | boolean | null
  ) => {
    setProfiles((prev) =>
      prev.map((p) => (p.feature === feature ? { ...p, [field]: value } : p))
    );
  };

  const handleToggleContextField = (fieldKey: string) => {
    if (!settings) return;
    const current = settings.allowed_context_fields || [];
    const exists = current.includes(fieldKey);
    const updated = exists ? current.filter((f) => f !== fieldKey) : [...current, fieldKey];
    setSettings({ ...settings, allowed_context_fields: updated });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setBanner(null);
    try {
      const res = await updateAiSettings({
        settings: {
          enabled: settings.enabled,
          monthly_budget_usd: settings.monthly_budget_usd,
          daily_user_limit: settings.daily_user_limit,
          fallback_enabled: settings.fallback_enabled,
          require_zdr: settings.require_zdr,
          allowed_models: settings.allowed_models,
          allowed_context_fields: settings.allowed_context_fields,
        },
        model_profiles: profiles,
      });
      setSettings(res.settings);
      setProfiles(res.model_profiles);
      setBanner({ type: 'success', text: res.message });
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao persistir configurações no servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Carregando CRM AI Studio (OpenRouter)...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              CRM AI Studio — OpenRouter Control Plane
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gateway único OpenRouter para assistência comercial auditável no CRM. A IA gera
            sugestões e rascunhos, nunca executa envios ou mutações sem confirmação humana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Salvar Políticas e Modelos
            </button>
          )}
        </div>
      </div>

      {banner && (
        <div
          className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Card 1: OpenRouter Connection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Key className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">OpenRouter Connection</h2>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    provider?.configured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {provider?.configured ? `Ativo (${provider.key_status})` : 'Chave Pendente'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Endpoint: <code className="text-slate-700">https://openrouter.ai/api/v1</code> •
                Chave criptografada no backend (nunca exposta ao navegador)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
              )}
              Testar conexão
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setShowKeyInput((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md"
                >
                  <Key className="w-3.5 h-3.5" />
                  Rotacionar chave
                </button>
                {provider?.configured && provider.credential_source === 'tenant_vault' && (
                  <button
                    type="button"
                    onClick={handleRevokeKey}
                    disabled={rotatingKey}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revogar chave
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-400 block text-[11px]">Chave Mascarada</span>
            <span className="font-mono font-medium text-slate-800 mt-0.5 block">
              {provider?.masked_key || 'Não configurada'}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-400 block text-[11px]">Último Teste de Conectividade</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {provider?.last_tested_at
                ? `${new Date(provider.last_tested_at).toLocaleString('pt-BR')} (${
                    provider.last_latency_ms || 0
                  } ms)`
                : 'Ainda não testado'}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-400 block text-[11px]">Status do Módulo no Tenant</span>
            <label className="inline-flex items-center gap-2 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings?.enabled)}
                disabled={!canEdit}
                onChange={(e) =>
                  settings && setSettings({ ...settings, enabled: e.target.checked })
                }
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800">
                {settings?.enabled ? 'Habilitado para o time comercial' : 'Desabilitado'}
              </span>
            </label>
          </div>
        </div>

        {showKeyInput && canEdit && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Cole a nova chave sk-or-v1-..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleRotateKey}
              disabled={rotatingKey || newApiKey.trim().length < 12}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
            >
              {rotatingKey ? 'Criptografando...' : 'Confirmar Rotação'}
            </button>
          </div>
        )}
      </div>

      {/* Card 2: Usage, Quotas & Privacy Policy */}
      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Orçamento e Limites</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Orçamento Mensal do Tenant (USD)</label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  disabled={!canEdit}
                  value={settings.monthly_budget_usd}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      monthly_budget_usd: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Limite Diário por Usuário (gerações/dia)
                </label>
                <input
                  type="number"
                  step="5"
                  min="1"
                  disabled={!canEdit}
                  value={settings.daily_user_limit}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      daily_user_limit: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Privacidade, ZDR e Resiliência</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_zdr}
                  disabled={!canEdit}
                  onChange={(e) => setSettings({ ...settings, require_zdr: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600"
                />
                <span>
                  <strong className="text-slate-800 block">Exigir Zero Data Retention (ZDR)</strong>
                  <span className="text-slate-500">
                    Envia política <code>data_collection: deny</code> ao OpenRouter e restringe a
                    modelos compatíveis.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.fallback_enabled}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setSettings({ ...settings, fallback_enabled: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-300 text-indigo-600"
                />
                <span>
                  <strong className="text-slate-800 block">Habilitar Fallback Controlado</strong>
                  <span className="text-slate-500">
                    Em caso de timeout ou HTTP 429/5xx no modelo primário, tenta automaticamente o
                    modelo de fallback da tarefa.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-amber-600" />
              <span>Campos Autorizados no Prompt</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {Object.entries(CONTEXT_FIELD_LABELS).map(([fieldKey, label]) => (
                <label key={fieldKey} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={(settings.allowed_context_fields || []).includes(fieldKey)}
                    onChange={() => handleToggleContextField(fieldKey)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card 3: Model Routing por Tarefa */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Model Routing por Tarefa CRM</h2>
            <p className="text-[11px] text-slate-500">
              Selecione o modelo primário e o fallback no catálogo curado do OpenRouter para cada
              operação comercial.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Tarefa CRM</th>
                <th className="py-2.5 px-3 font-semibold">Modelo Primário (OpenRouter)</th>
                <th className="py-2.5 px-3 font-semibold">Modelo Fallback</th>
                <th className="py-2.5 px-3 font-semibold w-24">Temp.</th>
                <th className="py-2.5 px-3 font-semibold w-28">Max Tokens</th>
                <th className="py-2.5 px-3 font-semibold w-28">Cota/Dia</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {profiles.map((profile) => {
                const meta = FEATURE_LABELS[profile.feature] || {
                  title: profile.feature,
                  description: '',
                };
                return (
                  <tr key={profile.feature} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{meta.title}</div>
                      <div className="text-[11px] text-slate-500">{meta.description}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        disabled={!canEdit}
                        value={profile.primary_model_id}
                        onChange={(e) =>
                          handleProfileChange(profile.feature, 'primary_model_id', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-800"
                      >
                        {catalog.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} (${m.prompt_cost_per_1m_usd}/${m.completion_cost_per_1m_usd}{' '}
                            1M)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        disabled={!canEdit}
                        value={profile.fallback_model_id || ''}
                        onChange={(e) =>
                          handleProfileChange(
                            profile.feature,
                            'fallback_model_id',
                            e.target.value || null
                          )
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-800"
                      >
                        <option value="">Sem fallback</option>
                        {catalog.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        disabled={!canEdit}
                        value={profile.temperature}
                        onChange={(e) =>
                          handleProfileChange(
                            profile.feature,
                            'temperature',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="50"
                        min="128"
                        max="4096"
                        disabled={!canEdit}
                        value={profile.max_tokens}
                        onChange={(e) =>
                          handleProfileChange(
                            profile.feature,
                            'max_tokens',
                            parseInt(e.target.value, 10) || 512
                          )
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="10"
                        min="1"
                        disabled={!canEdit}
                        value={profile.quota_daily}
                        onChange={(e) =>
                          handleProfileChange(
                            profile.feature,
                            'quota_daily',
                            parseInt(e.target.value, 10) || 10
                          )
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={profile.enabled}
                        onChange={(e) =>
                          handleProfileChange(profile.feature, 'enabled', e.target.checked)
                        }
                        className="rounded border-slate-300 text-indigo-600"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: Resumo de Uso & Auditoria Comercial */}
      {usage && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Telemetria de Consumo e Trilha de Auditoria (Mês Atual)
              </h2>
              <p className="text-[11px] text-slate-500">
                Histórico de gerações, modelos resolvidos, latência e decisão humana.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Custo Estimado (Mês)</span>
              <span className="text-base font-bold text-slate-900">
                ${usage.summary.monthly_spent_usd.toFixed(4)} / $
                {usage.summary.monthly_budget_usd.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Gerações no Mês</span>
              <span className="text-base font-bold text-slate-900">
                {usage.summary.monthly_generations}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Tokens (In / Out)</span>
              <span className="text-base font-bold text-slate-900">
                {usage.summary.monthly_prompt_tokens.toLocaleString()} /{' '}
                {usage.summary.monthly_completion_tokens.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Latência Média</span>
              <span className="text-base font-bold text-slate-900">
                {usage.summary.avg_latency_ms} ms
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Seu Uso Hoje</span>
              <span className="text-base font-bold text-slate-900">
                {usage.summary.daily_user_used} / {usage.summary.daily_user_limit}
              </span>
            </div>
          </div>

          {usage.recent_generations.length > 0 && (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Tarefa</th>
                    <th className="py-2 px-3">Modelo Resolvido</th>
                    <th className="py-2 px-3">Tokens</th>
                    <th className="py-2 px-3">Latência</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Decisão Humana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usage.recent_generations.slice(0, 10).map((g) => (
                    <tr key={g.id}>
                      <td className="py-2 px-3 font-mono text-slate-600">{g.generation_id}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {FEATURE_LABELS[g.feature]?.title || g.feature}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {g.resolved_model || g.requested_model}
                        {g.fallback_used && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded">
                            fallback
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {g.prompt_tokens + g.completion_tokens}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{g.latency_ms} ms</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            g.status === 'failed'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {g.user_decision || 'pendente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

