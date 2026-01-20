'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { analyticsApi, type CompanyAnalyticsSettings, type CompanyClaim, type VerificationStatus } from '@/lib/api-analytics';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  companyId: string;
};

const CLAIM_DEFINITIONS: Array<{
  key: CompanyClaim['key'];
  label: string;
  placeholder: string;
  type: 'number' | 'text';
}> = [
  { key: 'projects_delivered', label: 'Projetos Entregues', placeholder: 'Ex: 120', type: 'number' },
  { key: 'installed_capacity_kwp', label: 'Capacidade Instalada (kWp/MWp)', placeholder: 'Ex: 2.5 MWp', type: 'text' },
  { key: 'years_in_market', label: 'Anos de Mercado', placeholder: 'Ex: 8', type: 'number' },
  { key: 'ev_projects', label: 'Projetos EV', placeholder: 'Ex: 12', type: 'number' },
  { key: 'commercial_projects', label: 'Projetos Comerciais', placeholder: 'Ex: 35', type: 'number' },
  { key: 'impact_co2', label: 'Impacto (CO₂ evitado)', placeholder: 'Ex: 1.2 kt CO₂/ano', type: 'text' },
  { key: 'impact_economy', label: 'Economia (R$)', placeholder: 'Ex: R$ 450.000/ano', type: 'text' },
];

export default function AnalyticsSettings({ companyId }: Props) {
  const companyIdNum = useMemo(() => Number(companyId), [companyId]);
  const [settings, setSettings] = useState<CompanyAnalyticsSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    analyticsApi
      .getAnalyticsSettings(companyIdNum)
      .then((s) => {
        if (mounted) setSettings(s);
      })
      .catch(() => {
        if (mounted) setSettings(null);
      });
    return () => {
      mounted = false;
    };
  }, [companyIdNum]);

  const updateClaim = (key: CompanyClaim['key'], partial: Partial<CompanyClaim>) => {
    if (!settings) return;
    const claims = settings.claims.slice();
    const idx = claims.findIndex((c) => c.key === key);
    const now = new Date().toISOString();
    if (idx >= 0) {
      claims[idx] = {
        ...claims[idx],
        ...partial,
        updated_at: partial.updated_at || claims[idx].updated_at || now,
      };
    } else {
      claims.push({
        key,
        value: partial.value ?? '',
        status: (partial.status as VerificationStatus) ?? 'declared',
        updated_at: partial.updated_at || now,
        evidence: partial.evidence ?? [],
      });
    }
    setSettings({ ...settings, claims });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await analyticsApi.updateAnalyticsSettings(companyIdNum, settings);
      setSettings(saved);
      toast.success('Configurações salvas');
    } catch {
      toast.error('Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurar Analytics & Métricas Públicas</CardTitle>
          <CardDescription>Carregando configurações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurar Analytics & Métricas Públicas</h2>
        <p className="text-muted-foreground">Regra de Ouro — Origem dos dados via Dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modos de Coleta</CardTitle>
          <CardDescription>Defina como os dados nascem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label>Automático (tracking Avalia Solar)</Label>
                <p className="text-xs text-muted-foreground">views, cliques, leads, tempo de resposta, origem interna, campanhas</p>
              </div>
              <Switch
                checked={settings.collection_modes.automatic_tracking}
                onCheckedChange={(v) =>
                  setSettings({
                    ...settings,
                    collection_modes: { ...settings.collection_modes, automatic_tracking: v },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label>Declarado (input manual)</Label>
                <p className="text-xs text-muted-foreground">projetos, kWp/MWp, anos, EV, comerciais</p>
              </div>
              <Switch
                checked={settings.collection_modes.declared_input}
                onCheckedChange={(v) =>
                  setSettings({
                    ...settings,
                    collection_modes: { ...settings.collection_modes, declared_input: v },
                  })
                }
              />
            </div>
            <div className="rounded-lg border p-3 space-y-3">
              <Label>Integrado (externo)</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">UTM + import de leads</span>
                <Switch
                  checked={settings.collection_modes.integrated_sources.utm}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      collection_modes: {
                        ...settings.collection_modes,
                        integrated_sources: { ...settings.collection_modes.integrated_sources, utm: v },
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CRM (HubSpot/RD/Pipedrive)</span>
                <Switch
                  checked={settings.collection_modes.integrated_sources.crm_import}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      collection_modes: {
                        ...settings.collection_modes,
                        integrated_sources: { ...settings.collection_modes.integrated_sources, crm_import: v },
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">GA4/Meta/Google Ads</span>
                <Switch
                  checked={settings.collection_modes.integrated_sources.ga4_meta_ads}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      collection_modes: {
                        ...settings.collection_modes,
                        integrated_sources: { ...settings.collection_modes.integrated_sources, ga4_meta_ads: v },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Visibilidade Pública</CardTitle>
          <CardDescription>Defina o que aparece no perfil público</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label>Rating/Reviews</Label>
                <p className="text-xs text-muted-foreground">sempre público</p>
              </div>
              <Badge variant="secondary">Verificado</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label>Verificação</Label>
                <p className="text-xs text-muted-foreground">sempre público</p>
              </div>
              <Badge variant="secondary">Verificado</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label>Tempo de resposta (faixa pública)</Label>
                <p className="text-xs text-muted-foreground">exibido em faixas: até 1h, até 4h, etc.</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.public_visibility.response_time_public}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      public_visibility: { ...settings.public_visibility, response_time_public: v },
                    })
                  }
                />
                <Select
                  value={settings.public_visibility.response_band || '1h'}
                  onValueChange={(v) =>
                    setSettings({
                      ...settings,
                      public_visibility: { ...settings.public_visibility, response_band: v as any },
                    })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">até 1h</SelectItem>
                    <SelectItem value="4h">até 4h</SelectItem>
                    <SelectItem value="24h">até 24h</SelectItem>
                    <SelectItem value="48h">até 48h</SelectItem>
                    <SelectItem value="48h_plus">≥ 48h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.public_visibility.claims_public).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border p-3">
                <Label className="capitalize">{k.replace(/_/g, ' ')}</Label>
                <Switch
                  checked={v}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      public_visibility: {
                        ...settings.public_visibility,
                        claims_public: { ...settings.public_visibility.claims_public, [k]: checked } as any,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prova Técnica / Autoridade</CardTitle>
          <CardDescription>Preencha dados declarados com status e evidências</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {CLAIM_DEFINITIONS.map((def) => {
            const claim = settings.claims.find((c) => c.key === def.key);
            return (
              <div key={def.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="space-y-2">
                  <Label>{def.label}</Label>
                  {def.type === 'number' ? (
                    <Input
                      type="number"
                      value={typeof claim?.value === 'number' ? String(claim?.value) : ''}
                      placeholder={def.placeholder}
                      onChange={(e) => updateClaim(def.key, { value: Number(e.target.value || '0') })}
                    />
                  ) : (
                    <Input
                      value={typeof claim?.value === 'string' ? String(claim?.value) : ''}
                      placeholder={def.placeholder}
                      onChange={(e) => updateClaim(def.key, { value: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={(claim?.status || 'declared') as any}
                    onValueChange={(v) => updateClaim(def.key, { status: v as VerificationStatus })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="declared">Declarado</SelectItem>
                      <SelectItem value="verified">Verificado</SelectItem>
                      <SelectItem value="calculated">Calculado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Atualizado em: {claim?.updated_at ? new Date(claim.updated_at).toLocaleDateString() : '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Evidências (links, notas)</Label>
                  <Textarea
                    rows={3}
                    value={(claim?.evidence || []).join('\n')}
                    placeholder="Uma evidência por linha (URL, referência de projeto, ART/NF, etc.)"
                    onChange={(e) => updateClaim(def.key, { evidence: e.target.value.split('\n').filter(Boolean) })}
                  />
                </div>
              </div>
            );
          })}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

