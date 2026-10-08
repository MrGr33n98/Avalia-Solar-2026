import { render, screen } from '@testing-library/react';
import type { ImageProps } from 'next/image';

import { CompanyLogo } from '@/components/CompanyLogo';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: ImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : src.src} alt={alt} {...props} />
  ),
}));

describe('CompanyLogo', () => {
  it('exibe o primeiro selo com imagem associado à empresa quando showAchievementBadge e true', () => {
    render(
      <CompanyLogo
        name="GoodWe Brasil"
        logoUrl="/images/goodwe.png"
        badges={[
          { name: 'Selo sem imagem', image_url: null },
          { name: 'Top Brand 2026', image_url: '/images/top-brand.png' },
        ]}
        showAchievementBadge={true}
      />
    );

    expect(screen.getByTestId('company-achievement-badge')).toHaveAttribute(
      'title',
      'Top Brand 2026'
    );
    expect(screen.getByRole('img', { name: 'Top Brand 2026' })).toBeInTheDocument();
  });

  it('não exibe selo sobreposto por padrão (showAchievementBadge=false)', () => {
    render(
      <CompanyLogo
        name="GoodWe Brasil"
        logoUrl="/images/goodwe.png"
        badges={[{ name: 'Top Brand 2026', image_url: '/images/top-brand.png' }]}
      />
    );

    expect(screen.queryByTestId('company-achievement-badge')).not.toBeInTheDocument();
  });

  it('não cria selo quando a empresa não possui selo com imagem', () => {
    render(
      <CompanyLogo
        name="Empresa sem selo"
        logoUrl="/images/company.png"
        badges={[{ name: 'Selo sem imagem', image_url: null }]}
        showAchievementBadge={true}
      />
    );

    expect(screen.queryByTestId('company-achievement-badge')).not.toBeInTheDocument();
  });
});
