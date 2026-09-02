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

describe('CRMCommandPalette Component', () => {
  it('does not render when closed', () => {
    render(<CRMCommandPalette />);
    expect(screen.queryByPlaceholderText(/Digite um comando/i)).not.toBeInTheDocument();
  });

  it('opens on Cmd+K keyboard shortcut', () => {
    render(<CRMCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/Digite um comando/i)).toBeInTheDocument();
    expect(screen.getByText(/Ir para Pipeline Kanban/i)).toBeInTheDocument();
  });
});
