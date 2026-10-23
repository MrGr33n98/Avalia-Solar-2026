import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailEngagementBadges, {
  openSignalTooltip,
} from '@/components/sales/email/EmailEngagementBadges';
import EmailCenterPage from '@/components/sales/email/EmailCenterPage';

jest.mock('@/components/sales/layout/SalesLayoutWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/sales/email/EmailComposerModal', () => ({
  __esModule: true,
  default: () => null,
}));

describe('EmailEngagementBadges', () => {
  it('não renderiza nada sem sinais', () => {
    const { container } = render(<EmailEngagementBadges openCount={0} clickCount={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('usa "sinal de abertura" e nunca afirma leitura humana', () => {
    render(<EmailEngagementBadges engagement={{ raw_open_signals: 3, raw_clicks: 1 }} />);
    expect(screen.getByText('3 sinais de abertura')).toBeInTheDocument();
    expect(screen.getByText('1 clique')).toBeInTheDocument();
    expect(screen.queryByText(/lido/i)).not.toBeInTheDocument();
  });

  it('tooltip informa sinais automatizados quando houver proxy/bot/scanner', () => {
    expect(openSignalTooltip({ proxy_open_signals: 2, scanner_open_signals: 1 })).toMatch(
      /3 sinais vieram de proxy, robô ou scanner/
    );
    expect(openSignalTooltip({})).toMatch(/Não comprova leitura humana/);
  });
});

describe('EmailCenterPage — detalhe e eventos reais', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('busca GET /emails/:id ao selecionar e exibe o histórico de eventos', async () => {
    const listItem = {
      id: 7,
      subject: 'Apresentação Avalia Solar',
      from_email: 'v@avaliasolar.com.br',
      to_email: 'ana@cliente.com',
      status: 'delivered',
      open_count: 1,
      click_count: 0,
      created_at: '2026-10-22T13:00:00Z',
    };
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/api/v1/sales/emails/7')) {
        return {
          ok: true,
          json: async () => ({
            email: {
              ...listItem,
              engagement: { raw_open_signals: 1, proxy_open_signals: 1 },
              events: [
                { event_type: 'delivered', source: 'aws_ses_sns', occurred_at: '2026-10-22T13:01:00Z' },
                {
                  event_type: 'open_signal',
                  source: 'avalia_pixel',
                  signal_class: 'proxy',
                  occurred_at: '2026-10-22T13:05:00Z',
                },
              ],
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ emails: [listItem], meta: { total_pages: 1 } }),
      };
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<EmailCenterPage />);

    await waitFor(() => expect(screen.getByText('Entrega confirmada')).toBeInTheDocument());
    expect(screen.getByText('Pixel de abertura solicitado')).toBeInTheDocument();
    expect(screen.getByText(/possível proxy/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/sales/emails/7',
      expect.objectContaining({ credentials: 'include' })
    );
    // sem horário fixo fabricado
    expect(screen.queryByText('14:30')).not.toBeInTheDocument();
  });
});
