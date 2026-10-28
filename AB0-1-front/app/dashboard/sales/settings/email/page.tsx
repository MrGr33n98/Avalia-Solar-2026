'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Signature = {
  id: number;
  name: string;
  body_html: string;
  is_default: boolean;
};

export default function EmailSignaturesPage() {
  // Controle de Permissão (Admin vs. Vendedor/Read-Only)
  const [isAdmin, setIsAdmin] = useState(true);

  // Campos Estruturados da Assinatura Oficial Avalia Solar
  const [fullName, setFullName] = useState('Felipe Henrique');
  const [roleTitle, setRoleTitle] = useState('Fundador do Avalia Solar');
  const [email, setEmail] = useState('felipe@avaliasolar.com.br');
  const [phone, setPhone] = useState('(65) 99346-5055');
  const [avatarUrl, setAvatarUrl] = useState('https://www.avaliasolar.com.br/images/felipe-assinatura-avatar.png');
  const [websiteUrl, setWebsiteUrl] = useState('https://www.avaliasolar.com.br/');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/in/felipe-morais-8bb61a7b/');
  const [calendlyUrl, setCalendlyUrl] = useState('https://calendly.com/felipe-avaliasolar/30min');
  const [ctaText, setCtaText] = useState('Agendar 30 min ↗');
  const [logoUrl, setLogoUrl] = useState('https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png');
  const [footerTagline, setFooterTagline] = useState('ENERGIA SOLAR ● MOBILIDADE ELÉTRICA ● CONFIANÇA DIGITAL');

  // Estados de Interface
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [signatureName, setSignatureName] = useState('Assinatura Oficial Avalia Solar (Padrão)');

  // Upload Refs e Modos de Input
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('upload');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Gerador dinâmico do HTML de compatibilidade de e-mail (Tabelas e estilos inline)
  const generatedHtml = useMemo(() => {
    return `<!-- Assinatura Avalia Solar premium: fundo azul-gelo; somente tabelas e CSS inline para compatibilidade com email -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="550" bgcolor="#f6f9fd" style="width:550px;max-width:100%;border-collapse:separate;border-spacing:0;background-color:#f6f9fd;border:1px solid #dae5ef;font-family:Arial,Helvetica,sans-serif;color:#0b2944;">
  <tr>
    <td bgcolor="#eef4fa" width="120" valign="top" align="center" style="width:120px;background-color:#eef4fa;vertical-align:top;padding:17px 12px 12px 13px;border-right:3px solid #ffcd2d;">
      <img src="${avatarUrl || 'https://www.avaliasolar.com.br/images/felipe-assinatura-avatar.png'}" width="83" height="83" alt="${fullName}" style="width:83px;height:83px;display:block;object-fit:cover;border-radius:50%;border:2px solid #ffcd2d;">
      <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:10px;"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:5px 7px;border-radius:4px;">
        <a href="${websiteUrl}" target="_blank" style="text-decoration:none;"><img src="${logoUrl}" alt="Avalia Solar" width="92" style="display:block;width:92px;height:auto;border:0;"></a>
      </td></tr></table>
    </td>
    <td valign="top" style="padding:16px 16px 12px 18px;vertical-align:top;">
      <p style="margin:0 0 2px;font-size:17px;line-height:1.23;letter-spacing:-0.3px;font-weight:700;color:#0b2944;"><strong>${fullName}</strong></p>
      <p style="margin:0 0 9px;font-size:11px;line-height:1.3;color:#63768a;">${roleTitle}</p>
      <p style="margin:0 0 3px;font-size:11px;line-height:1.4;">
        <a href="mailto:${email}" style="color:#0b2944;text-decoration:none;">${email}</a> <span style="color:#a2b2c2;">&nbsp;·&nbsp;</span>
        <a href="tel:${phone.replace(/[^0-9+]/g, '')}" style="color:#0b2944;text-decoration:none;">${phone}</a>
      </p>
      <p style="margin:0 0 12px;font-size:11px;line-height:1.4;">
        <a href="${websiteUrl}" target="_blank" style="color:#0e5ac9;text-decoration:none;">Website</a><span style="color:#a2b2c2;">&nbsp;&nbsp;|&nbsp;&nbsp;</span><a href="${linkedinUrl}" target="_blank" style="color:#0e5ac9;text-decoration:none;">LinkedIn</a>
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
        <td bgcolor="#0b2944" style="background-color:#0b2944;border-radius:4px;">
          <a href="${calendlyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:7px 13px;font-size:11px;line-height:1.2;font-weight:bold;text-decoration:none;color:#ffffff;">${ctaText}</a>
        </td>
        <td width="10" style="width:10px;font-size:1px;line-height:1px;">&nbsp;</td>
        <td style="font-size:11px;line-height:1.25;"><a href="${websiteUrl}" target="_blank" style="font-weight:bold;color:#0e5ac9;text-decoration:none;">Conhecer a plataforma</a></td>
      </tr></table>
    </td>
  </tr>
  <tr><td colspan="2" bgcolor="#e8f0f7" style="background-color:#e8f0f7;padding:6px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#5d7287;letter-spacing:0.4px;line-height:1.4;">${footerTagline}</td></tr>
</table>`;
  }, [fullName, roleTitle, email, phone, avatarUrl, websiteUrl, linkedinUrl, calendlyUrl, ctaText, logoUrl, footerTagline]);

  // Carregar assinaturas existentes
  const loadSignatures = async () => {
    try {
      const res = await fetch('/api/v1/sales/email_signatures', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSignatures(data.signatures ?? []);
      }
    } catch {
      // Fallback gracioso
    }
  };

  useEffect(() => {
    loadSignatures();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSignature = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    try {
      const response = await fetch('/api/v1/sales/email_signatures', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: {
            name: signatureName.trim(),
            body_html: generatedHtml,
            is_default: true,
          },
        }),
      });

      if (response.ok) {
        await loadSignatures();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      // Feedback local se offline
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/v1/sales/email_signatures/${id}`, { method: 'DELETE', credentials: 'include' });
      setSignatures((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setSignatures((prev) => prev.filter((s) => s.id !== id));
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
                  isAdmin 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
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
                  !isAdmin 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
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
                  Esta assinatura é injetada automaticamente em todas as mensagens de campanhas e respostas pela variável <code className="bg-sky-100 text-sky-800 px-1 py-0.5 rounded font-mono text-[10px]">&#123;&#123;user.signature&#125;&#125;</code>.
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

          {/* Banner Informativo de Governança se estiver no modo Vendedor (Read-Only) */}
          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200/80 text-amber-900 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Governança Ativa:</strong> A identidade visual, logotipo e rodapé institucional são padronizados pela gestão. Você pode personalizar apenas seus dados de contato e link de agendamento.
                </span>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] uppercase tracking-wider font-semibold">
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
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
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
                    disabled={saving}
                    className="bg-[#43a047] hover:bg-[#388e3c] text-white font-medium text-xs h-7 px-4 shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Salvar como Padrão'}
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
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">Identificador da Assinatura (CRM)</label>
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
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">Cargo / Especialidade</label>
                    <Input
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="h-8 text-xs bg-white"
                      placeholder="Ex: Consultor de Energia Solar | Avalia Solar"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">E-mail Comercial</label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Telefone / WhatsApp</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
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
                      accept="image/*"
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
                                onClick={() => setAvatarUrl('')}
                                className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow-xs hover:bg-red-700 transition-colors"
                                title="Remover foto"
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
                            onClick={() => avatarFileInputRef.current?.click()}
                            size="sm"
                            className="h-7 text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 shadow-xs"
                          >
                            <Upload className="w-3 h-3" />
                            {avatarUrl ? 'Trocar Foto do Computador' : 'Fazer Upload da Foto'}
                          </Button>
                          <p className="text-[10px] text-slate-500">
                            Formatos suportados: PNG, JPG ou WEBP (recomendado quadrado 1:1, mín. 166x166px).
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
                        <p className="text-[10px] text-slate-400">
                          Cole a URL direta da imagem hospedada.
                        </p>
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
                      <Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1">
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
                      accept="image/*"
                      className="hidden"
                    />

                    {logoMode === 'upload' ? (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="border border-slate-200 bg-white p-1 rounded shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrl || 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png'}
                            alt="Logo preview"
                            className="h-7 w-auto object-contain"
                          />
                        </div>

                        {isAdmin ? (
                          <Button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex items-center gap-1.5 bg-white hover:bg-slate-50"
                          >
                            <Upload className="w-3 h-3 text-slate-600" /> Escolher Logo do Computador
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
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Faixa de Autoridade (Rodapé)</label>
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

                  {activeTab === 'preview' ? (
                    /* Mock Visual de E-mail (Gmail / Outlook) */
                    <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
                      <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Simulação de Leitura (Gmail / Outlook)</span>
                        <span className="text-[10px] font-mono">550px width</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="text-slate-600 text-xs space-y-1.5">
                          <p>Olá, Carlos!</p>
                          <p>Conforme conversamos, montei o estudo de viabilidade solar para o seu projeto com estimativa de retorno em menos de 3 anos.</p>
                          <p>Qualquer dúvida estou à total disposição.</p>
                        </div>

                        {/* Renderização da Tabela de Assinatura */}
                        <div 
                          className="pt-2 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: generatedHtml }}
                        />
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

                <div className="bg-white p-3 rounded-md border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between">
                  <span>
                    💡 <strong>Dica de Outbound:</strong> Ao criar cadências no Hermes Agent, use a tag <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">&#123;&#123;user.signature&#125;&#125;</code> para injetar esta assinatura.
                  </span>
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
                  <div key={s.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{s.name}</span>
                        {s.is_default && (
                          <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
                            Padrão de Campanhas
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xl">
                        ID #{s.id} · HTML de alta compatibilidade
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(s.id)}
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
