import {
  isSafeReturnTo,
  resolvePostAuthDestination,
  hasCompanyWorkspaceAccess,
  resolveCompanyId,
} from './post-auth-destination';
import type { User } from '@/lib/api';

const user = (role: User['role']): User => ({
  id: 1,
  name: 'Usuário Teste',
  email: 'teste@example.com',
  role,
  created_at: '2026-08-05T00:00:00Z',
  updated_at: '2026-08-05T00:00:00Z',
});

// ─── hasCompanyWorkspaceAccess ─────────────────────────────────────────────────

describe('hasCompanyWorkspaceAccess', () => {
  it('retorna true para role=company independente de memberships', () => {
    expect(hasCompanyWorkspaceAccess({ user: user('company'), activeMembershipsCount: 0 })).toBe(true);
    expect(hasCompanyWorkspaceAccess({ user: user('company'), activeMembershipsCount: 3 })).toBe(true);
  });

  it('retorna true para role=review com memberships ativas', () => {
    expect(hasCompanyWorkspaceAccess({ user: user('review'), activeMembershipsCount: 1 })).toBe(true);
    expect(hasCompanyWorkspaceAccess({ user: user('review'), activeMembershipsCount: 3 })).toBe(true);
  });

  it('retorna false para role=review sem memberships', () => {
    expect(hasCompanyWorkspaceAccess({ user: user('review'), activeMembershipsCount: 0 })).toBe(false);
  });

  it('retorna false para role=admin (não entra no workspace empresarial via este helper)', () => {
    expect(hasCompanyWorkspaceAccess({ user: user('admin'), activeMembershipsCount: 5 })).toBe(false);
  });
});

describe('resolveCompanyId', () => {
  it('prioriza empresa persistida quando ela está entre memberships', () => {
    expect(resolveCompanyId({ userCompanyId: 42, membershipCompanyIds: [11, 42, 99] })).toBe(42);
  });

  it('usa primeira membership quando empresa persistida é inválida', () => {
    expect(resolveCompanyId({ userCompanyId: 7, membershipCompanyIds: [11, 42] })).toBe(11);
  });

  it('retorna null sem memberships', () => {
    expect(resolveCompanyId({ userCompanyId: 42, membershipCompanyIds: [] })).toBeNull();
  });
});

// ─── resolvePostAuthDestination ───────────────────────────────────────────────

describe('resolvePostAuthDestination', () => {
  // Cenário 1 — company, 0 memberships
  it('[C1] company sem membership → select-company', () => {
    expect(resolvePostAuthDestination({
      user: user('company'),
      activeMembershipsCount: 0,
    })).toBe('/select-company');
  });

  // Cenário 2 — company, 1 membership, com activeCompanyId
  it('[C2] company, 1 membership, empresa ativa → dashboard empresa', () => {
    expect(resolvePostAuthDestination({
      user: user('company'),
      activeMembershipsCount: 1,
      activeCompanyId: 42,
    })).toBe('/dashboard?company_id=42');
  });

  // Cenário 3 — company, 3 memberships, sem activeCompanyId → primeira membership
  it('[C3] company, 3 memberships, sem empresa ativa → select-company para resolução local', () => {
    expect(resolvePostAuthDestination({
      user: user('company'),
      activeMembershipsCount: 3,
    })).toBe('/select-company');
  });

  // Cenário 4 — review, 0 memberships → review-dashboard
  it('[C4] review puro sem membership → review-dashboard', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 0,
    })).toBe('/review-dashboard');
  });

  // Cenário 5 — review + creator
  it('[C5] review creator habilitado → feed', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 0,
      creatorEnabled: true,
      creatorSlug: 'felipe',
    })).toBe('/feed');
  });

  it('[C5b] creator sem slug → review-dashboard', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      creatorEnabled: true,
    })).toBe('/review-dashboard');
  });

  // Cenário 6 — review + membership ativa → workspace empresarial (identidade multi-contexto)
  it('[C6] review + 1 membership ativa → select-company (sem activeCompanyId ainda)', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 1,
    })).toBe('/select-company');
  });

  it('[C6b] review + 1 membership ativa + activeCompanyId → dashboard empresa', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 1,
      activeCompanyId: 99,
    })).toBe('/dashboard?company_id=99');
  });

  it('[C6c] review + 3 memberships sem empresa ativa → select-company chooser', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 3,
    })).toBe('/select-company');
  });

  // Cenário 7 — returnTo válido e compatível
  it('[C7] returnTo relativo compatível é preservado', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      returnTo: '/profile?tab=security',
    })).toBe('/profile?tab=security');
  });

  // Cenário 8 — returnTo incompatível com role
  it('[C8] returnTo incompatível com role review → ignora, resolve normal', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 0,
      returnTo: '/dashboard',
    })).toBe('/review-dashboard');
  });

  // returnTo para dashboard é compatível quando review tem memberships
  it('[C8b] returnTo /dashboard compatível com review+memberships', () => {
    expect(resolvePostAuthDestination({
      user: user('review'),
      activeMembershipsCount: 2,
      returnTo: '/dashboard',
    })).toBe('/dashboard');
  });

  // Cenário para admin
  it('admin → home (admin usa rota própria, não este resolver)', () => {
    expect(resolvePostAuthDestination({ user: user('admin') })).toBe('/');
  });
});

// ─── isSafeReturnTo ───────────────────────────────────────────────────────────

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

  it('aceita /dashboard como returnTo interno', () => {
    expect(isSafeReturnTo('/dashboard')).toBe(true);
  });
});
