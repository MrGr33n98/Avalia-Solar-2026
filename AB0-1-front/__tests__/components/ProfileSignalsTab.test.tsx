import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileSignalsTab from '@/app/dashboard/components/intent/ProfileSignalsTab';
import {
  type BuyerIntentAccount,
  type BuyerIntentReportingData,
  EMPTY_REPORTING_DATA,
} from '@/lib/api/buyer-intent';

const mockAccounts: BuyerIntentAccount[] = [
  {
    id: 'acc-1',
    company_id: 10,
    account_name: 'SolarTech Integradores SP',
    location: 'São Paulo, SP',
    segment: 'Integrador Comercial',
    buying_stage: 'decision',
    activity_level: 'high',
    total_score: 95,
    direct_pageviews: 18,
    competitive_pageviews: 4,
    unique_visitors: 3,
    intent_level: 'immediate',
    thermometer: '🚨',
    recommended_action: 'Contato Imediato via WhatsApp',
    sla_window: '15min',
    last_interaction_at: new Date().toISOString(),
    confidence_score: 0.95,
    signals_count: 24,
    hot_signals_count: 5,
    pageviews_breakdown: { profile: 14, pricing: 4, compare: 4, category: 2, contact: 3 },
  },
  {
    id: 'acc-2',
    company_id: 10,
    account_name: 'Usina Verde Rural',
    location: 'Ribeirão Preto, SP',
    segment: 'Solar Rural',
    buying_stage: 'consideration',
    activity_level: 'medium',
    total_score: 62,
    direct_pageviews: 7,
    competitive_pageviews: 8,
    unique_visitors: 1,
    intent_level: 'warm',
    thermometer: '⚡',
    recommended_action: 'Enviar Portfólio de Usinas',
    sla_window: '24h',
    last_interaction_at: new Date().toISOString(),
    confidence_score: 0.8,
    signals_count: 12,
    hot_signals_count: 1,
    pageviews_breakdown: { profile: 7, pricing: 0, compare: 8, category: 5, contact: 0 },
  },
  {
    id: 'acc-3',
    company_id: 10,
    account_name: 'Empresa Apenas Categoria (Sem Visita ao Perfil)',
    location: 'Belo Horizonte, MG',
    segment: 'Comercial',
    buying_stage: 'awareness',
    activity_level: 'low',
    total_score: 25,
    direct_pageviews: 0,
    competitive_pageviews: 6,
    unique_visitors: 1,
    intent_level: 'cold',
    thermometer: '❄️',
    recommended_action: 'Campanha de Reconhecimento',
    sla_window: '7d',
    last_interaction_at: new Date().toISOString(),
    confidence_score: 0.5,
    signals_count: 6,
    hot_signals_count: 0,
    pageviews_breakdown: { profile: 0, pricing: 0, compare: 6, category: 6, contact: 0 },
  },
];

const mockReporting: BuyerIntentReportingData = {
  ...EMPTY_REPORTING_DATA,
  traffic_ratio: {
    direct_pageviews: 25,
    competitive_pageviews: 18,
    total_intent_signals: 42,
  },
};

describe('ProfileSignalsTab', () => {
  it('renders module header and only accounts with profile visits', () => {
    const handleSelect = jest.fn();
    render(
      <ProfileSignalsTab
        accounts={mockAccounts}
        reportingData={mockReporting}
        days="30d"
        companyName="Solar Premium Brasil"
        onSelectAccount={handleSelect}
      />
    );

    // Deve exibir o título e contexto do G2
    expect(screen.getByText('Visitantes do Perfil da Empresa')).toBeInTheDocument();
    expect(screen.getByText(/Buyer Activity · Profile Signals/i)).toBeInTheDocument();

    // Deve conter as contas que visitaram o perfil
    expect(screen.getByText('SolarTech Integradores SP')).toBeInTheDocument();
    expect(screen.getByText('Usina Verde Rural')).toBeInTheDocument();

    // NÃO deve exibir a conta que só pesquisou categoria sem visitar o perfil
    expect(
      screen.queryByText('Empresa Apenas Categoria (Sem Visita ao Perfil)')
    ).not.toBeInTheDocument();
  });

  it('filters by search term correctly', () => {
    render(
      <ProfileSignalsTab
        accounts={mockAccounts}
        reportingData={mockReporting}
        days="30d"
        onSelectAccount={jest.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar conta ou localização no perfil.../i);
    fireEvent.change(searchInput, { target: { value: 'Ribeirão' } });

    expect(screen.getByText('Usina Verde Rural')).toBeInTheDocument();
    expect(screen.queryByText('SolarTech Integradores SP')).not.toBeInTheDocument();
  });

  it('triggers onSelectAccount when clicking on a table row', () => {
    const handleSelect = jest.fn();
    render(
      <ProfileSignalsTab
        accounts={mockAccounts}
        reportingData={mockReporting}
        days="30d"
        onSelectAccount={handleSelect}
      />
    );

    const accountRow = screen.getByText('SolarTech Integradores SP');
    fireEvent.click(accountRow);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockAccounts[0]);
  });
});
