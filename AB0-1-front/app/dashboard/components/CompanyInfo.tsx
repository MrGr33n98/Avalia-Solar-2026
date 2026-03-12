'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Users,
  DollarSign,
  Award,
  Clock,
  Save,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Pencil,
  ImageIcon,
  Hash,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCompany } from '../hooks';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { cn } from '@/lib/utils';

interface CompanyInfoProps {
  companyId: string;
}

interface CompanyData {
  name: string;
  description: string;
  website: string;
  phone: string;
  phone_alt?: string;
  whatsapp: string;
  email_public: string;
  address: string;
  state: string;
  city: string;
  cnpj: string;
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
  project_types?: string[];
  services_offered?: string[];
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
      const response = await fetch(buildApiUrl(`companies/${companyId}`), {
        headers: getApiRequestHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch company data (${response.status})`);
      }
      const data = await response.json();
      if (!data?.company) {
        setLoadError('Empresa não encontrada ou não associada à sua conta.');
      } else {
        setCompany(data.company);
        setFormData(data.company);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setLoadError('Falha ao carregar dados da empresa.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleInputChange = (field: keyof CompanyData, value: any) => {
    setFormData((prev) => ({ ...(prev || {}), [field]: value } as CompanyData));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = formData ? { ...formData } : {};
      const result = await updateCompany(payload);
      if (result.success) {
        setPendingApproval(true);
        setIsEditing(false);
        setTimeout(() => setPendingApproval(false), 5000);
      }
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(company);
    setIsEditing(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg'].includes(file.type)) {
      alert('Formato inválido. Use PNG ou JPG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo acima de 2MB');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(buildApiUrl('company_dashboard/update_logo'), {
        method: 'POST',
        headers: { ...getApiRequestHeaders() },
        credentials: 'include',
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar logo');
      }
      setPendingApproval(true);
      fetchCompanyData();
      setTimeout(() => setPendingApproval(false), 5000);
    } catch (err) {
      console.error('Upload logo error:', err);
      alert((err as any)?.message || 'Erro ao enviar logo');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg'].includes(file.type)) {
      alert('Formato inválido. Use PNG ou JPG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Banner acima de 5MB');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(buildApiUrl('company_dashboard/update_banner'), {
        method: 'POST',
        headers: { ...getApiRequestHeaders() },
        credentials: 'include',
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar banner');
      }
      setPendingApproval(true);
      fetchCompanyData();
      setTimeout(() => setPendingApproval(false), 5000);
    } catch (err) {
      console.error('Upload banner error:', err);
      alert((err as any)?.message || 'Erro ao enviar banner');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground dark:text-white/40">Carregando dados técnicos...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-6 flex items-center gap-4">
        <AlertCircle className="h-6 w-6" />
        <p className="font-bold text-sm uppercase tracking-wider">{loadError}</p>
      </div>
    );
  }

  const TechnicalLabel = ({ children, htmlFor }: { children: React.ReactNode, htmlFor?: string }) => (
    <Label htmlFor={htmlFor} className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground dark:text-white/40 mb-1.5 block">
      {children}
    </Label>
  );

  const InfoBlock = ({ icon: Icon, label, value, className }: any) => (
    <div className={cn("space-y-1.5", className)}>
      <TechnicalLabel>{label}</TechnicalLabel>
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-inner">
          <Icon className="h-3.5 w-3.5 text-brand-cyan" />
        </div>
        <p className="text-sm font-bold text-foreground dark:text-white/80">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Pending Approval Alert */}
      {pendingApproval && (
        <Alert className="clay-precision bg-emerald-500/10 border-emerald-500/20 text-emerald-500 rounded-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5" />
          <AlertDescription className="font-bold uppercase tracking-widest text-[11px] ml-2">
            Alterações em análise técnica. Publicação em breve.
          </AlertDescription>
        </Alert>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tighter mb-1">Informações da Empresa</h2>
          <p className="text-sm font-medium text-muted-foreground dark:text-white/40">
            Gerenciamento de ativos, identidade e metadados corporativos.
          </p>
        </div>
        <div className="flex shrink-0">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="clay-precision-btn h-11 rounded-xl px-6 text-xs uppercase tracking-[0.1em]">
              <Pencil className="h-4 w-4 mr-2" />
              Editar Informações
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="h-11 rounded-xl px-6 text-xs border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground dark:text-white uppercase tracking-[0.1em]">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="clay-precision-btn h-11 rounded-xl px-6 text-xs uppercase tracking-[0.1em] bg-brand-green border-none">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Processando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Identity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Banner Card */}
        <Card className="lg:col-span-8 clay-precision bg-card dark:bg-[#002B4D] overflow-hidden shadow-none border-none">
          <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-cyan flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Viewport do Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative group">
              <div className={cn(
                "relative rounded-2xl overflow-hidden border-[0.5px] border-black/10 dark:border-white/10 bg-black/[0.05] dark:bg-black/40 shadow-2xl transition-all duration-500",
                formData?.banner_url ? "aspect-[21/7]" : "aspect-[21/7] flex items-center justify-center"
              )}>
                {formData?.banner_url ? (
                  <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="text-center space-y-2 opacity-20">
                    <ImageIcon className="h-12 w-12 mx-auto" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground dark:text-white">Sem banner configurado</p>
                  </div>
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-[#002B4D]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <label htmlFor="banner-upload" className="cursor-pointer">
                      <div className="bg-white text-[#002B4D] h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                        <Upload className="h-4 w-4" />
                        Trocar Banner
                      </div>
                      <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                    </label>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between items-center px-1">
                <p className="text-[9px] font-bold text-muted-foreground dark:text-white/20 uppercase tracking-tighter">Resolução recomendada: 1920x640px · Proporção Técnica 3:1</p>
                {formData?.banner_url && <Badge variant="outline" className="h-5 text-[8px] border-black/5 dark:border-white/10 text-muted-foreground dark:text-white/40 uppercase">Ativo</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Card */}
        <Card className="lg:col-span-4 clay-precision bg-card dark:bg-[#002B4D] overflow-hidden shadow-none border-none">
          <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-cyan flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Símbolo de Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <Avatar className="h-28 w-28 rounded-[2rem] border-[0.5px] border-black/10 dark:border-white/10 clay-precision p-1 bg-white dark:bg-white/5">
                <AvatarImage src={formData?.logo_url} className="rounded-[1.8rem] object-contain bg-white dark:bg-[#0F172A] p-4" />
                <AvatarFallback className="text-3xl font-black text-brand-blue bg-slate-50 dark:bg-[#002B4D] rounded-[1.8rem]">
                  {formData?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 cursor-pointer">
                  <div className="bg-brand-blue text-white h-9 w-9 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border border-white/20">
                    <Upload className="h-4 w-4" />
                  </div>
                  <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
            <div className="mt-6 space-y-1">
              <h4 className="text-sm font-black text-foreground dark:text-white tracking-tight uppercase">{formData?.name || 'Sua Empresa'}</h4>
              <p className="text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-widest">Identidade Oficial</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Basic Info & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 dark:text-white/80">Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <TechnicalLabel htmlFor="name">Nome da Empresa *</TechnicalLabel>
                {isEditing ? (
                  <Input id="name" value={formData?.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="clay-precision-input" />
                ) : (
                  <p className="text-sm font-black text-foreground dark:text-white">{company?.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <TechnicalLabel htmlFor="cnpj">CNPJ</TechnicalLabel>
                {isEditing ? (
                  <Input id="cnpj" value={formData?.cnpj || ''} onChange={(e) => handleInputChange('cnpj', e.target.value)} className="clay-precision-input font-mono" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground dark:text-white/20" />
                    <p className="text-sm font-bold text-foreground/80 dark:text-white/80 font-mono">{company?.cnpj || '-'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <TechnicalLabel htmlFor="description">Descrição Corporativa *</TechnicalLabel>
              {isEditing ? (
                <Textarea id="description" value={formData?.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} className="clay-precision-input min-h-[120px] resize-none" rows={4} />
              ) : (
                <p className="text-sm text-foreground/60 dark:text-white/60 leading-relaxed bg-black/[0.03] dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">{company?.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <InfoBlock icon={Calendar} label="Fundação" value={company?.founded_year} />
              <InfoBlock icon={Users} label="Efetivo" value={company?.employees_count ? `${company.employees_count} colaboradores` : '-'} />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 dark:text-white/80">Canais de Comunicação</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoBlock icon={Phone} label="Telefone Master" value={company?.phone} />
              <InfoBlock icon={Phone} label="Suporte Alternativo" value={company?.phone_alt} />
              <InfoBlock icon={Mail} label="E-mail Público" value={company?.email_public} />
              <InfoBlock icon={Globe} label="Portal Web" value={company?.website} className="md:col-span-1" />
            </div>
            
            <Separator className="bg-black/5 dark:bg-white/5" />
            
            <div className="space-y-4">
              <TechnicalLabel>Social & Engagement</TechnicalLabel>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Instagram, label: 'Instagram', field: 'instagram' as const },
                  { icon: Facebook, label: 'Facebook', field: 'facebook' as const },
                  { icon: Linkedin, label: 'LinkedIn', field: 'linkedin' as const }
                ].map((social) => (
                  <div key={social.label} className="p-3 rounded-xl bg-black/[0.03] dark:bg-black/20 border border-black/5 dark:border-white/5 flex flex-col items-center gap-2">
                    <social.icon className="h-4 w-4 text-muted-foreground dark:text-white/40" />
                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 dark:text-white/20 tracking-tighter">{social.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services & Awards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 dark:text-white/80">Projetos e Serviços</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <TechnicalLabel>Segmentos Atendidos</TechnicalLabel>
                <div className="flex flex-wrap gap-2">
                  {(company?.project_types || []).map((t) => (
                    <Badge key={t} className="bg-brand-blue/10 text-brand-blue dark:text-brand-cyan border-none hover:bg-brand-blue/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <TechnicalLabel>Portfólio de Serviços</TechnicalLabel>
                <div className="flex flex-wrap gap-2">
                  {(company?.services_offered || []).map((s) => (
                    <Badge key={s} className="bg-black/[0.03] dark:bg-white/5 text-foreground/60 dark:text-white/60 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 dark:text-white/80">Diferenciais</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1.5">
              <TechnicalLabel>Certificações Técnicas</TechnicalLabel>
              <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-black/20 border border-black/5 dark:border-white/5">
                <p className="text-xs font-bold text-foreground/60 dark:text-white/60 leading-relaxed">{company?.certifications || 'Nenhuma certificação listada.'}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <TechnicalLabel>Reconhecimentos</TechnicalLabel>
              <div className="p-3 rounded-xl bg-brand-yellow/10 dark:bg-brand-yellow/5 border border-brand-yellow/20 dark:border-brand-yellow/10">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-3.5 w-3.5 text-brand-yellow" />
                  <span className="text-[9px] font-black uppercase text-brand-yellow tracking-widest">Prêmios</span>
                </div>
                <p className="text-xs font-bold text-foreground/60 dark:text-white/60 leading-relaxed">{company?.awards || 'Sem premiações registradas.'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location */}
      <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
        <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 dark:text-white/80 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-cyan" />
            Base de Operações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <InfoBlock icon={MapPin} label="Endereço Fiscal/Operacional" value={company?.address} />
              <div className="grid grid-cols-2 gap-6">
                <InfoBlock icon={Building2} label="Cidade" value={company?.city} />
                <InfoBlock icon={MapPin} label="Estado (UF)" value={company?.state} />
              </div>
            </div>
            <div className="space-y-4 bg-black/[0.03] dark:bg-black/20 p-5 rounded-2xl border border-black/5 dark:border-white/5">
              <TechnicalLabel>Coordenadas Geográficas</TechnicalLabel>
              <div className="space-y-3 font-mono text-[11px] font-bold">
                <div className="flex justify-between items-center text-muted-foreground dark:text-white/40">
                  <span>LATITUDE</span>
                  <span className="text-brand-cyan">{company?.latitude || '0.000000'}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground dark:text-white/40">
                  <span>LONGITUDE</span>
                  <span className="text-brand-cyan">{company?.longitude || '0.000000'}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground dark:text-white">
                Validar no Mapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
        <CardHeader className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 dark:text-white/80 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-cyan" />
            Metadados Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <InfoBlock icon={Clock} label="Horário de Funcionamento" value={company?.working_hours} className="md:col-span-2" />
            <InfoBlock icon={DollarSign} label="Ticket Médio" value={company?.minimum_ticket ? `R$ ${company.minimum_ticket.toLocaleString()} - R$ ${company.maximum_ticket?.toLocaleString()}` : '-'} />
            <InfoBlock icon={CheckCircle2} label="SLA de Resposta" value={company?.response_time_sla} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
