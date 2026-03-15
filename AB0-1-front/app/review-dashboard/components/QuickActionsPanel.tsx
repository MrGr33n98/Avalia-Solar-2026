'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Building, PackageSearch, UserRound, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

export function QuickActionsPanel({ profileCompletion = 0, onActionClick }: QuickActionsPanelProps) {     
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-black text-slate-950 uppercase tracking-tight">Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full justify-between h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group px-4"
                  asChild
                  onClick={() => onActionClick?.(action.id)}
                >
                  <Link href={action.href}>
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", action.bg)}>
                        <Icon className={cn("h-5 w-5", action.color)} />
                      </div>
                      <span className="font-black text-slate-700 uppercase tracking-tight text-sm">{action.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu Perfil</span>
              <Badge className="bg-blue-600 text-white font-black rounded-lg">{profileCompletion}%</Badge>
            </div>
            <Progress value={profileCompletion} className="h-2.5 bg-slate-100" />
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Complete seu perfil para ganhar mais <strong className="text-slate-900 uppercase">visibilidade</strong> e confiança das empresas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trust Card Sidebar Quick Win */}
      <Card className="rounded-3xl shadow-lg border-none bg-slate-950 text-white p-6 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="h-24 w-24" />
         </div>
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <h4 className="font-black uppercase tracking-tight text-sm">Proteção Avalia Solar</h4>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Todos os seus dados são criptografados e compartilhados apenas com integradores que você aprovar.
            </p>
            <Button variant="link" className="p-0 h-auto text-blue-400 font-bold text-xs uppercase tracking-widest hover:text-blue-300">
               Saiba mais
            </Button>
         </div>
      </Card>
      
      <Card className="rounded-3xl border border-dashed border-slate-200 bg-transparent p-5 text-center group cursor-pointer hover:bg-slate-50 transition-all">
          <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
          <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">Dúvidas?</p>
          <p className="text-[10px] text-slate-400 font-medium">Nossos especialistas estão prontos para te ajudar com seu orçamento solar.</p>
      </Card>
    </div>
  );
}
