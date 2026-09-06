'use client';

import { useState } from 'react';
import type { EmailTemplate, PaginationMeta, TemplateStats as StatsType } from '../types';
import { TemplateHeader } from './TemplateHeader';
import { TemplateStats } from './TemplateStats';
import { TemplateTabs } from './TemplateTabs';
import { TemplateCard } from './TemplateCard';
import { TemplateFilters } from './TemplateFilters';
import { TemplateSkeleton } from '../states/TemplateSkeleton';
import { TemplateEmptyState } from '../states/TemplateEmptyState';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TemplateLibraryProps {
  templates: EmailTemplate[];
  meta: PaginationMeta | null;
  stats: StatsType | null;
  categoriesList: string[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  tabFilter: string;
  onTabChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  onNewTemplate: () => void;
  onEdit: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onDuplicate: (template: EmailTemplate) => void;
  onArchive: (template: EmailTemplate) => void;
  onTestSend: (template: EmailTemplate) => void;
  onResetFilters: () => void;
}

export function TemplateLibrary({
  templates,
  meta,
  stats,
  categoriesList,
  loading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  tabFilter,
  onTabChange,
  sort,
  onSortChange,
  page: _page,
  onPageChange,
  onNewTemplate,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  onTestSend,
  onResetFilters,
}: TemplateLibraryProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-6">
      <TemplateHeader
        search={search}
        onSearchChange={onSearchChange}
        onNewTemplate={onNewTemplate}
      />

      <TemplateStats stats={stats} loading={loading && !stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <TemplateTabs activeTab={tabFilter} onTabChange={onTabChange} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {showFilters && (
            <div className="lg:col-span-1">
              <TemplateFilters
                category={categoryFilter}
                onCategoryChange={onCategoryChange}
                status={statusFilter}
                onStatusChange={onStatusChange}
                sort={sort}
                onSortChange={onSortChange}
                categoriesList={categoriesList}
                onReset={onResetFilters}
              />
            </div>
          )}

          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {loading ? (
              <TemplateSkeleton />
            ) : templates.length === 0 ? (
              <TemplateEmptyState
                search={search}
                onNewTemplate={onNewTemplate}
                onClearFilters={onResetFilters}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={onEdit}
                      onPreview={onPreview}
                      onDuplicate={onDuplicate}
                      onArchive={onArchive}
                      onTestSend={onTestSend}
                    />
                  ))}
                </div>

                {meta && meta.total_pages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                    <p>
                      Exibindo página {meta.page} de {meta.total_pages} ({meta.total} templates no total)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page <= 1}
                        onClick={() => onPageChange(meta.page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page >= meta.total_pages}
                        onClick={() => onPageChange(meta.page + 1)}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
