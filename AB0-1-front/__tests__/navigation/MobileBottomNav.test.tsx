import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';

// Mock dependencies
const mockPush = jest.fn();
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockOpenComparisonModal = jest.fn();
jest.mock('@/lib/floating-widget-events', () => ({
  openComparisonModal: () => mockOpenComparisonModal(),
}));

let mockComparisonCount = 0;
jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    count: mockComparisonCount,
    comparisonList: [],
    maxComparison: 4,
  }),
}));

let mockIsAuthenticated = false;
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { id: 1, email: 'test@avaliasolar.com.br' } : null,
  }),
}));

let mockIsKeyboardOpen = false;
jest.mock('@/hooks/useVirtualKeyboard', () => ({
  useVirtualKeyboard: () => ({
    isKeyboardOpen: mockIsKeyboardOpen,
  }),
}));

let mockUnreadMessagesCount = 0;
const mockToggleChat = jest.fn();
jest.mock('@/hooks/useMobileNavNotifications', () => ({
  useMobileNavNotifications: () => ({
    unreadMessagesCount: mockUnreadMessagesCount,
    chatState: 'minimized',
    toggleChat: mockToggleChat,
  }),
}));

// Mock Link
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('MobileBottomNav (PWA Mobile Public Navigation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockComparisonCount = 0;
    mockIsAuthenticated = false;
    mockIsKeyboardOpen = false;
    mockUnreadMessagesCount = 0;
  });

  describe('Renderização e Estrutura dos 5 Itens', () => {
    it('renderiza todos os 5 itens da barra com atributos de acessibilidade', () => {
      render(<MobileBottomNav />);

      const nav = screen.getByTestId('mobile-bottom-nav');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('role', 'navigation');
      expect(nav).toHaveAttribute('aria-label', 'Navegação principal');

      expect(screen.getByTestId('mobile-nav-home')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-companies')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-search')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-compare')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-messages')).toBeInTheDocument();

      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Empresas')).toBeInTheDocument();
      expect(screen.getByText('Buscar')).toBeInTheDocument();
      expect(screen.getByText('Comparar')).toBeInTheDocument();
      expect(screen.getByText('Mensagens')).toBeInTheDocument();
    });

    it('marca o item ativo com aria-current="page" de acordo com a rota atual', () => {
      mockPathname = '/';
      const { rerender } = render(<MobileBottomNav />);
      expect(screen.getByTestId('mobile-nav-home')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('mobile-nav-companies')).not.toHaveAttribute('aria-current');

      mockPathname = '/companies';
      rerender(<MobileBottomNav />);
      expect(screen.getByTestId('mobile-nav-companies')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('mobile-nav-home')).not.toHaveAttribute('aria-current');

      mockPathname = '/search';
      rerender(<MobileBottomNav />);
      expect(screen.getByTestId('mobile-nav-search')).toHaveAttribute('aria-current', 'page');

      mockPathname = '/compare';
      rerender(<MobileBottomNav />);
      expect(screen.getByTestId('mobile-nav-compare')).toHaveAttribute('aria-current', 'page');

      mockPathname = '/messages';
      rerender(<MobileBottomNav />);
      expect(screen.getByTestId('mobile-nav-messages')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Badges Reais e Contadores', () => {
    it('não exibe badge de comparação quando count for 0', () => {
      mockComparisonCount = 0;
      render(<MobileBottomNav />);
      expect(screen.queryByTestId('compare-badge')).not.toBeInTheDocument();
    });

    it('exibe badge real com número de empresas selecionadas quando count > 0', () => {
      mockComparisonCount = 3;
      render(<MobileBottomNav />);
      const badge = screen.getByTestId('compare-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
      expect(badge).toHaveAttribute('aria-label', '3 empresas selecionadas');
    });

    it('não exibe badge de mensagens quando unreadMessagesCount for 0', () => {
      mockUnreadMessagesCount = 0;
      render(<MobileBottomNav />);
      expect(screen.queryByTestId('messages-badge')).not.toBeInTheDocument();
    });

    it('exibe badge de mensagens não lidas quando houver mensagens', () => {
      mockUnreadMessagesCount = 2;
      render(<MobileBottomNav />);
      const badge = screen.getByTestId('messages-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2');
      expect(badge).toHaveAttribute('aria-label', '2 mensagens não lidas');
    });

    it('formata contagens maiores que 9 com "9+"', () => {
      mockComparisonCount = 12;
      mockUnreadMessagesCount = 15;
      render(<MobileBottomNav />);
      expect(screen.getByTestId('compare-badge')).toHaveTextContent('9+');
      expect(screen.getByTestId('messages-badge')).toHaveTextContent('9+');
    });
  });

  describe('Zero Dead Actions (Tratamento de Cliques)', () => {
    it('ao clicar em Buscar fora de /search, navega para /search', () => {
      mockPathname = '/';
      render(<MobileBottomNav />);

      const searchButton = screen.getByTestId('mobile-nav-search');
      fireEvent.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith('/search');
    });

    it('ao clicar em Comparar sem empresas selecionadas (count=0), navega para /compare', () => {
      mockComparisonCount = 0;
      render(<MobileBottomNav />);

      const compareButton = screen.getByTestId('mobile-nav-compare');
      fireEvent.click(compareButton);

      expect(mockPush).toHaveBeenCalledWith('/compare');
      expect(mockOpenComparisonModal).not.toHaveBeenCalled();
    });

    it('ao clicar em Comparar com empresas selecionadas (count>0), abre o modal de comparação', () => {
      mockComparisonCount = 2;
      render(<MobileBottomNav />);

      const compareButton = screen.getByTestId('mobile-nav-compare');
      fireEvent.click(compareButton);

      expect(mockOpenComparisonModal).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('ao clicar em Mensagens não autenticado, redireciona para login seguro', () => {
      mockIsAuthenticated = false;
      render(<MobileBottomNav />);

      const messagesButton = screen.getByTestId('mobile-nav-messages');
      fireEvent.click(messagesButton);

      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/chat');
      expect(mockToggleChat).not.toHaveBeenCalled();
    });

    it('ao clicar em Mensagens autenticado, expande o chat', () => {
      mockIsAuthenticated = true;
      render(<MobileBottomNav />);

      const messagesButton = screen.getByTestId('mobile-nav-messages');
      fireEvent.click(messagesButton);

      expect(mockToggleChat).toHaveBeenCalledWith('expanded');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Ocultação em Rotas Restritas', () => {
    it.each([
      ['/dashboard'],
      ['/dashboard/companies/372'],
      ['/review-dashboard'],
      ['/review-dashboard/profile'],
      ['/creator-studio'],
      ['/chat'],
      ['/chat/session/123'],
      ['/profile'],
    ])('não renderiza o componente na rota %s', (restrictedPath) => {
      mockPathname = restrictedPath;
      const { container } = render(<MobileBottomNav />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Keyboard-Safe (Teclado Virtual)', () => {
    it('aplica classes de transição e ocultação quando o teclado virtual estiver aberto', () => {
      mockIsKeyboardOpen = true;
      render(<MobileBottomNav />);

      const nav = screen.getByTestId('mobile-bottom-nav');
      expect(nav).toHaveClass('translate-y-full');
      expect(nav).toHaveClass('opacity-0');
      expect(nav).toHaveClass('pointer-events-none');
    });
  });
});
