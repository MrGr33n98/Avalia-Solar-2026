import { render, screen } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import CategoryCardMinimal from '@/components/CategoryCardMinimal';

const baseCategory = {
  id: 1,
  name: 'Recarga em Condomínios',
  short_description: 'Solução para condomínios',
  description: 'Solução para condomínios',
  seo_url: 'recarga-em-condominios',
  banner_url: '/images/banner-avalia-solar.png',
  companies_count: 8,
  products_count: 0,
  status: 'active',
  kind: 'standard',
  parent_id: null,
  logo: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as any;

describe('Category cards mobile image behavior', () => {
  it('CategoryCard usa object-cover no banner', () => {
    render(<CategoryCard category={baseCategory} layout="top" />);
    const img = screen.getByAltText(/Categoria:/i);
    expect(img).toHaveClass('object-cover');
  });

  it('CategoryCardMinimal usa object-cover no banner', () => {
    render(<CategoryCardMinimal category={baseCategory} />);
    const img = screen.getByAltText(baseCategory.name);
    expect(img).toHaveClass('object-cover');
  });
});