'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useProfileViewTracker } from '@/hooks/useProfileViewTracker';

interface Props {
  companyId: number | string;
}

/**
 * Exibe o contador de visualizações do perfil público da empresa.
 *
 * Regras de exibição:
 *   0          → não exibir nada
 *   1–99       → "Novo perfil"
 *   100–999    → "428 visualizações"
 *   1.000–9.999 → "1,2 mil visualizações"
 *   10.000+    → "12,3 mil visualizações"
 */
export default function CompanyViewCounter({ companyId }: Props) {
  const [count, setCount] = useState<number | null>(null);

  // Rastreia a visualização com timer de 3s + Page Visibility
  useProfileViewTracker(companyId);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/v1/companies/${companyId}/views_count`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCount(data?.views_count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (count === null) return null; // loading — não exibe skeleton para não poluir header

  const label = formatViewCount(count);
  if (!label) return null; // 0 visualizações — não exibe

  return (
    <span
      className="flex items-center gap-1 text-slate-500"
      aria-label={`${count} visualizações do perfil`}
    >
      <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="text-xs sm:text-sm">{label}</span>
    </span>
  );
}

/**
 * Formata o contador de acordo com as regras de negócio.
 * Retorna null quando não deve ser exibido.
 */
export function formatViewCount(count: number): string | null {
  if (count <= 0)   return null;
  if (count < 100)  return 'Novo perfil';
  if (count < 1000) return `${count} visualizações`;

  const thousands = count / 1000;
  const formatted =
    count >= 10_000
      ? thousands.toFixed(1).replace('.', ',')
      : thousands.toFixed(1).replace('.', ',');

  return `${formatted} mil visualizações`;
}
