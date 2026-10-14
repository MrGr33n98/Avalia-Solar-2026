import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardNavigationFlyout } from '@/app/dashboard/components/DashboardNavigationFlyout';
import { Edit3, FileText, Grid2X2, Package } from 'lucide-react';
import type { NavigationItem } from '@/config/navigation';

const mockItem: NavigationItem = {
  id: 'product-edit-group',
  label: 'Perfil da Empresa',
  icon: Edit3,
  context: ['operational'],
  children: [
    {
      id: 'product-general',
      label: 'Informações Gerais',
      icon: FileText,
      context: ['operational'],
    },
    {
      id: 'product-categories',
      label: 'Categorias',
      icon: Grid2X2,
      context: ['operational'],
    },
    {
      id: 'product-catalog',
      label: 'Produtos e Serviços',
      icon: Package,
      context: ['operational'],
      badge: true,
    },
  ],
};

describe('DashboardNavigationFlyout (Padrão My.G2)', () => {
  it('renderiza o botão principal com ícone, label e indicador de submenu', () => {
    render(
      <DashboardNavigationFlyout
        item={mockItem}
        activeTab="overview"
        onTabChange={jest.fn()}
        isCompactRail={false}
      />
    );

    const trigger = screen.getByRole('button', { name: /Perfil da Empresa/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre o flyout lateral ao passar o mouse (hover)', async () => {
    render(
      <DashboardNavigationFlyout
        item={mockItem}
        activeTab="overview"
        onTabChange={jest.fn()}
        isCompactRail={false}
      />
    );

    const trigger = screen.getByRole('button', { name: /Perfil da Empresa/i });
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
      expect(screen.getByText('Categorias')).toBeInTheDocument();
      expect(screen.getByText('Produtos e Serviços')).toBeInTheDocument();
    });
  });

  it('abre o flyout ao clicar no botão do grupo', async () => {
    render(
      <DashboardNavigationFlyout
        item={mockItem}
        activeTab="overview"
        onTabChange={jest.fn()}
        isCompactRail={false}
      />
    );

    const trigger = screen.getByRole('button', { name: /Perfil da Empresa/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
    });
  });

  it('destaca visualmente o subitem ativo dentro do flyout', async () => {
    render(
      <DashboardNavigationFlyout
        item={mockItem}
        activeTab="product-categories"
        onTabChange={jest.fn()}
        isCompactRail={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Perfil da Empresa/i }));

    await waitFor(() => {
      const activeChildBtn = screen.getByRole('button', { name: /Categorias/i });
      expect(activeChildBtn).toHaveAttribute('aria-current', 'page');
    });
  });

  it('dispara onTabChange com o ID correto e fecha o flyout ao selecionar um subitem', async () => {
    const handleTabChange = jest.fn();

    render(
      <DashboardNavigationFlyout
        item={mockItem}
        activeTab="overview"
        onTabChange={handleTabChange}
        isCompactRail={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Perfil da Empresa/i }));

    await waitFor(() => {
      expect(screen.getByText('Produtos e Serviços')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Produtos e Serviços'));

    expect(handleTabChange).toHaveBeenCalledWith('product-catalog');
  });

  it('permite fechar com a tecla Escape', async () => {
    render(
      <DashboardNavigationFlyout
        item={mockItem}
        activeTab="overview"
        onTabChange={jest.fn()}
        isCompactRail={false}
      />
    );

    const trigger = screen.getByRole('button', { name: /Perfil da Empresa/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
    });

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Informações Gerais')).not.toBeInTheDocument();
    });
  });
});
