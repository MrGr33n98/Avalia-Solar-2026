'use client';

import { useState } from 'react';
import { BarChart3, Key, Check, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { companyDashboardApi, type ProspectsWorkspaceResponse } from '@/lib/api';

interface Props {
  data: ProspectsWorkspaceResponse;
  companyId: string | number;
  onRefresh: () => void;
}

export default function ProspectsIntegrationsTab({ data, companyId, onRefresh }: Props) {
  const { integrations } = data;
  const [ga4Id, setGa4Id] = useState(integrations.ga4.measurement_id || '');
  const [ga4Error, setGa4Error] = useState('');
  const [customIdsEnabled, setCustomIdsEnabled] = useState(integrations.custom_ids.enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveGa4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setGa4Error('');

    const trimmed = ga4Id.trim().toUpperCase();
    if (trimmed && !/^G-[A-Z0-9]+$/.test(trimmed)) {
      setGa4Error('Formato inválido. O Measurement ID do GA4 deve iniciar com "G-" seguido de letras e números.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await companyDashboardApi.updateProspectsSettings(companyId, {
        settings: {
          ga4: { measurement_id: trimmed },
          custom_ids: { enabled: customIdsEnabled },
        },
      });
      setSaveSuccess(true);
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar integrações:', err);
      setGa4Error('Erro ao salvar configuração no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCustomIds = async (enabled: boolean) => {
    setCustomIdsEnabled(enabled);
    try {
      await companyDashboardApi.updateProspectsSettings(companyId, {
        settings: {
          custom_ids: { enabled },
        },
      });
      onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar custom IDs:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* GA4 Integration Card */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
                  Google Analytics 4 (GA4)
                </h3>
                <Badge
                  variant="outline"
                  className={
                    integrations.ga4.status === 'connected'
                      ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                      : 'border-slate-500/30 text-slate-500 bg-slate-500/10'
                  }
                >
                  {integrations.ga4.status === 'connected' ? 'Configurado' : 'Não Configurado'}
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                Vincule o Measurement ID para correlacionar eventos com o fluxo de conversão do seu GA4.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveGa4} className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="space-y-1">
              <Label htmlFor="ga4-id" className="text-xs font-medium">
                Measurement ID do GA4
              </Label>
              <Input
                id="ga4-id"
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={ga4Id}
                onChange={(e) => setGa4Id(e.target.value)}
                className="max-w-xs h-9 text-xs font-mono rounded-xl"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="mt-5 h-9 rounded-xl gap-1.5"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar ID'}
            </Button>
          </div>

          {ga4Error && <p className="text-xs text-destructive">{ga4Error}</p>}

          {saveSuccess && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Configuração de GA4 salva com sucesso!
            </p>
          )}

          <div className="text-xs text-[hsl(var(--dashboard-muted))] flex items-start gap-1.5 pt-2 border-t border-[hsl(var(--dashboard-border))]">
            <AlertCircle className="h-4 w-4 text-[hsl(var(--dashboard-muted))] shrink-0 mt-0.5" />
            <span>
              Nota de transparência técnica: o Measurement ID é utilizado para despachar eventos client-side via gtag. Ele não concede autorização de leitura da API do Google nem substitui a instalação da tag GA4 no seu site.
            </span>
          </div>
        </form>
      </section>

      {/* Custom Identifiers Card */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
                Identificadores Customizados (CRM / Chaves Externas)
              </h3>
              <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                Habilite o mapeamento de identificadores estruturais para reconhecimento de contas corporativas.
              </p>
            </div>
          </div>
          <Switch
            checked={customIdsEnabled}
            onCheckedChange={handleToggleCustomIds}
            aria-label="Ativar identificadores customizados"
          />
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-[hsl(var(--dashboard-ink))]">
            Chaves Permitidas na Tag Parceira:
          </p>
          <div className="flex flex-wrap gap-2">
            {integrations.custom_ids.allowed_keys.map((k) => (
              <Badge key={k} variant="secondary" className="font-mono text-xs">
                {k}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--dashboard-muted))] pt-1">
            Qualquer tentativa de envio de chaves contendo PII (<code className="font-mono">email</code>, <code className="font-mono">phone</code>, <code className="font-mono">name</code>, <code className="font-mono">token</code>) é bloqueada e descartada automaticamente pelo sanitizador.
          </p>
        </div>
      </section>
    </div>
  );
}
