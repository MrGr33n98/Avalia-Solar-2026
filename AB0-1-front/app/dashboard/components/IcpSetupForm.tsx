'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Save, 
  TrendingUp, 
  MapPin, 
  Building2, 
  Home, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetchIcpProfile, updateIcpProfile, type IcpProfile } from '@/lib/icp-api';

interface IcpSetupFormProps {
  companyId?: string;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ROOF_TYPES = [
  { id: 'colonial', label: 'Cerâmico/Colonial' },
  { id: 'metalico', label: 'Metálico' },
  { id: 'laje', label: 'Laje/Concreto' },
  { id: 'carport', label: 'Carport (Estacionamento)' },
  { id: 'solo', label: 'Solo/Usinas' }
];

const EV_CHARGER_TYPES = [
  { id: 'ac_wallbox', label: 'AC (Wallbox Residencial/Comercial)' },
  { id: 'dc_fast_charger', label: 'DC (Carregamento Rápido/Rodoviário)' }
];

const AUDIENCES = [
  { id: 'residential', label: 'Residencial' },
  { id: 'commercial', label: 'Comercial' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'rural', label: 'Rural' }
];

export default function IcpSetupForm({ companyId }: IcpSetupFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Perfil ICP Local State
  const [minMonthlyBill, setMinMonthlyBill] = useState<number>(0);
  const [maxMonthlyBill, setMaxMonthlyBill] = useState<number | null>(null);
  const [minSystemKwp, setMinSystemKwp] = useState<number>(0);
  const [minEvChargersCount, setMinEvChargersCount] = useState<number>(0);
  const [strictnessLevel, setStrictnessLevel] = useState<'flexible' | 'balanced' | 'strict'>('balanced');
  const [autoRejectOutOfIcp, setAutoRejectOutOfIcp] = useState<boolean>(false);
  const [notifyOnlyHighMatch, setNotifyOnlyHighMatch] = useState<boolean>(false);
  const [nationwide, setNationwide] = useState<boolean>(false);
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [preferredRoofTypes, setPreferredRoofTypes] = useState<string[]>([]);
  const [evChargerTypes, setEvChargerTypes] = useState<string[]>([]);
  const [targetStates, setTargetStates] = useState<string[]>([]);

  // Load ICP Profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const idParam = companyId ? Number(companyId) : undefined;
        const profile = await fetchIcpProfile(idParam);
        
        setMinMonthlyBill(profile.min_monthly_bill || 0);
        setMaxMonthlyBill(profile.max_monthly_bill ?? null);
        setMinSystemKwp(profile.min_system_kwp || 0);
        setMinEvChargersCount(profile.min_ev_chargers_count || 0);
        setStrictnessLevel(profile.strictness_level || 'balanced');
        setAutoRejectOutOfIcp(!!profile.auto_reject_out_of_icp);
        setNotifyOnlyHighMatch(!!profile.notify_only_high_match);
        setNationwide(!!profile.nationwide);
        setTargetAudiences(profile.target_audiences || []);
        setPreferredRoofTypes(profile.preferred_roof_types || []);
        setEvChargerTypes(profile.ev_charger_types || []);
        setTargetStates(profile.target_states || []);
      } catch (error) {
        console.error('Erro ao carregar ICP:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações do ICP.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [companyId, toast]);

  // Toggle list selection helpers
  const toggleSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Submit profile settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const idParam = companyId ? Number(companyId) : undefined;
      const updated = await updateIcpProfile({
        min_monthly_bill: minMonthlyBill,
        max_monthly_bill: maxMonthlyBill,
        min_system_kwp: minSystemKwp,
        min_ev_chargers_count: minEvChargersCount,
        strictness_level: strictnessLevel,
        auto_reject_out_of_icp: autoRejectOutOfIcp,
        notify_only_high_match: notifyOnlyHighMatch,
        nationwide,
        target_audiences: targetAudiences,
        preferred_roof_types: preferredRoofTypes,
        ev_charger_types: evChargerTypes,
        target_states: nationwide ? [] : targetStates,
        target_cities: [], // Placeholder
      }, idParam);

      toast({
        title: 'Configurações salvas!',
        description: 'Perfil de ICP Solar & EV atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar ICP:', error);
      toast({
        title: 'Falha ao salvar',
        description: 'Erro ao enviar diretivas de ICP ao servidor.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-800 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 bg-slate-900/50 rounded-[2rem] border border-white/5 animate-pulse" />
          <div className="h-96 bg-slate-900/50 rounded-[2rem] border border-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Qualificação Automática</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
            Perfil de <span className="text-primary">Cliente Ideal (ICP)</span>
          </h2>
          <p className="text-sm text-white/40 max-w-lg font-medium leading-relaxed">
            Defina regras automáticas de filtragem e pontuação para novas oportunidades de energia solar e infraestrutura de recarga.
          </p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-95 group"
        >
          <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          {saving ? 'Gravando...' : 'Salvar Regras ICP'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Regras Financeiras e Técnicas */}
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Filtros Operacionais</CardTitle>
                <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3">SLIDERS</Badge>
              </div>
              <CardDescription className="text-white/40 font-medium">Ajuste os valores mínimos tolerados para faturamento e potência técnica.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              
              {/* Consumo Mensal Mínimo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Consumo Mensal de Energia (R$)</Label>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary">
                    Mínimo: R$ {minMonthlyBill.toLocaleString('pt-BR')}
                  </span>
                </div>
                <Slider
                  value={[minMonthlyBill]}
                  min={0}
                  max={25000}
                  step={500}
                  onValueChange={(val) => setMinMonthlyBill(val[0])}
                  className="py-4"
                />
                <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                  Contatos com conta mensal abaixo de R$ {minMonthlyBill} serão classificados como Fora de ICP ou rejeitados.
                </p>
              </div>

              {/* Potência Mínima da Usina (kWp) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Tamanho Mínimo do Sistema (kWp)</Label>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary">
                    Mínimo: {minSystemKwp} kWp
                  </span>
                </div>
                <Slider
                  value={[minSystemKwp]}
                  min={0}
                  max={150}
                  step={5}
                  onValueChange={(val) => setMinSystemKwp(val[0])}
                  className="py-4"
                />
                <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                  Define o tamanho físico do gerador solar mínimo em potência de pico (kWp) para projetos corporativos e de usinas.
                </p>
              </div>

              {/* Quantidade Mínima de Carregadores EV */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Carregadores de Mobilidade (Unidades)</Label>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary">
                    Mínimo: {minEvChargersCount} {minEvChargersCount === 1 ? 'carregador' : 'carregadores'}
                  </span>
                </div>
                <Slider
                  value={[minEvChargersCount]}
                  min={0}
                  max={20}
                  step={1}
                  onValueChange={(val) => setMinEvChargersCount(val[0])}
                  className="py-4"
                />
                <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                  Selecione a quantidade mínima de pontos de recarga que o cliente deseja instalar em projetos de infraestrutura EV.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Preferências Técnicas de Fixação & Conectores */}
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Infraestrutura Preferencial</CardTitle>
              <CardDescription className="text-white/40 font-medium">Selecione onde seu time tem melhor margem ou capacidade técnica de instalação.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              
              {/* Estruturas de Telhado */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-2">Estruturas do Telhado / Terrenos (Solar)</Label>
                <div className="flex flex-wrap gap-2">
                  {ROOF_TYPES.map((roof) => {
                    const isSelected = preferredRoofTypes.includes(roof.id);
                    return (
                      <button
                        key={roof.id}
                        type="button"
                        onClick={() => toggleSelection(preferredRoofTypes, setPreferredRoofTypes, roof.id)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-black/30 border-white/5 text-white/60 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {roof.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tecnologias de Mobilidade EV */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-2">Conectores / Carregadores EV</Label>
                <div className="flex flex-wrap gap-2">
                  {EV_CHARGER_TYPES.map((ev) => {
                    const isSelected = evChargerTypes.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => toggleSelection(evChargerTypes, setEvChargerTypes, ev.id)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-black/30 border-white/5 text-white/60 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {ev.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Públicos-Alvo */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-2">Segmentos Alvo (Público)</Label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map((aud) => {
                    const isSelected = targetAudiences.includes(aud.id);
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => toggleSelection(targetAudiences, setTargetAudiences, aud.id)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-black/30 border-white/5 text-white/60 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {aud.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Abrangência Geográfica */}
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Filtro Geográfico</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Atuação Nacional</span>
                  <Switch
                    checked={nationwide}
                    onCheckedChange={(val) => setNationwide(val)}
                  />
                </div>
              </div>
              <CardDescription className="text-white/40 font-medium">Restrinja os leads de acordo com a área de atendimento operacional da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              {!nationwide ? (
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-2">Estados Selecionados</Label>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {BRAZIL_STATES.map((state) => {
                      const isSelected = targetStates.includes(state);
                      return (
                        <button
                          key={state}
                          type="button"
                          onClick={() => toggleSelection(targetStates, setTargetStates, state)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'bg-black/30 border-white/5 text-white/60 hover:text-white'
                          }`}
                        >
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center space-y-2">
                  <MapPin className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-sm font-bold text-white uppercase">Abrangência Nacional Ativa</p>
                  <p className="text-[11px] text-white/40 max-w-sm mx-auto">
                    Sua empresa receberá e pontuará leads de qualquer localização e estado da federação sem restrições geográficas.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Barra Lateral de Regras e Rigor */}
        <div className="lg:col-span-4 space-y-8">
          
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Rigor & Inteligência</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              
              {/* Níveis de Rigor */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Grau de Rigidez do Match</Label>
                
                <div className="space-y-3">
                  {/* Flexível */}
                  <div 
                    onClick={() => setStrictnessLevel('flexible')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      strictnessLevel === 'flexible'
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : 'border-white/5 bg-black/25 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${strictnessLevel === 'flexible' ? 'bg-primary' : 'bg-white/20'}`} />
                      <span className="text-xs font-black text-white uppercase tracking-wider">Flexível</span>
                    </div>
                    <p className="text-[9px] text-white/40 font-medium">Pontua leads mesmo que correspondam a apenas um ou dois critérios selecionados.</p>
                  </div>

                  {/* Moderado */}
                  <div 
                    onClick={() => setStrictnessLevel('balanced')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      strictnessLevel === 'balanced'
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : 'border-white/5 bg-black/25 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${strictnessLevel === 'balanced' ? 'bg-primary' : 'bg-white/20'}`} />
                      <span className="text-xs font-black text-white uppercase tracking-wider">Moderado (Recomendado)</span>
                    </div>
                    <p className="text-[9px] text-white/40 font-medium">Fórmula equilibrada com pesos relativos de pontuação. Excelente balanço de leads.</p>
                  </div>

                  {/* Rígido */}
                  <div 
                    onClick={() => setStrictnessLevel('strict')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      strictnessLevel === 'strict'
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : 'border-white/5 bg-black/25 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${strictnessLevel === 'strict' ? 'bg-primary' : 'bg-white/20'}`} />
                      <span className="text-xs font-black text-white uppercase tracking-wider">Rígido</span>
                    </div>
                    <p className="text-[9px] text-white/40 font-medium">Leads precisam obrigatoriamente satisfazer todos os filtros e faixas ativas para dar match.</p>
                  </div>
                </div>
              </div>

              {/* Switches Avançados */}
              <div className="space-y-6 pt-4 border-t border-white/5">
                
                {/* Auto Reject */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-white">Rejeição Automática</Label>
                    <p className="text-[9px] text-white/40 font-medium leading-relaxed">
                      Rejeita contatos fora do perfil diretamente, sem enviar à sua Inbox.
                    </p>
                  </div>
                  <Switch
                    checked={autoRejectOutOfIcp}
                    onCheckedChange={(val) => setAutoRejectOutOfIcp(val)}
                  />
                </div>

                {/* Notify Only High Match */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-white">Apenas Alertas Críticos</Label>
                    <p className="text-[9px] text-white/40 font-medium leading-relaxed">
                      Disparar notificações de e-mail e push somente para matches altos (pontuação &gt; 80%).
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnlyHighMatch}
                    onCheckedChange={(val) => setNotifyOnlyHighMatch(val)}
                  />
                </div>

              </div>

            </CardContent>
          </Card>

          {/* Dica de Utilização */}
          <div className="p-6 rounded-[2rem] border border-white/5 bg-[#001D33]/60 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-white tracking-wider">Como funciona o cálculo?</h4>
              <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                Nosso motor de pontuação atribui <strong>35%</strong> de peso para o faturamento mensal, <strong>25%</strong> para a infraestrutura/telhado, <strong>25%</strong> para a localização e <strong>15%</strong> para o nível de urgência informado pelo lead.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
