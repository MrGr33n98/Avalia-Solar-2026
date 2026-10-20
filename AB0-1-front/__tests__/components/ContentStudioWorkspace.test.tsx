import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContentStudioWorkspace from '@/app/dashboard/components/content-studio/ContentStudioWorkspace';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock WidgetBadge component
jest.mock('@/app/dashboard/components/WidgetBadge', () => {
  return function DummyWidgetBadge(props: any) {
    return (
      <div data-testid="widget-badge-mock">
        <span>Mocked WidgetBadge: {props.companyData?.name}</span>
        <span>Style: {props.style}</span>
        <span>Theme: {props.theme}</span>
      </div>
    );
  };
});

describe('ContentStudioWorkspace Component', () => {
  const mockCompany = {
    id: '123',
    name: 'SolarTech Energia 2026',
    slug: 'solartech-energia-2026',
    verified: true,
    trust_score: 96,
    rating_avg: 4.9,
    reviews_count: 54,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renderiza o header principal e as 3 abas de navegacao do Content Studio', () => {
    render(<ContentStudioWorkspace company={mockCompany} companyId="123" />);

    expect(screen.getByText('Selos de Autoridade & Prova Social')).toBeInTheDocument();
    expect(screen.getByText(/Content Studio & Marketing Collateral/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Selos Oficiais 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Widget Interativo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Biblioteca de Relatórios/i })).toBeInTheDocument();
  });

  it('exibe os 4 tipos de selos oficiais e preview dinamico com dados da empresa', () => {
    render(<ContentStudioWorkspace company={mockCompany} companyId="123" />);

    // Verifica que os 4 tipos de selo estao visiveis
    expect(screen.getAllByText('Empresa Recomendada 2026').length).toBeGreaterThan(0);
    expect(screen.getByText('Integrador Verificado 2026')).toBeInTheDocument();
    expect(screen.getByText('Líder em Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Top Performance Solar')).toBeInTheDocument();

    // Verifica nome da empresa e metricas no preview
    const companyNames = screen.getAllByText('SolarTech Energia 2026');
    expect(companyNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trust Score: 96%/i).length).toBeGreaterThan(0);
  });

  it('gera snippet com link rastreavel UTM para alimentar os sinais de visitantes', () => {
    render(<ContentStudioWorkspace company={mockCompany} companyId="123" />);

    const codeSnippetMatches = screen.getAllByText(/utm_source=trust_badge/i);
    expect(codeSnippetMatches.length).toBeGreaterThan(0);
    expect(codeSnippetMatches[0].textContent).toContain('utm_medium=embed');
    expect(codeSnippetMatches[0].textContent).toContain('utm_campaign=selo_2026');
  });

  it('permite alternar para a aba Widget Interativo e exibe controles de customizacao', () => {
    render(<ContentStudioWorkspace company={mockCompany} companyId="123" />);

    const widgetTabButton = screen.getByRole('button', { name: /Widget Interativo/i });
    fireEvent.click(widgetTabButton);

    expect(screen.getByText('Personalização do Widget Interativo')).toBeInTheDocument();
    expect(screen.getByTestId('widget-badge-mock')).toBeInTheDocument();
    expect(screen.getByText(/Mocked WidgetBadge: SolarTech Energia 2026/i)).toBeInTheDocument();
  });

  it('permite alternar para a aba Biblioteca de Relatorios (G2-inspired)', () => {
    render(<ContentStudioWorkspace company={mockCompany} companyId="123" />);

    const reportsTabButton = screen.getByRole('button', { name: /Biblioteca de Relatórios/i });
    fireEvent.click(reportsTabButton);

    expect(screen.getByText('Biblioteca de Relatórios e Certificados Digitais')).toBeInTheDocument();
    expect(screen.getByText(/Certificado de Idoneidade Técnica 2026 \(PDF\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Pacote de Selos em Alta Resolução/i)).toBeInTheDocument();
    expect(screen.getByText(/Diretrizes de Co-Branding/i)).toBeInTheDocument();
  });

  it('copia o codigo HTML ao clicar no botao Copiar Codigo', async () => {
    render(<ContentStudioWorkspace company={mockCompany} companyId="123" />);

    const copyButtons = screen.getAllByRole('button', { name: /Copiar Código/i });
    expect(copyButtons.length).toBeGreaterThan(0);
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
