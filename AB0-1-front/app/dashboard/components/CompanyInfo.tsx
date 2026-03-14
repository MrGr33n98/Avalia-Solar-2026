'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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
  Linkedin,
  Shield,
  FileText,
  Maximize2,
  ExternalLink,
  Target,
  Activity
} from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { motion, AnimatePresence } from 'framer-motion';

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
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      const data = await response.json();
      if (!data?.company) {
        setLoadError('Dados da empresa não localizados.');
      } else {
        setCompany(data.company);
        setFormData(data.company);
      }
    } catch (error) {
      setLoadError('Falha crítica na conexão com o servidor.');
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
      const result = await updateCompany(formData ? { ...formData } : {});
      if (result.success) {
        setPendingApproval(true);
        setIsEditing(false);
        setTimeout(() => setPendingApproval(false), 8000);
        fetchCompanyData();
      }
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(buildApiUrl('company_dashboard/update_logo'), {
        method: 'POST',
        headers: { ...getApiRequestHeaders() },
        credentials: 'include',
        body: fd
      });
      if (!res.ok) throw new Error('Upload failed');
      setPendingApproval(true);
      fetchCompanyData();
      toast({ title: "Logo em processamento", description: "O novo ativo está sendo validado." });
    } catch (err) {
      toast({ title: "Falha no Upload", variant: "destructive" });
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(buildApiUrl('company_dashboard/update_banner'), {
        method: 'POST',
        headers: { ...getApiRequestHeaders() },
        credentials: 'include',
        body: fd
      });
      if (!res.ok) throw new Error('Upload failed');
      setPendingApproval(true);
      fetchCompanyData();
      toast({ title: "Banner em processamento", description: "O ativo visual está sendo validado." });
    } catch (err) {
      toast({ title: "Falha no Upload", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Iniciando Protocolo de Dados Tech</p>
      </div>
    );
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 block">
      {children}
    </h3>
  );

  const TechInputLabel = ({ children, htmlFor }: { children: React.ReactNode, htmlFor?: string }) => (
    <Label htmlFor={htmlFor} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 block">
      {children}
    </Label>
  );

  return (
    <div className="space-y-12 max-w-[1200px] mx-auto pb-24">
      {/* Dynamic Notifications */}
      <AnimatePresence>
        {pendingApproval && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          >
            <Alert className="clay-precision bg-emerald-500/5 border-emerald-500/10 text-emerald-500 rounded-2xl p-5 flex items-center gap-4">
              <Shield className="h-5 w-5 fill-emerald-500/20" />
              <AlertDescription className="font-black uppercase tracking-widest text-[10px]">
                Protocolo de aprovação iniciado. Os dados serão validados pelo comitê técnico.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Intelligence */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground dark:text-white">
              Institutional Vault
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-lg">
            Gestão avançada de metadados, ativos de marca e compliance corporativo para o ecossistema Avalia Solar.
          </p>
        </div>
        <div className="flex gap-4">
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)} 
              className="clay-precision bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl px-8 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Upgrade Info
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsEditing(false)} 
                disabled={saving}
                className="h-12 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Abortar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="clay-precision bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-2xl px-8 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Gravando...' : 'Comitar Alterações'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Identity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Banner Control */}
        <Card className="lg:col-span-2 clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden group">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Corporate Hero Asset
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="relative aspect-[21/9] rounded-3xl overflow-hidden bg-slate-100 dark:bg-black/40 border-[0.5px] border-slate-200 dark:border-white/10 shadow-2xl group/banner">
              {formData?.banner_url ? (
                <Image src={formData.banner_url} alt="Brand Banner" fill className="w-full h-full object-cover transition-transform duration-1000 group-hover/banner:scale-105" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-20">
                  <Maximize2 className="h-12 w-12" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Static Placeholder</p>
                </div>
              )}
              
              {isEditing && (
                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md opacity-0 group-hover/banner:opacity-100 transition-all duration-300 flex items-center justify-center">
                   <label htmlFor="banner-upload" className="cursor-pointer">
                     <div className="h-11 rounded-xl px-6 font-black text-[10px] uppercase tracking-[0.2em] bg-white text-blue-900 border-none shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                       <Upload className="h-4 w-4" /> Upload New Engine
                     </div>
                     <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                   </label>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between items-center px-1 text-[9px] font-black font-mono text-muted-foreground/30 uppercase tracking-widest">
              <span>Resolution: 1920x820px (Max Optimal)</span>
              <span className="text-blue-600/50">Status: Online</span>
            </div>
          </CardContent>
        </Card>

        {/* Logo Control */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden flex flex-col">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Core Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-8 flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-[2.5rem] bg-white dark:bg-[#002B4D] clay-precision p-1 shadow-2xl ring-1 ring-slate-100 dark:ring-white/5">
                <Avatar className="h-full w-full rounded-[2.4rem] overflow-hidden bg-slate-50 dark:bg-transparent">
                  <AvatarImage src={formData?.logo_url} className="object-contain p-6" />
                  <AvatarFallback className="text-3xl font-black text-blue-600 bg-blue-600/5 uppercase">
                    {formData?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isEditing && (
                <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 cursor-pointer">
                  <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                  </div>
                  <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-black tracking-tight uppercase text-foreground dark:text-white">
                {formData?.name || 'Unidentified'}
              </h4>
              <Badge className="bg-blue-600/5 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">
                Official Identifier
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Profile */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none">
          <CardHeader className="p-6">
            <SectionLabel>Core Technicals</SectionLabel>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <TechInputLabel>Legal Entity Name</TechInputLabel>
                {isEditing ? (
                  <Input value={formData?.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="h-12 rounded-xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 font-bold" />
                ) : (
                  <p className="text-sm font-black text-foreground dark:text-white uppercase tracking-tight">{company?.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <TechInputLabel>Register (CNPJ)</TechInputLabel>
                {isEditing ? (
                  <Input value={formData?.cnpj || ''} onChange={(e) => handleInputChange('cnpj', e.target.value)} className="h-12 rounded-xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 font-mono" />
                ) : (
                  <div className="h-12 flex items-center gap-3 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <Hash className="h-4 w-4 text-blue-600/40" />
                    <span className="text-sm font-bold font-mono tracking-wider">{company?.cnpj ||'NOT_DEFINED'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <TechInputLabel>Corporate DNA (Description)</TechInputLabel>
              {isEditing ? (
                <Textarea 
                  value={formData?.description || ''} 
                  onChange={(e) => handleInputChange('description', e.target.value)} 
                  className="min-h-[160px] rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 font-medium leading-relaxed" 
                />
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-muted-foreground/80 dark:text-slate-300 leading-relaxed">
                    {company?.description}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
               {[
                 { icon: Calendar, label: "Founding", value: company?.founded_year || '-' },
                 { icon: Users, label: "Capacity", value: company?.employees_count ? `${company.employees_count}` : '-' },
                 { icon: Shield, label: "Compliance", value: "Verified" }
               ].map((item, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-center group hover:border-blue-600/20 transition-all">
                    <item.icon className="h-4 w-4 text-blue-600/40 mx-auto mb-2 group-hover:text-blue-600 transition-colors" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">{item.label}</p>
                    <p className="text-xs font-black text-foreground dark:text-white uppercase">{item.value}</p>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* Global Connectivity */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none">
          <CardHeader className="p-6">
            <SectionLabel>Global Connectivity</SectionLabel>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: Phone, label: "Primary Terminal", value: company?.phone, field: 'phone' },
                { icon: Mail, label: "Digital Inbox", value: company?.email_public, field: 'email_public' },
                { icon: Globe, label: "Web Portal", value: company?.website, field: 'website' },
                { icon: MapPin, label: "Operations Hub", value: company?.city, field: 'city' }
              ].map((conn, i) => (
                <div key={i} className="space-y-2">
                  <TechInputLabel>{conn.label}</TechInputLabel>
                  <div className="h-12 flex items-center justify-between px-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <conn.icon className="h-4 w-4 text-blue-600/40" />
                      <span className="text-sm font-bold text-foreground/70 dark:text-white/70 truncate">{conn.value || 'N/A'}</span>
                    </div>
                    {conn.value && <ExternalLink className="h-3 w-3 text-muted-foreground/20" />}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="bg-slate-100 dark:bg-white/5" />

            <div className="space-y-4">
              <TechInputLabel>Social Sync Endpoints</TechInputLabel>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Instagram, label: "INSTA", color: "rose", value: company?.instagram },
                  { icon: Facebook, label: "FBK", color: "blue", value: company?.facebook },
                  { icon: Linkedin, label: "LKD", color: "sky", value: company?.linkedin }
                ].map((social, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-2 group transition-all",
                    social.value ? "opacity-100 border-blue-600/10" : "opacity-30 grayscale"
                  )}>
                    <social.icon className="h-5 w-5 text-muted-foreground/40 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{social.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-blue-600/[0.03] border border-blue-600/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Public Profile SLA</p>
                  <p className="text-xs font-bold text-muted-foreground">Otimizado para indexação global</p>
                </div>
              </div>
              <div className="flex gap-1">
                 {[1,2,3].map(i => <div key={i} className="h-1 w-4 rounded-full bg-blue-600/20" />)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Logistics */}
      <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Operational & Logistics Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <TechInputLabel>Regional Headquarters</TechInputLabel>
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 group hover:border-blue-600/20 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0">
                       <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-foreground dark:text-white uppercase leading-tight mb-2">
                        {company?.address || 'Terminal Address Not Set'}
                      </p>
                      <div className="flex items-center gap-4">
                         <Badge className="bg-slate-200/50 dark:bg-white/5 text-muted-foreground border-none font-black text-[9px] uppercase">{company?.city}</Badge>
                         <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[9px] uppercase">{company?.state}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <TechInputLabel>Working Frequency</TechInputLabel>
              <div className="flex items-center gap-4 mb-4">
                <Clock className="h-5 w-5 text-blue-600/40" />
                <span className="text-sm font-black text-foreground/80 dark:text-white/80 uppercase tracking-tight">{company?.working_hours || 'TBD'}</span>
              </div>
              <TechInputLabel>Economic Bracket</TechInputLabel>
              <div className="flex items-center gap-4">
                <DollarSign className="h-5 w-5 text-emerald-600/40" />
                <span className="text-sm font-black text-emerald-600 uppercase tracking-tight font-mono">
                  {company?.minimum_ticket ? `BRL ${company.minimum_ticket.toLocaleString()} - ${company.maximum_ticket?.toLocaleString()}` : 'OPEN_TICKET'}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Response SLA</p>
                 <p className="text-2xl font-black text-blue-600 font-mono tracking-tighter">{company?.response_time_sla || 'N/A'}</p>
               </div>
               <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                   initial={{ width: 0 }}
                   animate={{ width: '85%' }}
                 />
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities & Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none">
           <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
             <SectionLabel>Portfolio Capability</SectionLabel>
           </CardHeader>
           <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <TechInputLabel>Market Segments</TechInputLabel>
                <div className="flex flex-wrap gap-2">
                  {(company?.project_types || []).map((t, i) => (
                    <Badge key={i} className="bg-blue-600/10 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest px-4 h-8 rounded-xl shadow-sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <TechInputLabel>Service Catalog</TechInputLabel>
                <div className="flex flex-wrap gap-2">
                  {(company?.services_offered || []).map((s, i) => (
                    <Badge key={i} variant="outline" className="border-slate-200 dark:border-white/10 text-muted-foreground font-black text-[9px] uppercase tracking-widest px-4 h-8 rounded-xl">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
           </CardContent>
         </Card>

         <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none">
           <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
             <SectionLabel>Market Distinction</SectionLabel>
           </CardHeader>
           <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <TechInputLabel>Technical Certifications</TechInputLabel>
                <div className="p-6 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 flex items-start gap-4">
                   <Shield className="h-6 w-6 text-emerald-500 shrink-0" />
                   <p className="text-xs font-bold text-emerald-900/60 dark:text-emerald-500/80 leading-relaxed">
                     {company?.certifications || 'No active certifications logged.'}
                   </p>
                </div>
              </div>
              <div className="space-y-2">
                <TechInputLabel>Awards & Validations</TechInputLabel>
                <div className="p-6 rounded-2xl bg-yellow-500/[0.03] border border-yellow-500/10 flex items-start gap-4">
                   <Award className="h-6 w-6 text-yellow-500 shrink-0" />
                   <p className="text-xs font-bold text-yellow-900/60 dark:text-yellow-500/80 leading-relaxed">
                     {company?.awards || 'Awaiting formal market validation.'}
                   </p>
                </div>
              </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
