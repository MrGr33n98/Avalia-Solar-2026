import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatLeadQualificationWizard from '../chat/ChatLeadQualificationWizard';

describe('ChatLeadQualificationWizard', () => {
  it('qualifica um lead solar e envia respostas guiadas com busca de reviews', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <ChatLeadQualificationWizard
        vertical="solar"
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByText('Instalar energia solar'));
    fireEvent.click(screen.getByText('Residencial'));
    fireEvent.click(screen.getByText('R$ 301 a R$ 600'));
    fireEvent.click(screen.getByText('Nos próximos 30 dias'));
    fireEvent.change(screen.getByPlaceholderText('Cidade'), { target: { value: 'Campinas' } });
    fireEvent.change(screen.getByPlaceholderText('UF'), { target: { value: 'sp' } });
    fireEvent.click(screen.getByText('Continuar'));
    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'Ana Solar' } });
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
});
