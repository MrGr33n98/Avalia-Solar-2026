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
    email: 'admin@avaliasolar.com.br',
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
  { href: '/press', label: 'Sala de imprensa' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: '/terms', label: 'Termos de uso' },
  { href: '/privacy', label: 'Privacidade' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/dmca', label: 'DMCA' },
] as const;

export const STATIC_SITEMAP_LAST_MODIFIED = '2026-04-14T00:00:00.000Z';

export function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
