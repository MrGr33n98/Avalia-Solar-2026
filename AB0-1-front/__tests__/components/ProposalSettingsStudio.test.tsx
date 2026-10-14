import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProposalSettingsStudio } from '@/components/company-dashboard/proposals/ProposalSettingsStudio';
import { companyProposalSettingsApi } from '@/lib/api';

// Mock do contexto de empresa
jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: () => ({
    activeCompany: {
      id: 1,
      name: 'Love Solar Teste',
      document: '12.345.678/0001-90',
    },
  }),
}));

// Mock da API de configurações backend
jest.mock('@/lib/api', () => ({
  companyProposalSettingsApi: {
    get: jest.fn().mockResolvedValue({
      id: 1,
      company_id: 1,
      selected_pdf_model: 'modelo_1',
      pdf_colors: { primary: '#0066FF', secondary: '#0F172A', accent: '#F6E85A' },
      cover_image_option: 'solar_ceu',
      pdf_sections: [],
      payment_conditions: [],
      pricing_tiers: [],
      digital_sections: [],
    }),
    update: jest.fn().mockResolvedValue({
      id: 1,
      company_id: 1,
      selected_pdf_model: 'modelo_1',
    }),
  },
}));

describe('ProposalSettingsStudio (Enterprise A+++ Configurações)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renderiza título principal, abas de topo e seções do menu lateral', () => {
    render(<ProposalSettingsStudio />);

    expect(screen.getByRole('heading', { level: 1, name: 'Configurações' })).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Definições de propostas')).toBeInTheDocument();

    // Menu lateral
    expect(screen.getByText('Geral')).toBeInTheDocument();
    expect(screen.getByText('Mão de obra')).toBeInTheDocument();
    expect(screen.getByText('Condições de pagamento')).toBeInTheDocument();
    expect(screen.getByText('Proposta PDF')).toBeInTheDocument();
    expect(screen.getByText('Proposta Digital')).toBeInTheDocument();
  });

  it('exibe tela de Configurações Proposta PDF por padrão com botão Definir Modelo da Proposta', () => {
    render(<ProposalSettingsStudio />);

    expect(screen.getByText('Configurações Proposta PDF')).toBeInTheDocument();
    expect(screen.getByText('Definir Modelo da Proposta')).toBeInTheDocument();
    expect(screen.getByText(/Cores.*proposta PDF/i)).toBeInTheDocument();
    expect(screen.getByText('Imagem de capa')).toBeInTheDocument();
    expect(screen.getByText('Sobre a empresa')).toBeInTheDocument();
    expect(screen.getByText('Imagens de obras')).toBeInTheDocument();
  });

  it('abre o drawer lateral direito ao clicar em Definir Modelo da Proposta e exibe Modelo 1, 2 e 3', () => {
    render(<ProposalSettingsStudio />);

    const openDrawerBtn = screen.getByText('Definir Modelo da Proposta');
    fireEvent.click(openDrawerBtn);

    expect(screen.getByText(/Escolha o modelo d[ae] proposta/i)).toBeInTheDocument();
    expect(screen.getByText('Modelo 1')).toBeInTheDocument();
    expect(screen.getByText('Modelo 2')).toBeInTheDocument();
    expect(screen.getByText('Modelo 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
  });

  it('navega para Condições de pagamento ao clicar no menu', () => {
    render(<ProposalSettingsStudio />);

    const condicoesBtn = screen.getByText('Condições de pagamento');
    fireEvent.click(condicoesBtn);

    expect(screen.getByText('Configure as condições de pagamento que você deseja mostrar nas suas propostas')).toBeInTheDocument();
    expect(screen.getByText('Boleto')).toBeInTheDocument();
    expect(screen.getByText('Cartão de crédito')).toBeInTheDocument();
    expect(screen.getByText('Calculadora de financiamentos')).toBeInTheDocument();
    expect(screen.getByText('Transferência')).toBeInTheDocument();
  });

  it('navega para Precificação e exibe tabela com R$/kWp e botão Inserir custo', () => {
    render(<ProposalSettingsStudio />);

    const precificacaoBtn = screen.getByText('Precificação');
    fireEvent.click(precificacaoBtn);

    expect(screen.getByText('Configure os valores abaixo por R$/kWp ou R$/dimensionamento.')).toBeInTheDocument();
    expect(screen.getByText('Inserir custo')).toBeInTheDocument();
    expect(screen.getByText('Preço/kWp')).toBeInTheDocument();
    expect(screen.getByText('De (kWp)')).toBeInTheDocument();
    expect(screen.getByText('Até (kWp)')).toBeInTheDocument();
    expect(screen.getByText('Cálculo')).toBeInTheDocument();
  });

  it('chama a persistência backend ao salvar o modelo no drawer', async () => {
    render(<ProposalSettingsStudio />);

    const openDrawerBtn = screen.getByText('Definir Modelo da Proposta');
    fireEvent.click(openDrawerBtn);

    const modelo2Card = screen.getByText('Modelo 2');
    fireEvent.click(modelo2Card);

    const saveBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(companyProposalSettingsApi.update).toHaveBeenCalled();
    });
  });
});
