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
      companies: [{ id: 42, name: 'Energia Boa' }],
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);

    const quoteBtn = screen.getByRole('button', { name: 'Solicitar orçamento' });
    fireEvent.click(quoteBtn);

    expect(defaultProps.onRequestQuote).toHaveBeenCalledWith(42);
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

    const compareBtn = screen.getByRole('button', {
      name: /Adicionar Solar Prime à comparação/i,
    });
    fireEvent.click(compareBtn);

    expect(defaultProps.onAddToComparison).toHaveBeenCalledTimes(1);
    const payload = defaultProps.onAddToComparison.mock.calls[0][0];
    expect(payload.id).toBe(10);
    expect(payload.name).toBe('Solar Prime');
  });
});