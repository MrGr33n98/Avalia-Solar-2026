import React from 'react';
import { render, screen } from '@testing-library/react';
import CompanyFinancing from '@/app/companies/[id]/components/CompanyFinancing';
import { Company } from '@/lib/api';

const mockCompany: Company = {
  id: 1,
  name: 'Teste Solar',
  description: 'Empresa de teste',
  website: '',
  phone: '',
  address: '',
  created_at: '',
  updated_at: '',
  banner_url: null,
  logo_url: null,
  state: '',
  city: '',
  financing_tab_visible: true,
  financing_profile: {
    title: 'Financiamento sob medida',
    subtitle: 'Simule parcelas e condições',
    disclaimer: 'Oferta sujeita a aprovação.',
    cta_label: 'Falar com especialista',
    currency: 'BRL',
    default_amount_cents: 5000000,
    default_down_payment_percent: 20,
    default_term_months: 60,
    default_interest_rate_monthly: 1.2,
    grace_months_enabled: true,
    max_grace_months: 6,
    amortization_type: 'price',
    show_bank_logos: true,
    show_fee_inputs: true,
    status: 'published',
  },
  financing_offers: [
    {
      id: 10,
      name: 'CDC Solar',
      offer_type: 'CDC',
      term_months: 48,
      interest_rate_monthly: 1.1,
      min_down_payment_percent: 10,
      grace_months: 3,
      amortization_type: 'price',
      notes: 'Parcela fixa',
      active: true,
      position: 0,
    },
  ],
  financing_partners: [
    {
      id: 5,
      name: 'Banco Solar',
      partner_type: 'Banco',
      website: 'https://example.com',
      priority: 1,
      position: 0,
      active: true,
      badge: 'Premium',
      logo_url: 'https://example.com/logo.png',
    },
  ],
};

describe('CompanyFinancing (novo)', () => {
  it('renderiza simulador e cards principais', () => {
    render(<CompanyFinancing company={mockCompany} />);

    expect(screen.getByText(/Financiamento sob medida/i)).toBeInTheDocument();
    expect(screen.getByText(/Parcela estimada/i)).toBeInTheDocument();
    expect(screen.getByText(/Bancos e parceiros/i)).toBeInTheDocument();
  });
});
