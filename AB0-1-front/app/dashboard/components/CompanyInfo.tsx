'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Pencil
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/companies/${companyId}`);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/company_dashboard/update_logo`, {
        method: 'POST',
        headers: {
          Authorization: (() => {
            try { const a = localStorage.getItem('auth'); return a ? `Bearer ${JSON.parse(a).token}` : ''; } catch { return ''; }
          })()
        },
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar logo');
      }
      setPendingApproval(true);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/company_dashboard/update_banner`, {
        method: 'POST',
        headers: {
          Authorization: (() => {
            try { const a = localStorage.getItem('auth'); return a ? `Bearer ${JSON.parse(a).token}` : ''; } catch { return ''; }
          })()
        },
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar banner');
      }
      setPendingApproval(true);
      setTimeout(() => setPendingApproval(false), 5000);
    } catch (err) {
      console.error('Upload banner error:', err);
      alert((err as any)?.message || 'Erro ao enviar banner');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (loadError) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval Alert */}
      {pendingApproval && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Alterações enviadas para aprovação!</strong>
              <br />
              Suas mudanças estão sendo revisadas pela equipe do ActiveAdmin e serão publicadas após aprovação.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Informações da Empresa</h2>
          <p className="text-muted-foreground">
            Gerencie as informações básicas e detalhes da sua empresa
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Informações
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}
      </div>

      {/* Logo and Banner */}
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
          <CardDescription>Logo e banner da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={formData?.logo_url} alt="Logo" />
                  <AvatarFallback className="text-2xl">
                    {formData?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG ou JPG, até 2MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Banner */}
            <div className="space-y-3">
              <Label>Banner da Empresa</Label>
              <div className="space-y-2">
                {formData?.banner_url && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={formData.banner_url}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {isEditing && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      id="banner-upload"
                    />
                    <Label htmlFor="banner-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Banner
                        </span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG ou JPG, até 5MB. Recomendado: 1920x600px
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nome da empresa"
                />
              ) : (
                <p className="text-sm font-medium">{company?.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              {isEditing ? (
                <Input
                  id="cnpj"
                  value={formData?.cnpj || ''}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              ) : (
                <p className="text-sm font-medium">{company?.cnpj || '-'}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData?.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva sua empresa, produtos e serviços..."
                rows={4}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{company?.description}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founded_year">Ano de Fundação</Label>
              {isEditing ? (
                <Input
                  id="founded_year"
                  type="number"
                  value={formData?.founded_year || ''}
                  onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value))}
                  placeholder="2020"
                />
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {company?.founded_year || '-'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employees_count">Número de Funcionários</Label>
              {isEditing ? (
                <Input
                  id="employees_count"
                  type="number"
                  value={formData?.employees_count || ''}
                  onChange={(e) => handleInputChange('employees_count', parseInt(e.target.value))}
                  placeholder="50"
                />
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {company?.employees_count || '-'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects & Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tipos de Projetos e Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Tipos de Projetos</Label>
              {isEditing ? (
                <div className="grid grid-cols-1 gap-2">
                  {['Residenciais','Comerciais','Rurais'].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(formData?.project_types || []).includes(type)}
                        onChange={(e) => {
                          const current = new Set(formData?.project_types || []);
                          if (e.target.checked) current.add(type); else current.delete(type);
                          handleInputChange('project_types', Array.from(current));
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(company?.project_types || []).map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Serviços Oferecidos</Label>
              {isEditing ? (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Instalação Residencial',
                    'Instalação Comercial',
                    'Instalação Industrial',
                    'Manutenção e Suporte',
                    'Consultoria Energética',
                  ].map((svc) => (
                    <label key={svc} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(formData?.services_offered || []).includes(svc)}
                        onChange={(e) => {
                          const current = new Set(formData?.services_offered || []);
                          if (e.target.checked) current.add(svc); else current.delete(svc);
                          handleInputChange('services_offered', Array.from(current));
                        }}
                      />
                      <span>{svc}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(company?.services_offered || []).map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone Principal *</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData?.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 1234-5678"
                />
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {company?.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_alt">Telefone Alternativo</Label>
              {isEditing ? (
                <Input
                  id="phone_alt"
                  value={formData?.phone_alt || ''}
                  onChange={(e) => handleInputChange('phone_alt', e.target.value)}
                  placeholder="(11) 98765-4321"
                />
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {company?.phone_alt || '-'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              {isEditing ? (
                <Input
                  id="whatsapp"
                  value={formData?.whatsapp || ''}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="+5511987654321"
                />
              ) : (
                <p className="text-sm">{company?.whatsapp || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_public">E-mail Público</Label>
              {isEditing ? (
                <Input
                  id="email_public"
                  type="email"
                  value={formData?.email_public || ''}
                  onChange={(e) => handleInputChange('email_public', e.target.value)}
                  placeholder="contato@empresa.com"
                />
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {company?.email_public || '-'}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData?.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.empresa.com"
                />
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={company?.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {company?.website || '-'}
                  </a>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            {isEditing ? (
              <Textarea
                id="address"
                value={formData?.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Rua, número, complemento, bairro"
                rows={2}
              />
            ) : (
              <p className="text-sm">{company?.address || '-'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={formData?.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="São Paulo"
                />
              ) : (
                <p className="text-sm">{company?.city || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              {isEditing ? (
                <Input
                  id="state"
                  value={formData?.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              ) : (
                <p className="text-sm">{company?.state || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              {isEditing ? (
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={formData?.latitude || ''}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                  placeholder="-23.550520"
                />
              ) : (
                <p className="text-sm">{company?.latitude || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              {isEditing ? (
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={formData?.longitude || ''}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                  placeholder="-46.633308"
                />
              ) : (
                <p className="text-sm">{company?.longitude || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="working_hours">Horário de Funcionamento</Label>
            {isEditing ? (
              <Textarea
                id="working_hours"
                value={formData?.working_hours || ''}
                onChange={(e) => handleInputChange('working_hours', e.target.value)}
                placeholder="Seg-Sex: 9h-18h, Sáb: 9h-13h"
                rows={2}
              />
            ) : (
              <p className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {company?.working_hours || '-'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_methods">Métodos de Pagamento</Label>
            {isEditing ? (
              <Input
                id="payment_methods"
                value={formData?.payment_methods || ''}
                onChange={(e) => handleInputChange('payment_methods', e.target.value)}
                placeholder="Dinheiro, Cartão, Pix, Boleto"
              />
            ) : (
              <p className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {company?.payment_methods || '-'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certificações</Label>
            {isEditing ? (
              <Textarea
                id="certifications"
                value={formData?.certifications || ''}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                placeholder="ISO 9001, ISO 14001, etc."
                rows={2}
              />
            ) : (
              <p className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                {company?.certifications || '-'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="awards">Prêmios e Reconhecimentos</Label>
            {isEditing ? (
              <Textarea
                id="awards"
                value={formData?.awards || ''}
                onChange={(e) => handleInputChange('awards', e.target.value)}
                placeholder="Lista de prêmios e reconhecimentos"
                rows={2}
              />
            ) : (
              <p className="text-sm">{company?.awards || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages">Idiomas Atendidos</Label>
            {isEditing ? (
              <Input
                id="languages"
                value={formData?.languages || ''}
                onChange={(e) => handleInputChange('languages', e.target.value)}
                placeholder="Português, Inglês, Espanhol"
              />
            ) : (
              <p className="text-sm">{company?.languages || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_time_sla">SLA de Resposta</Label>
            {isEditing ? (
              <Input
                id="response_time_sla"
                value={formData?.response_time_sla || ''}
                onChange={(e) => handleInputChange('response_time_sla', e.target.value)}
                placeholder="24 horas"
              />
            ) : (
              <p className="text-sm">{company?.response_time_sla || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
          <CardDescription>Links para suas redes sociais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              {isEditing ? (
                <Input
                  id="instagram"
                  value={formData?.instagram || ''}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="@empresa"
                />
              ) : (
                <p className="text-sm">{company?.instagram || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              {isEditing ? (
                <Input
                  id="facebook"
                  value={formData?.facebook || ''}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  placeholder="facebook.com/empresa"
                />
              ) : (
                <p className="text-sm">{company?.facebook || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              {isEditing ? (
                <Input
                  id="linkedin"
                  value={formData?.linkedin || ''}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/company/empresa"
                />
              ) : (
                <p className="text-sm">{company?.linkedin || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
