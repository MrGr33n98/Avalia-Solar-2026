import { act, fireEvent, render, screen } from '@testing-library/react';
import CompanyHeroCarousel from './CompanyHeroCarousel';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid="slide-image" {...props} />
  ),
}));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));

const slides = [1, 2, 3].map((id) => ({
  id, slot: id, position: id, image_url: `https://example.com/${id}.webp`,
  width: 1920, height: 600, alt_text: `Banner de teste ${id}`,
}));

const props = {
  companyId: 100,
  companyName: 'Solar Teste',
  carousel: { version: 1, enabled: true, slides },
};

describe('CompanyHeroCarousel', () => {
  it('não introduz dots/barras e preserva a proporção', () => {
    const { container } = render(<CompanyHeroCarousel {...props} />);
    const frame = screen.getByTestId('company-hero-carousel');
    expect(frame).toHaveStyle({ aspectRatio: '1920 / 600' });
    expect(frame.querySelector('progress')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label*="indicador"]')).not.toBeInTheDocument();
    expect(screen.getByAltText('Banner de teste 1')).toBeInTheDocument();
  });

  it('permite navegar por setas sem alterar dimensões', () => {
    render(<CompanyHeroCarousel {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo banner' }));
    expect(screen.getByAltText('Banner de teste 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Banner anterior' }));
    expect(screen.getByAltText('Banner de teste 1')).toBeInTheDocument();
  });

  it('nunca gira um único slide, nem mostra controles desnecessários', () => {
    render(<CompanyHeroCarousel {...props} carousel={{ ...props.carousel, slides: slides.slice(0, 1) }} />);
    expect(screen.queryByRole('button', { name: /banner/i })).not.toBeInTheDocument();
  });

  it('respeita reduced-motion sem autoplay', () => {
    jest.useFakeTimers();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    } as unknown as MediaQueryList);
    render(<CompanyHeroCarousel {...props} />);
    act(() => { jest.advanceTimersByTime(18_000); });
    expect(screen.getByAltText('Banner de teste 1')).toBeInTheDocument();
    jest.useRealTimers();
  });
});
