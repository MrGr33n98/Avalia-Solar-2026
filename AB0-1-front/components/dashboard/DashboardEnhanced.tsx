'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Icons, Icon } from '@/components/icons/IconProvider';

// Dashboard Design Direction: "Executive Solar" - Luxury minimal meets industrial energy
// DFII Score: 13/15 (Excellent)
// Aesthetic Anchor: Radial energy grid patterns + solar-inspired gradient system

interface DashboardEnhancedProps {
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: keyof typeof Icons;
  variant?: 'default' | 'energy' | 'performance' | 'growth';
}

function MetricCard({ title, value, change, trend, icon, variant = 'default' }: MetricCardProps) {
  const variants = {
    default: 'bg-white border-slate-200 hover:border-slate-300',
    energy: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300',
    performance: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300',
    growth: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300'
  };

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-500',
    neutral: 'text-slate-500'
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${variants[variant]}`}>
        {/* Radial energy pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px),
                             radial-gradient(circle at 80% 80%, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px, 32px 32px'
          }}
        />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-600 tracking-wide">
            {title}
          </CardTitle>
          <Icon 
            name={icon} 
            className={`h-4 w-4 ${variant === 'energy' ? 'text-amber-600' : 
                      variant === 'performance' ? 'text-blue-600' :
                      variant === 'growth' ? 'text-emerald-600' : 'text-slate-500'}`} 
          />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
          <div className="flex items-center space-x-1">
            <Icon 
              name={trend === 'up' ? 'ArrowUp' : trend === 'down' ? 'ArrowDown' : 'Minus'} 
              className={`h-3 w-3 ${trendColors[trend]}`} 
            />
            <span className={`text-xs font-medium ${trendColors[trend]}`}>
              {change}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SolarPerformanceVisual() {
  return (
    <div className="relative h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 rounded-xl overflow-hidden">
      {/* Solar grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 30%, rgba(255,191,0,0.1) 50%, transparent 70%),
            repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.05) 22px, rgba(255,255,255,0.05) 24px)
          `
        }}
      />
      
      {/* Central energy node */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-amber-300/30"
          style={{ 
            background: `conic-gradient(from 0deg, transparent 0%, rgba(255,191,0,0.2) 25%, transparent 50%, rgba(255,191,0,0.2) 75%, transparent 100%)`
          }}
        />
      </div>
      
      {/* Performance indicators */}
      <div className="absolute top-4 left-4 text-white">
        <div className="text-xs font-medium text-amber-300 mb-1">ENERGIA ATIVA</div>
        <div className="text-2xl font-bold">847.3 kWh</div>
        <div className="text-xs text-slate-300">↗ +12.4% hoje</div>
      </div>
      
      <div className="absolute bottom-4 right-4 text-right text-white">
        <div className="text-xs font-medium text-emerald-300 mb-1">EFICIÊNCIA</div>
        <div className="text-2xl font-bold">94.7%</div>
        <div className="text-xs text-slate-300">Excelente ↗</div>
      </div>
    </div>
  );
}

function CompanyQuickActions() {
  const actions = [
    { label: 'Empresas', icon: 'Building2' as const, href: '/companies', variant: 'energy' },
    { label: 'Produtos', icon: 'Package' as const, href: '/products', variant: 'default' },
    { label: 'Avaliações', icon: 'Star' as const, href: '/reviews', variant: 'growth' },
    { label: 'Analytics', icon: 'BarChart3' as const, href: '/analytics', variant: 'performance' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Button 
            variant="outline" 
            className={`w-full h-16 flex flex-col items-center justify-center space-y-2 transition-all duration-300
              ${action.variant === 'energy' ? 'border-amber-200 hover:border-amber-300 hover:bg-amber-50' :
                action.variant === 'growth' ? 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50' :
                action.variant === 'performance' ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50' :
                'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Icon name={action.icon} className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardEnhanced({ className = '' }: DashboardEnhancedProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeCompany, companies, isLoading: companyLoading } = useCompanyContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Icon name="RefreshCw" className="h-8 w-8 text-slate-400" />
        </motion.div>
      </div>
    );
  }

  const metrics = [
    { title: 'Total de Empresas', value: '1,247', change: '+12%', trend: 'up' as const, icon: 'Building2' as const, variant: 'energy' as const },
    { title: 'Avaliações Este Mês', value: '3,891', change: '+8.2%', trend: 'up' as const, icon: 'Star' as const, variant: 'growth' as const },
    { title: 'Taxa de Conversão', value: '94.7%', change: '+2.1%', trend: 'up' as const, icon: 'Target' as const, variant: 'performance' as const },
    { title: 'Produtos Ativos', value: '456', change: '-1.2%', trend: 'down' as const, icon: 'Package' as const, variant: 'default' as const }
  ];

  return (
    <div className={`min-h-screen bg-slate-50 ${className}`}>
      {/* Design System: Custom CSS Variables for Solar Energy Theme */}
      <style jsx global>{`
        :root {
          --solar-primary: #f59e0b;
          --solar-secondary: #d97706;
          --solar-accent: #92400e;
          --energy-glow: rgba(245, 158, 11, 0.15);
          --performance-blue: #3b82f6;
          --growth-emerald: #10b981;
        }
        
        .solar-text-gradient {
          background: linear-gradient(135deg, var(--solar-primary), var(--solar-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .energy-grid {
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(245,158,11,0.1) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>

      {/* Header */}
      <motion.header 
        className="bg-white border-b border-slate-200 sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold solar-text-gradient">
                Dashboard Avalia Solar
              </h1>
              <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                {activeCompany?.name || 'Sistema Geral'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <div className="font-medium text-slate-900">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-slate-500">
                  {currentTime.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Icon name="Bell" className="h-4 w-4" />
                <Badge className="bg-amber-500 text-white px-1 py-0 text-xs">3</Badge>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Bem-vindo ao controle energético
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Monitore performance, gerencie empresas e acompanhe o crescimento 
              do setor de energia solar em tempo real.
            </p>
          </motion.div>

          {/* Metrics Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {metrics.map((metric, index) => (
              <motion.div key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <MetricCard {...metric} />
              </motion.div>
            ))}
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Performance Visual */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="xl:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Zap" className="h-5 w-5 text-amber-500" />
                    Performance Energética
                  </CardTitle>
                  <CardDescription>
                    Monitoramento em tempo real da rede solar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SolarPerformanceVisual />
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Zap" className="h-5 w-5 text-blue-500" />
                    Acesso Rápido
                  </CardTitle>
                  <CardDescription>
                    Navegue pelas principais seções
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompanyQuickActions />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Clock" className="h-5 w-5 text-slate-500" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Últimas atualizações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'company', message: 'Nova empresa cadastrada: Solar Tech Ltda', time: '2 min atrás' },
                    { type: 'review', message: '15 novas avaliações foram publicadas', time: '5 min atrás' },
                    { type: 'performance', message: 'Meta mensal de conversão atingida', time: '1h atrás' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <Icon 
                        name={activity.type === 'company' ? 'Building2' : activity.type === 'review' ? 'Star' : 'TrendingUp'} 
                        className="h-5 w-5 text-slate-400 mt-0.5" 
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                        <p className="text-xs text-slate-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}