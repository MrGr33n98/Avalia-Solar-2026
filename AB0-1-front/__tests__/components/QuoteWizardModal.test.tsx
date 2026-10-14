import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuoteWizardModal from '@/components/QuoteWizardModal';
import { leadsWizardApi, companiesApiSafe } from '@/lib/api-client';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getById: jest.fn().mockResolvedValue({
      id: 10,
      name: 'Instaladora Solar Top',
      city: 'São Paulo',
      state: 'SP',
      verified: true,
      rating_avg: 4.9,
    }),
  },
  leadsWizardApi: {
    create: jest.fn().mockResolvedValue({
      lead_id: 101,
      email_hint: 'us***@exemplo.com',
    }),
    resendEmailCode: jest.fn().mockResolvedValue({ success: true }),
    verifyEmailCode: jest.fn().mockResolvedValue({
      success: true,
      companies: [
        { id: 10, name: 'Instaladora Solar Top', city: 'São Paulo', state: 'SP', verified: true },
      ],
    }),
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={typeof src === 'string' ? src : ''} />
  ),
}));

describe('QuoteWizardModal (Auditoria e Correção PWA)', () => {
  beforeAll(() => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
        text: async () => '',
      })
    ) as jest.Mock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza modal fechado por padrão', () => {
    render(<QuoteWizardModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre o modal ao disparar o evento customizado open-quote-wizard', async () => {
    render(<QuoteWizardModal />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('open-quote-wizard', {
          detail: { preferredCompanyId: 10, source: 'company_profile' },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByText('Instaladora Solar Top')).toBeInTheDocument();
    expect(screen.getByText('O que você deseja comparar?')).toBeInTheDocument();
    expect(screen.getByText('Qual é o seu projeto?')).toBeInTheDocument();
  });

  it('exibe as soluções com assets 3D e o perfil do projeto incluindo Condomínio', async () => {
    render(<QuoteWizardModal />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('open-quote-wizard', {
          detail: { preferredCompanyId: 10 },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Energia solar e baterias')).toBeInTheDocument();
      expect(screen.getByText('Carregadores veiculares (EV)')).toBeInTheDocument();
      expect(screen.getByText('Baterias e armazenamento')).toBeInTheDocument();
    });

    // Perfis do projeto
    expect(screen.getByText('Residencial')).toBeInTheDocument();
    expect(screen.getByText('Condomínio')).toBeInTheDocument();
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('permite selecionar Condomínio e avançar pelas etapas sem erro de opção inválida', async () => {
    render(<QuoteWizardModal />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('open-quote-wizard', {
          detail: { preferredCompanyId: 10 },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Condomínio')).toBeInTheDocument();
    });

    // Seleciona Condomínio
    const condominioBtn = screen.getByText('Condomínio');
    fireEvent.click(condominioBtn);

    // Clica em Avançar para a Etapa 2
    const nextBtn = screen.getByRole('button', { name: /Avançar/i });
    fireEvent.click(nextBtn);

    // Etapa 2: Detalhes
    await waitFor(() => {
      expect(screen.getByText(/Faixa de Consumo de Energia/i)).toBeInTheDocument();
      expect(screen.getByText(/Tipo de Instalação/i)).toBeInTheDocument();
      expect(screen.getByText(/Prazo de Decisão/i)).toBeInTheDocument();
    });

    // Preenche consumo e CEP
    const consumoSelect = screen.getByLabelText(/Consumo mensal de energia/i);
    fireEvent.change(consumoSelect, { target: { value: 'R$ 500 a R$ 1.000' } });

    const cepInput = screen.getByPlaceholderText(/Digite seu CEP/i);
    fireEvent.change(cepInput, { target: { value: '01310-100' } });

    // Avança para a Etapa 3 (Contato)
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });
  });

  it('valida consentimento e limpa o erro imediatamente quando a checkbox é marcada', async () => {
    render(<QuoteWizardModal />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('open-quote-wizard', {
          detail: { preferredCompanyId: 10 },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Condomínio')).toBeInTheDocument();
    });

    // Passo 1 -> Passo 2
    fireEvent.click(screen.getByText('Condomínio'));
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Passo 2 -> Passo 3
    await waitFor(() => {
      expect(screen.getByLabelText(/Consumo mensal de energia/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Consumo mensal de energia/i), {
      target: { value: 'R$ 500 a R$ 1.000' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Digite seu CEP/i), {
      target: { value: '01310-100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Passo 3 (Contato)
    await waitFor(() => {
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    });

    // Preenche contato mas NÃO marca consentimento
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'Carlos Silva' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp/i), { target: { value: '11988887777' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'carlos@exemplo.com' } });

    // Tenta avançar sem consentimento
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Erro de consentimento deve estar visível (inline e/ou banner)
    expect(screen.getAllByText(/O consentimento é obrigatório/i).length).toBeGreaterThan(0);

    // Marca o consentimento
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);

    // O erro deve ser limpo imediatamente!
    await waitFor(() => {
      expect(screen.queryByText(/O consentimento é obrigatório/i)).not.toBeInTheDocument();
    });
  });

  it('avança para revisão, submete lead e completa verificação OTP com sucesso', async () => {
    render(<QuoteWizardModal />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('open-quote-wizard', {
          detail: { preferredCompanyId: 10 },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Condomínio')).toBeInTheDocument();
    });

    // Passo 1
    fireEvent.click(screen.getByText('Condomínio'));
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Passo 2
    await waitFor(() => {
      expect(screen.getByLabelText(/Consumo mensal de energia/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Consumo mensal de energia/i), {
      target: { value: 'R$ 500 a R$ 1.000' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Digite seu CEP/i), {
      target: { value: '01310-100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Passo 3
    await waitFor(() => {
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'Carlos Silva' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp/i), { target: { value: '11988887777' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'carlos@exemplo.com' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Passo 4: Revisão
    await waitFor(() => {
      expect(screen.getByText(/Solução & Projeto/i)).toBeInTheDocument();
      expect(screen.getByText(/Carlos Silva/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enviar Solicitação/i })).toBeInTheDocument();
    });

    // Enviar solicitação
    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitação/i }));

    await waitFor(() => {
      expect(leadsWizardApi.create).toHaveBeenCalled();
    });

    // Passo 5: OTP
    await waitFor(() => {
      expect(screen.getByText(/Validação de Segurança/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirmar código/i })).toBeInTheDocument();
    });

    // Simula OTP preenchido e verificado
    const otpInput = screen.getByLabelText(/Código de verificação de 6 dígitos/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar código/i }));

    await waitFor(() => {
      expect(leadsWizardApi.verifyEmailCode).toHaveBeenCalledWith(101, '123456');
    });

    // Passo 6: Sucesso
    await waitFor(() => {
      expect(screen.getByText(/Solicitação Enviada com Sucesso!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Concluir/i })).toBeInTheDocument();
    });
  });
});
