'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Activity,
  AlertCircle,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Facebook,
  FileText,
  Globe,
  ImageIcon,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Shield,
  Trash2,
  Upload,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { FeatureAccessEntry } from '@/lib/api';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import {
  BRAZIL_CAPITAL_OPTIONS,
  BRAZIL_STATES_OPTIONS,
  COMPANY_PROJECT_TYPES,
  COMPANY_SERVICES_OFFERED,
} from '@/lib/company-options';
import { cn } from '@/lib/utils';
import { useCompany } from '../hooks';

interface CompanyInfoProps {
  companyId: string;
}

interface CompanyData {
  id?: string;
  name?: string;
  description?: string;
  website?: string;
  phone?: string;
  phone_alt?: string;
  whatsapp?: string;
  email_public?: string;
  address?: string;
  state?: string;
  city?: string;
  cnpj?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  working_hours?: string;
  payment_methods?: string;
  certifications?: string;
  awards?: string;
  founded_year?: number;
  employees_count?: number;
  latitude?: number;
  longitude?: number;
  minimum_ticket?: number;
  maximum_ticket?: number;
  financing_options?: string;
  response_time_sla?: string;
  languages?: string;
  logo_url?: string;
  banner_url?: string;
  project_types?: string[] | string;
  services_offered?: string[] | string;
  coverage_states?: string[] | string;
  coverage_cities?: string[] | string;
  installation_warranty_years?: number;
  equipment_brands?: string[] | string;
  engineering_insurance?: boolean;
  post_sales_capacity?: string[] | string;
  delivered_projects_score?: number;
  status?: 'active' | 'pending' | 'inactive';
  verified?: boolean;
  seo_title?: string;
  seo_description?: string;
  meta_description?: string;
  seo_keywords?: string;
  plan_tier?: string | null;
  feature_access?: Record<string, FeatureAccessEntry> | null;
  created_at?: string;
  updated_at?: string;
}

const NOT_INFORMED = 'Não informado';
const TO_DEFINE = 'A definir';
const NOT_CONFIGURED = 'Não configurado';
const SERVICE_AREA_LIMIT_BY_PLAN: Record<string, { states: number; cities: number }> = {
  free: { states: 1, cities: 3 },
  essential: { states: 1, cities: 10 },
  pro: { states: 3, cities: 30 },
  enterprise: { states: 999, cities: 999 },
};

function isBlank(value: unknown) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.filter(Boolean).length === 0;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

function displayText(value: unknown, fallback = NOT_INFORMED) {
  if (isBlank(value)) return fallback;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function listFromValue(value?: string[] | string) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function numericFeatureValue(entry?: FeatureAccessEntry | null) {
  if (!entry) return null;
  const rawValue = entry.value ?? entry.limit?.max ?? null;
  if (typeof rawValue !== 'number' && typeof rawValue !== 'string') return null;

  const parsed = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveServiceAreaLimits(company?: CompanyData | null) {
  const access = company?.feature_access;
  const statesLimit =
    numericFeatureValue(access?.service_area_states_limit) ||
    numericFeatureValue(access?.coverage_states_limit);
  const citiesLimit =
    numericFeatureValue(access?.service_area_cities_limit) ||
    numericFeatureValue(access?.coverage_cities_limit);
  const planTier = (company?.plan_tier || 'free').toLowerCase();
  const fallback = SERVICE_AREA_LIMIT_BY_PLAN[planTier] || SERVICE_AREA_LIMIT_BY_PLAN.free;

  return {
    states: statesLimit || fallback.states,
    cities: citiesLimit || fallback.cities,
  };
}

function formatLimit(value: number, singular: string, plural: string, unlimited: string) {
  if (value >= 999) return unlimited;
  return `${value} ${value === 1 ? singular : plural}`;
}

function parseList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSeoFields(data: CompanyData | null): CompanyData | null {
  if (!data) return data;

  const seoDescription = data.seo_description ?? data.meta_description ?? '';

  return {
    ...data,
    seo_description: seoDescription,
    meta_description: seoDescription,
  };
}

function formatDateTime(value?: string) {
  if (!value) return NOT_INFORMED;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_INFORMED;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return NOT_CONFIGURED;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTicketRange(company: CompanyData) {
  const minimum = formatCurrency(company.minimum_ticket);
  const maximum = formatCurrency(company.maximum_ticket);

  if (minimum === NOT_CONFIGURED && maximum === NOT_CONFIGURED) return NOT_CONFIGURED;
  if (minimum !== NOT_CONFIGURED && maximum !== NOT_CONFIGURED) return `${minimum} a ${maximum}`;
  return minimum !== NOT_CONFIGURED ? `A partir de ${minimum}` : `Até ${maximum}`;
}

function publicationLabel(status?: string) {
  if (status === 'pending') return 'Aguardando aprovação';
  if (status === 'inactive') return 'Inativo';
  return 'Publicado';
}

function publicationClass(status?: string) {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'inactive') return 'border-slate-200 bg-slate-50 text-slate-600';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function handleNumberValue(value: string) {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card
      className={cn(
        'min-w-0 overflow-hidden rounded-none border border-slate-200 bg-white shadow-none [&_.rounded-2xl]:rounded-none [&_.rounded-full]:rounded-none [&_.rounded-lg]:rounded-none [&_.rounded-xl]:rounded-none',
        className
      )}
    >
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-blue-50 text-brand-blue">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="break-words text-base font-bold text-slate-950">{title}</CardTitle>
            {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions}
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-none border-slate-200 px-3 text-xs font-bold uppercase tracking-wide text-slate-600"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
          >
            {isOpen ? 'Fechar' : 'Abrir'}
            <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </Button>
        </div>
      </CardHeader>
      {isOpen ? <CardContent className="p-4 sm:p-5">{children}</CardContent> : null}
    </Card>
  );
}

function InfoItem({
  label,
  value,
  fallback = NOT_INFORMED,
  icon: Icon,
}: {
  label: string;
  value?: ReactNode;
  fallback?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-brand-blue" />}
        {label}
      </div>
      <div className="min-w-0 break-words text-sm font-semibold text-slate-950">{isBlank(value) ? fallback : value}</div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'blue',
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: 'blue' | 'green' | 'amber' | 'slate';
  action?: ReactNode;
}) {
  const toneClasses = {
    blue: 'border-blue-100 bg-blue-50 text-brand-blue',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between', toneClasses[tone])}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-sm font-bold">{title}</p>
          {description && <p className="mt-1 break-words text-xs opacity-80">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function ListBadges({
  items,
  empty,
}: {
  items: string[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="break-words rounded-lg bg-blue-50 px-3 py-1 text-brand-blue">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function UploadAction({
  inputId,
  children,
  onChange,
}: {
  inputId: string;
  children: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={inputId}
      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-brand-blue transition hover:bg-blue-50 sm:w-auto"
    >
      <Upload className="h-4 w-4" />
      {children}
      <input id={inputId} type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={onChange} />
    </label>
  );
}

function ChecklistGrid({
  options,
  values,
  onToggle,
  columns = 'sm:grid-cols-2',
}: {
  options: readonly { value: string; label: string }[];
  values: string[];
  onToggle: (value: string) => void;
  columns?: string;
}) {
  const selected = new Set(values);

  return (
    <div className={cn('grid grid-cols-1 gap-2', columns)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
            selected.has(option.value)
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            checked={selected.has(option.value)}
            onChange={() => onToggle(option.value)}
          />
          <span className="truncate">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function CompanyInfo({ companyId }: CompanyInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyData | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { updateCompany } = useCompany(companyId);

  const fetchCompanyData = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(buildApiUrl(`companies/${companyId}`), {
        headers: getApiRequestHeaders(),
      });

      if (!response.ok) throw new Error(`Erro de carregamento: ${response.status}`);

      const data = await response.json();

      if (!data?.company) {
        setLoadError('Dados da empresa não localizados.');
        return;
      }

      const normalizedCompany = normalizeSeoFields(data.company);
      setCompany(normalizedCompany);
      setFormData(normalizedCompany);
    } catch {
      setLoadError('Não foi possível carregar as informações da empresa.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const activeServiceAreaData = formData || company;
  const serviceAreaLimits = resolveServiceAreaLimits(activeServiceAreaData);
  const selectedCoverageStates = listFromValue(activeServiceAreaData?.coverage_states);
  const selectedCoverageCities = listFromValue(activeServiceAreaData?.coverage_cities);
  const exceedsServiceAreaStates = selectedCoverageStates.length > serviceAreaLimits.states;
  const exceedsServiceAreaCities = selectedCoverageCities.length > serviceAreaLimits.cities;
  const exceedsServiceAreaLimit = exceedsServiceAreaStates || exceedsServiceAreaCities;
  const serviceAreaLimitDescription = `${formatLimit(serviceAreaLimits.states, 'estado', 'estados', 'estados ilimitados')} e ${formatLimit(serviceAreaLimits.cities, 'cidade', 'cidades', 'cidades ilimitadas')}`;

  const handleInputChange = (field: keyof CompanyData, value: CompanyData[keyof CompanyData]) => {
    setFormData((previous) => ({ ...(previous || {}), [field]: value }));
  };

  const handleListChange = (field: keyof CompanyData, value: string) => {
    handleInputChange(field, parseList(value));
  };

  const handleListToggle = (field: keyof CompanyData, value: string) => {
    const currentValues = listFromValue(formData?.[field] as string[] | string | undefined);
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    if (
      field === 'coverage_states' &&
      nextValues.length > serviceAreaLimits.states &&
      nextValues.length > currentValues.length
    ) {
      toast({
        title: 'Limite de estados excedido',
        description: 'Esta abrangência extra será enviada para aprovação comercial ou upgrade de plano.',
      });
    }

    if (
      field === 'coverage_cities' &&
      nextValues.length > serviceAreaLimits.cities &&
      nextValues.length > currentValues.length
    ) {
      toast({
        title: 'Limite de cidades excedido',
        description: 'Esta abrangência extra será enviada para aprovação comercial ou upgrade de plano.',
      });
    }

    handleInputChange(field, nextValues);
  };

  const handleStartEditing = () => {
    setFormData(normalizeSeoFields(company));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setFormData(normalizeSeoFields(company));
    setIsEditing(false);
  };

  const handleContextEdit = () => {
    if (!isEditing) {
      setFormData(normalizeSeoFields(company));
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const normalizedPayload = normalizeSeoFields(formData) || formData;
      const result = await updateCompany({ ...normalizedPayload });

      if (result.success) {
        const responseData = result.data as
          | { requires_commercial_approval?: boolean; service_area_limit?: { exceeds_limit?: boolean } }
          | undefined;
        const requiresCommercialApproval =
          Boolean(responseData?.requires_commercial_approval) ||
          Boolean(responseData?.service_area_limit?.exceeds_limit);

        setPendingApproval(true);
        setIsEditing(false);
        toast({
          title: requiresCommercialApproval
            ? 'Solicitação comercial enviada'
            : 'Alterações enviadas para aprovação',
          description: requiresCommercialApproval
            ? 'A abrangência excede o plano atual. O admin pode aprovar a exceção ou recomendar upgrade.'
            : 'Felipe poderá revisar e liberar no Active Admin antes da publicação.',
        });
        window.setTimeout(() => setPendingApproval(false), 8000);
        await fetchCompanyData();
        return;
      }

      toast({
        title: 'Não foi possível salvar',
        description: result.error || 'Revise os campos e tente novamente.',
        variant: 'destructive',
      });
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'A solicitação não foi concluída. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const payload = new FormData();
    payload.append('file', file);

    try {
      const response = await fetch(buildApiUrl('company_dashboard/update_logo'), {
        method: 'POST',
        headers: { ...getApiRequestHeaders() },
        credentials: 'include',
        body: payload,
      });

      if (!response.ok) throw new Error('Falha no upload');

      setPendingApproval(true);
      toast({
        title: 'Logo enviada para aprovação',
        description: 'A nova marca será validada antes de aparecer no perfil público.',
      });
      await fetchCompanyData();
    } catch {
      toast({
        title: 'Falha no upload da logo',
        description: 'Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleBannerUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const payload = new FormData();
    payload.append('file', file);

    try {
      const response = await fetch(buildApiUrl('company_dashboard/update_banner'), {
        method: 'POST',
        headers: { ...getApiRequestHeaders() },
        credentials: 'include',
        body: payload,
      });

      if (!response.ok) throw new Error('Falha no upload');

      setPendingApproval(true);
      toast({
        title: 'Imagem enviada para aprovação',
        description: 'O banner será validado antes de aparecer no perfil público.',
      });
      await fetchCompanyData();
    } catch {
      toast({
        title: 'Falha no upload da imagem',
        description: 'Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleLogoRemovalNotice = () => {
    toast({
      title: 'Remoção de logo',
      description: 'Não há endpoint ativo para remoção direta. Envie uma nova logo ou solicite a remoção pelo suporte.',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Carregando informações da empresa...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentData = formData || company;

  if (!currentData) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <EmptyState icon={Building2} title="Empresa não localizada" description="Não encontramos dados disponíveis para este perfil." tone="slate" />
      </div>
    );
  }

  const logoInputId = `logo-upload-${companyId}`;
  const bannerInputId = `banner-upload-${companyId}`;
  const projectTypes = listFromValue(currentData.project_types);
  const servicesOffered = listFromValue(currentData.services_offered);
  const coverageStates = listFromValue(currentData.coverage_states);
  const coverageCities = listFromValue(currentData.coverage_cities);
  const certifications = listFromValue(currentData.certifications);
  const awards = listFromValue(currentData.awards);
  const equipmentBrands = listFromValue(currentData.equipment_brands);
  const postSalesCapacity = listFromValue(currentData.post_sales_capacity);
  const primaryLocation = [currentData.city, currentData.state].filter(Boolean).join(', ') || TO_DEFINE;

  return (
    <div className="mx-auto w-full max-w-[1200px] min-w-0 space-y-5 pb-24">
      <AnimatePresence>
        {pendingApproval && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Alert className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-800">
              <Shield className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Alterações enviadas para aprovação. Felipe poderá revisar e liberar no Active Admin antes da publicação.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-brand-blue">
              Central Institucional
            </Badge>
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', publicationClass(currentData.status))}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              {publicationLabel(currentData.status)}
            </Badge>
          </div>
          <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Informações gerais</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Gerencie os dados da empresa, ativos de marca e informações públicas usadas no ecossistema Avalia Solar.
            As alterações enviadas por empresas seguem para aprovação no Active Admin.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEditing} disabled={saving} className="w-full rounded-lg sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-brand-blue text-white hover:bg-blue-700 sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </>
          ) : (
            <Button onClick={handleStartEditing} className="w-full rounded-lg bg-brand-blue text-white hover:bg-blue-700 sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Editar informações
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <SectionCard
          title="Ativo Corporativo da Marca"
          description={`Atualizado em: ${formatDateTime(currentData.updated_at)}`}
          icon={ImageIcon}
          actions={<UploadAction inputId={bannerInputId} onChange={handleBannerUpload}>Alterar imagem</UploadAction>}
        >
          <div className="min-w-0 space-y-4">
            <div className="relative min-h-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {currentData.banner_url ? (
                <>
                  <Image
                    src={currentData.banner_url}
                    alt=""
                    fill
                    aria-hidden="true"
                    className="scale-110 object-cover opacity-40 blur-xl"
                    sizes="(max-width: 768px) 100vw, 760px"
                  />
                  <Image
                    src={currentData.banner_url}
                    alt={`Banner da empresa ${displayText(currentData.name)}`}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 768px) 100vw, 760px"
                  />
                </>
              ) : (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
                  <ImageIcon className="h-8 w-8 text-brand-blue" />
                  <div>
                    <p className="font-bold text-slate-700">Banner da empresa não configurado</p>
                    <p className="mt-1 text-sm">Envie uma imagem institucional para destacar o perfil.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Formato recomendado: 1920x600px (16:5) em PNG ou JPG. Mantenha textos e logos afastados das bordas.</span>
              <span className="font-semibold text-brand-blue">Banner da Empresa</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Identidade da Marca" description="Logo, nome público e identificador oficial." icon={BadgeCheck}>
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 rounded-2xl border border-slate-200 bg-white shadow-sm">
                {currentData.logo_url && <AvatarImage src={currentData.logo_url} alt={`Logo da ${displayText(currentData.name)}`} className="object-contain p-3" />}
                <AvatarFallback className="rounded-2xl bg-blue-50 text-lg font-bold text-brand-blue">
                  {displayText(currentData.name, 'AS').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="break-words text-lg font-bold text-slate-950">{displayText(currentData.name)}</h3>
                <Badge variant="secondary" className="mt-2 rounded-lg bg-blue-50 text-brand-blue">
                  Identificador oficial
                </Badge>
                <p className="mt-3 break-words text-sm text-slate-500">{displayText(currentData.cnpj, 'Identificador oficial não informado')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <InfoItem label="Arquivo atual" value={currentData.logo_url ? 'Logo cadastrada' : NOT_CONFIGURED} icon={FileText} />
              <InfoItem label="Última atualização" value={formatDateTime(currentData.updated_at)} icon={Calendar} />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <UploadAction inputId={logoInputId} onChange={handleLogoUpload}>Alterar logo</UploadAction>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogoRemovalNotice}
                className="w-full rounded-lg border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover logo
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Informações Técnicas Essenciais"
          description="Dados jurídicos, descrição institucional e conformidade."
          icon={Building2}
          actions={
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          }
        >
          {isEditing ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome jurídico</Label>
                <Input id="company-name" value={formData?.name || ''} onChange={(event) => handleInputChange('name', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-cnpj">CNPJ</Label>
                <Input id="company-cnpj" value={formData?.cnpj || ''} onChange={(event) => handleInputChange('cnpj', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-description">Descrição corporativa</Label>
                <Textarea
                  id="company-description"
                  value={formData?.description || ''}
                  onChange={(event) => handleInputChange('description', event.target.value)}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-founded">Fundação</Label>
                <Input
                  id="company-founded"
                  type="number"
                  value={formData?.founded_year ?? ''}
                  onChange={(event) => handleInputChange('founded_year', handleNumberValue(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-employees">Capacidade produtiva</Label>
                <Input
                  id="company-employees"
                  type="number"
                  value={formData?.employees_count ?? ''}
                  onChange={(event) => handleInputChange('employees_count', handleNumberValue(event.target.value))}
                />
              </div>
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem label="Nome jurídico" value={currentData.name} />
                <InfoItem label="CNPJ" value={currentData.cnpj} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição corporativa</p>
                <p className="break-words text-sm leading-6 text-slate-700">{displayText(currentData.description)}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InfoItem label="Fundação" value={currentData.founded_year} icon={Calendar} />
                <InfoItem label="Capacidade produtiva" value={currentData.employees_count} icon={Users} />
                <InfoItem label="Conformidade" value={currentData.verified ? 'Verificada' : 'Aguardando verificação'} icon={CheckCircle2} />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Conectividade Global"
          description="Canais de contato e presença digital."
          icon={Globe}
          actions={
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          }
        >
          {isEditing ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Telefone</Label>
                <Input id="company-phone" value={formData?.phone || ''} onChange={(event) => handleInputChange('phone', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-whatsapp">WhatsApp</Label>
                <Input id="company-whatsapp" value={formData?.whatsapp || ''} onChange={(event) => handleInputChange('whatsapp', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">E-mail</Label>
                <Input id="company-email" value={formData?.email_public || ''} onChange={(event) => handleInputChange('email_public', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Site institucional</Label>
                <Input id="company-website" value={formData?.website || ''} onChange={(event) => handleInputChange('website', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-instagram">Instagram</Label>
                <Input id="company-instagram" value={formData?.instagram || ''} onChange={(event) => handleInputChange('instagram', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-facebook">Facebook</Label>
                <Input id="company-facebook" value={formData?.facebook || ''} onChange={(event) => handleInputChange('facebook', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-linkedin">LinkedIn</Label>
                <Input id="company-linkedin" value={formData?.linkedin || ''} onChange={(event) => handleInputChange('linkedin', event.target.value)} />
              </div>
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem label="Telefone" value={currentData.phone} icon={Phone} />
                <InfoItem label="E-mail" value={currentData.email_public} icon={Mail} />
                <InfoItem
                  label="Site institucional"
                  value={
                    currentData.website ? (
                      <a href={currentData.website} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 text-brand-blue hover:underline">
                        <span className="break-all">{currentData.website}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      NOT_INFORMED
                    )
                  }
                  icon={Globe}
                />
                <InfoItem label="Localização" value={primaryLocation} icon={MapPin} />
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Redes sociais</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <InfoItem label="Instagram" value={currentData.instagram} icon={Instagram} fallback={NOT_CONFIGURED} />
                  <InfoItem label="Facebook" value={currentData.facebook} icon={Facebook} fallback={NOT_CONFIGURED} />
                  <InfoItem label="LinkedIn" value={currentData.linkedin} icon={Linkedin} fallback={NOT_CONFIGURED} />
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Inteligência Operacional e Logística"
        description="Endereço, frequência de operação, ticket e SLA de resposta."
        icon={Activity}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <MapPin className="mr-2 h-4 w-4" />
              Atualizar endereço
            </Button>
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <Clock className="mr-2 h-4 w-4" />
              Configurar SLA
            </Button>
          </div>
        }
      >
        {isEditing ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-address">Endereço</Label>
              <Input id="company-address" value={formData?.address || ''} onChange={(event) => handleInputChange('address', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-city">Cidade</Label>
              <Input id="company-city" value={formData?.city || ''} onChange={(event) => handleInputChange('city', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-state">Estado</Label>
              <Input id="company-state" value={formData?.state || ''} onChange={(event) => handleInputChange('state', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-hours">Frequência de operação</Label>
              <Input id="company-hours" value={formData?.working_hours || ''} onChange={(event) => handleInputChange('working_hours', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-sla">SLA de resposta</Label>
              <Input id="company-sla" value={formData?.response_time_sla || ''} onChange={(event) => handleInputChange('response_time_sla', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-min-ticket">Ticket mínimo</Label>
              <Input
                id="company-min-ticket"
                type="number"
                value={formData?.minimum_ticket ?? ''}
                onChange={(event) => handleInputChange('minimum_ticket', handleNumberValue(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-max-ticket">Ticket máximo</Label>
              <Input
                id="company-max-ticket"
                type="number"
                value={formData?.maximum_ticket ?? ''}
                onChange={(event) => handleInputChange('maximum_ticket', handleNumberValue(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-payment">Métodos de pagamento</Label>
              <Input id="company-payment" value={formData?.payment_methods || ''} onChange={(event) => handleInputChange('payment_methods', event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-financing">Opções de financiamento</Label>
              <Input id="company-financing" value={formData?.financing_options || ''} onChange={(event) => handleInputChange('financing_options', event.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)_minmax(220px,0.7fr)]">
            {currentData.address ? (
              <InfoItem label="Sede regional" value={`${currentData.address} ${primaryLocation !== TO_DEFINE ? `- ${primaryLocation}` : ''}`} icon={MapPin} />
            ) : (
              <EmptyState
                icon={MapPin}
                title="Endereço não informado"
                description={primaryLocation}
                tone="blue"
                action={
                  <Button type="button" size="sm" onClick={handleContextEdit} className="rounded-lg bg-brand-blue text-white hover:bg-blue-700">
                    Atualizar endereço
                  </Button>
                }
              />
            )}

            <div className="grid min-w-0 grid-cols-1 gap-3">
              <InfoItem label="Frequência de operação" value={currentData.working_hours} fallback={TO_DEFINE} icon={Clock} />
              <InfoItem label="Abrangência econômica" value={formatTicketRange(currentData)} icon={DollarSign} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Clock className="h-3.5 w-3.5 text-brand-blue" />
                SLA de resposta
              </div>
              <p className="mb-4 break-words text-sm font-semibold text-slate-950">{displayText(currentData.response_time_sla)}</p>
              <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue">
                Configurar SLA
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Capacidade de Atuação"
          description="Segmentos, serviços e escopo comercial."
          icon={Wrench}
          actions={
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Gerenciar serviços
            </Button>
          }
        >
          {isEditing ? (
            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <Label>Segmentos de mercado</Label>
                <ChecklistGrid
                  options={COMPANY_PROJECT_TYPES.map((item) => ({ value: item, label: item }))}
                  values={listFromValue(formData?.project_types)}
                  onToggle={(value) => handleListToggle('project_types', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Catálogo de serviços</Label>
                <ChecklistGrid
                  options={COMPANY_SERVICES_OFFERED.map((item) => ({ value: item, label: item }))}
                  values={listFromValue(formData?.services_offered)}
                  onToggle={(value) => handleListToggle('services_offered', value)}
                />
              </div>
            </div>
          ) : (
            <div className="min-w-0 space-y-5">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Segmentos de mercado</p>
                <ListBadges items={projectTypes} empty="Nenhum segmento cadastrado." />
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Catálogo de serviços</p>
                {servicesOffered.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {servicesOffered.map((service) => (
                      <div key={service} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                        {service}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Wrench}
                    title="Nenhum serviço cadastrado"
                    description="Adicione serviços para deixar o perfil mais completo."
                    tone="slate"
                    action={
                      <Button type="button" size="sm" variant="outline" onClick={handleContextEdit} className="rounded-lg text-brand-blue">
                        Gerenciar serviços
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Área de abrangência"
          description="Cidades e estados onde a empresa informa atendimento."
          icon={MapPin}
          actions={
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Editar abrangência
            </Button>
          }
        >
          {isEditing ? (
            <div className="min-w-0 space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                Cidade principal: <strong>{primaryLocation}</strong>. Estes campos não mudam a sede da empresa; eles definem onde ela atende.
              </div>
              <Alert className={cn('rounded-xl', exceedsServiceAreaLimit ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50')}>
                <AlertCircle className={cn('h-4 w-4', exceedsServiceAreaLimit ? 'text-amber-600' : 'text-slate-500')} />
                <AlertDescription className={cn('text-sm', exceedsServiceAreaLimit ? 'text-amber-900' : 'text-slate-700')}>
                  Seu plano permite {serviceAreaLimitDescription}.{' '}
                  {exceedsServiceAreaLimit
                    ? 'A abrangência extra será enviada para aprovação comercial ou upgrade antes de ganhar visibilidade pública.'
                    : 'A sede principal continua gratuita; apenas a abrangência expandida é controlada por plano.'}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Estados atendidos</Label>
                <ChecklistGrid
                  options={BRAZIL_STATES_OPTIONS.map((option) => ({
                    value: option.state,
                    label: `${option.label} (${option.state})`,
                  }))}
                  values={listFromValue(formData?.coverage_states)}
                  onToggle={(value) => handleListToggle('coverage_states', value)}
                  columns="sm:grid-cols-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Capitais atendidas</Label>
                <ChecklistGrid
                  options={BRAZIL_CAPITAL_OPTIONS}
                  values={listFromValue(formData?.coverage_cities)}
                  onToggle={(value) => handleListToggle('coverage_cities', value)}
                  columns="sm:grid-cols-2"
                />
              </div>
            </div>
          ) : (
            <div className="min-w-0 space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sede principal</p>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800">
                  {primaryLocation}
                </div>
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estados atendidos</p>
                  <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
                    Limite: {formatLimit(serviceAreaLimits.states, 'estado', 'estados', 'estados ilimitados')}
                  </Badge>
                </div>
                <ListBadges items={coverageStates} empty="Nenhum estado adicional informado." />
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capitais atendidas</p>
                  <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
                    Limite: {formatLimit(serviceAreaLimits.cities, 'cidade', 'cidades', 'cidades ilimitadas')}
                  </Badge>
                </div>
                {coverageCities.length > 0 ? (
                  <ListBadges items={coverageCities} empty="Nenhuma capital informada." />
                ) : (
                  <EmptyState
                    icon={MapPin}
                    title="Abrangência não configurada"
                    description="Informe capitais ou estados atendidos para melhorar SEO local e recomendações do MobiVolt."
                    tone="slate"
                    action={
                      <Button type="button" size="sm" variant="outline" onClick={handleContextEdit} className="rounded-lg text-brand-blue">
                        Editar abrangência
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Certificações e Reconhecimento"
          description="Certificações técnicas, prêmios e validações comerciais."
          icon={Award}
          actions={
            <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          }
        >
          {isEditing ? (
            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-certifications">Certificações técnicas</Label>
                <Textarea
                  id="company-certifications"
                  value={formData?.certifications || ''}
                  onChange={(event) => handleInputChange('certifications', event.target.value)}
                  placeholder="Ex.: ISO 9001, certificações de fabricantes, treinamentos técnicos"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-awards">Prêmios e validações</Label>
                <Textarea
                  id="company-awards"
                  value={formData?.awards || ''}
                  onChange={(event) => handleInputChange('awards', event.target.value)}
                  placeholder="Ex.: prêmio regional, reconhecimento de fabricante"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              {certifications.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Certificações técnicas</p>
                  <ListBadges items={certifications} empty="Nenhuma certificação registrada." />
                </div>
              ) : (
                <EmptyState
                  icon={Shield}
                  title="Nenhuma certificação registrada"
                  description="Adicione certificações para aumentar a confiança no perfil."
                  tone="green"
                  action={
                    <Button type="button" size="sm" variant="outline" onClick={handleContextEdit} className="rounded-lg bg-white text-emerald-700 hover:bg-emerald-50">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar certificação
                    </Button>
                  }
                />
              )}

              {awards.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Prêmios e validações</p>
                  <ListBadges items={awards} empty="Nenhum prêmio cadastrado." />
                </div>
              ) : (
                <EmptyState
                  icon={Award}
                  title="Nenhum prêmio cadastrado"
                  description="Registre prêmios, selos e reconhecimentos comerciais."
                  tone="amber"
                  action={
                    <Button type="button" size="sm" variant="outline" onClick={handleContextEdit} className="rounded-lg bg-white text-amber-700 hover:bg-amber-50">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar prêmio
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Fundamentos de Conversão / Prova de Valor"
        description="Dados que ajudam clientes a avaliar confiança, entrega e pós-venda."
        icon={Shield}
        actions={
          <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        }
      >
        {isEditing ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-warranty">Garantia de instalação (anos)</Label>
              <Input
                id="company-warranty"
                type="number"
                value={formData?.installation_warranty_years ?? ''}
                onChange={(event) => handleInputChange('installation_warranty_years', handleNumberValue(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-delivered">Projetos entregues</Label>
              <Input
                id="company-delivered"
                type="number"
                value={formData?.delivered_projects_score ?? ''}
                onChange={(event) => handleInputChange('delivered_projects_score', handleNumberValue(event.target.value))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-equipment">Marcas de equipamentos</Label>
              <Textarea
                id="company-equipment"
                value={listFromValue(formData?.equipment_brands).join(', ')}
                onChange={(event) => handleListChange('equipment_brands', event.target.value)}
                placeholder="Ex.: WEG, Fronius, Canadian Solar"
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-post-sales">Capacidade de pós-venda e O&M</Label>
              <Textarea
                id="company-post-sales"
                value={listFromValue(formData?.post_sales_capacity).join(', ')}
                onChange={(event) => handleListChange('post_sales_capacity', event.target.value)}
                placeholder="Ex.: monitoramento, manutenção preventiva, suporte remoto"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(formData?.engineering_insurance)}
                onChange={(event) => handleInputChange('engineering_insurance', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
              />
              Seguro de risco de engenharia ativo
            </label>
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoItem label="Garantia de instalação" value={currentData.installation_warranty_years ? `${currentData.installation_warranty_years} ano(s)` : NOT_INFORMED} icon={Shield} />
              <InfoItem label="Seguro de risco de engenharia" value={currentData.engineering_insurance ? 'Sim' : 'Não'} icon={BadgeCheck} />
              <InfoItem label="Projetos entregues" value={currentData.delivered_projects_score ?? 0} icon={Activity} />
              <InfoItem label="Marcas de equipamentos" value={equipmentBrands.length ? equipmentBrands.join(', ') : NOT_INFORMED} icon={FileText} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Capacidade de pós-venda e O&M</p>
              <ListBadges items={postSalesCapacity} empty="Não informado" />
            </div>
            <Alert className="rounded-xl border-blue-100 bg-blue-50 text-brand-blue">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Mantenha estas informações atualizadas para aumentar sua conversão e a confiança no ecossistema Avalia Solar.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="SEO & Otimização de Busca (Google)"
        description="Configure títulos e descrições personalizadas para sua empresa se destacar nos buscadores."
        icon={Globe}
        actions={
          <Button type="button" variant="outline" onClick={handleContextEdit} className="w-full rounded-lg text-brand-blue sm:w-auto">
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        }
      >
        {isEditing ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-seo-title">Título de SEO (Meta Title)</Label>
              <Input
                id="company-seo-title"
                value={formData?.seo_title || ''}
                onChange={(event) => handleInputChange('seo_title', event.target.value)}
                placeholder="Ex.: Voltalia Solar - Engenharia e Instalação Fotovoltaica"
              />
              <p className="text-xs text-slate-500">Ideal: 30 a 60 caracteres. Atual: {formData?.seo_title?.length || 0} caracteres.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-seo-keywords">Palavras-chave de SEO (Keywords)</Label>
              <Input
                id="company-seo-keywords"
                value={formData?.seo_keywords || ''}
                onChange={(event) => handleInputChange('seo_keywords', event.target.value)}
                placeholder="Ex.: energia solar, instalador solar, Cuiabá, Voltalia"
              />
              <p className="text-xs text-slate-500">Separe por vírgulas. Palavras-chave relevantes para o seu negócio.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-seo-description">Meta Descrição de SEO (Meta Description)</Label>
              <Textarea
                id="company-seo-description"
                value={formData?.seo_description || ''}
                onChange={(event) => handleInputChange('seo_description', event.target.value)}
                placeholder="Ex.: Solicite seu orçamento de energia solar com a Voltalia. Atendimento especializado em Cuiabá e região com garantia de 5 anos."
                rows={3}
              />
              <p className="text-xs text-slate-500">Ideal: 70 a 160 caracteres. Atual: {formData?.seo_description?.length || 0} caracteres.</p>
            </div>
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoItem
                label="Título de SEO"
                value={currentData.seo_title}
                fallback="Usará o nome da empresa como título padrão do Google"
              />
              <InfoItem
                label="Palavras-chave de SEO"
                value={currentData.seo_keywords}
                fallback="Nenhuma palavra-chave customizada definida"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Meta Descrição de SEO</p>
              <p className="break-words text-sm leading-6 text-slate-700">
                {currentData.seo_description || "Usará a descrição institucional padrão da empresa como resumo do Google"}
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {isEditing && (
        <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">As alterações serão enviadas para aprovação antes de serem publicadas.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleCancelEditing} disabled={saving} className="rounded-lg">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-blue text-white hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
