'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, TrendingUp, Award, Building, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { companiesApiSafe, type Company } from '@/lib/api-client';
import { RatingStars } from '@/components/RatingStars';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { buildCompanyPath } from '@/lib/slug';

export default function RatingStarsPage() {
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Busca empresas ordenadas por rating via API (funcionalidade de classificação)
        const response = await companiesApiSafe.getAll({
          sort: 'rating',
          limit: 10,
          status: 'active'
        });
        setTopCompanies(response || []);
      } catch (err) {
        console.error('[RatingStarsPage] Error fetching rankings:', err);
        setError('Ocorreu um erro ao carregar o ranking de empresas. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 inline-block max-w-md">
          <p className="font-semibold">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-sm underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-4 text-amber-600">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Ranking das Melhores Empresas
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Descubra os instaladores e fornecedores de energia solar mais bem avaliados pela nossa comunidade. 
            A classificação é baseada na média de avaliações reais e verificadas.
          </p>
        </div>

        {/* Ranking List */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border-none shadow-sm overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topCompanies.length > 0 ? (
            <div className="space-y-4">
              {topCompanies.map((company, index) => {
                const rank = index + 1;
                const rating = company.rating_avg ?? company.average_rating ?? 0;
                const count = company.rating_count ?? 0;
                const path = buildCompanyPath(company.slug, company.name, company.id);

                return (
                  <Link key={company.id} href={path}>
                    <Card className="group border-none shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mb-4">
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          {/* Rank Badge */}
                          <div className={`w-16 flex items-center justify-center text-2xl font-black ${
                            rank === 1 ? 'bg-amber-400 text-white' : 
                            rank === 2 ? 'bg-slate-300 text-white' :
                            rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {rank}
                          </div>
                          
                          <div className="flex-1 p-6 flex items-center gap-6">
                            {/* Logo fallback */}
                            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                              {company.logo_url ? (
                                <Image
                                  src={company.logo_url}
                                  alt={company.name}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-contain p-2"
                                  loading="lazy"
                                />
                              ) : (
                                <Building className="w-7 h-7" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                                  {company.name}
                                </h3>
                                {company.verified && (
                                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[10px]">
                                    Verificada
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {company.city}, {company.state}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span className="font-bold text-slate-700">{rating.toFixed(1)}</span>
                                  <span>({count} avaliações)</span>
                                </div>
                              </div>
                            </div>

                            <div className="hidden md:block">
                              <RatingStars rating={rating} count={count} showCount={false} starClassName="w-5 h-5" />
                            </div>

                            <div className="text-slate-300 group-hover:text-primary transition-colors">
                              <ArrowRight className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-2">
              <div className="text-slate-400 mb-4">
                <Info className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-slate-600">Nenhuma empresa encontrada com avaliações no momento.</p>
            </Card>
          )}
        </div>

        {/* Info Box */}
        <div className="max-w-4xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Como funciona nossa classificação?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-primary border border-slate-100">1</div>
              <h3 className="font-semibold text-slate-800">Avaliações Reais</h3>
              <p className="text-sm text-slate-600">Apenas avaliações de clientes que realmente contrataram serviços são consideradas.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-primary border border-slate-100">2</div>
              <h3 className="font-semibold text-slate-800">Moderação Rigorosa</h3>
              <p className="text-sm text-slate-600">Nossa equipe verifica cada comentário para evitar spam ou avaliações falsas.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-primary border border-slate-100">3</div>
              <h3 className="font-semibold text-slate-800">Cálculo Dinâmico</h3>
              <p className="text-sm text-slate-600">O ranking é atualizado em tempo real sempre que uma nova avaliação é aprovada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
