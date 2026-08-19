import { shouldShowStrategicFooter } from '@/lib/footer-visibility';

describe('strategic footer visibility', () => {
  test.each([
    '/',
    '/about',
    '/blog',
    '/blog/como-escolher-uma-empresa',
    '/categories',
    '/categories/paineis-solares',
    '/companies',
    '/companies/weg',
    '/companies/weg/categories/carregadores-residenciais',
    '/compare',
    '/dados-do-setor',
    '/energia-solar/florianopolis-sc',
    '/melhores-empresas',
    '/products',
    '/products/inversor-weg',
    '/review-dashboard',
    '/review-dashboard/profile',
    '/review-dashboard/achievements',
    '/search',
    '/solucoes/energia-solar-residencial',
    '/creators/test',
  ])('shows on public strategic route %s', (pathname) => {
    expect(shouldShowStrategicFooter(pathname)).toBe(true);
  });

  test.each([
    '/admin/categories',
    '/auth/callback',
    '/chat',
    '/companies/weg/claim',
    '/companies/weg/quote',
    '/companies/weg/review',
    '/company-dashboard',
    '/dashboard',
    '/login',
    '/profile',
    '/register',
    '/reset-password/token',
    '/select-company',
    '/feed',
  ])('hides on operational route %s', (pathname) => {
    expect(shouldShowStrategicFooter(pathname)).toBe(false);
  });
});
