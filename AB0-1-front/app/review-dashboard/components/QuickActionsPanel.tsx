import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Building2, PackageSearch, UserRound, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface QuickActionsPanelProps {
  profileCompletion?: number;
  onActionClick?: (actionId: string) => void;
}

const actions = [
  {
    id: 'new_review',
    label: 'Escrever nova avaliação',
    icon: PlusCircle,
    href: '/empresas',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    id: 'browse_companies',
    label: 'Encontrar integradores',
    icon: Building2,
    href: '/empresas',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'browse_products',
    label: 'Explorar produtos',
    icon: PackageSearch,
    href: '/produtos',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    id: 'complete_profile',
    label: 'Completar perfil',
    icon: UserRound,
    href: '/minha-conta',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

export function QuickActionsPanel({ profileCompletion = 0, onActionClick }: QuickActionsPanelProps) {
  return (
    <Card className="rounded-2xl shadow-sm border h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-start h-12 gap-3 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all"
                asChild
                onClick={() => onActionClick?.(action.id)}
              >
                <Link href={action.href}>
                  <div className={`p-1.5 rounded-lg ${action.bg}`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="font-medium text-gray-700">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Seu Perfil</span>
            <span className="text-teal-600 font-bold">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
          <p className="text-xs text-gray-500">
            Complete seu perfil para ganhar mais visibilidade e confiança.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3">
          <HelpCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-900">Dica do Avalia</p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Sua primeira avaliação ajuda outras pessoas a escolherem bons integradores.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
