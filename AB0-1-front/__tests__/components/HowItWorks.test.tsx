import { fireEvent, render, screen } from '@testing-library/react';
import HowItWorks from '@/components/landing/HowItWorks';

describe('HowItWorks', () => {
  it('shows the testimonial image and comparison CTA', () => {
    render(<HowItWorks />);

    expect(screen.getByAltText(/Depoimentos de usuários/i)).toHaveAttribute(
      'src',
      expect.stringContaining('depoimentos-avalia-solar.png')
    );
    expect(screen.getByRole('link', { name: /Comparar empresas/i })).toHaveAttribute(
      'href',
      '/compare'
    );
  });

  it('changes slide using the carousel controls', () => {
    render(<HowItWorks />);

    expect(screen.getByText('Compare antes de decidir.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo slide' }));
    expect(screen.getByText('Decida com a ajuda de quem já contratou.')).toBeInTheDocument();
  });
});
