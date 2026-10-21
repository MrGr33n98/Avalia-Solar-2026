import React from 'react';
import { render, screen } from '@testing-library/react';
import { CompanyReviewsSummarySheet } from './CompanyReviewsSummarySheet';

describe('CompanyReviewsSummarySheet — Invariantes de Reputação e UX Mobile', () => {
  it('exibe estado vazio honesto quando empresa tem 0 avaliações, ignorando dados fantasmas', () => {
    render(
      <CompanyReviewsSummarySheet
        isOpen={true}
        onOpenChange={jest.fn()}
        companyName="Growatt Brasil"
        ratingAvg={null}
        ratingCount={0}
        // Simula bug do backend enviando 100% positivo e 100% recomendação para 0 reviews:
        sentiment={{ positive: 100, neutral: 0, negative: 0 }}
        recommendationRate={100}
        reviewsPath="/companies/growatt-brasil#reviews"
        reviewActionPath="/companies/growatt-brasil#review"
      />
    );

    // Deve exibir o cabeçalho correto
    expect(screen.getByText('Growatt Brasil')).toBeInTheDocument();
    expect(screen.getByText('Avaliações da comunidade')).toBeInTheDocument();

    // Deve exibir o estado vazio e convite para avaliar
    expect(screen.getByText('Ainda não há avaliações')).toBeInTheDocument();
    expect(
      screen.getByText(/Sua experiência pode ajudar outras pessoas a escolher/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avaliar esta empresa/i })).toBeInTheDocument();

    // NUNCA deve exibir dados falsos de sentimento ou recomendação
    expect(screen.queryByText(/100% dos clientes recomendam/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Positivo')).not.toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.queryByText(/avaliações registradas/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver todas as avaliações/i })).not.toBeInTheDocument();
  });

  it('exibe métricas reais auditadas quando a empresa possui avaliações publicadas', () => {
    render(
      <CompanyReviewsSummarySheet
        isOpen={true}
        onOpenChange={jest.fn()}
        companyName="Growatt Brasil"
        ratingAvg={4.8}
        ratingCount={24}
        sentiment={{ positive: 85, neutral: 10, negative: 5 }}
        recommendationRate={92}
        reviewsPath="/companies/growatt-brasil#reviews"
      />
    );

    // Deve exibir nota média e total
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('24 avaliações registradas')).toBeInTheDocument();

    // Deve exibir sentimento real
    expect(screen.getByText('Sentimento das avaliações')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();

    // Deve exibir recomendação real
    expect(screen.getByText('Recomendação')).toBeInTheDocument();
    expect(screen.getByText(/92%/i)).toBeInTheDocument();
    expect(screen.getByText(/dos clientes recomendam/i)).toBeInTheDocument();

    // Deve exibir CTA para ver todas as avaliações
    expect(screen.getByRole('link', { name: /Ver todas as avaliações/i })).toBeInTheDocument();
  });
});
