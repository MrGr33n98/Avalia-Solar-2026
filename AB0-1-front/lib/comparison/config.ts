/**
 * Configuração canônica do comparador Avalia Solar.
 *
 * REGRA DE PRODUTO:
 *   PWA / mobile (viewport < md = 768px): máximo 2 empresas
 *   WebApp / tablet / desktop (viewport >= md): máximo 3 empresas
 *
 * ÚNICO lugar onde esses números existem. Todos os consumidores DEVEM
 * importar daqui — proibido repetir literais 2/3/4 no domínio de comparação.
 */

export const COMPARISON_LIMITS = {
  /** PWA/mobile: viewport < 768px */
  mobile: 2,
  /** WebApp/tablet/desktop: viewport >= 768px */
  desktop: 3,
} as const;

export type ComparisonExperience = 'mobile' | 'desktop';

/**
 * Breakpoint canônico: tailwind `md` = 768px.
 * Usar viewport capability (largura), não display-mode standalone.
 * PWA instalado em tablet com > 768px de largura recebe limite 3.
 */
export const COMPARISON_BREAKPOINT_PX = 768;

/**
 * Retorna o limite de comparação baseado na largura do viewport.
 * Seguro para uso em SSR (retorna 'desktop' quando window não existe).
 */
export function getComparisonLimit(widthPx?: number): number {
  const width = widthPx ?? (typeof window !== 'undefined' ? window.innerWidth : Infinity);
  return width < COMPARISON_BREAKPOINT_PX
    ? COMPARISON_LIMITS.mobile
    : COMPARISON_LIMITS.desktop;
}

/**
 * Retorna a experiência ('mobile' | 'desktop') baseada na largura do viewport.
 */
export function getComparisonExperience(widthPx?: number): ComparisonExperience {
  const width = widthPx ?? (typeof window !== 'undefined' ? window.innerWidth : Infinity);
  return width < COMPARISON_BREAKPOINT_PX ? 'mobile' : 'desktop';
}

/**
 * Mensagens de limite por experiência. Centralizadas para manter consistência
 * em toasts, modais, aria-labels e analytics.
 */
export const COMPARISON_LIMIT_MESSAGES: Record<ComparisonExperience, string> = {
  mobile: `No celular, compare até ${COMPARISON_LIMITS.mobile} empresas lado a lado.`,
  desktop: `Você pode comparar até ${COMPARISON_LIMITS.desktop} empresas.`,
};

/**
 * Normaliza um array de empresas para respeitar o limite da experiência atual.
 * Preserva a ordem (primeiras selecionadas têm prioridade).
 * Usar SOMENTE no boundary do store/domain, não na renderização.
 */
export function normalizeToLimit<T>(list: T[], experience: ComparisonExperience): T[] {
  return list.slice(0, COMPARISON_LIMITS[experience]);
}
