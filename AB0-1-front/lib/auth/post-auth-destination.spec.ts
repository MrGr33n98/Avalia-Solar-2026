import { isSafeReturnTo, resolvePostAuthDestination } from './post-auth-destination';
import type { User } from '@/lib/api';

const user = (role: User['role']): User => ({
  id: 1,
  name: 'Usuário Teste',
  email: 'teste@example.com',
  role,
  created_at: '2026-08-05T00:00:00Z',
  updated_at: '2026-08-05T00:00:00Z',
});

describe('resolvePostAuthDestination', () => {
  it('direciona avaliador para o dashboard correto', () => {
    expect(resolvePostAuthDestination({ user: user('review') })).toBe('/review-dashboard');
  });

  it('direciona creator habilitado para o feed', () => {
    expect(
      resolvePostAuthDestination({
        user: user('review'),
        creatorEnabled: true,
        creatorSlug: 'felipe-henrique-morais-almeida',
      })
    ).toBe('/feed');
  });

  it('usa dashboard quando creator não está habilitado ou slug ausente', () => {
    expect(resolvePostAuthDestination({ user: user('review'), creatorEnabled: false })).toBe(
      '/review-dashboard'
    );
    expect(resolvePostAuthDestination({ user: user('review'), creatorEnabled: true })).toBe(
      '/review-dashboard'
    );
  });

  it('direciona empresa vinculada para a empresa ativa', () => {
    expect(resolvePostAuthDestination({ user: user('company'), activeCompanyId: 42 })).toBe(
      '/dashboard?company_id=42'
    );
  });

  it('direciona empresa sem vínculo para seleção', () => {
    expect(resolvePostAuthDestination({ user: user('company') })).toBe('/select-company');
  });

  it('preserva retorno relativo compatível', () => {
    expect(
      resolvePostAuthDestination({ user: user('review'), returnTo: '/profile?tab=security' })
    ).toBe('/profile?tab=security');
  });

  it('recusa retorno incompatível com o papel', () => {
    expect(resolvePostAuthDestination({ user: user('review'), returnTo: '/dashboard' })).toBe(
      '/review-dashboard'
    );
  });
});

describe('isSafeReturnTo', () => {
  it.each(['https://evil.example', '//evil.example', '/login', '/reset-password/token'])(
    'recusa destino inseguro %s',
    (returnTo) => {
      expect(isSafeReturnTo(returnTo)).toBe(false);
    }
  );

  it('aceita caminho interno comum', () => {
    expect(isSafeReturnTo('/companies/solar')).toBe(true);
  });
});
