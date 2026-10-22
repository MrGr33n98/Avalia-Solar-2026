import { render, screen } from '@testing-library/react';
import CRMMobileBottomNav from '@/components/sales/layout/CRMMobileBottomNav';

let currentPathname = '/dashboard/sales/pipeline';

jest.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

describe('CRMMobileBottomNav — Navegação Móvel PWA do CRM', () => {
  beforeEach(() => {
    currentPathname = '/dashboard/sales/pipeline';
  });

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

  it('reconhece a rota /dashboard/sales/leads como destino Pipeline ativo', () => {
    currentPathname = '/dashboard/sales/leads';
    render(<CRMMobileBottomNav />);

    const pipelineLink = screen.getByRole('link', { name: /Ir para o Pipeline de Vendas/i });
    expect(pipelineLink).toHaveAttribute('aria-current', 'page');

    const maisLink = screen.getByRole('link', { name: /Abrir menu de opções e configurações do CRM/i });
    expect(maisLink).not.toHaveAttribute('aria-current');
  });
});
