'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MessageCircle, Mail } from 'lucide-react';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { VerifiedCompaniesMiniList } from '@/components/blog/VerifiedCompaniesMiniList';
import { ChecklistCard } from '@/components/blog/ChecklistCard';

interface BlogSidebarProps {
  verifiedCompanies?: any[]; // Using any[] to match VerifiedCompaniesMiniListProps loosely or define properly
}

export function BlogSidebar({ verifiedCompanies = [] }: BlogSidebarProps) {
  return (
    <aside className="space-y-8">
      {/* 1. QuoteCard */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-primary font-extrabold">
            <Calculator className="w-5 h-5" />
            Simular Economia
          </CardTitle>
          <CardDescription className="text-slate-600 font-medium">
            Descubra quanto você pode economizar na sua conta de luz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="state" className="text-xs font-bold uppercase text-slate-500">Onde você mora?</Label>
            <Select>
              <SelectTrigger className="bg-white border-slate-200">
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
            className="w-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-base py-6"
            onClick={() => openQuoteWizard({ source: 'blog_sidebar' })}
          >
            Receber Orçamento Grátis
          </Button>
          
          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-slate-400 font-medium">ou fale agora</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 font-bold"
            onClick={() => window.open('https://wa.me/556593465055', '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chamar no WhatsApp
          </Button>

          <p className="text-[10px] text-center text-slate-400">
            Mais de 15.000 orçamentos realizados
          </p>
        </CardContent>
      </Card>

      {/* 2. Verified Companies */}
      <VerifiedCompaniesMiniList companies={verifiedCompanies} />

      {/* 3. Newsletter */}
      <Card className="bg-slate-900 text-white border-none shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Mail className="w-24 h-24" />
        </div>
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Newsletter Solar
          </CardTitle>
          <p className="text-xs text-slate-300 font-medium">
            Junte-se a 50.000+ leitores e receba dicas exclusivas.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 relative z-10">
          <Input 
            placeholder="Seu melhor e-mail" 
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-primary focus-visible:border-primary" 
          />
          <Button variant="secondary" className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold">
            Receber Guia Gratuito
          </Button>
          <p className="text-[10px] text-slate-400 text-center">
            Zero spam. Cancele quando quiser.
          </p>
        </CardContent>
      </Card>

      {/* 4. Checklist */}
      <ChecklistCard />
    </aside>
  );
}
