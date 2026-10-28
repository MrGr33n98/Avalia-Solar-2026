'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Eye,
  Edit3,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

export default function SalesGeneralSettingsPage() {
  // Controle de Permissão / Modo Read-Only
  const [isAdmin, setIsAdmin] = useState(true);

  // Estados do Formulário General Settings (Fiel ao Nutshell CRM)
  const [companyName, setCompanyName] = useState('Av Solar');
  const [companySlogan, setCompanySlogan] = useState('Energia limpa, inteligência e alta performance');
  const [mailingAddress, setMailingAddress] = useState('Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100');
  
  // Logos
  const [horizontalLogo, setHorizontalLogo] = useState<string | null>(null);
  const [squareLogo, setSquareLogo] = useState<string | null>(null);

  // Parâmetros de Trabalho e Fiscais
  const [startOfWeek, setStartOfWeek] = useState('Monday');
  const [startOfFiscalYear, setStartOfFiscalYear] = useState('janeiro 1');
  const [businessHourStart, setBusinessHourStart] = useState('08:00 AM');
  const [businessHourEnd, setBusinessHourEnd] = useState('05:00 PM');
  const [timezone, setTimezone] = useState('-03 (Brasília / São Paulo)');

  // Mercados e Localização
  const [defaultMarket, setDefaultMarket] = useState('BRL');
  const [defaultPhoneCode, setDefaultPhoneCode] = useState('55');
  const [defaultAddress, setDefaultAddress] = useState('Brazil');

  // Estados de Interface e Salvamento
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);

  // Refs para acionamento de upload
  const horizontalFileRef = useRef<HTMLInputElement>(null);
  const squareFileRef = useRef<HTMLInputElement>(null);

  // Carregar dados salvos ou do backend
  useEffect(() => {
    fetch('/api/v1/sales/taxonomies', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.company_settings) {
          if (data.company_settings.name) setCompanyName(data.company_settings.name);
          if (data.company_settings.slogan) setCompanySlogan(data.company_settings.slogan);
          if (data.company_settings.address) setMailingAddress(data.company_settings.address);
        }
      })
      .catch(() => {
        // Fallback gracioso mantendo os padrões
      });
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 700);
  };

  const handleHorizontalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setHorizontalLogo(url);
    }
  };

  const handleSquareUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSquareLogo(url);
    }
  };

  // Componente de ícone com Tooltip informativo estilo Nutshell (i)
  const InfoTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs bg-slate-900 text-slate-100 border-slate-800 p-2.5 shadow-lg">
        {content}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <SalesLayoutWrapper>
      <TooltipProvider delayDuration={200}>
        <div className="max-w-[1020px] mx-auto py-2 space-y-5 font-sans">
          
          {/* Header da Página (Exatamente como no Nutshell) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Setup</h1>
              <p className="text-xs text-slate-500 italic mt-0.5">
                Only admins can view this page
              </p>
            </div>

            {/* Alternador de Perfil para Homologação / Simulação Read-Only */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs self-start sm:self-auto">
              <span className="text-[11px] font-medium text-slate-500">Perfil Simulado:</span>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-all ${
                  isAdmin 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Admin
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-all ${
                  !isAdmin 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Read-Only
                </span>
              </button>
            </div>
          </div>

          {/* Banner de Aviso de Modo Read-Only */}
          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200/80 text-amber-900 rounded-md p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Somente Leitura:</strong> Você está visualizando estas configurações sem privilégio de edição. Somente administradores da organização podem salvar alterações.
                </span>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] uppercase tracking-wider font-semibold">
                Read-Only
              </Badge>
            </div>
          )}

          {/* Card Principal: General settings (Fiel ao Nutshell CRM) */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            {/* Header do Card com Barra Cinza e Botão Save Verde à Direita */}
            <div className="bg-[#f5f6f8] px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-800">General settings</h2>
                {saveSuccess && (
                  <span className="text-emerald-700 text-xs font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
                  </span>
                )}
              </div>

              {isAdmin ? (
                <Button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="bg-[#43a047] hover:bg-[#388e3c] text-white font-medium text-xs h-7 px-4 shadow-xs transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        disabled
                        className="bg-slate-200 text-slate-400 font-medium text-xs h-7 px-4 cursor-not-allowed"
                      >
                        Save
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs bg-slate-900 text-white">
                    Alterações desabilitadas em modo somente leitura
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Conteúdo do Formulário (Alinhamento em Duas Colunas Estilo IBM Carbon 2x) */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              
              {/* 1. Company name */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="O nome oficial da empresa exibido no cabeçalho do CRM, propostas solares comerciais e notificações aos clientes." />
                  <span>Company name</span>
                </div>
                <div className="sm:col-span-9 max-w-lg">
                  <Input
                    value={companyName}
                    disabled={!isAdmin}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-sky-600 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              {/* 2. Company slogan */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Slogan ou frase de impacto institucional impressa no rodapé de propostas e modelos de e-mail." />
                  <span>Company slogan</span>
                </div>
                <div className="sm:col-span-9 max-w-lg">
                  <Input
                    value={companySlogan}
                    disabled={!isAdmin}
                    onChange={(e) => setCompanySlogan(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-sky-600 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Ex: Energia Solar Sustentável e Inteligente"
                  />
                </div>
              </div>

              {/* 3. Mailing address */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Endereço físico de correspondência comercial da organização para rodapés de e-mails em conformidade legal (CAN-SPAM / LGPD)." />
                  <span>Mailing address</span>
                </div>
                <div className="sm:col-span-9 max-w-lg">
                  <Input
                    value={mailingAddress}
                    disabled={!isAdmin}
                    onChange={(e) => setMailingAddress(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-sky-600 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Rua, número, complemento, cidade, estado e CEP"
                  />
                </div>
              </div>

              {/* 4. Your logo */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1.5">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Logotipo horizontal principal da empresa usado no cabeçalho das propostas e faturas geradas (PNG ou SVG transparente recomendado)." />
                  <span>Your logo</span>
                </div>
                <div className="sm:col-span-9 flex items-center gap-3">
                  <input
                    type="file"
                    ref={horizontalFileRef}
                    onChange={handleHorizontalUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {horizontalLogo ? (
                    <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-1.5 rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={horizontalLogo} alt="Logo" className="h-6 w-auto object-contain" />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setHorizontalLogo(null)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : null}

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => horizontalFileRef.current?.click()}
                      className="text-[#0f62fe] hover:underline text-xs font-normal transition-colors"
                    >
                      {horizontalLogo ? 'Change your logo' : 'Upload your logo'}
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      {horizontalLogo ? 'Logo configurado' : 'Nenhum logo carregado'}
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Square logo */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1.5">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Versão quadrada do logotipo para uso como avatar nos e-mails, ícones de perfil do CRM e aplicativo móvel (1:1)." />
                  <span>Square logo</span>
                </div>
                <div className="sm:col-span-9 flex items-center gap-3">
                  <input
                    type="file"
                    ref={squareFileRef}
                    onChange={handleSquareUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {squareLogo ? (
                    <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-1.5 rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={squareLogo} alt="Square Logo" className="w-6 h-6 object-cover rounded" />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setSquareLogo(null)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : null}

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => squareFileRef.current?.click()}
                      className="text-[#0f62fe] hover:underline text-xs font-normal transition-colors"
                    >
                      {squareLogo ? 'Change square logo' : 'Upload your logo'}
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      {squareLogo ? 'Logo quadrado configurado' : 'Nenhum logo carregado'}
                    </span>
                  )}
                </div>
              </div>

              {/* 6. Start of work week */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 text-slate-700 font-medium">
                  <span>Start of work week</span>
                </div>
                <div className="sm:col-span-9 max-w-xs">
                  <Select
                    value={startOfWeek}
                    onValueChange={setStartOfWeek}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-300 w-36 disabled:bg-slate-50 disabled:text-slate-500">
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 7. Start of fiscal year */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Data de início do ano fiscal para consolidação das metas de vendas, previsões de faturamento (forecast) e relatórios anuais." />
                  <span>Start of fiscal year</span>
                </div>
                <div className="sm:col-span-9 max-w-xs">
                  <Input
                    value={startOfFiscalYear}
                    disabled={!isAdmin}
                    onChange={(e) => setStartOfFiscalYear(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 w-36 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="ex: janeiro 1"
                  />
                </div>
              </div>

              {/* 8. Business hours */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Expediente de atendimento comercial da equipe. E-mails e cadências automáticas de vendas respeitarão esta janela de horário." />
                  <span>Business hours</span>
                </div>
                <div className="sm:col-span-9 flex flex-wrap items-center gap-2">
                  <Input
                    value={businessHourStart}
                    disabled={!isAdmin}
                    onChange={(e) => setBusinessHourStart(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 w-28 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <span className="text-slate-400">–</span>
                  <Input
                    value={businessHourEnd}
                    disabled={!isAdmin}
                    onChange={(e) => setBusinessHourEnd(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 w-28 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setTimezoneModalOpen(true)}
                      className="text-[#0f62fe] hover:underline text-xs font-normal ml-2 transition-colors"
                    >
                      Change your timezone
                    </button>
                  ) : (
                    <span className="text-slate-500 text-xs ml-2 font-mono">
                      {timezone}
                    </span>
                  )}
                </div>
              </div>

              {/* 9. Default market */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 flex items-center gap-1.5 text-slate-700 font-medium">
                  <InfoTooltip content="Mercado e moeda padrão aplicados às novas oportunidades e orçamentos do funil." />
                  <span>Default market</span>
                </div>
                <div className="sm:col-span-9 flex items-center gap-3">
                  <Select
                    value={defaultMarket}
                    onValueChange={setDefaultMarket}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-300 w-36 disabled:bg-slate-50 disabled:text-slate-500">
                      <SelectValue placeholder="Selecione o mercado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Brasil (BRL)</SelectItem>
                      <SelectItem value="USD">U.S. (USD)</SelectItem>
                      <SelectItem value="EUR">Europa (EUR)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Link
                    href="/dashboard/sales/settings/markets"
                    className="text-[#0f62fe] hover:underline text-xs font-normal transition-colors"
                  >
                    Manage markets
                  </Link>
                </div>
              </div>

              {/* 10. Default phone code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 text-slate-700 font-medium">
                  <span>Default phone code</span>
                </div>
                <div className="sm:col-span-9 max-w-xs">
                  <Select
                    value={defaultPhoneCode}
                    onValueChange={setDefaultPhoneCode}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-300 w-24 disabled:bg-slate-50 disabled:text-slate-500">
                      <SelectValue placeholder="DDI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="55">55 (BR)</SelectItem>
                      <SelectItem value="1">1 (US)</SelectItem>
                      <SelectItem value="351">351 (PT)</SelectItem>
                      <SelectItem value="34">34 (ES)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 11. Default address */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                <div className="sm:col-span-3 text-slate-700 font-medium">
                  <span>Default address</span>
                </div>
                <div className="sm:col-span-9 max-w-xs">
                  <Select
                    value={defaultAddress}
                    onValueChange={setDefaultAddress}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-300 w-56 disabled:bg-slate-50 disabled:text-slate-500">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Brazil">Brazil</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </form>
          </div>

          {/* Dialog Modal de Fuso Horário (Acionado por "Change your timezone") */}
          <Dialog open={timezoneModalOpen} onOpenChange={setTimezoneModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" /> Ajustar Fuso Horário
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Selecione o fuso horário oficial da sua operação comercial no Avalia Solar.
                </DialogDescription>
              </DialogHeader>

              <div className="py-3 space-y-2">
                <label className="text-xs font-medium text-slate-700">Fuso Horário Operacional</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full text-xs h-9">
                    <SelectValue placeholder="Selecione o fuso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-03 (Brasília / São Paulo)">America/Sao_Paulo (UTC-03)</SelectItem>
                    <SelectItem value="-04 (Manaus / Cuiabá)">America/Manaus (UTC-04)</SelectItem>
                    <SelectItem value="-02 (Fernando de Noronha)">America/Noronha (UTC-02)</SelectItem>
                    <SelectItem value="-05 (New York / Eastern)">America/New_York (UTC-05)</SelectItem>
                    <SelectItem value="00 (Londres / UTC)">Europe/London (UTC+00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setTimezoneModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-xs h-8"
                >
                  Confirmar Fuso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </TooltipProvider>
    </SalesLayoutWrapper>
  );
}
