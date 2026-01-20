'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, MapPin, ArrowRight, Mail, Calculator } from 'lucide-react';
import Link from 'next/link';
import { openQuoteWizard } from '@/lib/quote-wizard';

import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import ErrorBoundary from '@/components/ErrorBoundary';

function PostSidebarContent() {
  const { data: categoriesData } = useCategoriesQuery();
  const categories = categoriesData?.data || [];

  return (
    <aside className="space-y-8">
      {/* Simulation Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Calculator className="w-5 h-5" />
            Simular Economia
          </CardTitle>
          <p className="text-sm text-slate-600">Descubra quanto você pode economizar com energia solar.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs font-semibold uppercase text-slate-500">Sua Cidade</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input id="city" placeholder="Ex: São Paulo, SP" className="pl-9 bg-white" />
            </div>
          </div>
          <Button 
            className="w-full font-bold shadow-md hover:shadow-lg transition-all"
            onClick={() => openQuoteWizard({ source: 'blog_sidebar' })}
          >
            Ver Economia
          </Button>
        </CardContent>
      </Card>

      {/* Verified Companies Placeholder */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Empresas Verificadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded bg-slate-200 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-1" />
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <div className="flex">★★★★★</div>
                  <span className="text-slate-400 text-[10px]">(4.{8+i})</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
            </div>
          ))}
          <Button variant="outline" className="w-full text-xs h-8" asChild>
             <Link href="/companies">Ver todas</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card className="bg-slate-900 text-white border-none shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Newsletter Solar
          </CardTitle>
          <p className="text-xs text-slate-300">Receba guias, notícias e checklists exclusivos.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input 
            placeholder="Seu melhor e-mail" 
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-primary" 
          />
          <Button variant="secondary" className="w-full bg-white text-slate-900 hover:bg-slate-100">
            Inscrever-se
          </Button>
        </CardContent>
      </Card>

      {/* Blog Categories */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Categorias</h4>
        <ScrollArea className="h-[200px] pr-4">
          <nav className="flex flex-col space-y-1">
            {categories?.map((cat: any) => (
               <Link 
                 key={cat.id} 
                 href={`/blog?category=${cat.id}`}
                 className="flex items-center justify-between p-2 text-sm text-slate-600 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
               >
                 <span>{cat.name}</span>
                 <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{Math.floor(Math.random() * 20) + 1}</span>
               </Link>
            ))}
            {!categories?.length && (
              <>
                 <div className="h-8 w-full bg-slate-100 rounded animate-pulse mb-1" />
                 <div className="h-8 w-full bg-slate-100 rounded animate-pulse mb-1" />
                 <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
              </>
            )}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}

export function PostSidebar() {
  return (
    <ErrorBoundary 
      fallback={
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800 text-sm">
          <p>Não foi possível carregar a barra lateral.</p>
        </div>
      }
    >
      <PostSidebarContent />
    </ErrorBoundary>
  );
}
