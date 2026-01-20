'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Calculator,
  ArrowRight,
  AlertCircle,
  Info,
  Trophy,
  Wallet,
  Check,
  Loader2,
  Lock,
  Clock,
  BadgeCheck,
  Sparkles,
  Building2,
  Home,
  Tractor,
  Users,
  Target,
  BarChart3,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  Phone,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Star,
  ChevronDown
} from 'lucide-react';
import { FinancingOption, financingOptionsApi, financingProposalsApi } from '@/lib/api';
import { toast } from 'sonner';
import { analyticsApi } from '@/lib/api-analytics';
import { useFinancingContext7 } from '@/app/context7/provider';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types
type Props = { companyId: number };
type UseType = 'residencial' | 'comercial' | 'rural';

interface Option extends FinancingOption {
  id: number;
  institution_name: string;
  credit_line: string;
  monthly_payment: number;
  total_cost: number;
  interest_rate_percent: number;
  cet_annual_percent?: number;
  max_term_months: number;
}

// Helpers
function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function cleanPhone(s: string) {
  return String(s || '').replace(/\D/g, '');
}

function formatPhone(value: string) {
  const digits = cleanPhone(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Components
function MiniKpi({ icon: Icon, title, value, hint, active }: any) {
  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-xl transition-all duration-300 border",
      active 
        ? "bg-primary/5 border-primary/20 shadow-sm" 
        : "bg-card border-border/40 hover:border-primary/20"
    )}>
      <div className={cn(
        "p-3 rounded-lg transition-colors",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  );
}

function AudienceCard({ type, label, description, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/60 hover:border-primary/30 bg-card"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <Badge variant={active ? "default" : "outline"} className="mb-2">
          {type.toUpperCase()}
        </Badge>
        {active && <Check className="h-4 w-4 text-primary" />}
      </div>
      <h4 className="font-semibold text-foreground">{label}</h4>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function ProjectTypeCard({ type, label, icon: Icon, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-center gap-3 hover:shadow-md h-full",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/60 hover:border-primary/30 bg-card"
      )}
    >
      <div className={cn(
        "p-3 rounded-full transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

function EnhancedOptionCard({ option, isBest, selected, onSelect, expanded, onExpand, showCet }: any) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 relative overflow-hidden group",
        selected ? "ring-2 ring-primary border-primary shadow-lg" : "hover:border-primary/50 hover:shadow-md",
        isBest && !selected && "border-yellow-500/50"
      )}
      onClick={onSelect}
    >
      {isBest && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          Melhor Opção
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border bg-background">
              <AvatarFallback className="font-bold text-primary">
                {option.institution_name?.charAt(0) || "B"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                {option.credit_line}
              </h4>
              <p className="text-sm text-muted-foreground">{option.institution_name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Parcela</span>
            <div className="text-xl font-bold text-foreground">
              {formatBRL(option.monthly_payment)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Taxa Mensal</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xl font-bold",
                option.interest_rate_percent < 1.5 ? "text-emerald-600" : "text-foreground"
              )}>
                {option.interest_rate_percent}%
              </span>
            </div>
          </div>
        </div>

        {showCet && option.cet_annual_percent && (
          <div className="mb-4 p-2 bg-muted/50 rounded-lg flex items-center justify-between text-sm">
            <span className="text-muted-foreground">CET Anual:</span>
            <span className="font-mono font-medium">{option.cet_annual_percent}%</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{option.max_term_months}x</span> de prazo
          </div>
          <div className="text-sm font-medium text-foreground">
            Total: {formatBRL(option.total_cost)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CompanyFinancing({ companyId }: Props) {
  // Steps
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Inputs
  const [audience, setAudience] = useState<'pf' | 'pj'>('pf');
  const [useType, setUseType] = useState<UseType>('residencial');
  const [loanAmount, setLoanAmount] = useState([50000]);
  const [months, setMonths] = useState([60]);
  const [entry, setEntry] = useState<number>(0);
  
  // Debounced values for query
  const debouncedAmount = useDebounce(loanAmount[0], 600);
  const debouncedMonths = useDebounce(months[0], 600);

  // Selection
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  
  // View & Filters
  const [optionsView, setOptionsView] = useState<'cards' | 'table' | 'chart'>('cards');
  const [sortMetric, setSortMetric] = useState<'monthly_payment' | 'interest_rate_percent' | 'total_cost'>('monthly_payment');
  const [ascending, setAscending] = useState<boolean>(true);
  const [showCet, setShowCet] = useState<boolean>(false);
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Contact
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Context
  const { financing, dispatchFinancing } = useFinancingContext7();

  // Validations
  const amountValid = loanAmount[0] >= 1000 && loanAmount[0] <= 500000;
  const monthsValid = months[0] >= 6 && months[0] <= 120;
  const entryValid = entry >= 0 && entry <= loanAmount[0];
  
  const financedAmount = useMemo(() => Math.max(loanAmount[0] - entry, 0), [loanAmount, entry]);

  const proposalSchema = z.object({
    name: z.string().min(2, 'Informe seu nome'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    amount: z.number().min(1000, 'Valor mínimo R$ 1.000').max(500000, 'Valor máximo R$ 500.000'),
    months: z.number().min(6, 'Prazo mínimo 6').max(120, 'Prazo máximo 120'),
    entry: z.number().min(0, 'Entrada inválida'),
    optionId: z.number().optional().nullable(),
  });

  // Market info
  const market = useMemo(() => {
    const baseRateMin = audience === 'pf' ? 1.29 : 1.49;
    const baseRateMax = audience === 'pf' ? 2.49 : 2.89;
    const maxMonths = useType === 'residencial' ? 84 : useType === 'comercial' ? 96 : 120;
    const approval = audience === 'pf' ? 'até 24h' : 'até 48h';
    return { rateMin: baseRateMin, rateMax: baseRateMax, maxMonths, approval };
  }, [audience, useType]);

  const progressValue = useMemo(() => (step === 1 ? 33 : step === 2 ? 66 : 100), [step]);

  // Query Simulation
  const { 
    data: simulationResult, 
    isLoading: simulating, 
    isError: simulationError 
  } = useQuery({
    queryKey: ['financing', 'simulate', companyId, debouncedAmount, debouncedMonths, audience, financedAmount],
    queryFn: async () => {
      // Small delay for UI smoothness if API is too fast
      await new Promise(r => setTimeout(r, 400));
      return financingOptionsApi.simulate(companyId, {
        amount: financedAmount,
        audience,
        months: debouncedMonths,
      });
    },
    enabled: amountValid && monthsValid && entryValid,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
  });

  // Track simulation event
  useEffect(() => {
    if (simulationResult) {
      analyticsApi.trackEvent({
        company_id: companyId,
        event_type: 'click',
        metadata: {
          event: 'financing_simulate',
          amount: loanAmount[0],
          financed: financedAmount,
          months: months[0],
          audience,
          useType,
        },
      });
    }
  }, [simulationResult, companyId, audience, useType]); // Reduced dependencies to avoid spam

  // Preselect best option
  useEffect(() => {
    if (simulationResult?.best?.id && !selectedOptionId) {
      setSelectedOptionId(simulationResult.best.id);
    }
  }, [simulationResult?.best, selectedOptionId]);

  // Derived data from simulation
  const options = useMemo(() => simulationResult?.options || [], [simulationResult]);
  const hasOptions = Array.isArray(options) && options.length > 0;

  const institutions = useMemo(() => {
    const set = new Set<string>();
    (options as Option[])?.forEach((o: Option) => {
      if (o?.institution_name) set.add(String(o.institution_name));
    });
    return Array.from(set);
  }, [options]);

  const filteredOptions = useMemo(() => {
    const base = (options as Option[]) ?? [];
    const filtered = institutionFilter === 'all' 
      ? base 
      : base.filter((o) => String(o.institution_name) === institutionFilter);
      
    return filtered.slice().sort((a: Option, b: Option) => {
      const av = Number(a?.[sortMetric]) || 0;
      const bv = Number(b?.[sortMetric]) || 0;
      return ascending ? av - bv : bv - av;
    });
  }, [options, institutionFilter, sortMetric, ascending]);

  const chartData = useMemo(() => {
    return (filteredOptions as Option[]).map((o: Option, idx: number) => ({
      idx: idx + 1,
      option: String(o.credit_line || o.institution_name || `Opção ${idx + 1}`),
      monthly_payment: Number(o.monthly_payment) || 0,
      total_cost: Number(o.total_cost) || 0,
      interest_rate_percent: Number(o.interest_rate_percent) || 0,
      cet_annual_percent: Number(o.cet_annual_percent) || 0,
    }));
  }, [filteredOptions]);

  const canContinueStep1 = amountValid && monthsValid && entryValid;
  const contactValid = name.length >= 2 && email.includes('@') && cleanPhone(phone).length >= 10;

  // Submit proposal
  const submitProposal = async () => {
    const mustSelectOption = (simulationResult?.options?.length ?? 0) > 0;
    
    const parsed = proposalSchema.safeParse({
      name,
      email,
      phone: cleanPhone(phone),
      amount: loanAmount[0],
      months: months[0],
      entry,
      optionId: selectedOptionId,
    });

    if (!parsed.success || (mustSelectOption && !selectedOptionId)) {
      const issues = !parsed.success ? parsed.error.issues.map((i) => i.message) : [];
      const msg = mustSelectOption && !selectedOptionId ? ['Selecione uma opção'] : issues;
      const finalMsg = msg.filter(Boolean).join(', ');
      
      dispatchFinancing({ type: 'proposal_failed', error: finalMsg || 'Dados inválidos' });
      toast.error(finalMsg || 'Verifique os dados informados');
      return;
    }

    dispatchFinancing({ type: 'proposal_submitting' });
    
    try {
      const resp = await financingProposalsApi.submit(companyId, {
        option_id: selectedOptionId ?? undefined,
        amount: financedAmount,
        months: months[0],
        audience,
        entry,
        use_type: useType,
        project_amount: loanAmount[0],
        name,
        email,
        phone: cleanPhone(phone),
      });
      
      dispatchFinancing({ type: 'proposal_submitted', proposalId: resp.proposal_id, status: resp.status });
      
      analyticsApi.trackEvent({
        company_id: companyId,
        event_type: 'click',
        metadata: { event: 'financing_click_interest', option_id: selectedOptionId, amount: loanAmount[0], financed: financedAmount },
      });
      
      toast.success('Proposta enviada com sucesso!');
      setStep(3);
    } catch (e: any) {
      const errMsg = e?.response?.data?.error || e?.message || 'Erro ao enviar proposta';
      dispatchFinancing({ type: 'proposal_failed', error: String(errMsg) });
      toast.error(String(errMsg));
    }
  };

  // Poll status
  useEffect(() => {
    if (!financing.proposalId) return;
    const interval = setInterval(async () => {
      try {
        const s = await financingProposalsApi.status(companyId, financing.proposalId!);
        dispatchFinancing({ type: 'status_updated', status: s.status });
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [financing.proposalId, companyId, dispatchFinancing]);

  const UseTypeIcon = useMemo(() => (useType === 'residencial' ? Home : useType === 'comercial' ? Building2 : Tractor), [useType]);

  const steps = [
    { number: 1, label: 'Simulação', icon: Calculator },
    { number: 2, label: 'Opções', icon: BarChart3 },
    { number: 3, label: 'Conclusão', icon: Check },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Error Alert */}
        {financing.error && (
          <Alert variant="destructive" className="border-2 animate-in slide-in-from-top">
            <AlertCircle className="h-4 w-4" />
            <div>
              <AlertTitle>Falha ao enviar proposta</AlertTitle>
              <AlertDescription className="mt-1">{financing.error}</AlertDescription>
            </div>
          </Alert>
        )}
        {/* Enhanced Hero Section */}
        <Card className="border-border/60 shadow-xl overflow-hidden bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-md">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Financiamento Inteligente
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Simule, compare e solicite proposta — tudo em uma única jornada sem complicações.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-full">
                    <Lock className="h-3.5 w-3.5" />
                    Dados protegidos
                  </Badge>
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    {market.approval}
                  </Badge>
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-full">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Sem compromisso
                  </Badge>
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    LGPD
                  </Badge>
                </div>
              </div>
              {/* Enhanced Progress */}
              <div className="w-full lg:w-[400px] space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progresso da simulação</span>
                    <Badge variant="outline" className="font-medium">
                      Passo {step} de 3
                    </Badge>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                 
                  {/* Enhanced Step Indicators */}
                  <div className="flex justify-between pt-2">
                    {steps.map((s) => (
                      <div key={s.number} className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center mb-2 transition-all",
                          step >= s.number
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <s.icon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "text-xs font-medium",
                          step >= s.number ? "text-primary" : "text-muted-foreground"
                        )}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MiniKpi
                icon={UseTypeIcon}
                title="Tipo de projeto"
                value={useType === 'residencial' ? 'Residencial' : useType === 'comercial' ? 'Comercial' : 'Rural'}
                hint="Ajusta faixas estimadas"
                active={step === 1}
              />
              <MiniKpi
                icon={Wallet}
                title="Valor do projeto"
                value={formatBRL(loanAmount[0])}
                hint={`Financiado: ${formatBRL(financedAmount)}`}
                active={step === 1}
              />
              <MiniKpi
                icon={Clock}
                title="Prazo"
                value={`${months[0]} meses`}
                hint={`Até ${market.maxMonths} meses`}
                active={step === 1}
              />
            </div>
          </CardContent>
        </Card>
        {/* Enhanced Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Steps Content - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="border-border/60 shadow-lg">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      {/* Enhanced Step 1 Header */}
                      <div className="flex items-center justify-between pb-4 border-b">
                        <div>
                          <h3 className="text-2xl font-bold flex items-center gap-3">
                            <Calculator className="h-6 w-6 text-primary" />
                            Configuração da Simulação
                          </h3>
                          <p className="text-muted-foreground mt-1">
                            Ajuste os parâmetros para ver opções personalizadas
                          </p>
                        </div>
                        {simulating ? (
                          <Badge variant="secondary" className="gap-2 animate-pulse">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Calculando...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            Tempo real
                          </Badge>
                        )}
                      </div>
                      {/* Enhanced Input Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Audience & Type */}
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              Tipo de Pessoa
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <AudienceCard
                                type="pf"
                                label="Pessoa Física"
                                description="Para projetos pessoais"
                                active={audience === 'pf'}
                                onClick={() => setAudience('pf')}
                              />
                              <AudienceCard
                                type="pj"
                                label="Pessoa Jurídica"
                                description="Para empresas e CNPJ"
                                active={audience === 'pj'}
                                onClick={() => setAudience('pj')}
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Tipo de Projeto
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <ProjectTypeCard
                                type="residencial"
                                label="Residencial"
                                icon={Home}
                                active={useType === 'residencial'}
                                onClick={() => setUseType('residencial')}
                              />
                              <ProjectTypeCard
                                type="comercial"
                                label="Comercial"
                                icon={Building2}
                                active={useType === 'comercial'}
                                onClick={() => setUseType('comercial')}
                              />
                              <ProjectTypeCard
                                type="rural"
                                label="Rural"
                                icon={Tractor}
                                active={useType === 'rural'}
                                onClick={() => setUseType('rural')}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Right Column - Financial Inputs */}
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                Valor do Projeto
                              </Label>
                              <div className="text-lg font-bold text-primary tabular-nums">
                                {formatBRL(loanAmount[0])}
                              </div>
                            </div>
                           
                            <div className="space-y-2">
                              <Slider
                                value={loanAmount}
                                onValueChange={setLoanAmount}
                                max={500000}
                                min={1000}
                                step={1000}
                                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                              />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>R$ 1.000</span>
                                <span>R$ 250.000</span>
                                <span>R$ 500.000</span>
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="font-medium">Prazo (meses)</Label>
                                <span className="font-bold text-primary text-lg">{months[0]}</span>
                              </div>
                              <Slider
                                value={months}
                                onValueChange={setMonths}
                                min={6}
                                max={120}
                                step={6}
                              />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>6</span>
                                <span>60</span>
                                <span>120</span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="font-medium">Entrada (opcional)</Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Mais informações">
                                      <Info className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    A entrada reduz o valor financiado e pode melhorar as condições
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="relative">
                                <Input
                                  value={entry ? String(entry) : ''}
                                  onChange={(e) => setEntry(Number(e.target.value.replace(/\D/g, '')) || 0)}
                                  placeholder="0"
                                  className="pl-8"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  R$
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Valor financiado: <span className="font-semibold">{formatBRL(financedAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Action Bar */}
                      <div className="pt-6 border-t">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Clique em &quot;Continuar&quot; para ver as melhores opções
                          </div>
                          <Button
                            onClick={() => setStep(2)}
                            disabled={!canContinueStep1}
                            size="lg"
                            className="gap-2 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                          >
                            {simulating ? 'Calculando...' : 'Ver Opções Disponíveis'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      {/* Enhanced Step 2 Header */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
                        <div>
                          <h3 className="text-2xl font-bold flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            Compare as Opções
                          </h3>
                          <p className="text-muted-foreground mt-1">
                            Selecione a melhor opção para o seu perfil
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-2">
                            <Eye className="h-3.5 w-3.5" />
                            {options.length} opções encontradas
                          </Badge>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-3.5 w-3.5" />
                                Filtros
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Filtros e Ordenação</SheetTitle>
                                <SheetDescription>
                                  Personalize a visualização das opções
                                </SheetDescription>
                              </SheetHeader>
                              <div className="space-y-6 py-6">
                                <div className="space-y-3">
                                  <Label>Ordenar por</Label>
                                  <Select value={sortMetric} onValueChange={(v) => setSortMetric(v as any)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly_payment">Menor Parcela</SelectItem>
                                      <SelectItem value="total_cost">Menor Custo Total</SelectItem>
                                      <SelectItem value="interest_rate_percent">Menor Taxa</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-3">
                                  <Label>Instituição</Label>
                                  <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Todas as instituições</SelectItem>
                                      {institutions.map((n) => (
                                        <SelectItem key={n} value={n}>
                                          {n}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="sort-order">Ordem</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant={ascending ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setAscending(true)}
                                      className="gap-1"
                                    >
                                      <SortAsc className="h-3.5 w-3.5" />
                                      Cresc
                                    </Button>
                                    <Button
                                      variant={!ascending ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setAscending(false)}
                                      className="gap-1"
                                    >
                                      <SortDesc className="h-3.5 w-3.5" />
                                      Decresc
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>
                      {/* Enhanced View Tabs */}
                      <Tabs value={optionsView} onValueChange={(v) => setOptionsView(v as any)} className="space-y-6">
                        <div className="flex items-center justify-between">
                          <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="cards" className="gap-2">
                              <div className="h-4 w-4 rounded-sm bg-primary/20" />
                              Cards
                            </TabsTrigger>
                            <TabsTrigger value="table" className="gap-2">
                              <Table className="h-4 w-4" />
                              Tabela
                            </TabsTrigger>
                            <TabsTrigger value="chart" className="gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Gráficos
                            </TabsTrigger>
                          </TabsList>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="cet-toggle" className="text-sm">CET Anual</Label>
                              <Switch id="cet-toggle" checked={showCet} onCheckedChange={setShowCet} />
                            </div>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Cards View - Enhanced */}
                        <TabsContent value="cards" className="mt-0">
                          {simulating ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <Card key={i} className="p-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-2">
                                      <Skeleton className="h-6 w-48" />
                                      <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                  </div>
                                  <Skeleton className="h-20 w-full mb-6 rounded-xl" />
                                  <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-1">
                                      <Skeleton className="h-3 w-16" />
                                      <Skeleton className="h-5 w-20" />
                                    </div>
                                    <div className="space-y-1">
                                      <Skeleton className="h-3 w-20" />
                                      <Skeleton className="h-5 w-28" />
                                    </div>
                                  </div>
                                  <Skeleton className="h-10 w-full" />
                                </Card>
                              ))}
                            </div>
                          ) : hasOptions ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {filteredOptions.map((opt: Option) => (
                                <EnhancedOptionCard
                                  key={opt.id}
                                  option={opt}
                                  isBest={simulationResult?.best?.id === opt.id}
                                  selected={selectedOptionId === opt.id}
                                  onSelect={() => setSelectedOptionId(opt.id)}
                                  expanded={expandedCard === opt.id}
                                  onExpand={() => setExpandedCard(expandedCard === opt.id ? null : opt.id)}
                                  showCet={showCet}
                                  bestOption={simulationResult?.best}
                                />
                              ))}
                            </div>
                          ) : (
                            <EmptyState
                              title="Nenhuma opção encontrada"
                              description="Tente ajustar os parâmetros da simulação"
                              action={
                                <Button onClick={() => setStep(1)}>
                                  Ajustar Simulação
                                </Button>
                              }
                            />
                          )}
                        </TabsContent>
                        {/* Table View - Enhanced */}
                        <TabsContent value="table" className="mt-0">
                          <Card>
                            <ScrollArea className="h-[500px]">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                  <TableRow>
                                    <TableHead className="w-[200px]">Instituição</TableHead>
                                    <TableHead>Taxa Mensal</TableHead>
                                    <TableHead>Prazo</TableHead>
                                    <TableHead>Parcela</TableHead>
                                    <TableHead>Custo Total</TableHead>
                                    {showCet && <TableHead>CET Anual</TableHead>}
                                    <TableHead className="text-right">Ação</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredOptions.map((opt: Option) => (
                                    <TableRow
                                      key={opt.id}
                                      className={cn(
                                        "cursor-pointer hover:bg-muted/50 transition-colors",
                                        selectedOptionId === opt.id && "bg-primary/5"
                                      )}
                                      onClick={() => setSelectedOptionId(opt.id)}
                                    >
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                              {opt.institution_name?.charAt(0) || "B"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium">{opt.credit_line}</div>
                                            <div className="text-xs text-muted-foreground">{opt.institution_name}</div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={cn(
                                          "font-mono",
                                          Number(opt.interest_rate_percent) < 2 && "bg-green-50 text-green-700 border-green-200"
                                        )}>
                                          {opt.interest_rate_percent}%
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{opt.max_term_months} meses</TableCell>
                                      <TableCell className="font-semibold">
                                        {formatBRL(opt.monthly_payment)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {formatBRL(opt.total_cost)}
                                          {simulationResult?.best?.id === opt.id && (
                                            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                          )}
                                        </div>
                                      </TableCell>
                                      {showCet && (
                                        <TableCell>
                                          <Badge variant="secondary" className="font-mono">
                                            {opt.cet_annual_percent || '—'}%
                                          </Badge>
                                        </TableCell>
                                      )}
                                      <TableCell className="text-right">
                                        <Button
                                          size="sm"
                                          variant={selectedOptionId === opt.id ? "default" : "outline"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOptionId(opt.id);
                                          }}
                                        >
                                          {selectedOptionId === opt.id ? "Selecionado" : "Selecionar"}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </Card>
                        </TabsContent>
                        {/* Chart View - Enhanced */}
                        <TabsContent value="chart" className="mt-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold">Comparativo de Parcelas</CardTitle>
                              </CardHeader>
                              <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="option" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(v) => `R$${v/1000}k`} />
                                    <RechartsTooltip
                                      formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Parcela']}
                                      labelFormatter={(label) => `Opção ${label}`}
                                    />
                                    <Bar dataKey="monthly_payment" fill="#3b82f6" name="Parcela Mensal" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold">Distribuição de Custos</CardTitle>
                              </CardHeader>
                              <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={chartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="total_cost"
                                    >
                                      {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Custo Total']} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                      {/* Contact Form - Enhanced */}
                      <div className="pt-8 border-t">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Contact Form */}
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <h4 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Seus Dados
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Informe seus dados para envio da proposta
                              </p>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">Nome completo *</Label>
                                <Input
                                  id="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Digite seu nome"
                                  className={cn(
                                    "transition-all",
                                    name.length > 0 && (
                                      name.trim().length >= 2
                                        ? "border-green-500 focus-visible:ring-green-500"
                                        : "border-red-500 focus-visible:ring-red-500"
                                    )
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="email">E-mail *</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className={cn(
                                      "transition-all",
                                      email.length > 0 && (
                                        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
                                          ? "border-green-500 focus-visible:ring-green-500"
                                          : "border-red-500 focus-visible:ring-red-500"
                                      )
                                    )}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="phone">WhatsApp *</Label>
                                  <Input
                                    id="phone"
                                    value={formatPhone(phone)}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className={cn(
                                      "transition-all",
                                      phone.length > 0 && (
                                        cleanPhone(phone).length >= 10
                                          ? "border-green-500 focus-visible:ring-green-500"
                                          : "border-red-500 focus-visible:ring-red-500"
                                      )
                                    )}
                                    maxLength={15}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Summary & Actions */}
                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold">
                                  Resumo da Simulação
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Valor do projeto</span>
                                  <span className="font-medium">{formatBRL(loanAmount[0])}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Entrada</span>
                                  <span className="font-medium">{formatBRL(entry)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Valor financiado</span>
                                  <span className="font-semibold text-primary">
                                    {formatBRL(financedAmount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Prazo</span>
                                  <span className="font-medium">{months[0]} meses</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold">Opção selecionada</span>
                                  <span className="text-sm text-muted-foreground">
                                    {selectedOptionId ? "✓ Selecionada" : "Nenhuma"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                            <div className="space-y-3">
                              <Button
                                onClick={submitProposal}
                                disabled={(hasOptions && !selectedOptionId) || !contactValid || financing.submitting}
                                className="w-full gap-2 py-6 text-base rounded-xl"
                                size="lg"
                              >
                                {financing.submitting ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Enviando proposta...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-5 w-5" />
                                    Enviar Proposta
                                  </>
                                )}
                              </Button>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setStep(1)}
                                  className="flex-1 rounded-xl"
                                >
                                  Voltar
                                </Button>
                                <Button
                                  variant="secondary"
                                  className="flex-1 rounded-xl gap-2"
                                  onClick={() => toast.message('Conectando com especialista...')}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Falar com Especialista
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8"
                    >
                      {/* Success Screen */}
                      <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                          <Check className="h-12 w-12 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-bold mb-3">Proposta Enviada com Sucesso!</h3>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                          Sua solicitação está sendo processada. Em breve você receberá as melhores condições.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                          title="Identificador"
                          value={String(financing.proposalId || '—')}
                          icon={<ShieldCheck className="h-5 w-5" />}
                        />
                        <StatCard
                          title="Status"
                          value={String(financing.status || 'processando')}
                          icon={<Clock className="h-5 w-5" />}
                          variant={
                            financing.status?.includes('aprov') ? 'success' :
                            financing.status?.includes('pendente') ? 'warning' :
                            'default'
                          }
                        />
                        <StatCard
                          title="Tempo Estimado"
                          value={market.approval}
                          icon={<TrendingUp className="h-5 w-5" />}
                        />
                      </div>
                      {simulationResult?.best && (
                        <Card className="border-2 border-primary/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-yellow-500" />
                              Recomendação do Sistema
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Instituição</div>
                                <div className="text-lg font-semibold">{simulationResult.best.institution_name}</div>
                                <div className="text-xs text-muted-foreground">{simulationResult.best.credit_line}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-2">Parcela Estimada</div>
                                <div className="text-3xl font-bold text-primary">
                                  {formatBRL(simulationResult.best.monthly_payment)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  em {simulationResult.best.max_term_months} meses
                                </div>
                              </div>
                              <div className="space-y-2">
                                <LineItem label="Custo Total" value={formatBRL(simulationResult.best.total_cost)} />
                                <LineItem label="Taxa Mensal" value={`${simulationResult.best.interest_rate_percent}%`} />
                                <LineItem label="CET Anual" value={`${simulationResult.best.cet_annual_percent}%`} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Button
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1 rounded-xl"
                        >
                          Nova Simulação
                        </Button>
                        <Button
                          className="flex-1 rounded-xl gap-2"
                          onClick={() => toast.success('WhatsApp aberto!')}
                        >
                          <Phone className="h-4 w-4" />
                          Acompanhar pelo WhatsApp
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1 rounded-xl gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Baixar Detalhes
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
          {/* Enhanced Sidebar - 1/3 width */}
          <div className="space-y-6">
            <Card className="border-border/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Insights do Mercado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StatBox
                    label="Taxa Média"
                    value={`${market.rateMin.toFixed(2)}-${market.rateMax.toFixed(2)}%`}
                    trend="down"
                  />
                  <StatBox
                    label="Prazo Máx"
                    value={`${market.maxMonths} meses`}
                    trend="neutral"
                  />
                  <StatBox
                    label="Aprovação"
                    value={market.approval}
                    trend="up"
                  />
                  <StatBox
                    label="Conversão"
                    value="92%"
                    trend="up"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Dicas para Economizar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TipItem
                  icon={<Wallet className="h-4 w-4" />}
                  title="Aumente a entrada"
                  description="Redução imediata no valor financiado"
                />
                <TipItem
                  icon={<Clock className="h-4 w-4" />}
                  title="Estenda o prazo"
                  description="Menor parcela, maior custo total"
                />
                <TipItem
                  icon={<Target className="h-4 w-4" />}
                  title="Compare o CET"
                  description="Verifique o custo real anual"
                />
                <TipItem
                  icon={<Star className="h-4 w-4" />}
                  title="Negocie taxas"
                  description="Instituições podem oferecer condições especiais"
                />
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Atendimento Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Precisa de ajuda? Nossos especialistas estão disponíveis para tirar suas dúvidas.
                </p>
                <div className="space-y-3">
                  <Button className="w-full gap-2 rounded-xl" variant="default">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Direto
                  </Button>
                  <Button className="w-full gap-2 rounded-xl" variant="outline">
                    <Phone className="h-4 w-4" />
                    Ligação Gratuita
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Enhanced Components
function StatBox({ label, value, trend }: any) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function LineItem({ label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function TipItem({ icon, title, description }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

type StatCardVariant = 'default' | 'success' | 'warning';

function StatCard({ title, value, icon, variant = 'default' }: { title: string; value: any; icon: any; variant?: StatCardVariant }) {
  const variantClasses: Record<StatCardVariant, string> = {
    default: "border-border/60",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
  };
  return (
    <Card className={cn("border", variantClasses[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            variant === 'success' ? "bg-green-100 text-green-600" :
            variant === 'warning' ? "bg-yellow-100 text-yellow-600" :
            "bg-primary/10 text-primary"
          )}>
            {icon}
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description, action }: any) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
}
