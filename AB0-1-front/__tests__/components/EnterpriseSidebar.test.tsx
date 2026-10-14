import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnterpriseSidebar from '@/app/dashboard/components/EnterpriseSidebar';

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: () => ({
    activeCompany: {
      id: 10,
      name: 'Instaladora Solar Top',
      plan_tier: 'pro',
    },
    companies: [],
    selectCompany: jest.fn(),
  }),
}));

jest.mock('@/components/company/CompanySelectorModal', () => ({
  CompanySelectorModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="company-selector-modal" /> : null,
}));

jest.mock('@/components/brand/BrandLogo', () => ({
  BrandLogo: () => <div data-testid="brand-logo">Avalia Solar</div>,
}));

describe('EnterpriseSidebar (Arquitetura Lateral My.G2)', () => {
  beforeEach(() => {
    // Default desktop viewport width
    window.innerWidth = 1280;
  });

  it('renderiza a sidebar fixa com logo e o item de Visão Geral como botão direto', () => {
    render(
      <EnterpriseSidebar
        activeTab="overview"
        onTabChange={jest.fn()}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId('brand-logo')).toBeInTheDocument();

    // Visão Geral é botão direto e ativo
    const overviewBtn = screen.getByRole('button', { name: /Visão Geral/i });
    expect(overviewBtn).toBeInTheDocument();
    expect(overviewBtn).not.toHaveAttribute('aria-haspopup');
  });

  it('renderiza grupos com múltiplos filhos como triggers de flyout no desktop', () => {
    render(
      <EnterpriseSidebar
        activeTab="overview"
        onTabChange={jest.fn()}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    // Perfil da Empresa é um grupo com filhos que abre lateralmente
    const perfilBtn = screen.getByRole('button', { name: /Perfil da Empresa \(submenu\)/i });
    expect(perfilBtn).toBeInTheDocument();
    expect(perfilBtn).toHaveAttribute('aria-haspopup', 'menu');
    expect(perfilBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre o flyout lateral à direita sem expandir a sidebar verticalmente', async () => {
    render(
      <EnterpriseSidebar
        activeTab="overview"
        onTabChange={jest.fn()}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    const perfilBtn = screen.getByRole('button', { name: /Perfil da Empresa \(submenu\)/i });
    fireEvent.click(perfilBtn);

    await waitFor(() => {
      expect(perfilBtn).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
      expect(screen.getByText('Categorias')).toBeInTheDocument();
      expect(screen.getByText('Produtos e Serviços')).toBeInTheDocument();
    });
  });

  it('seleciona um subitem do flyout e aciona onTabChange', async () => {
    const handleTabChange = jest.fn();

    render(
      <EnterpriseSidebar
        activeTab="overview"
        onTabChange={handleTabChange}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    const perfilBtn = screen.getByRole('button', { name: /Perfil da Empresa \(submenu\)/i });
    fireEvent.click(perfilBtn);

    await waitFor(() => {
      expect(screen.getByText('Categorias')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Categorias'));

    expect(handleTabChange).toHaveBeenCalledWith('product-categories');
  });

  it('permite abrir o modal de alternar empresa', () => {
    render(
      <EnterpriseSidebar
        activeTab="overview"
        onTabChange={jest.fn()}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    const switchBtn = screen.getByRole('button', { name: /Alternar Empresa/i });
    fireEvent.click(switchBtn);

    expect(screen.getByTestId('company-selector-modal')).toBeInTheDocument();
  });
});
