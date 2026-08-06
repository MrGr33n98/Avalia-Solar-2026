import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { buildCompanyCategoryPath } from '@/lib/slug';
import type { CategoryWithCount } from '@/lib/api';

interface CategorySuggestionChipProps {
  category: CategoryWithCount;
  companySlug: string;
  companyName?: string;
}

export function CategorySuggestionChip({
  category,
  companySlug,
  companyName,
}: CategorySuggestionChipProps) {
  const href = buildCompanyCategoryPath(companySlug, companyName, category.seo_url);

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <span className="truncate">{category.name}</span>
      {category.product_count ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
          {category.product_count}
        </span>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
    </Link>
  );
}
