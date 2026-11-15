import Link from 'next/link';

export interface CategoryNavigationItem {
  label: string;
  href: string;
}

const MOBILE_LABELS: Record<string, string> = {
  Empresas: 'Empresas',
  'Sobre a categoria': 'Sobre',
  'Dúvidas frequentes': 'FAQ',
  'Tipos de soluções': 'Soluções',
  'Comparar soluções': 'Comparar',
  'Empresas para seu projeto': 'Projeto',
};

export default function CategoryNavigation({ items }: { items: CategoryNavigationItem[] }) {
  return (
    <nav
      aria-label="Navegação da categoria"
      data-testid="category-navigation"
      className="no-scrollbar mx-auto flex max-w-[1280px] snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 py-1.5 sm:px-6 md:gap-2 md:py-3"
    >
      {items.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className="flex h-11 min-h-11 basis-[calc((100%-12px)/3)] shrink-0 snap-start items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 px-1.5 py-1 text-center text-[11px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 md:h-auto md:min-h-11 md:basis-auto md:rounded-xl md:px-4 md:py-2 md:text-sm"
        >
          <span aria-hidden="true" className="md:hidden">
            {MOBILE_LABELS[label] || label}
          </span>
          <span className="hidden md:inline">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
