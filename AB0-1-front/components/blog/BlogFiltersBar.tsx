'use client';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { BlogPromoBanner } from './BlogPromoBanner';
import { CategoryWithCount } from '@/lib/api/blog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/lazy';

interface BlogFiltersBarProps {
  categories: CategoryWithCount[];
}
export function BlogFiltersBar({ categories }: BlogFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentSort = searchParams.get('sort') || 'latest';
  const currentQ = searchParams.get('q') || '';
  const [search, setSearch] = React.useState(currentQ);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);
  React.useEffect(() => setSearch(currentQ), [currentQ]);
  const pushParams = React.useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page'); // reset pagination on filter changes
      for (const [key, value] of Object.entries(next)) {
        if (!value || value === 'all') params.delete(key);
        else params.set(key, value);
        
        // Track filter changes
        if (key === 'category') {
          const catName = categories.find(c => String(c.id) === value)?.name || 'Tudo';
          track('blog_filter_change', {
            filter_type: 'category',
            filter_value: catName,
            category_id: value
          });
        }
        if (key === 'sort') {
          track('blog_filter_change', {
            filter_type: 'sort',
            filter_value: value
          });
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams, categories]
  );
  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (search === currentQ) return;
      pushParams({ q: search || null });
      
      if (search) {
        track('blog_search', {
          search_term: search,
          results_count: 0 // We don't have results count here easily
        });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [search, currentQ, pushParams]);
  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);
  React.useEffect(() => {
    // after layout
    const raf = requestAnimationFrame(checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories.length, checkScroll]);
  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -260 : 260, behavior: 'smooth' });
  };
  const hasActiveFilters =
    (currentCategory && currentCategory !== 'all') ||
    (currentSort && currentSort !== 'latest') ||
    Boolean(currentQ);
  return (
    <section className="mb-8 sticky top-[80px] z-20">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        {/* ✅ grid responsivo: tabs / search / sort */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
          {/* Tabs (col 1..7) */}
          <div className="lg:col-span-7 min-w-0">
            <div className="relative flex items-center min-w-0">
              {/* Left arrow */}
              <div
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 z-10 pr-3 py-1 bg-gradient-to-r from-white via-white to-transparent transition-opacity',
                  showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-primary hover:bg-slate-50"
                  onClick={() => scroll('left')}
                  aria-label="Rolar categorias para esquerda"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              {/* Scroll container */}
              <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="min-w-0 w-full overflow-x-auto no-scrollbar scroll-smooth px-2"
              >
                <Tabs value={currentCategory} onValueChange={(v) => pushParams({ category: v === 'all' ? null : v })}>
                  <TabsList className="inline-flex w-max gap-1 bg-slate-100/60 p-1 h-11 rounded-full">
                    <TabsTrigger
                      value="all"
                      className="rounded-full px-4 h-9 text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      Tudo
                    </TabsTrigger>
                    {categories.map((cat) => (
                      <TabsTrigger
                        key={cat.id}
                        value={String(cat.id)} // (se você migrar p/ slug, troque aqui)
                        className="rounded-full px-4 h-9 text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                      >
                        {cat.name}{' '}
                        <span className="ml-1 text-slate-500">({cat.articles_count ?? cat.count ?? 0})</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              {/* Right arrow */}
              <div
                className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 z-10 pl-3 py-1 bg-gradient-to-l from-white via-white to-transparent transition-opacity',
                  showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-primary hover:bg-slate-50"
                  onClick={() => scroll('right')}
                  aria-label="Rolar categorias para direita"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Search (col 8..10) */}
          <div className="lg:col-span-3 min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar artigos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "h-11 rounded-full pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary",
                  search && "pr-10"
                )}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-11 w-10 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {/* Sort + Clear (col 11..12) */}
          <div className="lg:col-span-2 flex gap-2 min-w-0">
            <div className="flex-1">
              <Select value={currentSort} onValueChange={(v) => pushParams({ sort: v || null })}>
                <SelectTrigger className="w-full h-11 rounded-full bg-white border-slate-200 hover:bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ArrowUpDown className="h-4 w-4 text-primary/70" />
                    <SelectValue placeholder="Ordenar" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Mais recentes</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={() => router.push(pathname)}
                aria-label="Limpar filtros"
                title="Limpar filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
