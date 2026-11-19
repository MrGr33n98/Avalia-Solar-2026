import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination';
import { isCanonicalSurfaceHost } from '@/lib/routing/surface-origins';
import type { User } from '@/lib/api';

const makeUser = (role: User['role']): User => ({
  id: 1,
  name: 'Usuário Teste',
  email: 'teste@example.com',
  role,
  created_at: '2026-08-05T00:00:00Z',
  updated_at: '2026-08-05T00:00:00Z',
});

describe('isCanonicalSurfaceHost', () => {
  it('recognizes canonical production hosts and apex domain', () => {
    expect(isCanonicalSurfaceHost('www.avaliasolar.com.br')).toBe(true);
    expect(isCanonicalSurfaceHost('avaliasolar.com.br')).toBe(true);
    expect(isCanonicalSurfaceHost('app.avaliasolar.com.br')).toBe(true);
    expect(isCanonicalSurfaceHost('crm.avaliasolar.com.br')).toBe(true);
    expect(isCanonicalSurfaceHost('https://www.avaliasolar.com.br')).toBe(true);
  });

  it('rejects localhost, loopback IPs and non-canonical hosts', () => {
    expect(isCanonicalSurfaceHost('localhost:3000')).toBe(false);
    expect(isCanonicalSurfaceHost('http://localhost:3000')).toBe(false);
    expect(isCanonicalSurfaceHost('127.0.0.1:3000')).toBe(false);
    expect(isCanonicalSurfaceHost('preview.example.com')).toBe(false);
    expect(isCanonicalSurfaceHost('')).toBe(false);
    expect(isCanonicalSurfaceHost(null)).toBe(false);
  });
});

describe('resolvePostAuthDestination origin isolation', () => {
  it('keeps relative paths on localhost so local/E2E login never redirects to production', () => {
    expect(
      resolvePostAuthDestination({
        user: makeUser('review'),
        surface: 'public',
        currentHost: 'localhost:3000',
      })
    ).toBe('/review-dashboard');

    expect(
      resolvePostAuthDestination({
        user: makeUser('company'),
        surface: 'public',
        activeCompanyId: 42,
        activeMembershipsCount: 1,
        currentHost: 'localhost:3000',
      })
    ).toBe('/dashboard?company_id=42');

    expect(
      resolvePostAuthDestination({
        user: makeUser('admin'),
        surface: 'public',
        currentHost: '127.0.0.1:3000',
      })
    ).toBe('/dashboard/sales/leads');
  });

  it('preserves canonical cross-subdomain URLs on production hosts', () => {
    expect(
      resolvePostAuthDestination({
        user: makeUser('review'),
        surface: 'public',
        currentHost: 'www.avaliasolar.com.br',
      })
    ).toBe('https://www.avaliasolar.com.br/review-dashboard');

    expect(
      resolvePostAuthDestination({
        user: makeUser('company'),
        surface: 'public',
        activeCompanyId: 42,
        activeMembershipsCount: 1,
        currentHost: 'www.avaliasolar.com.br',
      })
    ).toBe('https://app.avaliasolar.com.br/dashboard?company_id=42');

    expect(
      resolvePostAuthDestination({
        user: makeUser('admin'),
        surface: 'public',
        currentHost: 'www.avaliasolar.com.br',
      })
    ).toBe('https://crm.avaliasolar.com.br/dashboard/sales/leads');
  });
});

