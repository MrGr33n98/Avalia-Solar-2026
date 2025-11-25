import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '@/app/register/page';
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

describe('RegisterPage', () => {
  const mockPush = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
    });

    mockPush.mockClear();
    mockRegister.mockClear();
  });

  it('renders the register form with all required inputs', () => {
    render(<RegisterPage />);
    
    expect(screen.getByTestId('input-text')).toBeInTheDocument(); // name input
    expect(screen.getByTestId('input-email')).toBeInTheDocument(); // email input
    
    // Para múltiplos elementos com mesmo testid, usar getAllByTestId
    const passwordInputs = screen.getAllByTestId('input-password');
    expect(passwordInputs).toHaveLength(2); // password and confirm password
  });

  it('renders the register title and description', () => {
    render(<RegisterPage />);
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Registro');
    expect(screen.getByTestId('card-description')).toHaveTextContent('Crie uma nova conta para acessar o sistema');
  });

  it('updates form fields when typing', async () => {
    render(<RegisterPage />);
    
    const nameInput = screen.getByTestId('input-text');
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    });
    
    const form = passwordInput.closest('form');
    await act(async () => {
      fireEvent.submit(form!);
    });
    
    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    });
    
    const form = passwordInput.closest('form');
    await act(async () => {
      fireEvent.submit(form!);
    });
    
    await waitFor(() => {
      expect(screen.getByText('A senha deve ter pelo menos 6 caracteres')).toBeInTheDocument();
    });
  });

  it('calls register function with correct credentials on successful form submission', async () => {
    mockRegister.mockResolvedValue({});

    render(<RegisterPage />);
    
    const nameInput = screen.getByTestId('input-text');
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    const submitButton = screen.getByRole('button', { name: /Registrar/ });
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
    });
  });

  it('redirects to dashboard after successful registration', async () => {
    mockRegister.mockResolvedValue({});

    render(<RegisterPage />);
    
    const nameInput = screen.getByTestId('input-text');
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    const submitButton = screen.getByRole('button', { name: /Registrar/ });
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state when submitting', async () => {
    // Mock register to resolve after a delay to capture loading state
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterPage />);
    
    const nameInput = screen.getByTestId('input-text');
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    const submitButton = screen.getByRole('button', { name: /Registrar/ });
    
    // Fill out the form
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Should show loading state
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Registrando...');
  });

  it('shows error message when registration fails', async () => {
    const errorMessage = 'Email already exists';
    mockRegister.mockRejectedValue(new Error(errorMessage));

    render(<RegisterPage />);
    
    const nameInput = screen.getByTestId('input-text');
    const emailInput = screen.getByTestId('input-email');
    const passwordInput = screen.getAllByTestId('input-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-password')[1];
    const submitButton = screen.getByRole('button', { name: /Registrar/ });
    
    // Fill out the form
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('has a link to the login page', () => {
    render(<RegisterPage />);
    
    expect(screen.getByRole('link', { name: 'Faça login' })).toHaveAttribute('href', '/login');
  });
});