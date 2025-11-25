'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  Star,
  TrendingUp,
  Users,
  Eye,
  Target,
  Award
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from './components/ThemeToggle';
import ReviewsAnalytics from './components/ReviewsAnalytics';
import PerformanceMetrics from './components/PerformanceMetrics';
import CompetitorBenchmark from './components/CompetitorBenchmark';

export default function ModernDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [company, setCompany] = useState<any>(null);
  
  // Mock company data - replace with actual API call
  useEffect(() => {
    setCompany({
      id: 1,
      name: 'Solar Energy Pro',
      logo_url: null,
      verified: true,
      featured: true,
    });
  }, []);

  const isDark = themeMode === 'dark';

  // Quick stats for overview
  const quickStats = [
    {
      title: 'Visualizações',
      value: '3,847',
      change: '+23.5%',
      icon: Eye,
      trend: 'up',
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
    },
    {
      title: 'Avaliação Média',
      value: '4.7',
      change: '+0.3',
      icon: Star,
      trend: 'up',
      color: isDark ? 'text-yellow-400' : 'text-yellow-600',
      bgColor: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
    },
    {
      title: 'Total Reviews',
      value: '287',
      change: '+12.5%',
      icon: Users,
      trend: 'up',
      color: isDark ? 'text-emerald-400' : 'text-emerald-600',
      bgColor: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
    },
    {
      title: 'Ranking',
      value: '#3',
      change: '+2',
      icon: Award,
      trend: 'up',
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isDark 
          ? 'bg-slate-900/80 border-slate-800' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Company Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={company?.logo_url} alt={company?.name} />
                <AvatarFallback className={`font-bold ${
                  isDark ? 'bg-slate-800 text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {company?.name?.substring(0, 2).toUpperCase() || 'SE'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className={`text-xl font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-foreground'
                }`}>
                  {company?.name || 'Dashboard'}
                  {company?.verified && (
                    <span className="text-blue-500">✓</span>
                  )}
                </h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  Analytics Dashboard
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle onThemeChange={setThemeMode} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isDark 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                    : 'bg-white hover:shadow-lg'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor} transition-transform hover:scale-110`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trend === 'up' 
                          ? 'text-emerald-600' 
                          : 'text-red-600'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${
                          stat.trend === 'down' ? 'rotate-180' : ''
                        }`} />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-medium mb-1 ${
                        isDark ? 'text-slate-400' : 'text-muted-foreground'
                      }`}>
                        {stat.title}
                      </p>
                      <p className={`text-3xl font-bold ${
                        isDark ? 'text-white' : 'text-foreground'
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                  </CardContent>
                  {/* Progress indicator */}
                  <div className={`h-1 ${stat.bgColor}`}>
                    <div className={`h-full bg-gradient-to-r ${
                      stat.color.includes('blue') ? 'from-blue-500 to-blue-600' :
                      stat.color.includes('yellow') ? 'from-yellow-500 to-yellow-600' :
                      stat.color.includes('emerald') ? 'from-emerald-500 to-emerald-600' :
                      'from-purple-500 to-purple-600'
                    } w-3/4`}></div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`w-full grid grid-cols-4 p-1 rounded-xl ${
            isDark 
              ? 'bg-slate-900 border border-slate-800' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <TabsTrigger 
              value="overview" 
              className={`rounded-lg transition-all data-[state=active]:shadow-lg ${
                isDark
                  ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                  : 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className={`rounded-lg transition-all data-[state=active]:shadow-lg ${
                isDark
                  ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                  : 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              }`}
            >
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className={`rounded-lg transition-all data-[state=active]:shadow-lg ${
                isDark
                  ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                  : 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              }`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="competitors" 
              className={`rounded-lg transition-all data-[state=active]:shadow-lg ${
                isDark
                  ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                  : 'data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Benchmark
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Overview Card */}
              <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
                    Resumo Rápido
                  </CardTitle>
                  <CardDescription className={isDark ? 'text-slate-400' : ''}>
                    Principais métricas em destaque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-blue-900/10 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
                        🎯 <span className="font-semibold">Performance Excelente:</span> Você está no top 10% da categoria com {quickStats[1].value} de rating médio.
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-emerald-900/10 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'
                    }`}>
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
                        📈 <span className="font-semibold">Crescimento:</span> Suas visualizações cresceram {quickStats[0].change} nos últimos 30 dias.
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-purple-900/10 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'
                    }`}>
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
                        🏆 <span className="font-semibold">Ranking:</span> Você subiu {quickStats[3].change} posições e agora está em {quickStats[3].value}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
                    Atividade Recente
                  </CardTitle>
                  <CardDescription className={isDark ? 'text-slate-400' : ''}>
                    Últimas interações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { text: 'Nova avaliação de 5 estrelas recebida', time: '5 min atrás', type: 'review' },
                      { text: '12 novos visitantes no perfil', time: '1 hora atrás', type: 'view' },
                      { text: 'Lead respondido com sucesso', time: '2 horas atrás', type: 'lead' },
                      { text: 'Você subiu para #3 no ranking', time: 'Hoje', type: 'rank' },
                    ].map((activity, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                        isDark ? 'bg-slate-800/50' : 'bg-gray-50'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'review' ? 'bg-yellow-500' :
                          activity.type === 'view' ? 'bg-blue-500' :
                          activity.type === 'lead' ? 'bg-emerald-500' :
                          'bg-purple-500'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-foreground'}`}>
                            {activity.text}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsAnalytics companyId="1" themeMode={themeMode} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics companyId="1" themeMode={themeMode} />
          </TabsContent>

          <TabsContent value="competitors">
            <CompetitorBenchmark companyId="1" themeMode={themeMode} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
