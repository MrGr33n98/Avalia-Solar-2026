import { render, screen } from '@testing-library/react';
import CRMMobileBottomNav from '@/components/sales/layout/CRMMobileBottomNav';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/sales/pipeline',
}));

describe('CRMMobileBottomNav — Navegação Móvel PWA do CRM', () => {
  it('renderiza os 5 destinos obrigatórios do CRM com acessibilidade', () => {
    render(<CRMMobileBottomNav />);

    const nav = screen.getByRole('navigation', { name: /Navegação do CRM Móvel/i });
    expect(nav).toBeInTheDocument();

    const hojeLink = screen.getByRole('link', { name: /Ir para a fila de trabalho de Hoje/i });
    const pipelineLink = screen.getByRole('link', { name: /Ir para o Pipeline de Vendas/i });
    const empresasLink = screen.getByRole('link', { name: /Ir para a carteira de Empresas e Contatos/i });
    const tarefasLink = screen.getByRole('link', { name: /Ir para a lista de Tarefas/i });
    const maisLink = screen.getByRole('link', { name: /Abrir menu de opções e configurações do CRM/i });

    expect(hojeLink).toBeInTheDocument();
    expect(pipelineLink).toBeInTheDocument();
    expect(empresasLink).toBeInTheDocument();
    expect(tarefasLink).toBeInTheDocument();
    expect(maisLink).toBeInTheDocument();

    // Como o mock do pathname é /dashboard/sales/pipeline, Pipeline deve ter aria-current="page"
    expect(pipelineLink).toHaveAttribute('aria-current', 'page');
    expect(hojeLink).not.toHaveAttribute('aria-current');
  });
});
