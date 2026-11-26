'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, CheckCircle2, ChevronRight, MapPin, ShieldCheck, Star, Sun, Wrench, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CompanyData {
  id: number;
  name: string;
  slug: string;
  verified: boolean;
  logo_url?: string | null;
  headquarters: {
    city: string;
    state: string;
  };
  rating?: number | null;
  review_count: number;
}

interface SettingsData {
  headline: string;
  cta_label: string;
  show_calculator: boolean;
  featured_brands: string[];
  direct_quote_enabled: boolean;
}

interface ProjectData {
  id: number;
  title: string;
  power_kwp: number;
  city: string;
  uf: string;
  photo_urls: string[];
  completion_year: number;
}

interface ProductData {
  id: number;
  category: string;
  brand: string;
  model: string;
  warranty_years?: number | null;
}

interface StorefrontClientProps {
  company: CompanyData;
  settings: SettingsData;
  projects: ProjectData[];
  curatedProducts: ProductData[];
}

export default function StorefrontClient({
  company,
  settings,
  projects,
  curatedProducts,
}: StorefrontClientProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'projects' | 'calculator'>('catalog');
  const [billValue, setBillValue] = useState<number>(650);

  const hq = [company.headquarters.city, company.headquarters.state].filter(Boolean).join(' – ');
  const estimatedKwp = Math.max(1, Number((billValue / 95).toFixed(1)));
  const estimatedSavings = Math.round(billValue * 0.9);

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Hero Card */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-2xl shrink-0 shadow-inner">
                {company.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-full w-full object-contain rounded-2xl p-2"
                  />
                ) : (
                  company.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {company.name}
                  </h1>
                  {company.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verificada
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  {company.rating ? (
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span>{company.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({company.review_count} avaliações)</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Sem avaliações recentes</span>
                  )}
                  {hq && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{hq}</span>
                    </div>
                  )}
                </div>

                <p className="text-slate-700 text-sm sm:text-base pt-2 max-w-2xl font-medium leading-relaxed">
                  "{settings.headline}"
                </p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow">
              <Link href={`/companies/${company.slug}`}>
                {settings.cta_label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Button
            variant={activeTab === 'catalog' ? 'default' : 'ghost'}
            className={activeTab === 'catalog' ? 'bg-slate-900 text-white' : 'text-slate-600'}
            onClick={() => setActiveTab('catalog')}
          >
            <Sun className="h-4 w-4 mr-2" />
            Catálogo ({curatedProducts.length})
          </Button>
          <Button
            variant={activeTab === 'projects' ? 'default' : 'ghost'}
            className={activeTab === 'projects' ? 'bg-slate-900 text-white' : 'text-slate-600'}
            onClick={() => setActiveTab('projects')}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Projetos Executados ({projects.length})
          </Button>
          <Button
            variant={activeTab === 'calculator' ? 'default' : 'ghost'}
            className={activeTab === 'calculator' ? 'bg-slate-900 text-white' : 'text-slate-600'}
            onClick={() => setActiveTab('calculator')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Simulador Solar
          </Button>
        </div>

        {/* Tab 1: Catálogo */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {curatedProducts.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 bg-white">
                Nenhum produto cadastrado no catálogo público.
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {curatedProducts.map((prod) => (
                  <Card key={prod.id} className="p-5 bg-white border border-slate-200 hover:border-amber-300 transition shadow-sm space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{prod.model}</h3>
                      <p className="text-xs text-slate-500">Fabricante: {prod.brand}</p>
                    </div>
                    {prod.warranty_years && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Garantia de {prod.warranty_years} anos</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Projetos Executados */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 bg-white">
                Nenhum projeto fotovoltaico registrado no portfólio.
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <Card key={proj.id} className="p-5 bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base">{proj.title}</h3>
                      <p className="text-xs text-slate-500">
                        {proj.city} – {proj.uf} • Concluído em {proj.completion_year}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-blue-600">{proj.power_kwp}</span>
                      <span className="text-xs text-slate-400 block">kWp</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Simulador Solar */}
        {activeTab === 'calculator' && (
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl max-w-xl mx-auto space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-slate-900">Simule a sua economia com {company.name}</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Informe o valor da sua fatura mensal de energia para calcular a potência estimada e a economia.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="front-bill-input" className="block text-sm font-semibold text-slate-700">
                Conta de luz média mensal (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">R$</span>
                <input
                  id="front-bill-input"
                  type="number"
                  min="100"
                  max="100000"
                  step="50"
                  value={billValue}
                  onChange={(e) => setBillValue(Number(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 block">Potência Recomendada</span>
                <span className="text-xl font-extrabold text-slate-900">~{estimatedKwp} kWp</span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs text-slate-500 block">Economia Estimada / Mês</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  ~R$ {estimatedSavings.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <Button asChild size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              <Link href={`/companies/${company.slug}`}>
                {settings.cta_label}
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

