export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const buildCompanySlug = (
  slug?: string | null,
  name?: string | null,
  fallbackId?: number | string
): string => {
  const base = slugify(slug || name || '');
  if (base) return base;
  return fallbackId ? String(fallbackId) : '';
};

export const buildCompanyPath = (
  slug?: string | null,
  name?: string | null,
  fallbackId?: number | string
): string => {
  return `/companies/${buildCompanySlug(slug, name, fallbackId)}`;
};

export const buildCompanySubPath = (
  slug: string | null | undefined,
  name: string | null | undefined,
  suffix: string,
  fallbackId?: number | string
): string => {
  return `${buildCompanyPath(slug, name, fallbackId)}/${suffix}`;
};

export const buildProductPath = (
  id?: number | string | null,
  name?: string | null
): string => {
  const base = slugify(name || String(id || 'produto'));
  return `/products/${id}-${base}`;
};

export const buildCategoryPath = (seo?: string | null, id?: number | string): string => {
  const slug = seo ? String(seo).replace(/^\/+/, '') : String(id ?? '');
  return `/categories/${slug}`;
};
