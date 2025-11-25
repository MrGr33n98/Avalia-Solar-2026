'use client';

import { motion } from 'framer-motion';
import {
  Building2,
  Package,
  Star,
  Target,
  Zap,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OverviewTabProps {
  company: any;
  stats: any;
}

export default function OverviewTab({ company, stats }: OverviewTabProps) {
  const quickActions = [
    {
      label: 'Editar Informações',
      icon: Building2,
      color: 'blue',
      action: 'info'
    },
    {
      label: 'Adicionar Produto',
      icon: Package,
      color: 'green',
      action: 'products'
    },
    {
      label: 'Ver Reviews',
      icon: Star,
      color: 'yellow',
      action: 'reviews'
    },
    {
      label: 'Gerenciar Leads',
      icon: Target,
      color: 'purple',
      action: 'leads'
    }
  ];

  const recentActivities = [
    {
      type: 'lead',
      text: 'Novo lead recebido de "João Silva"',
      time: '5 min atrás',
      icon: Target,
      color: 'purple'
    },
    {
      type: 'review',
      text: 'Nova avaliação de 5 estrelas',
      time: '2 horas atrás',
      icon: Star,
      color: 'yellow'
    },
    {
      type: 'view',
      text: '127 visualizações no perfil hoje',
      time: '4 horas atrás',
      icon: Eye,
      color: 'blue'
    },
    {
      type: 'approval',
      text: 'Alteração de descrição aprovada',
      time: 'Ontem',
      icon: CheckCircle2,
      color: 'green'
    }
  ];

  const pendingTasks = [
    { task: 'Responder 3 leads pendentes', urgent: true, link: 'leads' },
    { task: 'Atualizar fotos da galeria', urgent: false, link: 'media' },
    { task: 'Revisar informações de contato', urgent: false, link: 'info' },
    { task: 'Configurar CTAs personalizados', urgent: true, link: 'settings' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400',
      purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-muted hover:border-primary/20 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesse rapidamente as funcionalidades mais utilizadas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + (index * 0.05) }}
                >
                  <Button
                    variant="outline"
                    className={cn(
                      'h-auto py-4 px-4 flex flex-col items-center gap-3 w-full',
                      'hover:shadow-lg hover:scale-105 transition-all duration-300',
                      'hover:border-primary/40'
                    )}
                  >
                    <div className={cn(
                      'p-3 rounded-xl transition-transform group-hover:scale-110',
                      getColorClasses(action.color)
                    )}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-center">
                      {action.label}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-muted hover:border-primary/20 transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Performance do Perfil</CardTitle>
                  <CardDescription>Últimos 30 dias</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    Taxa de Conversão
                  </span>
                  <span className="font-bold text-foreground">
                    {stats?.conversionRate}%
                  </span>
                </div>
                <Progress value={stats?.conversionRate || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Leads convertidos em clientes
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    Engajamento
                  </span>
                  <span className="font-bold text-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Interação com seu perfil e conteúdo
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    Completude do Perfil
                  </span>
                  <span className="font-bold text-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Complete para melhorar visibilidade
                </p>
              </div>

              <Button variant="outline" className="w-full mt-4">
                Ver Relatório Completo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Tasks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-muted hover:border-primary/20 transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Próximas Ações</CardTitle>
                  <CardDescription>
                    Tarefas pendentes e recomendações
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingTasks.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.05) }}
                  >
                    <button
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-lg',
                        'hover:bg-muted transition-all duration-200 group',
                        'border border-transparent hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.urgent ? (
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            {item.task}
                          </p>
                          {item.urgent && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Urgente
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-muted hover:border-primary/20 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas interações com sua empresa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (index * 0.05) }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg',
                    'hover:bg-muted transition-colors cursor-pointer'
                  )}
                >
                  <div className={cn(
                    'p-2.5 rounded-lg shrink-0',
                    getColorClasses(activity.color)
                  )}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
