'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Save, 
  Settings2, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Eye, 
  Database, 
  Cpu, 
  Zap, 
  BarChart3, 
  FileCheck2,
  Lock,
  Globe,
  RefreshCw,
  Search,
  Check,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { analyticsApi, type CompanyAnalyticsSettings, type CompanyClaim, type VerificationStatus } from '@/lib/api-analytics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

type Props = {
  companyId: string;
};

const CLAIM_DEFINITIONS: Array<{
  key: CompanyClaim['key'];
  label: string;
  placeholder: string;
  type: 'number' | 'text';
  icon: any;
}> = [
  { key: 'projects_delivered', label: 'Projetos Entregues', placeholder: 'Ex: 120', type: 'number', icon: Target },
  { key: 'installed_capacity_kwp', label: 'Capacidade Instalada', placeholder: 'Ex: 2.5 MWp', type: 'text', icon: Zap },
  { key: 'years_in_market', label: 'Anos de Mercado', placeholder: 'Ex: 8', type: 'number', icon: Activity },
  { key: 'ev_projects', label: 'Projetos EV', placeholder: 'Ex: 12', type: 'number', icon: Cpu },
  { key: 'commercial_projects', label: 'Projetos Comerciais', placeholder: 'Ex: 35', type: 'number', icon: Globe },
  { key: 'impact_co2', label: 'CO₂ Evitado', placeholder: 'Ex: 1.2 kt CO₂/ano', type: 'text', icon: ShieldCheck },
  { key: 'impact_economy', label: 'Economia (R$)', placeholder: 'Ex: R$ 450.000/ano', type: 'text', icon: BarChart3 },
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
      toast.success('Protocolo de métricas sincronizado');
    } catch {
      toast.error('Erro na sincronização de metadados');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="p-12 space-y-8">
         <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-white/5 rounded-lg" />
            <div className="h-[400px] w-full bg-white/5 rounded-3xl" />
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <Database className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Market Authority Data</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
            Public <span className="text-brand-blue">Claims Protocol</span>
          </h2>
          <p className="text-sm text-white/40 max-w-lg font-medium leading-relaxed">
            Gerencie o pipeline de evidências técnicas e metadados públicos que sustentam sua autoridade de mercado.
          </p>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 px-8 rounded-2xl bg-brand-blue hover:bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue/20 group transition-all"
        >
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'PROCESSANDO...' : 'SYNC ALL CLAIMS'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Collection Modes */}
          <Card className="clay-precision bg-[#002B4D]/50 border-none rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Intelligence Sources</CardTitle>
              <CardDescription className="text-white/40 font-medium">Defina como os dados brutos são capturados e processados.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "flex items-center justify-between p-6 rounded-3xl border transition-all duration-300",
                  settings.collection_modes.automatic_tracking ? "bg-brand-blue/10 border-brand-blue/30" : "bg-white/[0.02] border-white/5 opacity-60"
                )}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <Search className="h-3.5 w-3.5 text-blue-400" />
                       <Label className="text-xs font-black uppercase tracking-widest text-white">Full Tracking</Label>
                    </div>
                    <p className="text-[10px] font-medium text-white/30">Views, leads e sinais de intenção via SDK.</p>
                  </div>
                  <Switch
                    checked={settings.collection_modes.automatic_tracking}
                    onCheckedChange={(v) =>
                      setSettings({
                        ...settings,
                        collection_modes: { ...settings.collection_modes, automatic_tracking: v },
                      })
                    }
                    className="data-[state=checked]:bg-brand-blue"
                  />
                </div>

                <div className={cn(
                  "flex items-center justify-between p-6 rounded-3xl border transition-all duration-300",
                  settings.collection_modes.declared_input ? "bg-emerald-600/10 border-emerald-500/30" : "bg-white/[0.02] border-white/5 opacity-60"
                )}>
                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                       <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                       <Label className="text-xs font-black uppercase tracking-widest text-white">Manual Input</Label>
                    </div>
                    <p className="text-[10px] font-medium text-white/30">Projetos, capacidade e histórico de mercado.</p>
                  </div>
                  <Switch
                    checked={settings.collection_modes.declared_input}
                    onCheckedChange={(v) =>
                      setSettings({
                        ...settings,
                        collection_modes: { ...settings.collection_modes, declared_input: v },
                      })
                    }
                    className="data-[state=checked]:bg-brand-green"
                  />
                </div>
              </div>

              {/* Integrated Sources */}
              <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-6">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">External Pipeline (Integrations)</Label>
                    <Badge variant="outline" className="text-[8px] border-white/10 text-white/20">OAUTH SECURE</Badge>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/60">UTM Analytics</span>
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
                      <span className="text-[11px] font-bold text-white/60">CRM Buffer</span>
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
                      <span className="text-[11px] font-bold text-white/60">GA4 / Meta Bridge</span>
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

          {/* Visibility Protocol */}
          <Card className="clay-precision bg-[#002B4D]/50 border-none rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Public Visibility Protocol</CardTitle>
              <CardDescription className="text-white/40 font-medium">Controle granular da exposição de sinal para o mercado.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-white">Reputation Index</Label>
                    <p className="text-[10px] text-brand-green font-bold">ALWAYS PUBLIC</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-brand-green/50" />
                </div>
                
                <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.01] border border-white/5">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-white">Latency (Response)</Label>
                    <p className="text-[10px] text-white/30 font-medium">Banda de exibição pública</p>
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
                      <SelectTrigger className="w-24 h-9 bg-black/40 border-white/5 text-[10px] font-black uppercase rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#002B4D] border-white/10">
                        <SelectItem value="1h">≤ 1h</SelectItem>
                        <SelectItem value="4h">≤ 4h</SelectItem>
                        <SelectItem value="24h">≤ 24h</SelectItem>
                        <SelectItem value="48h">≤ 48h</SelectItem>
                        <SelectItem value="48h_plus">≥ 48h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(settings.public_visibility.claims_public).map(([k, v]) => (
                  <div key={k} className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 text-center",
                    v ? "bg-brand-blue/5 border-brand-blue/20" : "bg-white/[0.01] border-white/5 opacity-40"
                  )}>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/60 min-h-[24px]">
                      {k.replace(/_/g, ' ')}
                    </Label>
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
                      className="data-[state=checked]:bg-brand-blue scale-75"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Proof & Claims Database */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 px-2">
                <FileCheck2 className="h-5 w-5 text-brand-green" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Authority Database</h3>
             </div>
             
             <div className="grid gap-6">
                {CLAIM_DEFINITIONS.map((def, index) => {
                  const claim = settings.claims.find((c) => c.key === def.key);
                  const Icon = def.icon;
                  return (
                    <motion.div 
                      key={def.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-8 rounded-[2.5rem] bg-[#002B4D]/30 border border-white/5 hover:border-brand-blue/20 transition-all"
                    >
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                          <div className="md:col-span-4 space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
                                   <Icon className="h-5 w-5" />
                                </div>
                                <Label className="text-sm font-black text-white uppercase tracking-tight">{def.label}</Label>
                             </div>
                             <div className="relative">
                                {def.type === 'number' ? (
                                  <Input
                                    type="number"
                                    value={typeof claim?.value === 'number' ? String(claim?.value) : ''}
                                    placeholder={def.placeholder}
                                    onChange={(e) => updateClaim(def.key, { value: Number(e.target.value || '0') })}
                                    className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-lg font-black text-blue-400 placeholder:text-white/10"
                                  />
                                ) : (
                                  <Input
                                    value={typeof claim?.value === 'string' ? String(claim?.value) : ''}
                                    placeholder={def.placeholder}
                                    onChange={(e) => updateClaim(def.key, { value: e.target.value })}
                                    className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-lg font-black text-blue-400 placeholder:text-white/10"
                                  />
                                )}
                             </div>
                          </div>

                          <div className="md:col-span-3 space-y-4">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Verification Status</Label>
                             <Select
                                value={(claim?.status || 'declared') as any}
                                onValueChange={(v) => updateClaim(def.key, { status: v as VerificationStatus })}
                              >
                                <SelectTrigger className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-xs font-black uppercase tracking-widest">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#002B4D] border-white/10">
                                  <SelectItem value="declared">Declarado</SelectItem>
                                  <SelectItem value="verified">Verificado</SelectItem>
                                  <SelectItem value="calculated">Calculado</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                Sync: {claim?.updated_at ? new Date(claim.updated_at).toLocaleDateString() : 'PENDING'}
                              </p>
                          </div>

                          <div className="md:col-span-5 space-y-4">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Audit Evidence (Links/ART)</Label>
                             <Textarea
                                rows={3}
                                value={(claim?.evidence || []).join('\n')}
                                placeholder="Uma evidência por linha (URL, Projeto, etc.)"
                                onChange={(e) => updateClaim(def.key, { evidence: e.target.value.split('\n').filter(Boolean) })}
                                className="p-4 rounded-2xl bg-black/40 border-white/5 text-xs font-medium placeholder:text-white/5 resize-none leading-relaxed"
                              />
                          </div>
                       </div>
                    </motion.div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="clay-precision bg-gradient-to-br from-[#002B4D] to-[#0A0E17] border border-white/5 rounded-[3.5rem] p-10 space-y-8 sticky top-8">
              <div className="space-y-4">
                 <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
                    <ShieldCheck className="h-7 w-7 text-brand-blue" />
                 </div>
                 <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">Integridade de Dados Públicos</h4>
                 <p className="text-sm text-white/40 font-medium leading-relaxed">
                   Mantenha suas evidências atualizadas para elevar seu score de <span className="text-white font-black underline decoration-brand-blue">CONFIANÇA TÉCNICA</span>. Dados verificados possuem peso 3x maior no ranking.
                 </p>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Lock className="h-3.5 w-3.5 text-blue-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Audit Level</span>
                    </div>
                    <Badge className="bg-brand-blue text-white border-none text-[8px] font-black">PREMIUM</Badge>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                       <span className="text-white/20">Data Coverage</span>
                       <span className="text-brand-blue">88.5%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '88.5%' }}
                        className="h-full bg-brand-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                       />
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Sincronização OK</span>
                 </div>
                 <p className="text-[10px] text-white/20 font-medium italic">
                    Última auditoria heurística realizada há 42 minutos.
                 </p>
              </div>

              <Button className="w-full h-14 bg-white text-brand-blue font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-white/90 active:scale-95 shadow-2xl transition-all">
                 Solicitar Auditoria Manual
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}
