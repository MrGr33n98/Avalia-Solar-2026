'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy,
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  Award,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CompetitorBenchmarkProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
}

interface Competitor {
  id: number;
  name: string;
  logo_url?: string;
  rating: number;
  reviewsCount: number;
  responseRate: number;
  featured: boolean;
  verified: boolean;
}

export default function CompetitorBenchmark({ companyId, themeMode = 'light' }: CompetitorBenchmarkProps) {
  const isDark = themeMode === 'dark';

  // Mock data - replace with actual API
  const yourCompany: Competitor = {
    id: 1,
    name: 'Sua Empresa',
    rating: 4.7,
    reviewsCount: 287,
    responseRate: 94,
    featured: true,
    verified: true,
  };

  const topCompetitors: Competitor[] = [
    {
      id: 2,
      name: 'Solar Prime',
      rating: 4.8,
      reviewsCount: 432,
      responseRate: 87,
      featured: true,
      verified: true,
    },
    {
      id: 3,
      name: 'EcoSolar Brasil',
      rating: 4.6,
      reviewsCount: 356,
      responseRate: 91,
      featured: true,
      verified: true,
    },
    {
      id: 4,
      name: 'SunPower Instalações',
      rating: 4.5,
      reviewsCount: 298,
      responseRate: 78,
      featured: false,
      verified: true,
    },
    {
      id: 5,
      name: 'GreenEnergy Solutions',
      rating: 4.4,
      reviewsCount: 245,
      responseRate: 85,
      featured: false,
      verified: true,
    },
    {
      id: 6,
      name: 'Solar Tech Pro',
      rating: 4.3,
      reviewsCount: 201,
      responseRate: 72,
      featured: false,
      verified: false,
    },
  ];

  const categoryAverage = {
    rating: 4.3,
    reviewsCount: 156,
    responseRate: 68,
  };

  const allCompanies = [yourCompany, ...topCompetitors].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount;
  });

  const yourRank = allCompanies.findIndex(c => c.id === yourCompany.id) + 1;

  const getPositionChange = (competitor: Competitor) => {
    // Mock position change
    if (competitor.id === yourCompany.id) return 2;
    return Math.floor(Math.random() * 5) - 2;
  };

  const getScoreColor = (value: number, metric: 'rating' | 'responseRate' | 'reviews') => {
    if (metric === 'rating') {
      if (value >= 4.5) return isDark ? 'text-emerald-400' : 'text-emerald-600';
      if (value >= 4.0) return isDark ? 'text-blue-400' : 'text-blue-600';
      return isDark ? 'text-orange-400' : 'text-orange-600';
    }
    if (metric === 'responseRate') {
      if (value >= 85) return isDark ? 'text-emerald-400' : 'text-emerald-600';
      if (value >= 70) return isDark ? 'text-blue-400' : 'text-blue-600';
      return isDark ? 'text-orange-400' : 'text-orange-600';
    }
    if (metric === 'reviews') {
      if (value >= 300) return isDark ? 'text-emerald-400' : 'text-emerald-600';
      if (value >= 200) return isDark ? 'text-blue-400' : 'text-blue-600';
      return isDark ? 'text-orange-400' : 'text-orange-600';
    }
    return isDark ? 'text-slate-400' : 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
          Benchmark Competitivo
        </h3>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
          Compare sua performance com os líderes da categoria
        </p>
      </div>

      {/* Your Position Summary */}
      <Card className={`${isDark ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/30' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <Trophy className={`h-8 w-8 ${yourRank <= 3 ? 'text-yellow-500' : isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-foreground'} mb-2`}>
                  Você está em #{yourRank} de {allCompanies.length}
                </h4>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'} mb-4`}>
                  {yourRank === 1 ? '🎉 Parabéns! Você é o líder da categoria!' :
                   yourRank <= 3 ? '⭐ Excelente posição! Você está no top 3!' :
                   yourRank <= 5 ? '👍 Boa posição! Continue melhorando.' :
                   '📈 Há oportunidades de crescimento.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className={`${isDark ? 'border-slate-600 text-slate-300' : ''}`}>
                    <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                    {yourCompany.rating.toFixed(1)} Rating
                  </Badge>
                  <Badge variant="outline" className={`${isDark ? 'border-slate-600 text-slate-300' : ''}`}>
                    <Users className="h-3 w-3 mr-1" />
                    {yourCompany.reviewsCount} Reviews
                  </Badge>
                  <Badge variant="outline" className={`${isDark ? 'border-slate-600 text-slate-300' : ''}`}>
                    <Zap className="h-3 w-3 mr-1" />
                    {yourCompany.responseRate}% Resposta
                  </Badge>
                </div>
              </div>
            </div>
            {getPositionChange(yourCompany) > 0 && (
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-bold">+{getPositionChange(yourCompany)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Rankings */}
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
            Rankings Detalhados
          </CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : ''}>
            Comparação com top performers da categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allCompanies.map((company, index) => {
              const isYou = company.id === yourCompany.id;
              const positionChange = getPositionChange(company);
              
              return (
                <div
                  key={company.id}
                  className={`p-4 rounded-xl transition-all ${
                    isYou
                      ? isDark
                        ? 'bg-blue-900/20 border-2 border-blue-700/50'
                        : 'bg-blue-50 border-2 border-blue-300'
                      : isDark
                      ? 'bg-slate-800/50 border border-slate-700'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex flex-col items-center min-w-[50px]">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-600' :
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        #{index + 1}
                      </div>
                      {positionChange !== 0 && (
                        <div className={`flex items-center text-xs font-medium ${
                          positionChange > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {positionChange > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{Math.abs(positionChange)}</span>
                        </div>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={company.logo_url} alt={company.name} />
                        <AvatarFallback className={`${isDark ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>
                          {company.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                            {company.name}
                          </span>
                          {company.verified && (
                            <Badge variant="outline" className="text-xs">
                              <Award className="h-3 w-3 mr-1 text-blue-500" />
                              Verificado
                            </Badge>
                          )}
                          {company.featured && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                              Destaque
                            </Badge>
                          )}
                          {isYou && (
                            <Badge className="text-xs bg-blue-600">Você</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-6 text-center">
                      {/* Rating */}
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                          Rating
                        </p>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className={`text-lg font-bold ${getScoreColor(company.rating, 'rating')}`}>
                            {company.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <Progress
                            value={(company.rating / 5) * 100}
                            className={`h-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
                          />
                        </div>
                      </div>

                      {/* Reviews */}
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                          Reviews
                        </p>
                        <span className={`text-lg font-bold ${getScoreColor(company.reviewsCount, 'reviews')}`}>
                          {company.reviewsCount}
                        </span>
                        <div className="mt-1">
                          <Progress
                            value={Math.min((company.reviewsCount / 500) * 100, 100)}
                            className={`h-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
                          />
                        </div>
                      </div>

                      {/* Response Rate */}
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                          Resposta
                        </p>
                        <span className={`text-lg font-bold ${getScoreColor(company.responseRate, 'responseRate')}`}>
                          {company.responseRate}%
                        </span>
                        <div className="mt-1">
                          <Progress
                            value={company.responseRate}
                            className={`h-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gaps & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rating Gap */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                  Rating vs Líder
                </h4>
                <p className={`text-2xl font-bold mb-1 ${
                  yourCompany.rating >= allCompanies[0].rating
                    ? 'text-emerald-600'
                    : isDark ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  {yourCompany.rating >= allCompanies[0].rating ? '=' : '-'}
                  {Math.abs(yourCompany.rating - allCompanies[0].rating).toFixed(1)}
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  {yourCompany.rating >= allCompanies[0].rating
                    ? 'Você é o líder!'
                    : 'pontos para alcançar o líder'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Gap */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                  Reviews vs Líder
                </h4>
                <p className={`text-2xl font-bold mb-1 ${
                  yourCompany.reviewsCount >= allCompanies[0].reviewsCount
                    ? 'text-emerald-600'
                    : isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {yourCompany.reviewsCount >= allCompanies[0].reviewsCount ? '+' : ''}
                  {yourCompany.reviewsCount - allCompanies[0].reviewsCount}
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  {yourCompany.reviewsCount >= allCompanies[0].reviewsCount
                    ? 'reviews a mais!'
                    : 'reviews de diferença'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Rate Gap */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                  Taxa de Resposta
                </h4>
                <p className={`text-2xl font-bold mb-1 ${
                  yourCompany.responseRate >= categoryAverage.responseRate + 10
                    ? 'text-emerald-600'
                    : isDark ? 'text-yellow-400' : 'text-yellow-600'
                }`}>
                  {yourCompany.responseRate}%
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  {yourCompany.responseRate >= categoryAverage.responseRate + 10
                    ? 'Excelente performance!'
                    : `Média: ${categoryAverage.responseRate}%`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
            <Target className="h-5 w-5 text-blue-500" />
            Recomendações Estratégicas
          </CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : ''}>
            Ações para melhorar seu posicionamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {yourRank > 1 && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/10 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      Foco em Reviews
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
                      Você precisa de {allCompanies[0].reviewsCount - yourCompany.reviewsCount} reviews adicionais para alcançar o líder. 
                      Incentive clientes satisfeitos a deixarem avaliações.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {yourCompany.responseRate < 90 && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-emerald-900/10 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h5 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      Melhore a Taxa de Resposta
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
                      Responder a todas as reviews aumenta credibilidade. Você está em {yourCompany.responseRate}%, 
                      tente alcançar 95%+.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {yourCompany.rating < 4.6 && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/10 border border-yellow-800/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      Foco na Qualidade
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
                      Trabalhe para melhorar a experiência do cliente. Um rating acima de 4.6 coloca você 
                      no top 3 da categoria.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
