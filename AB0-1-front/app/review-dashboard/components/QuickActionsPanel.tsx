'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlusCircle,
  Building,
  PackageSearch,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuickActionsPanelProps {
  profileCompletion?: number;
  onActionClick?: (actionId: string) => void;
  compact?: boolean;
}

const actions = [
  {
    id: 'new_review',
    label: 'Escrever nova avaliação',
    icon: PlusCircle,
    href: '/empresas',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'browse_companies',
    label: 'Encontrar integradores',
    icon: Building,
    href: '/empresas',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'browse_products',
    label: 'Explorar produtos',
    icon: PackageSearch,
    href: '/produtos',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

export function QuickActionsPanel({
  profileCompletion = 0,
  onActionClick,
  compact = false,
}: QuickActionsPanelProps) {
  const profileComplete = profileCompletion >= 100;

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-950">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="group h-12 w-full justify-between rounded-xl border-slate-200 px-3 transition-all hover:border-slate-300 hover:bg-slate-50"
                  asChild
                  onClick={() => onActionClick?.(action.id)}
                >
                  <Link href={action.href}>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          action.bg
                        )}
                      >
                        <Icon className={cn('h-4 w-4', action.color)} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{action.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-950">Seu perfil</span>
              <Badge className="rounded-full bg-blue-600 text-xs font-semibold text-white">
                {profileCompletion}%
              </Badge>
            </div>
            <Progress value={profileCompletion} className="h-1.5 bg-slate-100" />
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              {profileComplete
                ? 'Perfil completo. Você está pronto para receber recomendações melhores.'
                : 'Complete seu perfil para ganhar mais visibilidade e confiança.'}
            </p>
            {!profileComplete && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full rounded-xl border-slate-200 text-xs font-semibold"
                asChild
                onClick={() => onActionClick?.('complete_profile')}
              >
                <Link href="/profile">Completar perfil</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden rounded-2xl border-none bg-slate-950 p-4 text-white shadow-sm">
        <div className="absolute right-3 top-3 opacity-10 transition-opacity group-hover:opacity-20">
          <ShieldCheck className="h-20 w-20" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-300" />
            <h4 className="text-sm font-semibold">Proteção Avalia Solar</h4>
          </div>
          <p className="max-w-sm text-xs font-medium leading-relaxed text-slate-300">
            Seus dados são criptografados e compartilhados apenas com empresas autorizadas.
          </p>
          <Button
            variant="link"
            className="h-auto p-0 text-xs font-semibold text-blue-300 hover:text-blue-200"
          >
            Saiba mais
          </Button>
        </div>
      </Card>

      <Card className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            <HelpCircle className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Dúvidas?</p>
            <p className="text-xs font-medium text-slate-500">Nossos especialistas podem ajudar.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
