import { render, screen } from '@testing-library/react';
import ClaimProfileCard from '@/app/companies/[id]/components/ClaimProfileCard';
import ClaimCompanyCard from '@/app/companies/[id]/components/ClaimCompanyCard';
import type { Company } from '@/lib/api';

const company = {
  id: 925,
  slug: 'integrador-solar-exemplo',
  name: 'Integrador Solar Exemplo',
  city: 'Cuiabá',
  state: 'MT',
  verified: true,
  has_paid_plan: true,
  claimed: false,
} as Company;

describe('company claim cards', () => {
  it('does not confuse verification or paid plan with an active claim', () => {
    render(<ClaimProfileCard company={company} />);
    expect(screen.getByRole('link', { name: /reivindicar perfil grátis/i })).toHaveAttribute(
      'href',
      '/companies/925/claim'
    );
  });

  it('shows managed state and hides claim action only for an active claimed profile', () => {
    const claimedCompany = { ...company, claimed: true };
    const { rerender } = render(<ClaimProfileCard company={claimedCompany} />);
    expect(screen.getByText('Perfil gerenciado')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /reivindicar perfil grátis/i })
    ).not.toBeInTheDocument();

    rerender(<ClaimCompanyCard company={claimedCompany} />);
    expect(
      screen.queryByRole('link', { name: /reivindicar perfil grátis/i })
    ).not.toBeInTheDocument();
  });
});
