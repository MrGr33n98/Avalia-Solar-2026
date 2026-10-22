import { render, screen, fireEvent } from '@testing-library/react';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('CRMCommandPalette Component — Acessibilidade e Busca', () => {
  it('não renderiza quando fechado', () => {
    render(<CRMCommandPalette />);
    expect(screen.queryByPlaceholderText(/Digite um comando/i)).not.toBeInTheDocument();
  });

  it('abre no atalho de teclado Cmd+K / Ctrl+K', () => {
    render(<CRMCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/Digite um comando/i)).toBeInTheDocument();
    expect(screen.getByText(/Ir para Pipeline Kanban/i)).toBeInTheDocument();
  });

  it('fecha ao pressionar a tecla ESC', () => {
    render(<CRMCommandPalette open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByPlaceholderText(/Digite um comando/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
  });

  it('fecha ao clicar no botão fechar mobile (X)', () => {
    const onOpenChangeMock = jest.fn();
    render(<CRMCommandPalette open={true} onOpenChange={onOpenChangeMock} />);

    const closeBtn = screen.getByRole('button', { name: /Fechar busca/i });
    fireEvent.click(closeBtn);

    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });
});
