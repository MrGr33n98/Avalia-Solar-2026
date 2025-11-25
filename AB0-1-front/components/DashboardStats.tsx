'use client';

import { motion } from 'framer-motion';
import { 
  Building2, 
  Package, 
  Users, 
  Star, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardStats() {
  const { stats, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-md animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">Erro ao carregar estatísticas do dashboard</p>
      </div>
    );
  }

  const statsConfig = [
    {
      title: 'Empresas',
      value: stats.companies_count,
      icon: Building2,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Produtos',
      value: stats.products_count,
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Leads',
      value: stats.leads_count,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      change: '+25%',
      changeType: 'positive' as const,
    },
    {
      title: 'Reviews',
      value: stats.reviews_count,
      icon: Star,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      change: '+18%',
      changeType: 'positive' as const,
    },
    {
      title: 'Campanhas Ativas',
      value: stats.active_campaigns,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      change: '-2%',
      changeType: 'negative' as const,
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${(stats.monthly_revenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      change: '+32%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.title}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
              </div>
              
              <div className="mb-2">
                <p className="text-2xl font-bold text-gray-900">
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
                <span className="text-sm text-gray-500">vs mês passado</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
