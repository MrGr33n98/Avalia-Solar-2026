import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { RankingData } from '@/lib/api';

export function RankingMethodologyDrawer({ definition, quadrantMeta }: {
  definition?: RankingData['definition'];
  quadrantMeta?: RankingData['quadrant_meta'];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><CircleHelp className="mr-2 h-4 w-4" />Como funciona o ranking?</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Metodologia do ranking orgânico</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>O ranking mede desempenho orgânico. Patrocínio, anúncios e plano comercial não alteram a posição oficial.</p>
          <p><strong className="text-foreground">População elegível:</strong> {definition?.eligibility_definition || 'empresas ativas com score de ranking calculado no escopo selecionado.'}</p>
          <p><strong className="text-foreground">Fórmula:</strong> {definition?.score_definition || 'Trust score × 10 + engajamento recente.'}</p>
          <p>O engajamento considera os últimos sete dias completos com decaimento exponencial.</p>
          <p><strong className="text-foreground">Desempate:</strong> {definition?.tie_breaker || 'score, confiança, avaliações e ID da empresa.'}</p>
          <p><strong className="text-foreground">Datas:</strong> “Dados até” informa o último dia incluído; “calculado em” informa quando o snapshot oficial foi gerado.</p>
          <p><strong className="text-foreground">Versão:</strong> {definition?.definition_version || 'aguardando snapshot'}.</p>
          <p><strong className="text-foreground">Mapa de posicionamento:</strong> usa eixos próprios ({quadrantMeta?.x_axis_definition || 'autoridade'} e {quadrantMeta?.y_axis_definition || 'execução'}) e não define a posição oficial.</p>
          <Link href="/como-funciona-o-ranking" className="inline-flex font-medium text-brand-blue underline">Ler a metodologia completa</Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
