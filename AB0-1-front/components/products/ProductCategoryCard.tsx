import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { ResolvedQuickProductCategory } from '@/lib/products/quick-product-categories';

interface ProductCategoryCardProps {
  category: ResolvedQuickProductCategory;
  selected: boolean;
  onSelect: (category: ResolvedQuickProductCategory) => void;
}

export function ProductCategoryCard({
  category,
  selected,
  onSelect,
}: ProductCategoryCardProps) {
  const available = category.categoryId !== null;
  const countLabel =
    category.count === null
      ? 'Indisponível'
      : `${category.count} ${category.count === 1 ? 'produto' : 'produtos'}`;

  return (
    <button
      type="button"
      title={category.name}
      data-testid={`product-category-${category.key}`}
      aria-label={`${category.name}: ${countLabel}`}
      aria-pressed={selected}
      disabled={!available}
      onClick={() => onSelect(category)}
      className={cn(
        'flex h-[108px] w-full flex-col items-center justify-start rounded-xl border',
        'border-slate-200 bg-white px-2 py-2 text-center shadow-sm',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        'sm:h-[112px] md:px-2.5 lg:h-[116px]',
        available
          ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/30'
          : 'cursor-not-allowed opacity-65',
        selected && 'border-blue-600 bg-blue-50 ring-1 ring-blue-600/20'
      )}
    >
      <Image
        src={category.imageSrc}
        width={48}
        height={48}
        alt=""
        aria-hidden="true"
        unoptimized={category.imageSrc.endsWith('.svg')}
        className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12"
      />
      <span
        className={cn(
          'mt-1 flex min-h-[24px] w-full items-center justify-center text-[11px]',
          'font-semibold leading-[1.1] text-slate-900 sm:text-xs',
          selected && 'text-blue-700'
        )}
      >
        <span className="line-clamp-2 break-words">{category.label}</span>
      </span>
      <span className="mt-auto whitespace-nowrap text-[10px] font-medium leading-tight text-slate-500 sm:text-[11px]">
        {countLabel}
      </span>
    </button>
  );
}
