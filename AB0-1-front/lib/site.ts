import { BRAZIL_CAPITAL_SOLAR_PAGES } from '@/lib/locations/local-page-slugs';

export const SITE = {
  name: 'Avalia Solar',
  url: 'https://www.avaliasolar.com.br',
  description:
    'Compare empresas verificadas, produtos e encontre a melhor solução para sua casa ou empresa.',
  searchUrl: 'https://www.avaliasolar.com.br/search?q={search_term_string}',
  ogImagePath: '/opengraph-image',
} as const;

export const CONTACT = {
  founder: {
    name: 'Felipe',
    email: 'felipe@avaliasolar.com.br',
  },
  team: {
    email: 'felipe@avaliasolar.com.br',
  },
  phone: {
    display: '+55 65 9346-5055',
    e164: '+556593465055',
    href: 'tel:+556593465055',
  },
  hours: 'Segunda a sexta, 9h às 18h',
  coverage: 'Atendimento remoto em todo o Brasil',
} as const;

export const SOCIAL_PROFILES = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/avalia_solar/',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/avalia-solar/',
  },
] as const;

export const PUBLIC_CONTACT_CHANNELS = [
  {
    label: 'Fale com Felipe',
    href: `mailto:${CONTACT.founder.email}`,
    description: 'Parcerias, imprensa e alinhamento editorial.',
    display: CONTACT.founder.email,
  },
  {
    label: 'Fale com a equipe',
    href: `mailto:${CONTACT.team.email}`,
    description: 'Suporte, cadastro e dúvidas operacionais.',
    display: CONTACT.team.email,
  },
  {
    label: 'Telefone comercial',
    href: CONTACT.phone.href,
    description: CONTACT.hours,
    display: CONTACT.phone.display,
  },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: '/about', label: 'Sobre a Avalia Solar' },
  { href: '/careers', label: 'Carreiras' },
  { href: '/blog', label: 'Blog' },
] as const;

export const FOOTER_TRUST_LINKS = [
  { href: '/contact', label: 'Contato oficial' },
  { href: '/help', label: 'Central de ajuda' },
  { href: '/metodologia', label: 'Metodologia' },
  { href: '/como-funciona-o-ranking', label: 'Como funciona o ranking' },
  { href: '/empresas-verificadas', label: 'Empresas verificadas' },
  { href: '/criterios-de-avaliacao', label: 'Critérios de avaliação' },
  { href: '/press', label: 'Sala de imprensa' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: '/terms', label: 'Termos de uso' },
  { href: '/privacy', label: 'Privacidade' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/dmca', label: 'DMCA' },
] as const;

export const FOOTER_LOCAL_SOLAR_LINKS = BRAZIL_CAPITAL_SOLAR_PAGES.map((page) => ({
  href: page.href,
  label: `${page.city}/${page.state}`,
  state: page.state,
  city: page.city,
})) as readonly {
  href: string;
  label: string;
  state: string;
  city: string;
}[];

// Curadoria baseada em páginas locais indexáveis e densidade real de empresas.
// Florianópolis é uma prioridade editorial; as demais seguem relevância do marketplace.
const PRIORITY_LOCAL_SOLAR_KEYS = [
  'SC:florianopolis',
  'SP:sao-paulo',
  'MG:belo-horizonte',
  'PR:curitiba',
  'DF:brasilia',
  'GO:goiania',
] as const;

export const FOOTER_PRIORITY_LOCAL_SOLAR_LINKS = PRIORITY_LOCAL_SOLAR_KEYS.map((key) => {
  const [state, citySlug] = key.split(':');
  const page = BRAZIL_CAPITAL_SOLAR_PAGES.find(
    (candidate) => candidate.state === state && candidate.citySlug === citySlug
  );

  if (!page) throw new Error(`Footer local solar page not found: ${key}`);

  return {
    href: page.href,
    label: `Energia solar em ${page.city}`,
  };
});

export const FOOTER_DISCOVERY_SECTIONS = {
  companies: [
    { href: '/companies', label: 'Todas as empresas' },
    { href: '/categories/energia-solar', label: 'Empresas de energia solar' },
    { href: '/categories/instaladores-energia-solar', label: 'Instaladores de energia solar' },
    {
      href: '/categories/energia-solar-comercial-industrial',
      label: 'Energia comercial e industrial',
    },
    { href: '/empresas-verificadas', label: 'Empresas verificadas' },
    { href: '/categories', label: 'Ver todas as especialidades' },
  ],
  products: [
    { href: '/products', label: 'Todos os produtos' },
    { href: '/categories/paineis-solares', label: 'Painéis solares' },
    { href: '/categories/baterias-armazenamento', label: 'Baterias e armazenamento' },
    { href: '/categories/carregadores-residenciais', label: 'Carregadores residenciais' },
    { href: '/categories/mobilidade-eletrica', label: 'Mobilidade elétrica' },
    { href: '/products/compare', label: 'Comparar produtos' },
  ],
  content: [
    { href: '/blog', label: 'Guias e notícias' },
    { href: '/melhores-empresas', label: 'Melhores empresas' },
    { href: '/como-funciona-o-ranking', label: 'Como funciona o ranking' },
    { href: '/metodologia', label: 'Metodologia' },
    { href: '/criterios-de-avaliacao', label: 'Critérios de avaliação' },
    { href: '/dados-do-setor', label: 'Dados do setor' },
  ],
  support: [
    { href: '/help', label: 'Central de ajuda' },
    { href: '/contact', label: 'Fale conosco' },
    { href: '/terms', label: 'Termos de uso' },
    { href: '/privacy', label: 'Privacidade' },
    { href: '/cookies', label: 'Cookies' },
    { href: '/dmca', label: 'DMCA' },
  ],
} as const;

export const STATIC_SITEMAP_LAST_MODIFIED = '2026-04-14T00:00:00.000Z';

export function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
