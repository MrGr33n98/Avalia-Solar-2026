'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PackageSearch, Store, Layers, Lightbulb } from 'lucide-react';
import type { CompanyCatalogResponse } from '@/lib/api';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { buildCompanyPath } from '@/lib/slug';
import { trackCompanyCategoryEmptyViewed, trackCompanyCategoryQuoteStarted } from '@/lib/analytics/company-category';
import { CategorySuggestionChip } from './CategorySuggestionChip';
import { CompanyMiniCard } from './CompanyMiniCard';

interface SmartEmptyCatalogProps {
  catalog: CompanyCatalogResponse;
  favorites: Set<number>;
  onToggleFavorite: (id: number) => void;
}

export function SmartEmptyCatalog({ catalog, favorites, onToggleFavorite }: SmartEmptyCatalogProps) {
  const company = catalog.company;
  const category = catalog.category;
  const suggestedProducts = catalog.suggested_products || [];
  const relatedCategories = catalog.related_categories || [];
  const similarCompanies = catalog.similar_companies || [];
  const companyPath = buildCompanyPath(company.slug, company.name, company.id);

  const hasSuggestions = suggestedProducts.length > 0 || relatedCategories.length > 0 || similarCompanies.length > 0;

  useEffect(() => {
    trackCompanyCategoryEmptyViewed({
      company_id: company.id,
      company_name: company.name,
      category_id: category.id,
      category_name: category.name,
      has_suggestions: hasSuggestions,
      suggestion_count: suggestedProducts.length + relatedCategories.length + similarCompanies.length,
    });
  }, [company.id, company.name, category.id, category.name, hasSuggestions, suggestedProducts.length, relatedCategories.length, similarCompanies.length]);

  const handleQuoteClick = () => {
    trackCompanyCategoryQuoteStarted({
      company_id: company.id,
      company_name: company.name,
      category_id: category.id,
      category_name: category.name,
      source: 'company-category-empty-catalog',
    });
    openQuoteWizard({
      preferredCompanyId: company.id,
      source: 'company-category-empty-catalog',
    });
  };

  return (
    <div className="space-y-10">
      <section className="border border-slate-300 bg-white p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <PackageSearch className="h-7 w-7 text-[#0B1F4B]" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-[#0B1F4B]">
          {category.name}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          A <strong className="text-slate-900">{company.name}</strong> ainda não publicou produtos
          ou serviços em <strong className="text-slate-900">{category.name}</strong>.
          {!hasSuggestions
            ? ' Solicite um orçamento personalizado e seja avisado quando novas opções estiverem disponíveis.'
            : ' Enquanto isso, confira as opções abaixo.'}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleQuoteClick}
            className="inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#0B1F4B] px-6 text-sm font-semibold text-white hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Solicitar orçamento para {category.name}
          </button>
          <Link
            href={companyPath}
            className="inline-flex min-h-11 items-center justify-center rounded-[2px] border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar para {company.name}
          </Link>
        </div>
      </section>

      {suggestedProducts.length > 0 && (
        <section aria-labelledby="suggested-products-title">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 id="suggested-products-title" className="text-lg font-bold text-[#0B1F4B]">
              Outros produtos da {company.name}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {suggestedProducts.map((product) => (
              <ProductCardEnhanced
                key={product.id}
                product={product}
                favorite={favorites.has(product.id)}
                onToggleFavorite={() => onToggleFavorite(product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {relatedCategories.length > 0 && (
        <section aria-labelledby="related-categories-title">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 id="related-categories-title" className="text-lg font-bold text-[#0B1F4B]">
              Explore outras categorias da {company.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {relatedCategories.map((relatedCategory) => (
              <CategorySuggestionChip
                key={relatedCategory.id}
                category={relatedCategory}
                companySlug={company.slug}
                companyName={company.name}
              />
            ))}
          </div>
        </section>
      )}

      {similarCompanies.length > 0 && (
        <section aria-labelledby="similar-companies-title">
          <div className="mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 id="similar-companies-title" className="text-lg font-bold text-[#0B1F4B]">
              Outras empresas com {category.name}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarCompanies.map((similarCompany) => (
              <CompanyMiniCard key={similarCompany.id} company={similarCompany} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
