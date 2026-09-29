import { BANNER_PLACEMENT_ASPECT_RATIOS, getPlacementDisplaySpec } from './placements';

interface ResolveBannerAspectRatioOptions {
  position?: string;
  width?: number | null;
  height?: number | null;
  sourcePosition?: string;
}

function isPositiveDimension(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    [a, b] = [b, a % b];
  }

  return a;
}

function formatAspectRatio(width: number, height: number): string {
  if (Number.isInteger(width) && Number.isInteger(height)) {
    const divisor = greatestCommonDivisor(width, height);
    return `${width / divisor}/${height / divisor}`;
  }

  return `${width}/${height}`;
}

/**
 * Resolve a creative's CSS aspect-ratio.
 * Placements with an explicit display spec (e.g. company_profile_about_inline) control their UI geometry.
 * Fallback creatives use their source placement defaults.
 */
export function resolveBannerAspectRatio({
  position,
  width,
  height,
  sourcePosition,
}: ResolveBannerAspectRatioOptions): string {
  const targetPos = sourcePosition || position || '';
  const spec = getPlacementDisplaySpec(targetPos) || getPlacementDisplaySpec(position || '');

  if (spec?.ignoreCreativeDimensions) {
    return spec.defaultAspectRatio || BANNER_PLACEMENT_ASPECT_RATIOS[targetPos] || '4/1';
  }

  if (isPositiveDimension(width) && isPositiveDimension(height)) {
    return formatAspectRatio(width, height);
  }

  return (
    BANNER_PLACEMENT_ASPECT_RATIOS[sourcePosition || position || ''] ||
    BANNER_PLACEMENT_ASPECT_RATIOS[position || ''] ||
    '21/5'
  );
}

export type { ResolveBannerAspectRatioOptions };