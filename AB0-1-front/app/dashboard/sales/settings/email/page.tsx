'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Code2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Trash2,
  Edit3,
  Calendar,
  Linkedin,
  Upload,
  Camera,
  X,
  Image as ImageIcon,
  Link2,
  AlertCircle,
  Loader2,
  Smartphone,
  Monitor,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

import {
  escapeHtml,
  sanitizeHttpUrl,
  sanitizeEmailAddress,
  parseAndFormatWhatsappPhone,
  buildResponsiveSignatureHtml,
  DEFAULT_SIGNATURE_ASSETS,
} from './signature-utils';
import { WhatsAppButton2 } from '@/components/ui/WhatsAppButton2';

type SignatureFields = {
  full_name?: string;
  role_title?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  logo_url?: string;
  website_url?: string;
  linkedin_url?: string;
  calendly_url?: string;
  cta_text?: string;
  footer_tagline?: string;
  whatsapp_message?: string;
};

type Signature = {
  id: number;
  name: string;
  body_html: string;
  is_default: boolean;
  avatar_url?: string;
  logo_url?: string;
  fields?: SignatureFields;
};

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function EmailSignaturesPage() {
  // Controle de Permissão (Admin vs. Vendedor/Read-Only)
  const [isAdmin, setIsAdmin] = useState(true);

  // Campos Estruturados da Assinatura Oficial Avalia Solar
  const [fullName, setFullName] = useState('Felipe Henrique');
  const [roleTitle, setRoleTitle] = useState('Fundador do Avalia Solar');
  const [email, setEmail] = useState('felipe@avaliasolar.com.br');
  const [phone, setPhone] = useState('(65) 99346-5055');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png'
  );
  const [avatarSignedId, setAvatarSignedId] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('https://www.avaliasolar.com.br/');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/in/felipe-morais-8bb61a7b/');
  const [calendlyUrl, setCalendlyUrl] = useState('https://calendly.com/felipe-avaliasolar/30min');
  const [ctaText, setCtaText] = useState('Agendar 30 min ↗');
  const [logoUrl, setLogoUrl] = useState(
    'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png'
  );
  const [logoSignedId, setLogoSignedId] = useState<string | null>(null);
  const [footerTagline, setFooterTagline] = useState(
    'ENERGIA SOLAR ● MOBILIDADE ELÉTRICA ● CONFIANÇA DIGITAL'
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    'Olá! Gostaria de falar sobre os projetos da Avalia Solar.'
  );

  // Estados de Interface e Persistência
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'iphone' | 'se' | 'compact'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [signatureName, setSignatureName] = useState('Assinatura Oficial Avalia Solar (Padrão)');
  const hydratedInitialRef = useRef(false);

  // Upload Refs e Modos de Input
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('upload');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');

  const uploadSignatureAsset = async (file: File, kind: 'avatar' | 'logo') => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('A imagem excede o limite máximo de 5 MB.');
      return;
    }

    if (kind === 'avatar') setUploadingAvatar(true);
    else setUploadingLogo(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const res = await fetch('/api/v1/sales/email_signatures/upload_asset', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || data.message || 'Falha ao enviar imagem para o servidor.');
      }

      if (kind === 'avatar') {
        setAvatarUrl(data.url);
        setAvatarSignedId(data.signed_id || null);
        toast.success('Foto do avatar enviada e salva com URL pública HTTPS!');
      } else {
        setLogoUrl(data.url);
        setLogoSignedId(data.signed_id || null);
        toast.success('Logotipo enviado e salvo com URL pública HTTPS!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar imagem.';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      if (kind === 'avatar') setUploadingAvatar(false);
      else setUploadingLogo(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadSignatureAsset(e.target.files[0], 'avatar');
      e.target.value = '';
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadSignatureAsset(e.target.files[0], 'logo');
      e.target.value = '';
    }
  };

  const resolvedEmailAvatarUrl = useMemo(() => {
    const fallback = 'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png';
    if (!avatarUrl || avatarUrl.startsWith('data:')) return fallback;
    if (avatarUrl.startsWith('/')) return `https://www.avaliasolar.com.br${avatarUrl}`;
    return sanitizeHttpUrl(
      avatarUrl.replace('felipe-assinatura-avatar.png', 'foto-felipe-assinatura-avalia-solar.png'),
      fallback
    );
  }, [avatarUrl]);

  const resolvedEmailLogoUrl = useMemo(() => {
    const fallback = 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png';
    if (!logoUrl || logoUrl.startsWith('data:')) return fallback;
    if (logoUrl.startsWith('/')) return `https://www.avaliasolar.com.br${logoUrl}`;
    return sanitizeHttpUrl(logoUrl, fallback);
  }, [logoUrl]);

  const phoneInfo = useMemo(
    () => parseAndFormatWhatsappPhone(phone, whatsappMessage),
    [phone, whatsappMessage]
  );
  const whatsappUrl = phoneInfo.valid ? phoneInfo.url : '';

  // Gerador dinâmico do HTML V3 Responsivo de compatibilidade de e-mail (Tabelas fluidas, estilos inline, WhatsApp .button2 e Dark Mode)
  const generatedHtml = useMemo(() => {
    return buildResponsiveSignatureHtml({
      fullName,
      roleTitle,
      email,
      phone,
      whatsappMessage,
      avatarUrl: resolvedEmailAvatarUrl,
      logoUrl: resolvedEmailLogoUrl,
      websiteUrl,
      linkedinUrl,
      calendlyUrl,
      ctaText,
      footerTagline,
    });
  }, [
    fullName,
    roleTitle,
    email,
    phone,
    whatsappMessage,
    resolvedEmailAvatarUrl,
    resolvedEmailLogoUrl,
    websiteUrl,
    linkedinUrl,
    calendlyUrl,
    ctaText,
    footerTagline,
  ]);

  const hydrateFromSignature = useCallback((sig: Signature) => {
    setSignatureName(sig.name || 'Assinatura Oficial Avalia Solar (Padrão)');
    const f = sig.fields || {};
    if (f.full_name) setFullName(f.full_name);
    if (f.role_title) setRoleTitle(f.role_title);
    if (f.email) setEmail(f.email);
    if (typeof f.phone === 'string') setPhone(f.phone);
    if (sig.avatar_url || f.avatar_url) setAvatarUrl(sig.avatar_url || f.avatar_url!);
    if (sig.logo_url || f.logo_url) setLogoUrl(sig.logo_url || f.logo_url!);
    if (f.website_url) setWebsiteUrl(f.website_url);
    if (f.linkedin_url) setLinkedinUrl(f.linkedin_url);
    if (f.calendly_url) setCalendlyUrl(f.calendly_url);
    if (f.cta_text) setCtaText(f.cta_text);
    if (f.footer_tagline) setFooterTagline(f.footer_tagline);
    if (f.whatsapp_message) setWhatsappMessage(f.whatsapp_message);
  }, []);

  // Carregar assinaturas existentes e restaurar campos salvos
  const loadSignatures = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/sales/email_signatures', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list: Signature[] = data.signatures ?? [];
        setSignatures(list);

        if (list.length > 0 && !hydratedInitialRef.current) {
          hydratedInitialRef.current = true;
          const def = list.find((s) => s.is_default) || list[0];
          hydrateFromSignature(def);
        }
      }
    } catch {
      // Ignora erro inicial de leitura
    }
  }, [hydrateFromSignature]);

  useEffect(() => {
    loadSignatures();
  }, [loadSignatures]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSignature = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const existingDefault = signatures.find((s) => s.is_default) || signatures[0];
      const endpoint = existingDefault
        ? `/api/v1/sales/email_signatures/${existingDefault.id}`
        : '/api/v1/sales/email_signatures';
      const method = existingDefault ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: {
            name: signatureName.trim() || 'Assinatura Oficial Avalia Solar (Padrão)',
            body_html: generatedHtml,
            is_default: true,
            avatar_signed_id: avatarSignedId || undefined,
            logo_signed_id: logoSignedId || undefined,
            settings: {
              full_name: fullName,
              role_title: roleTitle,
              email,
              phone,
              avatar_url: resolvedEmailAvatarUrl,
              logo_url: resolvedEmailLogoUrl,
              website_url: websiteUrl,
              linkedin_url: linkedinUrl,
              calendly_url: calendlyUrl,
              cta_text: ctaText,
              footer_tagline: footerTagline,
              whatsapp_message: whatsappMessage,
            },
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Não foi possível salvar a assinatura no servidor.');
      }

      if (data.signature) {
        hydrateFromSignature(data.signature);
      }
      await loadSignatures();
      setSaveSuccess(true);
      toast.success('Assinatura salva com sucesso no servidor!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha de conexão ao salvar assinatura.';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/sales/email_signatures/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Falha ao excluir assinatura.');
      }
      setSignatures((prev) => prev.filter((s) => s.id !== id));
      toast.success('Assinatura removida.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover assinatura.');
    }
  };

  return (
    <SalesLayoutWrapper>
      <TooltipProvider delayDuration={200}>
        <div className="max-w-[1400px] mx-auto py-2 space-y-5 font-sans text-xs">
          {/* Header da Página (Estilo Setup Nutshell + IBM Carbon) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email & Signatures</h1>
              <p className="text-xs text-slate-500 italic mt-0.5">
                Personalize assinaturas corporativas, gerencie contas conectadas e padronize o outbound comercial
              </p>
            </div>

            {/* Alternador de Perfil para Demonstração de Governança Read-Only */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs self-start sm:self-auto">
              <span className="text-[11px] font-medium text-slate-500">Perfil:</span>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`text-xs px-2.5 py-0.5 rounded font-medium transition-all ${
                  isAdmin ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Admin (Editor Completo)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`text-xs px-2.5 py-0.5 rounded font-medium transition-all ${
                  !isAdmin ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Vendedor (Read-Only)
                </span>
              </button>
            </div>
          </div>

          {/* Banner de Conexão com Zoho Mail / Inboxes */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-md p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-xs">Caixas de E-mail Conectadas (Zoho Mail / SES)</p>
                <p className="text-[11px] text-slate-500">
                  Esta assinatura é injetada automaticamente em todas as mensagens de campanhas e respostas pela variável{' '}
                  <code className="bg-sky-100 text-sky-800 px-1 py-0.5 rounded font-mono text-[10px]">
                    &#123;&#123;user.signature&#125;&#125;
                  </code>
                  .
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/sales/settings/email/accounts"
              className="text-xs font-semibold text-[#0F62FE] hover:underline flex items-center gap-1 shrink-0"
            >
              Gerenciar Contas <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Banner Informativo de Governança se estiver no modo Vendedor (Read-Only) */}
          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200/80 text-amber-900 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Governança Ativa:</strong> A identidade visual, logotipo e rodapé institucional são padronizados pela gestão. Você pode personalizar apenas seus dados de contato e link de agendamento.
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] uppercase tracking-wider font-semibold"
              >
                Modo Vendedor
              </Badge>
            </div>
          )}

          {/* Card Principal: Gerador & Live Preview em 2 Colunas */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            {/* Header do Card com Barra Cinza e Botão Salvar Verde */}
            <div className="bg-[#f5f6f8] px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-800">Assinatura Oficial Avalia Solar</h2>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                >
                  Compatível com Gmail & Outlook
                </Badge>
                {saveSuccess && (
                  <span className="text-emerald-700 text-xs font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex items-center gap-1 bg-white hover:bg-slate-50"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado!' : 'Copiar HTML'}</span>
                </Button>

                {isAdmin && (
                  <Button
                    type="button"
                    onClick={() => handleSaveSignature()}
                    disabled={saving || uploadingAvatar || uploadingLogo}
                    className="bg-[#43a047] hover:bg-[#388e3c] text-white font-medium text-xs h-7 px-4 shadow-xs transition-colors"
                  >
                    {saving ? 'Salvando...' : 'Salvar como Padrão'}
                  </Button>
                )}
              </div>
            </div>

            {/* Grid 2-Colunas: Coluna Esquerda (Formulário) | Coluna Direita (Live Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* Coluna 1: Campos e Customização (45% -> col-span-5) */}
              <div className="lg:col-span-5 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Parâmetros do Consultor
                  </span>
                  <span className="text-[10px] text-slate-400">Campos individuais</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      Identificador da Assinatura (CRM)
                    </label>
                    <Input
                      value={signatureName}
                      disabled={!isAdmin}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="h-8 text-xs bg-white disabled:bg-slate-50 disabled:text-slate-500"
                      placeholder="Ex: Assinatura Oficial Avalia Solar"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">Nome Completo</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-8 text-xs bg-white"
                      placeholder="Ex: Felipe Henrique"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      Cargo / Especialidade
                    </label>
                    <Input
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="h-8 text-xs bg-white"
                      placeholder="Ex: Consultor de Energia Solar | Avalia Solar"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        E-mail Comercial
                      </label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        WhatsApp (Ícone + Número Clicável)
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-8 text-xs bg-white"
                        placeholder="(65) 99346-5055"
                      />
                      {!phoneInfo.valid && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          Informe um telefone válido com DDD para exibir o bloco do WhatsApp na assinatura.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Campo Mensagem Inicial do WhatsApp */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-600 font-medium">
                      Mensagem Inicial do WhatsApp (Opcional)
                    </label>
                    <Input
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      className="h-8 text-xs bg-white"
                      placeholder="Olá! Gostaria de falar sobre os projetos da Avalia Solar."
                    />
                    <p className="text-[10px] text-slate-500">
                      Texto codificado na URL wa.me pré-carregado no chat do WhatsApp ao clicar no botão.
                    </p>
                  </div>

                  {/* Campo Foto / Avatar do Consultor */}
                  <div className="space-y-1.5 p-3 bg-slate-50/80 rounded-md border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-sky-600" /> Foto de Perfil / Avatar
                      </label>
                      <button
                        type="button"
                        onClick={() => setAvatarMode(avatarMode === 'upload' ? 'url' : 'upload')}
                        className="text-[10px] text-sky-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        {avatarMode === 'upload' ? (
                          <>
                            <Link2 className="w-2.5 h-2.5" /> Colar link URL
                          </>
                        ) : (
                          <>
                            <Upload className="w-2.5 h-2.5" /> Enviar arquivo
                          </>
                        )}
                      </button>
                    </div>

                    {/* Input de arquivo invisível */}
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />

                    {avatarMode === 'upload' ? (
                      <div className="flex items-center gap-3 pt-1">
                        {/* Miniatura do Avatar com borda amarela */}
                        <div className="relative shrink-0">
                          {avatarUrl ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={avatarUrl}
                                alt="Foto do consultor"
                                className="w-14 h-14 rounded-full object-cover border-2 border-[#ffcd2d] shadow-xs bg-white"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setAvatarUrl(
                                    'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png'
                                  )
                                }
                                className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow-xs hover:bg-red-700 transition-colors"
                                title="Restaurar foto padrão"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white text-slate-400">
                              <Camera className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Botão de Upload e Orientações */}
                        <div className="flex-1 space-y-1">
                          <Button
                            type="button"
                            disabled={uploadingAvatar}
                            onClick={() => avatarFileInputRef.current?.click()}
                            size="sm"
                            className="h-7 text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 shadow-xs"
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Enviando ao servidor...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                <span>{avatarUrl ? 'Trocar Foto do Computador' : 'Fazer Upload da Foto'}</span>
                              </>
                            )}
                          </Button>
                          <p className="text-[10px] text-slate-500">
                            PNG, JPG ou WEBP (máx. 5 MB). Salvo permanentemente no Active Storage com URL HTTPS.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 pt-1">
                        <Input
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="h-8 text-xs bg-white font-mono"
                          placeholder="https://exemplo.com/sua-foto.png"
                        />
                        <p className="text-[10px] text-slate-400">Cole a URL HTTPS direta da imagem hospedada.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-sky-600" /> Calendly / Agendamento
                      </label>
                      <Input
                        value={calendlyUrl}
                        onChange={(e) => setCalendlyUrl(e.target.value)}
                        className="h-8 text-xs bg-white font-mono"
                        placeholder="https://calendly.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Texto do CTA</label>
                      <Input
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1 flex items-center gap-1">
                      <Linkedin className="w-3 h-3 text-sky-600" /> Perfil no LinkedIn
                    </label>
                    <Input
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Seção Institucional Governança Admin */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-600" /> Padrões Globais da Empresa
                    </span>
                    {!isAdmin && (
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1"
                      >
                        <Lock className="w-2.5 h-2.5" /> Bloqueado
                      </Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Website Oficial</label>
                    <Input
                      value={websiteUrl}
                      disabled={!isAdmin}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="h-8 text-xs bg-white disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* Campo Logotipo Horizontal da Empresa */}
                  <div className="space-y-1.5 p-3 bg-slate-50/80 rounded-md border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-600" /> Logotipo Horizontal
                      </label>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setLogoMode(logoMode === 'upload' ? 'url' : 'upload')}
                          className="text-[10px] text-sky-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          {logoMode === 'upload' ? (
                            <>
                              <Link2 className="w-2.5 h-2.5" /> Colar URL
                            </>
                          ) : (
                            <>
                              <Upload className="w-2.5 h-2.5" /> Enviar arquivo
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />

                    {logoMode === 'upload' ? (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="border border-slate-200 bg-white p-1 rounded shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              logoUrl ||
                              'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png'
                            }
                            alt="Logo preview"
                            className="h-7 w-auto object-contain"
                          />
                        </div>

                        {isAdmin ? (
                          <Button
                            type="button"
                            disabled={uploadingLogo}
                            onClick={() => logoFileInputRef.current?.click()}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex items-center gap-1.5 bg-white hover:bg-slate-50"
                          >
                            {uploadingLogo ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Enviando...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 text-slate-600" /> Escolher Logo do Computador
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Logo institucional travado</span>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={logoUrl}
                        disabled={!isAdmin}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="h-8 text-xs bg-white font-mono disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="https://..."
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">
                      Faixa de Autoridade (Rodapé)
                    </label>
                    <Input
                      value={footerTagline}
                      disabled={!isAdmin}
                      onChange={(e) => setFooterTagline(e.target.value)}
                      className="h-8 text-xs bg-white disabled:bg-slate-50 disabled:text-slate-500 uppercase font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Coluna 2: Live Preview em Tempo Real (55% -> col-span-7) */}
              <div className="lg:col-span-7 p-5 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Visualização em Tempo Real (Live Preview)
                    </span>

                    {/* Controles de Preview e Alternador Código/Renderizado */}
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab === 'preview' && (
                        <>
                          {/* Seletores de Viewport */}
                          <div className="flex bg-white rounded border border-slate-200 p-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setPreviewViewport('desktop')}
                              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                                previewViewport === 'desktop'
                                  ? 'bg-sky-100 text-sky-800 font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Desktop (máx. 480px)"
                            >
                              <Monitor className="w-3 h-3" /> 480px
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewViewport('iphone')}
                              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                                previewViewport === 'iphone'
                                  ? 'bg-sky-100 text-sky-800 font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="iPhone 14/15/Pro (390px)"
                            >
                              <Smartphone className="w-3 h-3" /> 390px
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewViewport('se')}
                              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                                previewViewport === 'se'
                                  ? 'bg-sky-100 text-sky-800 font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="iPhone SE (375px)"
                            >
                              <Smartphone className="w-3 h-3" /> 375px
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewViewport('compact')}
                              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                                previewViewport === 'compact'
                                  ? 'bg-sky-100 text-sky-800 font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Compacto (320px)"
                            >
                              <Smartphone className="w-3 h-3" /> 320px
                            </button>
                          </div>

                          {/* Alternador Light / Dark Mode */}
                          <div className="flex bg-white rounded border border-slate-200 p-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setPreviewTheme('light')}
                              className={`p-1 rounded transition-colors ${
                                previewTheme === 'light'
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Tema Claro"
                            >
                              <Sun className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewTheme('dark')}
                              className={`p-1 rounded transition-colors ${
                                previewTheme === 'dark'
                                  ? 'bg-indigo-950 text-indigo-200 font-bold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Tema Escuro (Dark Mode)"
                            >
                              <Moon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}

                      {/* Alternador Código vs Preview */}
                      <div className="flex bg-white rounded border border-slate-200 p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setActiveTab('preview')}
                          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                            activeTab === 'preview'
                              ? 'bg-sky-100 text-sky-800 font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Renderizado
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('code')}
                          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                            activeTab === 'code'
                              ? 'bg-sky-100 text-sky-800 font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Code2 className="w-3.5 h-3.5" /> Código HTML
                        </button>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'preview' ? (
                    /* Mock Visual de E-mail (Gmail / Outlook / Apple Mail) */
                    <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
                      <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="font-medium flex items-center gap-1.5">
                          <span>Simulação:</span>
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-white">
                            {previewViewport === 'desktop'
                              ? 'Desktop (480px)'
                              : previewViewport === 'iphone'
                              ? 'iPhone 14/15 (390px)'
                              : previewViewport === 'se'
                              ? 'iPhone SE (375px)'
                              : 'Compacto (320px)'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 h-4 ${
                              previewTheme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-700'
                            }`}
                          >
                            {previewTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </Badge>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {phoneInfo.valid ? `wa.me/${phoneInfo.digits}` : 'WhatsApp oculto'}
                        </span>
                      </div>

                      {/* Corpo do E-mail Simulado */}
                      <div
                        className={`p-4 transition-colors ${
                          previewTheme === 'dark'
                            ? 'bg-[#0f172a] text-slate-200'
                            : 'bg-[#f8fafc] text-slate-800'
                        }`}
                      >
                        <div
                          className={`p-4 rounded-lg border transition-all ${
                            previewTheme === 'dark'
                              ? 'bg-[#1e293b] border-slate-700 shadow-md'
                              : 'bg-white border-slate-200/80 shadow-xs'
                          }`}
                          style={{
                            maxWidth:
                              previewViewport === 'desktop'
                                ? '480px'
                                : previewViewport === 'iphone'
                                ? '390px'
                                : previewViewport === 'se'
                                ? '375px'
                                : '320px',
                            margin: '0 auto',
                          }}
                        >
                          <div className={`text-xs space-y-1.5 mb-4 ${previewTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            <p>Olá, Carlos!</p>
                            <p>
                              Conforme conversamos, montei o estudo de viabilidade solar para o seu projeto com
                              estimativa de retorno em menos de 3 anos.
                            </p>
                            <p>Qualquer dúvida estou à total disposição.</p>
                          </div>

                          {/* Renderização da Tabela de Assinatura Responsiva V3 */}
                          <div
                            className="pt-2 overflow-x-auto"
                            dangerouslySetInnerHTML={{
                              __html: generatedHtml.replace(
                                /https:\/\/www\.avaliasolar\.com\.br\/images\/email\/([a-z0-9.-]+\.png)/gi,
                                '/images/email/$1'
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Visualizador de Código HTML */
                    <div className="relative">
                      <textarea
                        readOnly
                        value={generatedHtml}
                        className="w-full h-[360px] font-mono text-[11px] p-3 rounded-md border border-slate-200 bg-slate-900 text-slate-200 select-all"
                      />
                    </div>
                  )}
                </div>

                {/* Demonstração da Arquitetura Dual: Web/CRM vs E-mail */}
                <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-700">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Arquitetura Dual do Botão WhatsApp (.button2):
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      <strong>Web/CRM:</strong> componente interativo com hover e profundidade suave. <strong>E-mail:</strong> tabela HTML bulletproof com estilos inline e PNG HTTPS.
                    </p>
                  </div>
                  {phoneInfo.valid && (
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">Demonstração Web:</span>
                      <WhatsAppButton2
                        phone={phoneInfo.digits}
                        message={whatsappMessage}
                        label="WhatsApp"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-md border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between">
                  {phoneInfo.valid ? (
                    <span>
                      💡 <strong>Dica de Outbound:</strong> O ícone verde e o número{' '}
                      <strong>{phoneInfo.formatted}</strong> formam um único link clicável apontando para{' '}
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">{whatsappUrl}</code>.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>WhatsApp oculto:</strong> Preencha um telefone válido com DDD para exibir o ícone e o
                      número clicável na assinatura.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Listagem de Assinaturas Salvas no Backend */}
          <div className="bg-white rounded-md border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-sky-600" /> Assinaturas no Sistema ({signatures.length})
              </span>
            </div>

            {signatures.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-50 border border-dashed rounded-md">
                Nenhuma assinatura adicional salva no banco. A assinatura oficial acima está pronta para ser salva e utilizada.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {signatures.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => hydrateFromSignature(s)}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{s.name}</span>
                        {s.is_default && (
                          <Badge
                            variant="outline"
                            className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]"
                          >
                            Padrão de Campanhas
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xl">
                        ID #{s.id} · Clique para carregar no editor · Avatar HTTPS ativo
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </SalesLayoutWrapper>
  );
}
