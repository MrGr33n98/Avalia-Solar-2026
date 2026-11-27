import { useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardTabPanel, DashboardTabPanels } from './DashboardTabPanels';

const mounts: string[] = [];

// Mesmo componente com estado em duas abas, como CategoriesManagement em
// `categories` e `product-categories`.
function Stateful({ name }: { name: string }) {
  const [instance] = useState(() => `${name}-${mounts.length}`);
  useEffect(() => {
    mounts.push(instance);
  }, [instance]);
  return <span data-testid="instance">{instance}</span>;
}

function Panels({ activeTab }: { activeTab: string }) {
  return (
    <DashboardTabPanels activeTab={activeTab} labels={{ overview: 'Início', categories: 'Categorias' }}>
      <DashboardTabPanel value="overview" data-tour="overview" className="mt-0">
        <p>conteúdo overview</p>
      </DashboardTabPanel>
      <DashboardTabPanel value="product-categories">
        <Stateful name="product" />
      </DashboardTabPanel>
      <DashboardTabPanel value="categories">
        <Stateful name="categories" />
      </DashboardTabPanel>
    </DashboardTabPanels>
  );
}

describe('DashboardTabPanels', () => {
  beforeEach(() => {
    mounts.length = 0;
  });

  it('renderiza só o painel ativo, com role=tabpanel', () => {
    render(<Panels activeTab="overview" />);
    const panels = screen.getAllByRole('tabpanel');
    expect(panels).toHaveLength(1);
    expect(panels[0]).toHaveTextContent('conteúdo overview');
    expect(screen.queryByTestId('instance')).not.toBeInTheDocument();
  });

  it('preserva data-tour, tabIndex, classes de foco e usa o rótulo como aria-label', () => {
    render(<Panels activeTab="overview" />);
    const panel = screen.getByRole('tabpanel', { name: 'Início' });
    expect(panel).toHaveAttribute('data-tour', 'overview');
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(panel).toHaveAttribute('data-state', 'active');
    expect(panel).toHaveClass('mt-0', 'focus-visible:ring-2', 'focus-visible:outline-none');
  });

  it('remonta ao trocar entre abas que usam o mesmo componente (sem herdar estado)', () => {
    const { rerender } = render(<Panels activeTab="product-categories" />);
    const first = screen.getByTestId('instance').textContent;
    rerender(<Panels activeTab="categories" />);
    const second = screen.getByTestId('instance').textContent;
    rerender(<Panels activeTab="product-categories" />);
    const third = screen.getByTestId('instance').textContent;

    expect(second).not.toBe(first);
    expect(third).not.toBe(first);
    expect(mounts).toHaveLength(3);
  });

  it('não renderiza nada para aba sem painel', () => {
    render(<Panels activeTab="inexistente" />);
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('exige o provedor', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <DashboardTabPanel value="overview">
          <p>x</p>
        </DashboardTabPanel>
      )
    ).toThrow('DashboardTabPanel deve ficar dentro de DashboardTabPanels');
    spy.mockRestore();
  });
});
