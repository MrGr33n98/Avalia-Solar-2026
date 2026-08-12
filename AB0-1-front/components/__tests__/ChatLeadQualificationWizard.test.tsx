import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatLeadQualificationWizard from '../chat/ChatLeadQualificationWizard';

describe('ChatLeadQualificationWizard', () => {
  beforeAll(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ localidade: 'Campinas', uf: 'SP', erro: false }),
    }) as jest.Mock;
  });

  it('qualifica um lead solar e envia respostas guiadas com busca de reviews', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);

    render(
      <ChatLeadQualificationWizard
        vertical="solar"
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByText('Instalar energia solar'));
    fireEvent.click(screen.getByText('Residencial'));
    fireEvent.click(screen.getByText('Cerâmico'));
    fireEvent.click(screen.getByText('R$ 301 a R$ 600'));
    fireEvent.click(screen.getByText('Esse mês'));
    fireEvent.click(screen.getByText('Melhores avaliadas'));
    fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '13010-111' } });
    fireEvent.change(screen.getByPlaceholderText('Cidade'), { target: { value: 'Campinas' } });
    fireEvent.change(screen.getByPlaceholderText('UF'), { target: { value: 'sp' } });
    fireEvent.click(screen.getByText('Continuar'));
    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'Ana Solar' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'ana@solar.com' } });
    fireEvent.change(screen.getByPlaceholderText('WhatsApp com DDD'), { target: { value: '(19) 99999-9999' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Encontrar empresas e reviews'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      vertical: 'solar',
      intent: 'solar_quote',
      property_type: 'residential',
      monthly_bill: '600',
      city: 'Campinas',
      state: 'SP',
      recommendationQuery: expect.stringContaining('Mostre empresas cadastradas e seus reviews.'),
      metadata: expect.objectContaining({
        category_seo_url: 'energia-solar-residencial',
        qualification_source: 'guided_chat_wizard',
      }),
    }));
  });

  it('abre opções específicas para mobilidade elétrica', () => {
    render(
      <ChatLeadQualificationWizard
        vertical="electric_mobility"
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByText('Carregador residencial')).toBeInTheDocument();
    expect(screen.getByText('Condomínio')).toBeInTheDocument();
    expect(screen.getByText('Empresa ou frota')).toBeInTheDocument();
    expect(screen.getByText('Eletroposto')).toBeInTheDocument();
  });

  it('bloqueia submit se telefone ou email forem inválidos', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    render(<ChatLeadQualificationWizard vertical="solar" onCancel={jest.fn()} onSubmit={onSubmit} />);

    // Navega até o último passo (passo de contato)
    fireEvent.click(screen.getByText('Instalar energia solar'));
    fireEvent.click(screen.getByText('Residencial'));
    fireEvent.click(screen.getByText('Cerâmico'));
    fireEvent.click(screen.getByText('R$ 301 a R$ 600'));
    fireEvent.click(screen.getByText('Esse mês'));
    fireEvent.click(screen.getByText('Melhores avaliadas'));
    fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '13010-111' } });
    fireEvent.change(screen.getByPlaceholderText('Cidade'), { target: { value: 'Campinas' } });
    fireEvent.change(screen.getByPlaceholderText('UF'), { target: { value: 'SP' } });
    fireEvent.click(screen.getByText('Continuar'));

    // Preenche com dados inválidos
    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'Ana Solar' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'email-invalido' } });
    fireEvent.change(screen.getByPlaceholderText('WhatsApp com DDD'), { target: { value: '119999' } }); // muito curto
    fireEvent.click(screen.getByRole('checkbox'));
    
    fireEvent.submit(screen.getByText('Encontrar empresas e reviews').closest('form') as HTMLFormElement);

    // Verifica que mensagem de erro apareceu
    await waitFor(() => {
      expect(screen.getByText('Por favor, informe um e-mail válido.')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // Corrige o email, agora testa telefone
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'ana@solar.com' } });
    fireEvent.submit(screen.getByText('Encontrar empresas e reviews').closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText('Por favor, informe um WhatsApp válido com DDD.')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('mostra mensagem de erro se onSubmit falhar (retornar false)', async () => {
    const onSubmit = jest.fn().mockResolvedValue(false);
    render(<ChatLeadQualificationWizard vertical="solar" onCancel={jest.fn()} onSubmit={onSubmit} />);

    // Navega até o passo final
    fireEvent.click(screen.getByText('Instalar energia solar'));
    fireEvent.click(screen.getByText('Residencial'));
    fireEvent.click(screen.getByText('Cerâmico'));
    fireEvent.click(screen.getByText('R$ 301 a R$ 600'));
    fireEvent.click(screen.getByText('Esse mês'));
    fireEvent.click(screen.getByText('Melhores avaliadas'));
    fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '13010-111' } });
    fireEvent.change(screen.getByPlaceholderText('Cidade'), { target: { value: 'Campinas' } });
    fireEvent.change(screen.getByPlaceholderText('UF'), { target: { value: 'SP' } });
    fireEvent.click(screen.getByText('Continuar'));

    // Preenche correto
    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'Ana Solar' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'ana@solar.com' } });
    fireEvent.change(screen.getByPlaceholderText('WhatsApp com DDD'), { target: { value: '11999999999' } });
    fireEvent.click(screen.getByRole('checkbox'));
    
    fireEvent.click(screen.getByText('Encontrar empresas e reviews'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Não foi possível concluir agora. Tente novamente.')).toBeInTheDocument();
    });
  });
});
