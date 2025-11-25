import { render, fireEvent, screen } from '@testing-library/react';
import CompanyCard from './CompanyCard';

describe('CompanyCard', () => {
  const mockCompany = {
    whatsapp_enabled: true,
    whatsapp_url: 'https://wa.me/123',
    verified: true,
    status: 'active',
    has_paid_plan: true
  };

  it('exibe botão WhatsApp condicionalmente', () => {
    const { getByTestId } = render(<CompanyCard company={mockCompany} />);
    expect(getByTestId('whatsapp-button')).toBeInTheDocument();
  });

  it('não exibe botão WhatsApp se desabilitado', () => {
    const disabledCompany = { ...mockCompany, whatsapp_enabled: false };
    const { queryByTestId } = render(<CompanyCard company={disabledCompany} />);
    expect(queryByTestId('whatsapp-button')).not.toBeInTheDocument();
  });

  it('redireciona para URL correta ao clicar', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;
    const { getByTestId } = render(<CompanyCard company={mockCompany} />);
    fireEvent.click(getByTestId('whatsapp-button'));
    expect(mockOpen).toHaveBeenCalledWith('https://wa.me/123', '_blank');
  });

  it('verifica acessibilidade do botão (aria-label)', () => {
    render(<CompanyCard company={mockCompany} />);
    const button = screen.getByRole('link', { name: /contatar via whatsapp/i });
    expect(button).toHaveAttribute('aria-label', 'Contatar via WhatsApp');
    expect(button).toBeInTheDocument();
  });

  it('verifica interação via teclado (Enter e Space)', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;
    const { getByTestId } = render(<CompanyCard company={mockCompany} />);
    const button = getByTestId('whatsapp-button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockOpen).toHaveBeenCalledWith('https://wa.me/123', '_blank');
    mockOpen.mockClear();
    fireEvent.keyDown(button, { key: ' ' });
    expect(mockOpen).toHaveBeenCalledWith('https://wa.me/123', '_blank');
  });

  it('verifica responsividade em diferentes viewports', () => {
    // Simula viewport mobile
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 640 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 480 });
    window.dispatchEvent(new Event('resize'));

    const { getByTestId } = render(<CompanyCard company={mockCompany} />);
    expect(getByTestId('whatsapp-button')).toBeInTheDocument();
    expect(getByTestId('whatsapp-button')).toHaveClass('w-full'); // Exemplo de classe responsiva

    // Simula viewport desktop
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    window.dispatchEvent(new Event('resize'));

    expect(getByTestId('whatsapp-button')).toBeInTheDocument();
    // Adicione expectativas específicas para desktop, se aplicável
  });
});