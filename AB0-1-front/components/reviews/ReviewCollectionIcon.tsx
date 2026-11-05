import type { SVGProps } from 'react';

export const REVIEW_COLLECTION_ICON_NAMES = [
  '01_estrelas_ia', '02_usuarios', '03_carrinho', '04_primeira_avaliacao',
  '05_globo', '06_matriz', '07_tendencia', '08_escudo', '09_medalha',
  '10_raio', '11_elo', '12_copiar', '13_seta_direita',
] as const;

export type ReviewCollectionIconName = (typeof REVIEW_COLLECTION_ICON_NAMES)[number];

interface ReviewCollectionIconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'width' | 'height'> {
  name: ReviewCollectionIconName;
  size?: number;
  label?: string;
}

/** Fonte vetorial única — não acoplar semântica, tracking ou lógica de prêmio à arte. */
export function ReviewCollectionIcon({
  name,
  size = 24,
  label,
  className = '',
  ...rest
}: ReviewCollectionIconProps) {
  return (
    <svg
      {...rest}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={'shrink-0 ' + className}
    >
      <use href={'/assets/icons/review-collection/avalia-solar-icons-sprite.svg#' + name} />
    </svg>
  );
}
