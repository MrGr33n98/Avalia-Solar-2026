'use client';

import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Check, X, ArrowLeft, MessageCircle, Scale } from 'lucide-react';
import Link from 'next/link';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';

export default function ComparePage() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();

  const handleQuoteClick = (companyId: number) => {
    track('comparison_quote_click', { company_id: companyId });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-page', type: 'quick' });
  };

  if (comparisonList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <X className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Lista de comparação vazia</h1>
          <p className="text-slate-500 mb-8">
            Adicione empresas para comparar suas características e encontrar a melhor opção para você.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/companies">Explorar Empresas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Button asChild variant="ghost" className="mb-6 -ml-4 text-slate-500 hover:text-slate-900">
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Empresas
            </Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Comparar Empresas</h1>
              <p className="text-slate-500 mt-2 text-lg">
                Análise detalhada entre {comparisonList.length} empresas selecionadas.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={clearComparison}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Limpar Comparação
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisonList.map((company) => (
            <Card key={company.id} className="relative overflow-hidden border-none shadow-lg group">
              <button
                onClick={() => removeFromComparison(company.id)}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="h-32 bg-slate-100 relative">
                {company.banner_url ? (
                  <img 
                    src={getFullImageUrl(company.banner_url)} 
                    alt={company.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )}
                <div className="absolute -bottom-8 left-6">
                  <div className="h-16 w-16 rounded-2xl bg-white p-2 shadow-xl border border-slate-100">
                    <img 
                      src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                      alt={company.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <CardContent className="pt-12 px-6 pb-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{company.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-current mr-1" />
                      {company.average_rating?.toFixed(1) || '0.0'}
                    </div>
                    <span className="text-slate-400 text-sm">({company.rating_count || 0} avaliações)</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Localização</p>
                      <p className="text-sm text-slate-500">{company.city}, {company.state}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-2">Características</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        {company.verified ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-slate-300" />
                        )}
                        Selo Verificado
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        {company.featured ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Check className="h-4 w-4 text-emerald-500" />
                        )}
                        Atendimento Online
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-emerald-500" />
                        Orçamento Gratuito
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button 
                      onClick={() => handleQuoteClick(company.id)}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Pedir Orçamento
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {comparisonList.length < 3 && (
            <Link 
              href="/companies"
              className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 hover:bg-white hover:border-primary/50 transition-all group"
            >
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4">
                <Scale className="h-8 w-8" />
              </div>
              <p className="font-bold text-slate-400 group-hover:text-primary transition-colors">Adicionar Empresa</p>
              <p className="text-xs text-slate-300">Compare até 3 empresas</p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
