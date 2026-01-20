import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import CompanyFinancing from '@/app/companies/[id]/components/CompanyFinancing';
import { Context7Provider } from '@/app/context7/provider';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/lib/api-analytics', () => ({
  analyticsApi: {
    trackEvent: jest.fn(),
  },
}));

// Mock UI components to simplify render tree
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, onClick, className, ...props }: any) => (
    <button disabled={disabled} onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));
jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, id, 'aria-label': ariaLabel, ...props }: any) => (
    <input
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}));
jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
    />
  ),
}));
jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div onChange={(e: any) => onValueChange(e.target.value)} data-value={value}>{children}</div>
  ),
  RadioGroupItem: ({ value, id }: any) => <input type="radio" id={id} value={value} />,
}));
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div />,
}));

// Mock API endpoints
jest.mock('@/lib/api', () => {
  const financingOptionsApi = {
    simulate: jest.fn().mockResolvedValue({ options: [], best: null }),
    getAll: jest.fn().mockResolvedValue([]),
  };
  const financingProposalsApi = {
    submit: jest.fn().mockResolvedValue({ proposal_id: 123, status: 'queued' }),
    status: jest.fn().mockResolvedValue({ proposal_id: 123, status: 'queued' }),
  };
  return { financingOptionsApi, financingProposalsApi };
});

describe('CompanyFinancing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderWithProvider() {
    return render(
      <Context7Provider>
        <CompanyFinancing companyId={1} />
      </Context7Provider>
    );
  }

  it('desabilita confirmar quando contato inválido', async () => {
    renderWithProvider();
    // Avança simulação inicial
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    // Ir para passo 2
    const continuarBtn = screen.getByText(/Continuar/i);
    fireEvent.click(continuarBtn);
    const confirmarBtn = screen.getByText(/Confirmar proposta/i).closest('button')!;
    expect(confirmarBtn).toBeDisabled();
  });

  it('envia proposta sem opções e mostra status', async () => {
    renderWithProvider();
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Fulano' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'fulano@example.com' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11999999999' } });

    const confirmarBtn = screen.getByText(/Confirmar proposta/i).closest('button')!;
    expect(confirmarBtn).not.toBeDisabled();

    fireEvent.click(confirmarBtn);

    await waitFor(() => {
      const { financingProposalsApi } = require('@/lib/api');
      expect(financingProposalsApi.submit).toHaveBeenCalled();
      expect(screen.getByText(/Proposta enviada/i)).toBeInTheDocument();
      expect(screen.getByText('queued')).toBeInTheDocument();
    });
  });
});
