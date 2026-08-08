'use client';

import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { LeadWizardEngine } from '@/src/modules/leadWizard/components/LeadWizardEngine';
import { companiesApiSafe } from '@/lib/api-client';
import { resolveWizardCategoryId } from '@/lib/lead-engine';

type LeadWizardEventDetail = {
  categoryId?: number;
  preferredCompanyId?: number;
  source?: string;
};

type CategoryOption = {
  id: number;
  name?: string;
  seo_url?: string;
};

type RawCategoryOption = {
  id?: number | string | null;
  name?: string | null;
  seo_url?: string | null;
  seoUrl?: string | null;
  slug?: string | null;
};

type CompanyCategorySource = {
  category_id?: number;
  category_info?: CategoryOption | null;
  categories?: RawCategoryOption[] | null;
};

const normalizeCategoryOption = (category: RawCategoryOption): CategoryOption | null => {
  const id = Number(category.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    name: category.name || undefined,
    seo_url: category.seo_url || category.seoUrl || category.slug || undefined,
  };
};

export default function DynamicLeadWizardModal() {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [preferredCompanyId, setPreferredCompanyId] = useState<number | undefined>(undefined);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isResolvingCategory, setIsResolvingCategory] = useState(false);
  const [categoryResolutionError, setCategoryResolutionError] = useState<string | null>(null);

  const resetWizardState = useCallback(() => {
    setCategoryId(undefined);
    setPreferredCompanyId(undefined);
    setCategoryOptions([]);
    setCategoryResolutionError(null);
    setIsResolvingCategory(false);
  }, []);

  const handleOpenRequest = useCallback((detail: LeadWizardEventDetail) => {
    resetWizardState();
    setCategoryId(detail.categoryId);
    setPreferredCompanyId(detail.preferredCompanyId);
    setOpen(true);
  }, [resetWizardState]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent<LeadWizardEventDetail>).detail || {}) as LeadWizardEventDetail;
      handleOpenRequest(detail);
    };

    window.addEventListener('open-dynamic-lead-wizard', handler as EventListener);
    return () => window.removeEventListener('open-dynamic-lead-wizard', handler as EventListener);
  }, [handleOpenRequest]);

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetWizardState();
    }
  };

  useEffect(() => {
    if (!open || categoryId || !preferredCompanyId) return;

    let cancelled = false;

    const resolveCategory = async () => {
      setIsResolvingCategory(true);
      setCategoryResolutionError(null);

      try {
        const company = await companiesApiSafe.getById(preferredCompanyId) as CompanyCategorySource | null;
        if (cancelled) return;
        if (!company) {
          setCategoryResolutionError('Nao foi possivel identificar a empresa.');
          return;
        }

        const categories = Array.isArray(company.categories)
          ? company.categories
              .map(normalizeCategoryOption)
              .filter((category): category is CategoryOption => Boolean(category))
          : [];
        const inferredCategoryId = resolveWizardCategoryId({
          category_id: company.category_id,
          category_info: company.category_info,
          categories,
        });

        setCategoryOptions(categories);

        if (inferredCategoryId && (categories.length <= 1 || categories.some((category: CategoryOption) => category.id === inferredCategoryId && /financiamento|financing/i.test(`${category.name || ''} ${category.seo_url || ''}`)))) {
          setCategoryId(inferredCategoryId);
        } else if (categories.length === 1) {
          setCategoryId(categories[0].id);
        } else if (categories.length === 0) {
          setCategoryResolutionError('Nao foi possivel identificar uma categoria para esta empresa.');
        }
      } catch {
        if (!cancelled) {
          setCategoryResolutionError('Nao foi possivel carregar as categorias desta empresa.');
        }
      } finally {
        if (!cancelled) {
          setIsResolvingCategory(false);
        }
      }
    };

    resolveCategory();

    return () => {
      cancelled = true;
    };
  }, [open, categoryId, preferredCompanyId]);

  const showCategoryPicker = !categoryId && categoryOptions.length > 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col z-[10000] rounded-2xl border-none">
        <div className="bg-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Solicitar Orcamento
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-300">
                Preencha o formulario para receber contato das empresas mais aderentes ao seu projeto.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => handleClose(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto bg-slate-50 px-4 py-4 md:px-6 md:py-6">
          {categoryId ? (
            <LeadWizardEngine
              categoryId={categoryId}
              preferredCompanyId={preferredCompanyId}
            />
          ) : isResolvingCategory ? (
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Preparando formulario
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Estamos identificando a categoria ideal para esta solicitacao.
              </p>
            </div>
          ) : showCategoryPicker ? (
            <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Escolha a categoria do seu interesse
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Esta empresa atua em mais de uma vertical. Selecione a categoria para abrir o formulario correto.
              </p>
              <div className="mt-6 grid gap-3">
                {categoryOptions.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl px-4 py-6 text-left"
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.name || category.seo_url || `Categoria ${category.id}`}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Nao foi possivel abrir o formulario
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {categoryResolutionError || 'A categoria do wizard nao foi identificada para esta empresa. Tente novamente a partir da pagina da categoria.'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
