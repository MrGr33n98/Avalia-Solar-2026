import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { GatedContentDownload } from '@/components/GatedContentDownload';
import { getAnonymousId, handleUserIdentified } from '@/lib/analytics/identity-stitch';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';

jest.mock('@/lib/analytics/identity-stitch', () => ({
  getAnonymousId: jest.fn(),
  handleUserIdentified: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  sendIntentSignal: jest.fn(),
}));

describe('GatedContentDownload', () => {
  const fetchMock = jest.fn();
  const windowOpenMock = jest.spyOn(window, 'open').mockImplementation(() => null);
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as typeof fetch;
    (getAnonymousId as jest.Mock).mockReturnValue('anon-123');
    (handleUserIdentified as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    windowOpenMock.mockRestore();
  });

  it('submits the gated lead, stitches identity, and tracks the download without leaking email to analytics', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        user_id: 'user-1',
        anonymous_id: 'anon-123',
      }),
    } as Response);

    render(
      <GatedContentDownload
        companyId="42"
        documentType="pdf"
        documentTitle="Guia Técnico Solar"
        documentUrl="/materiais/guia-tecnico.pdf"
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Nome Completo *'), {
      target: { value: 'Maria Compradora' },
    });
    fireEvent.change(screen.getByLabelText('Email Corporativo *'), {
      target: { value: 'maria@empresa.com' },
    });
    fireEvent.change(screen.getByLabelText('Telefone *'), {
      target: { value: '(11) 99999-8888' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Baixar Agora' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/gated_downloads',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(String(requestInit.body));

    expect(requestBody).toMatchObject({
      company_id: '42',
      anonymous_id: 'anon-123',
      document_type: 'pdf',
      document_title: 'Guia Técnico Solar',
      contact_name: 'Maria Compradora',
      contact_email: 'maria@empresa.com',
    });

    expect(handleUserIdentified).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'maria@empresa.com',
      name: 'Maria Compradora',
    });

    expect(sendIntentSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: '42',
        user_id: 'user-1',
        anonymous_id: 'anon-123',
        signal_type: 'document_download',
        signal_category: 'research_intent',
        metadata: {
          document_type: 'pdf',
          document_title: 'Guia Técnico Solar',
        },
      })
    );
    expect(JSON.stringify((sendIntentSignal as jest.Mock).mock.calls[0][0])).not.toContain(
      'maria@empresa.com'
    );

    expect(windowOpenMock).toHaveBeenCalledWith(
      '/materiais/guia-tecnico.pdf',
      '_blank',
      'noopener,noreferrer'
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows an error when the backend request fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
    } as Response);

    render(
      <GatedContentDownload
        companyId="42"
        documentType="pdf"
        documentTitle="Guia Técnico Solar"
        documentUrl="/materiais/guia-tecnico.pdf"
      />
    );

    fireEvent.change(screen.getByLabelText('Nome Completo *'), {
      target: { value: 'Maria Compradora' },
    });
    fireEvent.change(screen.getByLabelText('Email Corporativo *'), {
      target: { value: 'maria@empresa.com' },
    });
    fireEvent.change(screen.getByLabelText('Telefone *'), {
      target: { value: '(11) 99999-8888' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Baixar Agora' }));

    expect(await screen.findByText('Falha ao processar download')).toBeInTheDocument();
    expect(handleUserIdentified).not.toHaveBeenCalled();
    expect(sendIntentSignal).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
  });
});
