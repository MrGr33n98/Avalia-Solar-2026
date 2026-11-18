import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfiguraçõesPage from './page';
import * as brandUsagesApi from '@/lib/api/reviewer-brand-usages';

jest.mock('../DashboardLayoutClient', () => ({
  useDashboardContext: () => ({ loading: false }),
}));

jest.mock('@/lib/api/reviewer-brand-usages');
const mockedBrandUsagesApi = brandUsagesApi as jest.Mocked<typeof brandUsagesApi>;

describe('ConfiguraçõesPage — PR9 Mobile & Privacy Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza as abas de configurações', () => {
    render(<ConfiguraçõesPage />);

    expect(screen.getByRole('button', { name: /Perfil e conta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Privacidade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notificações/i })).toBeInTheDocument();
  });

  it('permite alternar para a aba Privacidade e exibe garantias LGPD', () => {
    render(<ConfiguraçõesPage />);

    const privacyTab = screen.getByRole('button', { name: /Privacidade/i });
    fireEvent.click(privacyTab);

    expect(screen.getByTestId('settings-privacy-tab')).toBeInTheDocument();
    expect(screen.getByText(/Lei 13.709\/2018/i)).toBeInTheDocument();
    expect(screen.getByTestId('revoke-public-brands-button')).toBeInTheDocument();
  });

  it('permite revogar marcas públicas após confirmação do usuário', async () => {
    window.confirm = jest.fn(() => true);
    mockedBrandUsagesApi.fetchReviewerBrandUsages.mockResolvedValue({
      data: [
        {
          id: 'u-1',
          brand: { id: 1, name: 'Growatt', slug: 'growatt', initials: 'GW', logo_url: null, active: true },
          usage_context: 'integrator_install',
          usage_context_label: 'Instalação',
          source: 'manual',
          verification_status: 'self_declared',
          visibility: 'public',
          status: 'active',
          experience_since: null,
          description: null,
          consent_version: 'v1',
          opted_in_at: '2026-11-10T12:00:00Z',
          lock_version: 0,
          created_at: '2026-11-10T12:00:00Z',
          updated_at: '2026-11-10T12:00:00Z',
        },
      ],
      meta: { total: 1, limit: 100, offset: 0 },
    });
    mockedBrandUsagesApi.updateReviewerBrandUsage.mockResolvedValue({
      data: {} as any,
    });

    render(<ConfiguraçõesPage />);

    fireEvent.click(screen.getByRole('button', { name: /Privacidade/i }));
    const revokeBtn = screen.getByTestId('revoke-public-brands-button');
    fireEvent.click(revokeBtn);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Deseja realmente revogar a visibilidade pública')
    );

    await waitFor(() => {
      expect(mockedBrandUsagesApi.updateReviewerBrandUsage).toHaveBeenCalledWith('u-1', {
        visibility: 'private',
        lock_version: 0,
      });
      expect(screen.getByText(/Visibilidade pública revogada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('permite alternar para a aba Notificações', () => {
    render(<ConfiguraçõesPage />);

    const notifTab = screen.getByRole('button', { name: /Notificações/i });
    fireEvent.click(notifTab);

    expect(screen.getByTestId('settings-notifications-tab')).toBeInTheDocument();
    expect(screen.getByText('Status de Verificação Técnica')).toBeInTheDocument();
  });
});
