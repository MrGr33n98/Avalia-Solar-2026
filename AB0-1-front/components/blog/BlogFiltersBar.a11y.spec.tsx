import { render, screen } from '@testing-library/react';
import { BlogFiltersBar } from './BlogFiltersBar';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/blog',
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(''),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

describe('BlogFiltersBar accessibility', () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    window.cancelAnimationFrame = jest.fn();
  });

  it('uses category filter buttons without orphaned tab aria-controls', () => {
    render(
      <BlogFiltersBar
        categories={[
          { id: 12, name: 'Energia Solar', articles_count: 8, count: 8 },
        ]}
      />
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    const allButton = screen.getByRole('button', { name: 'Tudo' });
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
    expect(allButton).not.toHaveAttribute('aria-controls');

    const categoryButton = screen.getByRole('button', { name: /Energia Solar/i });
    expect(categoryButton).toHaveAttribute('aria-pressed', 'false');
    expect(categoryButton).not.toHaveAttribute('aria-controls');
  });

  it('labels search and sort controls with specific accessible names', () => {
    render(<BlogFiltersBar categories={[]} />);

    expect(screen.getByLabelText('Buscar artigos')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Filtrar posts por ordem de mais recentes')
    ).toBeInTheDocument();
  });
});
