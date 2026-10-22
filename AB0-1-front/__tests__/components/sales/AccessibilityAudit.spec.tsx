import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CRMMobileBottomNav from '@/components/sales/layout/CRMMobileBottomNav';
import CRMTopbar from '@/components/sales/layout/CRMTopbar';
import CRMModal from '@/components/sales/ui/CRMModal';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/sales/pipeline',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Engenheiro Solar', email: 'solar@avaliasolar.com.br', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
  }),
}));

describe('Auditoria de Acessibilidade WCAG AA & Usabilidade (T-070 / US-CRM-046)', () => {
  describe('CRMMobileBottomNav', () => {
    it('possui landmark navigation, labels descritivos e indicador aria-current', () => {
      render(<CRMMobileBottomNav />);

      const nav = screen.getByRole('navigation', { name: /Navegação do CRM Móvel/i });
      expect(nav).toBeInTheDocument();

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(5);

      // Cada link possui aria-label acessível para leitores de tela
      links.forEach((link) => {
        expect(link).toHaveAttribute('aria-label');
        expect(link.getAttribute('aria-label')?.length).toBeGreaterThan(5);
      });

      // Pipeline ativo possui aria-current="page"
      const pipelineLink = screen.getByRole('link', { name: /Ir para o Pipeline de Vendas/i });
      expect(pipelineLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('CRMTopbar', () => {
    it('possui botões com labels acessíveis para busca, novo registro, notificações e ajuda', () => {
      render(<CRMTopbar onOpenSearch={jest.fn()} onOpenAddModal={jest.fn()} />);

      const searchBtn = screen.getByRole('button', { name: /Abrir busca global do CRM/i });
      expect(searchBtn).toBeInTheDocument();

      const newBtn = screen.getByRole('button', { name: /Criar novo registro no CRM/i });
      expect(newBtn).toBeInTheDocument();

      const notifBtn = screen.getByRole('button', { name: /Notificações do sistema/i });
      expect(notifBtn).toBeInTheDocument();

      const helpBtn = screen.getByRole('button', { name: /Ajuda e suporte do CRM/i });
      expect(helpBtn).toBeInTheDocument();
    });
  });

  describe('CRMModal', () => {
    it('garante DialogDescription acessível para leitores de tela mesmo sem description explícita', () => {
      render(
        <CRMModal open={true} onClose={jest.fn()} title="Modal de Teste">
          <div>Conteúdo acessível</div>
        </CRMModal>
      );

      const title = screen.getByRole('heading', { level: 2, name: /Modal de Teste/i });
      expect(title).toBeInTheDocument();

      const srDescription = screen.getByText('Formulário modal do CRM');
      expect(srDescription).toBeInTheDocument();
      expect(srDescription).toHaveClass('sr-only');
    });

    it('renderiza título e descrição visíveis quando fornecidos', () => {
      render(
        <CRMModal open={true} onClose={jest.fn()} title="Título Visível" description="Descrição Visível">
          <div>Conteúdo com título</div>
        </CRMModal>
      );

      expect(screen.getByRole('heading', { level: 2, name: /Título Visível/i })).toBeInTheDocument();
      expect(screen.getByText('Descrição Visível')).toBeInTheDocument();
    });
  });
});
