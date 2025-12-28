export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const buildCompanySlug = (id: number | string, name?: string | null): string => {
  const base = name ? slugify(name) : '';
  return base ? `${id}-${base}` : String(id);
};

export const buildCompanyPath = (id: number | string, name?: string | null): string => {
  return `/companies/${buildCompanySlug(id, name)}`;
};

export const buildCompanySubPath = (
  id: number | string,
  name: string | null | undefined,
  suffix: string
): string => {
  return `${buildCompanyPath(id, name)}/${suffix}`;
};

export const parseIdFromSlug = (value: string): number | null => {
  const idPart = value.split('-')[0];
  const parsed = parseInt(idPart, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const buildCategoryPath = (seo?: string | null, id?: number | string): string => {
  const slug = seo ? String(seo).replace(/^\/+/, '') : String(id ?? '');
  return `/categories/${slug}`;
};
