import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatCompanyRecommendations from '../chat/ChatCompanyRecommendations';

// Suprime erros de console gerados intencionalmente pelo ErrorBoundary
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ChatCompanyRecommendations', () => {
  const defaultProps = {
    comparisonList: [],
    onCompanyClick: jest.fn(),
    onRequestQuote: jest.fn(),
    onAddToComparison: jest.fn(),
    onRemoveFromComparison: jest.fn(),
    maxComparison: 4,
    onRequestPersonalizedSearch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza fallback do ErrorBoundary se metadata for undefined', () => {
    render(<ChatCompanyRecommendations {...defaultProps} metadata={undefined} />);
    expect(screen.getByText('Não foi possível carregar as recomendações no momento.')).toBeInTheDocument();
  });

  it('renderiza fallback do ErrorBoundary se metadata for null', () => {
    render(<ChatCompanyRecommendations {...defaultProps} metadata={null} />);
    expect(screen.getByText('Não foi possível carregar as recomendações no momento.')).toBeInTheDocument();
  });

  it('renderiza estado vazio quando metadata.companies não é array', () => {
    render(<ChatCompanyRecommendations {...defaultProps} metadata={{ companies: 'not-an-array' }} />);
    expect(screen.getByText(/Não encontramos empresas cadastradas para esse perfil na sua região/i)).toBeInTheDocument();
  });

  it('renderiza estado de "Nenhuma empresa encontrada" quando array está vazio', () => {
    render(<ChatCompanyRecommendations {...defaultProps} metadata={{ companies: [] }} />);
    expect(screen.getByText(/Não encontramos empresas cadastradas para esse perfil na sua região/i)).toBeInTheDocument();
  });

  it('renderiza cards de empresas corretamente quando os dados estão válidos', () => {
    const validMetadata = {
      companies: [
        {
          id: 1,
          name: 'Solar Tech BR',
          city: 'São Paulo',
          state: 'SP',
          rating_avg: 4.8,
          rating_count: 100,
          sponsored: true,
          verified: true,
        },
      ],
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);

    // Verifica elementos do card
    expect(screen.getByText('Solar Tech BR')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
    expect(screen.getByText('Destaque')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('permite solicitar orçamento e chama callback correto', () => {
    const validMetadata = {
      companies: [{ id: 42, name: 'Energia Boa', has_paid_plan: true, cta_visibility: { effective: { quote: true, whatsapp: false } } }],
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);

    const quoteBtn = screen.getByRole('button', { name: 'Solicitar orçamento' });
    fireEvent.click(quoteBtn);

    expect(defaultProps.onRequestQuote).toHaveBeenCalledWith(42);
  });

  it('oculta o orçamento para empresa Free patrocinada, sem prejudicar a comparação', () => {
    render(<ChatCompanyRecommendations {...defaultProps} metadata={{
      companies: [{ id: 77, name: 'Solar Free', sponsored: true, has_paid_plan: false,
        cta_visibility: { effective: { quote: true } } }],
    }} />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getByText('Solar Free')).toBeInTheDocument();
  });

  it('oculta orçamento para empresa paga quando entitlement não é retornado', () => {
    render(<ChatCompanyRecommendations {...defaultProps} metadata={{
      companies: [{ id: 78, name: 'Paga Sem Entitlement', has_paid_plan: true }],
    }} />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
  });

  it('renderiza múltiplos cards quando há várias empresas', () => {
    const validMetadata = {
      companies: [
        { id: 1, name: 'Empresa A' },
        { id: 2, name: 'Empresa B' },
        { id: 3, name: 'Empresa C' },
      ],
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);

    expect(screen.getByText('Empresa A')).toBeInTheDocument();
    expect(screen.getByText('Empresa B')).toBeInTheDocument();
    expect(screen.getByText('Empresa C')).toBeInTheDocument();
  });

  it('chama onAddToComparison ao clicar em Comparar em empresa não selecionada', () => {
    const validMetadata = {
      companies: [{ id: 10, name: 'Solar Prime', slug: 'solar-prime' }],
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);

    const compareBtn = screen.getByRole('checkbox', {
      name: /Adicionar Solar Prime à comparação/i,
    });
    fireEvent.click(compareBtn);

    expect(defaultProps.onAddToComparison).toHaveBeenCalledTimes(1);
    const payload = defaultProps.onAddToComparison.mock.calls[0][0];
    expect(payload.id).toBe(10);
    expect(payload.name).toBe('Solar Prime');
  });
});