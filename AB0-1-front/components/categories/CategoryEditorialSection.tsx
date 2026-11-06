import Link from 'next/link';
import type { Category } from '@/lib/api';
import {
  resolveCategoryCanonicalPath,
  resolveCategoryCanonicalSlug,
} from '@/lib/seo/category-metadata';
import { sanitizeEditorialHtml } from '@/lib/seo/category-schema';

interface CategoryEditorialSectionProps {
  category: Category;
  eligibleCompaniesCount: number;
  fallbackSlug?: string;
}

/**
 * CDSI-053 / CDSI-054 / CDSI-061 / CDSI-096:
 * Seção editorial Server-Side (SSR) específica da categoria, com H2 semântico,
 * corpo sanitizado, tipos de solução reais e links contextuais verificados.
 * Substitui o antigo AnswerBlock genérico fixo.
 */
export default function CategoryEditorialSection({
  category,
  eligibleCompaniesCount,
  fallbackSlug,
}: CategoryEditorialSectionProps) {
  const canonicalSlug = resolveCategoryCanonicalSlug(category, fallbackSlug);
  const canonicalPath = resolveCategoryCanonicalPath(category, fallbackSlug);
  const sanitizedDescription = sanitizeEditorialHtml(
    category.description || category.short_description || ''
  );
  const solutions = Array.isArray(category.solution_types) ? category.solution_types : [];
  const subcategories = Array.isArray(category.subcategories)
    ? category.subcategories.filter((sub) => !sub.status || sub.status === 'active')
    : [];

  return (
    <section
      id="editorial-category-guide"
      aria-labelledby="editorial-category-heading"
      className="border-t border-slate-200/80 bg-white py-10 md:py-14"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="max-w-4xl space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Guia Técnico e Escopo da Categoria
            </p>
            <h2
              id="editorial-category-heading"
              className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl"
            >
              Sobre {category.name}
            </h2>
          </div>

          {sanitizedDescription ? (
            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 md:text-base"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          ) : (
            <p className="text-sm leading-relaxed text-slate-700 md:text-base">
              Consulte fornecedores e empresas especializadas em {category.name.toLowerCase()}{' '}
              com atuação verificada, histórico de avaliações reais e especificações técnicas
              comparáveis no Avalia Solar.
            </p>
          )}

          <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Empresas elegíveis listadas
              </dt>
              <dd className="mt-1 text-lg font-extrabold text-slate-950">
                {eligibleCompaniesCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categoria canônica
              </dt>
              <dd className="mt-1 text-sm font-bold text-slate-900">{category.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Critério de listagem
              </dt>
              <dd className="mt-1 text-xs font-medium text-slate-600">
                Cadastro ativo, escopo compatível e avaliações auditadas
              </dd>
            </div>
          </dl>

          {solutions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-lg font-bold text-slate-900">
                Modalidades e tecnologias em {category.name}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {solutions.slice(0, 6).map((solution) => (
                  <div
                    key={solution.id || solution.slug}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <h4 className="text-sm font-bold text-slate-900">{solution.name}</h4>
                    {(solution.short_description || solution.description) && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {solution.short_description || solution.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-1">
                <Link
                  href={`${canonicalPath}/solutions`}
                  className="inline-flex items-center text-xs font-bold text-blue-700 hover:underline"
                >
                  Explorar especificações das soluções de {category.name} →
                </Link>
              </div>
            </div>
          )}

          {subcategories.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Subcategorias relacionadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => {
                  const subSlug = sub.seo_url || sub.slug;
                  if (!subSlug) return null;
                  return (
                    <Link
                      key={sub.id || subSlug}
                      href={`/categories/${subSlug}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                    >
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>
              URL canônica:{' '}
              <Link
                href={`/categories/${canonicalSlug}`}
                className="font-semibold text-slate-700 hover:text-blue-700"
              >
                /categories/{canonicalSlug}
              </Link>
            </span>
            {category.parent?.name && (category.parent.seo_url || category.parent.slug) && (
              <span>
                Categoria principal:{' '}
                <Link
                  href={`/categories/${category.parent.seo_url || category.parent.slug}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {category.parent.name}
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

