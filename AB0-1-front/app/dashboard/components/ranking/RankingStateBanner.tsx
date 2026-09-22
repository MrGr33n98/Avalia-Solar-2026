import { AlertCircle, Clock3, LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  status?: string;
};

export function RankingStateBanner({ status }: Props) {
  if (!['processing', 'empty', 'stale', 'locked'].includes(status || '')) return null;

  const content = {
    processing: {
      title: 'Ranking em processamento',
      description: 'O primeiro snapshot orgânico está sendo calculado. Nenhuma posição foi estimada.',
      icon: Clock3,
    },
    empty: {
      title: 'Sem empresas comparáveis neste escopo',
      description: 'Amplie ou limpe os filtros para encontrar uma população elegível.',
      icon: AlertCircle,
    },
    stale: {
      title: 'Atualização pendente',
      description: 'Exibimos o último snapshot oficial disponível enquanto os dados são atualizados.',
      icon: Clock3,
    },
    locked: {
      title: 'Ranking avançado bloqueado',
      description: 'Esta análise está disponível para planos com Advanced Analytics.',
      icon: LockKeyhole,
    },
  }[status as 'processing' | 'empty' | 'stale' | 'locked'];
  const Icon = content.icon;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardContent className="flex gap-3 p-5">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-200">{content.title}</p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">{content.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
