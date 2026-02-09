'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCompanyContext } from '@/context/CompanyContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, 
  Package, 
  Star, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Building,
  FileText,
  Calendar,
  Bell,
  Building2,
  Loader2
} from 'lucide-react';

const RealtimeDashboard = dynamic(
  () => import('@/app/dashboard/components/RealtimeDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyLoading && !activeCompany) {
      router.push('/select-company');
    }
  }, [activeCompany, companyLoading, router]);

  if (companyLoading || !activeCompany) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock stats for demo
  const stats = {
    companies_count: 150,
    products_count: 320,
    leads_count: 45,
    reviews_count: 89,
    active_campaigns: 5,
    monthly_revenue: 15000
  };

  // Stats configuration
  const statsConfig = [
    {
      title: 'Empresas',
      value: stats?.companies_count ?? 0,
      icon: Building,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Produtos',
      value: stats?.products_count ?? 0,
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Leads',
      value: stats?.leads_count ?? 0,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      change: '+25%',
      changeType: 'positive' as const,
    },
    {
      title: 'Reviews',
      value: stats?.reviews_count ?? 0,
      icon: Star,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      change: '+18%',
      changeType: 'positive' as const,
    },
    {
      title: 'Campanhas Ativas',
      value: stats?.active_campaigns ?? 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      change: '-2%',
      changeType: 'negative' as const,
    },
    {
      title: 'Receita Mensal',
      value: stats?.monthly_revenue ? `R$ ${stats.monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      icon: DollarSign,
      color: 'bg-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      change: '+32%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="animate-in fade-in slide-in-from-bottom-8 duration-700"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta, {user?.name || 'usuário'}!
            </h1>
            <p className="text-muted-foreground">
              Aqui está um resumo das atividades mais recentes da sua conta.
            </p>
            
            <div className="mt-6">
              <Link href="/dashboard/company">
                <Button size="lg" className="gap-2">
                  <Building2 className="h-5 w-5" />
                  Acessar Dashboard da Empresa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsConfig.map((stat, index) => (
                <div
                  key={stat.title}
                  className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-2xl font-bold text-foreground">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        {stat.changeType === 'positive' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-muted-foreground">vs mês passado</span>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Realtime Company Analytics */}
      {activeCompany?.id ? (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-bold text-foreground mb-2">Analytics em Tempo Real</h2>
              <p className="text-muted-foreground mb-6">Atualização contínua das métricas críticas da sua empresa.</p>
              <RealtimeDashboard companyId={activeCompany.id} />
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* Recent Activity */}
      <section className="py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Atividade Recente</h2>
              <p className="text-muted-foreground">
                Veja as últimas interações e atualizações da sua conta.
              </p>
            </div>
            <Button variant="outline" className="mt-4 md:mt-0">
              <Bell className="mr-2 h-4 w-4" />
              Ver todas as notificações
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Leads */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Leads Recentes
                </CardTitle>
                <CardDescription>
                  Últimos contatos recebidos através da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                      <div>
                        <h4 className="font-medium">Lead #{i}</h4>
                        <p className="text-sm text-muted-foreground">Empresa Exemplo {i}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recebido em {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Próximos Eventos
                </CardTitle>
                <CardDescription>
                  Compromissos e datas importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 bg-background rounded-lg border border-border">
                      <h4 className="font-medium">Reunião com Cliente #{i}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(Date.now() + i * 86400000).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        10:00 - 11:00 • Videochamada
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
