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
    comparedCompanyIds: [],
    onCompanyClick: jest.fn(),
    onRequestQuote: jest.fn(),
    onCompare: jest.fn(),
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

  it('renderiza fallback do ErrorBoundary se metadata.companies não for array (e falhar em array operations, mas no caso temos fallback textual para empty array se não crashar)', () => {
    // Com o código atual, se metadata.companies é string, Array.isArray(rawCompanies) é falso.
    // Assim hasCompanies = false, o que renderiza o estado vazio, sem quebrar! (Graças à nossa checagem).
    render(<ChatCompanyRecommendations {...defaultProps} metadata={{ companies: "not-an-array" }} />);
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
        }
      ]
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);
    
    // Verifica elementos do card
    expect(screen.getByText('Solar Tech BR')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
    expect(screen.getByText('Destaque')).toBeInTheDocument(); // Tag sponsored
  });
  
  it('permite solicitar orçamento e chama callback correto', () => {
    const validMetadata = {
      companies: [
        { id: 42, name: 'Energia Boa' }
      ]
    };

    render(<ChatCompanyRecommendations {...defaultProps} metadata={validMetadata} />);
    
    const quoteBtn = screen.getByRole('button', { name: /Quero Orçamento/i });
    fireEvent.click(quoteBtn);
    
    expect(defaultProps.onRequestQuote).toHaveBeenCalledWith(42);
  });
});
