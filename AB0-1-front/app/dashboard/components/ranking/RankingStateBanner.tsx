import { AlertCircle, Clock3, LockKeyhole, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  status?: string;
  officialStatus?: string;
  fallback?: {
    active?: boolean;
    reason?: string | null;
    requested?: string | null;
    resolved?: string | null;
  };
  analysisAvailable?: boolean;
  asOf?: string;
  methodologyRelease?: string;
};

export function RankingStateBanner({
  status,
  officialStatus,
  fallback,
  analysisAvailable = true,
  asOf,
  methodologyRelease,
}: Props) {
  // Se houver fallback de escopo ativo, exibe disclosure com escopo solicitado e resolvido
  if (fallback?.active) {
    const requestedText = fallback.requested ? ` (${fallback.requested})` : '';
    const resolvedText = fallback.resolved ? ` ${fallback.resolved}` : ' abrangente';

    return (
      <Card className="border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />
          <div className="flex-1">
            <p className="font-semibold text-blue-950 dark:text-blue-200">
              Escopo ajustado para representatividade estatística
            </p>
            <p className="mt-1 text-xs text-blue-900/80 dark:text-blue-200/80">
              O escopo solicitado{requestedText} possui amostra insuficiente para publicação segura.
              Exibindo o ranking de nível territorial{resolvedText}.
            </p>
            {(asOf || methodologyRelease) && (
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-blue-800/70">
                {asOf && <span>Base de dados: {asOf}</span>}
                {methodologyRelease && <span>Metodologia: {methodologyRelease}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se a análise de posicionamento estiver em calibração
  if (analysisAvailable === false) {
    return (
      <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Análise estatística avançada em calibração
            </p>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              O ranking orgânico oficial permanece válido. O quadrante e os percentis exigem população mínima de 5 empresas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleStatus = officialStatus || status;
  if (!['processing', 'empty', 'stale', 'locked'].includes(visibleStatus || '')) return null;

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
  }[visibleStatus as 'processing' | 'empty' | 'stale' | 'locked'];
  const Icon = content.icon;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardContent className="flex gap-3 p-5">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-200">{content.title}</p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">{content.description}</p>
          {(asOf || methodologyRelease) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-900/60">
              {asOf && <span>Base de dados: {asOf}</span>}
              {methodologyRelease && <span>Metodologia: {methodologyRelease}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
