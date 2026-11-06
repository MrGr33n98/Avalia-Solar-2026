#!/usr/bin/env node
/**
 * CDSI-028: Relatório auditável de diferença de indexabilidade de categorias (shadow vs enforced).
 * Operação 100% READ-ONLY: consulta GET /api/v1/categories (ou lê snapshot JSON) e emite JSON/resumo.
 */

const apiBaseUrl = (
  process.env.API_URL_INTERNAL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api/v1'
).replace(/\/+$/, '');

const VALID_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_SUBSTANTIVE_DESCRIPTION_LENGTH = 70;

function stripHtml(text = '') {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function evaluateCategory(category) {
  const slug = String(category?.seo_url || category?.slug || '').trim().toLowerCase();
  const status = String(category?.status || 'active');
  const name = String(category?.name || '').trim().toLowerCase();

  if (status !== 'active') {
    return {
      id: category?.id ?? null,
      slug,
      name: category?.name ?? null,
      status,
      shadow_indexable: false,
      enforced_indexable: false,
      divergent: false,
      warnings: ['inactive'],
    };
  }

  if (!slug || slug.length > 160 || !VALID_SLUG_REGEX.test(slug)) {
    return {
      id: category?.id ?? null,
      slug,
      name: category?.name ?? null,
      status,
      shadow_indexable: false,
      enforced_indexable: false,
      divergent: false,
      warnings: ['invalid_slug'],
    };
  }

  const descriptions = [
    category?.description,
    category?.short_description,
    category?.seo_description,
  ]
    .map(stripHtml)
    .filter(Boolean);

  const hasSubstantiveCopy = descriptions.some(
    (d) => d.length >= MIN_SUBSTANTIVE_DESCRIPTION_LENGTH && d.toLowerCase() !== name
  );
  const companiesCount = Number(category?.companies_count || 0);
  const productsCount = Number(category?.products_count || 0);
  const faqsCount = Array.isArray(category?.faqs) ? category.faqs.length : 0;
  const solutionsCount = Array.isArray(category?.solution_types)
    ? category.solution_types.length
    : 0;

  const warnings = [];
  if (!hasSubstantiveCopy) warnings.push('thin_editorial_copy');
  const hasUtility =
    hasSubstantiveCopy ||
    companiesCount > 0 ||
    productsCount > 0 ||
    faqsCount > 0 ||
    solutionsCount > 0;
  if (!hasUtility) warnings.push('empty_without_editorial_utility');

  const shadowIndexable = true;
  const enforcedIndexable = !warnings.includes('empty_without_editorial_utility');

  return {
    id: category?.id ?? null,
    slug,
    name: category?.name ?? null,
    status,
    companies_count: companiesCount,
    shadow_indexable: shadowIndexable,
    enforced_indexable: enforcedIndexable,
    divergent: shadowIndexable !== enforcedIndexable,
    warnings,
  };
}

async function main() {
  const endpoint = `${apiBaseUrl}/categories?per_page=500`;
  let records = [];

  try {
    const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${endpoint}`);
    }
    const payload = await res.json();
    records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  } catch (err) {
    console.error(`[indexability_diff] Aviso: falha ao consultar ${endpoint}: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const evaluations = records.map(evaluateCategory);
  const summary = {
    generated_at: new Date().toISOString(),
    endpoint,
    total_categories: evaluations.length,
    shadow_indexable_count: evaluations.filter((e) => e.shadow_indexable).length,
    enforced_indexable_count: evaluations.filter((e) => e.enforced_indexable).length,
    divergent_count: evaluations.filter((e) => e.divergent).length,
    thin_copy_count: evaluations.filter((e) => e.warnings.includes('thin_editorial_copy')).length,
    divergent_categories: evaluations.filter((e) => e.divergent),
    all_categories: evaluations,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();

