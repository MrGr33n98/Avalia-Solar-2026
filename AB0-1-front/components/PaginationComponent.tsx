import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  perPage?: number;
  className?: string;
}

/**
 * Componente de Paginação reutilizável e acessível
 * 
 * @example
 * <PaginationComponent 
 *   currentPage={2}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 *   totalItems={100}
 *   perPage={10}
 * />
 */
export function PaginationComponent({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
  className = '',
}: PaginationComponentProps) {
  // Calcular range de itens exibidos
  const startItem = totalItems && perPage ? (currentPage - 1) * perPage + 1 : null;
  const endItem = totalItems && perPage ? Math.min(currentPage * perPage, totalItems) : null;

  // Gerar array de números de página para mostrar
  const getPageNumbers = () => {
    const delta = 2; // Quantas páginas mostrar em cada lado
    const pages: (number | string)[] = [];

    // Sempre mostrar primeira página
    pages.push(1);

    // Calcular range de páginas
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // Adicionar "..." se necessário
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Adicionar páginas do range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Adicionar "..." se necessário
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // Sempre mostrar última página
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav 
      className={`flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 ${className}`}
      aria-label="Paginação"
    >
      {/* Info de itens (mobile hidden) */}
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          {startItem && endItem && totalItems ? (
            <>
              Mostrando <span className="font-medium">{startItem}</span> a{' '}
              <span className="font-medium">{endItem}</span> de{' '}
              <span className="font-medium">{totalItems}</span> resultados
            </>
          ) : (
            <>
              Página <span className="font-medium">{currentPage}</span> de{' '}
              <span className="font-medium">{totalPages}</span>
            </>
          )}
        </p>
      </div>

      {/* Botões de paginação */}
      <div className="flex flex-1 justify-between sm:justify-end gap-2">
        {/* Primeira página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:inline-flex"
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {/* Números de página (desktop only) */}
        <div className="hidden md:flex gap-1">
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Página ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Button>
            ) : (
              <span
                key={index}
                className="inline-flex items-center px-2 text-gray-500"
                aria-hidden="true"
              >
                {page}
              </span>
            )
          ))}
        </div>

        {/* Próxima página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4 sm:ml-2" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:inline-flex"
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
