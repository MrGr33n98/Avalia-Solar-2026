import { fireEvent, render, screen } from '@testing-library/react';

import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/components/LocationSearch', () => ({
  __esModule: true,
  default: ({
    onLocationSelect,
  }: {
    onLocationSelect: (value: { state: string; city?: string }) => void;
  }) => (
    <button onClick={() => onLocationSelect({ state: 'SP', city: 'Sao Paulo' })}>
      select-location
    </button>
  ),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

describe('LandingHeroSearch', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('navigates to category page with location query when search is submitted', () => {
    render(
      <LandingHeroSearch
        categories={[
          { id: 1, name: 'Solar', seo_url: 'energia-solar-residencial' } as any,
          { id: 2, name: 'EV', seo_url: 'integracao-solar-ev' } as any,
        ]}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('select-location'));
    fireEvent.click(screen.getByRole('button', { name: /buscar empresas/i }));

    expect(pushMock).toHaveBeenCalledWith(
      '/categories/energia-solar-residencial?state=SP&city=Sao+Paulo'
    );
  });
});
