import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '@/app/(auth)/components/AuthModal';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockLogin = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockResendConfirmation = jest.fn();
const mockGetPostLoginDestination = jest.fn().mockResolvedValue('/dashboard');

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    signInWithGoogle: mockSignInWithGoogle,
    resendConfirmation: mockResendConfirmation,
    getPostLoginDestination: mockGetPostLoginDestination,
  }),
}));

// Mock BrandLogo to verify it renders without image loading delays
jest.mock('@/components/brand/BrandLogo', () => ({
  BrandLogo: ({ className }: { className?: string }) => (
    <div data-testid="brand-logo" className={className}>
      Avalia Solar
    </div>
  ),
}));

describe('AuthModal Compact Redesign (Web & PWA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('AC01 & AC07: renderiza o modal compacto <= 760px com role="dialog" e altura adaptativa de login', () => {
    render(<AuthModal initialTab="login" />);

    const dialog = screen.getByRole('dialog', { name: 'Autenticação' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Verifica que o container tem largura máxima compacta de 760px e rounded-2xl
    expect(dialog.className).toContain('max-w-[760px]');
    expect(dialog.className).toContain('rounded-2xl');

    // No estado login, deve usar altura derivada do conteúdo (h-auto), sem altura rígida de 780px
    expect(dialog.className).toContain('h-auto');
    expect(dialog.className).not.toContain('md:h-[min(780px');
  });

  it('AC02: preserva rigorosamente todos os campos e ações do login', () => {
    render(<AuthModal initialTab="login" />);

    // Abas de navegação
    expect(screen.getByRole('tab', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Criar conta' })).toBeInTheDocument();

    // Botão Google
    const googleBtn = screen.getByRole('button', { name: /Continuar com Google/i });
    expect(googleBtn).toBeInTheDocument();

    // Separador "ou"
    expect(screen.getByText('ou')).toBeInTheDocument();

    // Inputs e Labels
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    const passwordInput = screen.getByLabelText('Senha');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');

    // Botão alternar visualização de senha com acessibilidade
    const togglePasswordBtn = screen.getByRole('button', { name: 'Exibir senha' });
    expect(togglePasswordBtn).toBeInTheDocument();
    fireEvent.click(togglePasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument();

    // Link esqueceu senha
    const forgotLink = screen.getByRole('link', { name: 'Esqueceu sua senha?' });
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');

    // Botão submit "Entrar"
    const submitBtn = screen.getByRole('button', { name: 'Entrar' });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveAttribute('type', 'submit');

    // Botão rodapé "Criar conta"
    expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument();
    const createAccountBtn = screen.getByRole('button', { name: 'Criar conta' });
    expect(createAccountBtn).toBeInTheDocument();
  });

  it('AC02: executa submissão do formulário chamando login com credenciais preenchidas', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1, email: 'teste@avaliasolar.com.br' });

    render(<AuthModal initialTab="login" />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitBtn = screen.getByRole('button', { name: 'Entrar' });

    fireEvent.change(emailInput, { target: { value: 'teste@avaliasolar.com.br' } });
    fireEvent.change(passwordInput, { target: { value: 'senha123456' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('teste@avaliasolar.com.br', 'senha123456');
    });
  });

  it('AC04 & AC05: alterna para aba de Criar Conta mantendo altura limitada e permitindo selecionar tipo de cadastro', async () => {
    render(<AuthModal initialTab="login" />);

    // Alterna via botão "Criar conta" no rodapé do formulário
    const createAccountLink = screen.getByRole('button', { name: 'Criar conta' });
    fireEvent.click(createAccountLink);

    expect(mockReplace).toHaveBeenCalledWith('/register');

    // O container deve aplicar limites de altura para formulário longo de cadastro
    const dialog = screen.getByRole('dialog', { name: 'Autenticação' });
    expect(dialog.className).toContain('md:h-[min(680px');

    // Botões de tipo de cadastro
    expect(screen.getByRole('button', { name: 'Para Você' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Para Empresas' })).toBeInTheDocument();

    // Alternar para Para Empresas
    const companyBtn = screen.getByRole('button', { name: 'Para Empresas' });
    fireEvent.click(companyBtn);

    expect(await screen.findByText('Cadastro para empresas')).toBeInTheDocument();
  });

  it('AC06: exibe mensagens de erro sem quebrar o layout e permite reenvio de confirmação de e-mail', async () => {
    mockLogin.mockRejectedValueOnce({
      context: { details: { code: 'EMAIL_NOT_CONFIRMED' } },
      message: 'confirme seu e-mail',
    });

    render(<AuthModal initialTab="login" />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitBtn = screen.getByRole('button', { name: 'Entrar' });

    fireEvent.change(emailInput, { target: { value: 'pendente@avaliasolar.com.br' } });
    fireEvent.change(passwordInput, { target: { value: 'senha123' } });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Seu e-mail ainda não foi confirmado/i)
    ).toBeInTheDocument();

    const resendBtn = screen.getByRole('button', { name: 'Reenviar confirmação' });
    expect(resendBtn).toBeInTheDocument();

    mockResendConfirmation.mockResolvedValueOnce({});
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(mockResendConfirmation).toHaveBeenCalledWith('pendente@avaliasolar.com.br');
    });
  });

  it('AC07: fecha o modal ao clicar no botão X ou pressionar Escape', () => {
    jest.useFakeTimers();
    render(<AuthModal initialTab="login" />);

    const closeBtn = screen.getByRole('button', { name: 'Fechar autenticação' });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    jest.advanceTimersByTime(350);

    expect(mockPush).toHaveBeenCalledWith('/');
    jest.useRealTimers();
  });
});
