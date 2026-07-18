'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MessageCircle, Mail, ShieldCheck } from 'lucide-react';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { VerifiedCompaniesMiniList } from '@/components/blog/VerifiedCompaniesMiniList';
import { ChecklistCard } from '@/components/blog/ChecklistCard';
import BannerByLocation from '@/components/BannerByLocation';

type SidebarCompany = {
  id: number;
  name: string;
  rating: number;
  city: string;
  logo_url?: string;
};

interface BlogSidebarProps {
  verifiedCompanies?: SidebarCompany[];
}

export function BlogSidebar({ verifiedCompanies = [] }: BlogSidebarProps) {
  return (
    <aside className="space-y-5">
      {/* Ad Banner */}
      <div className="border border-gray-100 overflow-hidden">
        <BannerByLocation location="sidebar" limit={1} />
      </div>

      {/* 1. Simulador de Economia */}
      <div className="border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
          <Calculator className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">
              Simular Economia Solar
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-normal">
              Descubra o potencial da sua conta de luz.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sidebar-state" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            Onde você mora?
          </Label>
          <Select>
            <SelectTrigger
              id="sidebar-state"
              className="rounded-none border-gray-200 text-sm h-9 focus:ring-blue-500 focus:border-blue-500"
            >
              <SelectValue placeholder="Selecione seu estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
              <SelectItem value="rs">Rio Grande do Sul</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full rounded-none bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-none h-9 text-sm"
          onClick={() => openQuoteWizard({ source: 'blog_sidebar' })}
        >
          Receber Orçamento Grátis
        </Button>

        <div className="relative flex items-center gap-2 text-[10px] text-gray-500">
          <div className="flex-1 h-px bg-gray-100" />
          <span>ou fale agora</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <Button
          variant="outline"
          className="w-full rounded-none border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium h-9 text-sm shadow-none"
          onClick={() => window.open('https://wa.me/556593465055', '_blank')}
        >
          <MessageCircle className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
          Chamar no WhatsApp
        </Button>

        <p className="text-[10px] text-center text-gray-500">
          +15.000 orçamentos realizados
        </p>
      </div>

      {/* 2. Newsletter */}
      <div className="border border-gray-100 bg-gray-900 p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">
              Newsletter Solar
            </h3>
            <p className="text-[11px] text-gray-300 mt-0.5 font-normal">
              50.000+ leitores. Dicas exclusivas toda semana.
            </p>
          </div>
        </div>

        <Input
          type="email"
          placeholder="Seu melhor e-mail"
          className="rounded-none bg-white/10 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm h-9"
        />
        <Button
          className="w-full rounded-none bg-white text-gray-900 hover:bg-gray-100 font-medium text-sm h-9 shadow-none"
        >
          Receber Guia Gratuito
        </Button>
        <p className="text-[10px] text-gray-300 text-center">
          Zero spam. Cancele quando quiser.
        </p>
      </div>

      {/* 3. Verified Companies */}
      <div className="border border-gray-100 bg-white">
        <div className="flex items-center gap-2 p-4 border-b border-gray-50">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Empresas Verificadas
          </h3>
        </div>
        <div className="p-2">
          <VerifiedCompaniesMiniList companies={verifiedCompanies} />
        </div>
      </div>

      {/* 4. Checklist */}
      <ChecklistCard />
    </aside>
  );
}
