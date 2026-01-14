'use client';



import * as React from 'react';

import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';

import { ChevronDown, Zap, Sun, Battery, Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useCategories } from '@/hooks/useCategories';

import { Category } from '@/lib/api';

import { cn } from '@/lib/utils';

import { usePathname } from 'next/navigation';



// Helper to pick an icon based on category name (just for visual flair)

const getCategoryIcon = (name: string) => {

  const n = name.toLowerCase();

  if (n.includes('painel') || n.includes('módulo')) return Sun;

  if (n.includes('inversor')) return Zap;

  if (n.includes('bateria')) return Battery;

  return Activity;

};



export default function CategoryDropdown() {

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { categories, loading, error, refresh } = useCategories(true); // Fetch all active categories
  const pathname = usePathname();

  const activeCategorySlug = React.useMemo(() => {
    if (!pathname) return '';
    const parts = pathname.split('/categories/');
    if (parts.length < 2) return '';
    return parts[1].split('/')[0].split('?')[0];
  }, [pathname]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close when path changes (navigation occurred)
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Toggle dropdown
  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };



  return (

    <div className="relative" ref={containerRef}>

      <Button
        variant="ghost"
        className={cn(
          "flex items-center gap-1 font-medium transition-colors bg-[#14b8a6] hover:bg-[#0d9488] text-white hover:text-white",
          isOpen && "bg-[#0d9488] text-white"
        )}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Categorias
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>



      <AnimatePresence>

        {isOpen && (

          <motion.div

            initial={{ opacity: 0, y: 10, scale: 0.95 }}

            animate={{ opacity: 1, y: 0, scale: 1 }}

            exit={{ opacity: 0, y: 10, scale: 0.95 }}

            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-[85vw] md:w-[600px] max-w-[600px] rounded-xl border border-border bg-popover p-4 shadow-lg shadow-black/5 outline-none z-[1001] origin-top-left"
          >

            <div className="grid grid-cols-2 gap-4">

              {/* Header/Info Section inside dropdown */}

              <div className="col-span-2 mb-2 pb-2 border-b border-border/50">

                 <h4 className="text-sm font-semibold text-foreground">Explore por Categoria</h4>

                 <p className="text-xs text-muted-foreground">Encontre os melhores produtos e serviços.</p>

              </div>



              {loading ? (

                <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">

                  Carregando categorias...

                </div>

              ) : error ? (

                <div className="col-span-2 py-8 text-center text-sm text-destructive">

                  Erro ao carregar. 

                  <Button variant="link" size="sm" onClick={() => refresh()} className="ml-2">Tentar novamente</Button>

                </div>

              ) : (

                categories.map((category) => {

                  const Icon = getCategoryIcon(category.name);

                  const isActive = Boolean(

                    activeCategorySlug &&

                      (category.seo_url === activeCategorySlug || String(category.id) === activeCategorySlug)

                  );

                  return (

                    <Link
                      key={category.id}
                      href={`/categories/${category.seo_url || category.id}`}
                      onClick={() => setIsOpen(false)}
                      className={cn(

                        'group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent',

                        isActive && 'bg-primary text-white shadow-lg'

                      )}

                      aria-current={isActive ? 'page' : undefined}

                    >

                      <div

                        className={cn(

                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors',

                          isActive

                            ? 'bg-white group-hover:bg-white border-white'

                            : 'bg-muted group-hover:bg-background group-hover:border-border'

                        )}

                      >

                        <Icon

                          className={cn(

                            'h-5 w-5 transition-colors',

                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'

                          )}

                        />

                      </div>

                      <div className="space-y-1">

                        <p

                          className={cn(

                            'text-sm font-medium leading-none transition-colors',

                            isActive ? 'text-white' : 'group-hover:text-primary'

                          )}

                        >

                          {category.name}

                        </p>

                        <p

                          className={cn(

                            'text-xs line-clamp-2 transition-colors',

                            isActive ? 'text-white/80' : 'text-muted-foreground'

                          )}

                        >

                          {category.description || 'Produtos e servi?os de alta qualidade.'}

                        </p>

                      </div>

                    </Link>

                  );

                })

              )}

              

              {!loading && !error && categories.length === 0 && (

                 <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">

                   Nenhuma categoria encontrada.

                 </div>

              )}

            </div>

            

            <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/categories">
                  <span>Ver todas as categorias →</span>
                </Link>
              </Button>
            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>

  );

}

