import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';
import { useAuth } from '@/hooks/useAuth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the components used in the page
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, ...props }: any) => (
    <button disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, type, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      type={type}
      {...props}
      data-testid={`input-${type}`}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="card-title">{children}</h1>
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });

    mockPush.mockClear();
    mockLogin.mockClear();
  });

  it('renders the login form with email and password inputs', () => {
    render(<LoginPage />);
    
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
  });

  it('renders the login title and description', () => {
    render(<LoginPage />);
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Login');
    expect(screen.getByTestId('card-description')).toHaveTextContent('Entre com sua conta para acessar o sistema');
  });

  it('updates email state when typing in email input', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByTestId('input-email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates password state when typing in password input', () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByTestId('input-password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls login function with correct credentials on form submission', async () => {
    mockLogin.mockResolvedValue({});

    render(<LoginPage />);
    
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByRole('button', { name: /Entrar/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('redirects to dashboard after successful login', async () => {
    mockLogin.mockResolvedValue({});

    render(<LoginPage />);
    
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByRole('button', { name: /Entrar/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state when submitting', () => {
    // Temporarily mock login to return a pending promise to keep the loading state
    const pendingPromise = new Promise(() => {});
    const mockLogin = jest.fn(() => pendingPromise);
    
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByRole('button', { name: /Entrar/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Click the submit button (this will trigger form submission)
    fireEvent.click(submitButton);
    
    // The button should be disabled during the async login
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Entrando...');
  });

  it('shows error message when login fails', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue(new Error(errorMessage));

    render(<LoginPage />);
    
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getByTestId('input-password');
    const submitButton = screen.getByRole('button', { name: /Entrar/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('has links to register and forgot password pages', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('link', { name: 'Registre-se' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Esqueceu sua senha?' })).toHaveAttribute('href', '/forgot-password');
  });
});