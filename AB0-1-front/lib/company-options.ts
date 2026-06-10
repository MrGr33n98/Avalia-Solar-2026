import { BRAZIL_CAPITAL_SOLAR_PAGES } from '@/lib/locations/local-page-slugs';

export const COMPANY_PROJECT_TYPES = [
  'Residenciais',
  'Comerciais',
  'Rurais',
  'Industriais',
  'Condomínios',
  'Usinas de Solo',
  'Sistemas Off-grid',
  'Carregadores para Veículos Elétricos',
] as const;

export const COMPANY_SERVICES_OFFERED = [
  'Estudo Econômico',
  'Projeto',
  'Instalação',
  'Homologação',
  'Monitoramento',
  'Manutenção e Assistência Técnica',
  'Limpeza de Módulos',
  'O&M',
  'Consultoria',
  'Laudo Técnico',
  'Financiamento',
  'Pós-venda',
] as const;

export const BRAZIL_STATES_OPTIONS = [
  { state: 'AC', label: 'Acre' },
  { state: 'AL', label: 'Alagoas' },
  { state: 'AP', label: 'Amapá' },
  { state: 'AM', label: 'Amazonas' },
  { state: 'BA', label: 'Bahia' },
  { state: 'CE', label: 'Ceará' },
  { state: 'DF', label: 'Distrito Federal' },
  { state: 'ES', label: 'Espírito Santo' },
  { state: 'GO', label: 'Goiás' },
  { state: 'MA', label: 'Maranhão' },
  { state: 'MT', label: 'Mato Grosso' },
  { state: 'MS', label: 'Mato Grosso do Sul' },
  { state: 'MG', label: 'Minas Gerais' },
  { state: 'PA', label: 'Pará' },
  { state: 'PB', label: 'Paraíba' },
  { state: 'PR', label: 'Paraná' },
  { state: 'PE', label: 'Pernambuco' },
  { state: 'PI', label: 'Piauí' },
  { state: 'RJ', label: 'Rio de Janeiro' },
  { state: 'RN', label: 'Rio Grande do Norte' },
  { state: 'RS', label: 'Rio Grande do Sul' },
  { state: 'RO', label: 'Rondônia' },
  { state: 'RR', label: 'Roraima' },
  { state: 'SC', label: 'Santa Catarina' },
  { state: 'SP', label: 'São Paulo' },
  { state: 'SE', label: 'Sergipe' },
  { state: 'TO', label: 'Tocantins' },
] as const;

export const BRAZIL_CAPITAL_OPTIONS = BRAZIL_CAPITAL_SOLAR_PAGES.map((page) => ({
  value: page.city,
  label: `${page.city}/${page.state}`,
  state: page.state,
}));
