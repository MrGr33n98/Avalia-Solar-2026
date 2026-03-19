export type BrandContext = {
  brand_id?: number | string;
  brand_slug?: string;
};

export function resolveBrandContext(product: any): BrandContext {
  if (!product) return {};

  const brandId = product.brand_id ?? product.brand?.id;
  const brandSlug = product.brand_slug ?? product.brand?.slug;

  return {
    ...(brandId ? { brand_id: brandId } : {}),
    ...(brandSlug ? { brand_slug: brandSlug } : {})
  };
}
