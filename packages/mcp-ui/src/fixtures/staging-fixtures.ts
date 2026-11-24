import type {
  CompareIntegratorsPayload,
  GetIntegratorReputationPayload,
  ListIntegratorsPayload,
  ListSolarCategoriesPayload,
  ShowIntegratorProfilePayload,
} from '../contracts/schemas';

export const FIXTURE_CATEGORIES: ListSolarCategoriesPayload = {
  schema_version: '1.0.0',
  data_as_of: '2026-11-24T03:59:12Z',
  source_type: 'platform_derived',
  data: {
    categories: [
      {
        id: 16,
        name: 'Instalação Solar Residencial',
        slug: 'instalacao-solar-residencial',
        description: 'Sistemas fotovoltaicos para residências e condomínios.',
        parent_id: null,
        vertical: null,
      },
      {
        id: 17,
        name: 'Projetos Comerciais',
        slug: 'projetos-comerciais',
        description: 'Usinas e geração distribuída para empresas e indústrias.',
        parent_id: null,
        vertical: null,
      },
      {
        id: 18,
        name: 'Energia Solar Rural',
        slug: 'energia-solar-rural',
        description: 'Bombeamento, irrigação e sistemas para o agronegócio.',
        parent_id: null,
        vertical: null,
      },
      {
        id: 19,
        name: 'Carregadores Veiculares (EV)',
        slug: 'carregadores-veiculares',
        description: 'Infraestrutura de recarga residencial e frotas elétricas.',
        parent_id: null,
        vertical: null,
      },
    ],
    next_cursor: null,
  },
  limitations: [
    'O campo vertical é desconhecido até que a taxonomia seja formalmente validada.',
  ],
};

export const FIXTURE_INTEGRATORS: ListIntegratorsPayload = {
  schema_version: '1.0.0',
  data_as_of: '2026-11-24T03:59:12Z',
  source_type: 'company_declared',
  data: {
    integrators: [
      {
        id: 3,
        name: 'Solar Staging Alfa LTDA',
        slug: 'solar-staging-alfa',
        profile_url: 'https://www.avaliasolar.com.br/companies/solar-staging-alfa',
        logo_url: null,
        headquarters: { city: 'Florianópolis', state: 'SC' },
        declared_coverage: { states: ['SC'], cities: ['Florianópolis', 'São José'] },
        verification_state: 'platform_verified',
        rating_average: 5.0,
        rating_count: 1,
        categories: [
          { id: 16, name: 'Instalação Solar Residencial', slug: 'instalacao-solar-residencial' },
        ],
      },
      {
        id: 4,
        name: 'Solar Staging Beta Engenharia Fotovoltaica e Armazenamento Inteligente LTDA',
        slug: 'solar-staging-beta',
        profile_url: 'https://www.avaliasolar.com.br/companies/solar-staging-beta',
        logo_url: null,
        headquarters: { city: 'Joinville', state: 'SC' },
        declared_coverage: { states: [], cities: [] },
        verification_state: 'unverified',
        rating_average: null,
        rating_count: 0,
        categories: [
          { id: 17, name: 'Projetos Comerciais', slug: 'projetos-comerciais' },
          { id: 18, name: 'Energia Solar Rural', slug: 'energia-solar-rural' },
          { id: 19, name: 'Carregadores Veiculares (EV)', slug: 'carregadores-veiculares' },
        ],
      },
      {
        id: 5,
        name: 'Helios Sul Energia Solar',
        slug: 'helios-sul-energia',
        profile_url: 'https://www.avaliasolar.com.br/companies/helios-sul-energia',
        logo_url: null,
        headquarters: { city: 'Curitiba', state: 'PR' },
        declared_coverage: { states: ['PR', 'SC'], cities: ['Curitiba', 'Maringá'] },
        verification_state: 'platform_verified',
        rating_average: 4.82,
        rating_count: 1042,
        categories: [
          { id: 16, name: 'Instalação Solar Residencial', slug: 'instalacao-solar-residencial' },
          { id: 17, name: 'Projetos Comerciais', slug: 'projetos-comerciais' },
        ],
      },
    ],
    next_cursor: 'cursor-page-2-example',
  },
  limitations: [
    'Cidade da sede não comprova cobertura de atendimento.',
    'Informações declaradas e avaliações devem ser verificadas na página pública.',
  ],
};

export const FIXTURE_PROFILE: ShowIntegratorProfilePayload = {
  schema_version: '1.0.0',
  data_as_of: '2026-11-24T03:59:12Z',
  source_type: 'company_declared',
  data: {
    integrator: {
      ...FIXTURE_INTEGRATORS.data.integrators[0],
      description:
        'Projeto, homologação na concessionária e instalação de sistemas fotovoltaicos residenciais e comerciais com monitoramento remoto.',
      services: [
        'Projeto fotovoltaico',
        'Homologação junto à distribuidora',
        'Manutenção preventiva e limpeza',
      ],
    },
  },
  limitations: ['Cobertura geográfica informada pela empresa, não necessariamente verificada.'],
};

export const FIXTURE_REPUTATION_ZERO: GetIntegratorReputationPayload = {
  schema_version: '1.0.0',
  data_as_of: '2026-11-24T03:59:12Z',
  source_type: 'review_aggregate',
  data: {
    total_approved: 0,
    average_rating: null,
    rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    verified_total: 0,
    replied_total: 0,
    sample_size: 0,
  },
  limitations: [
    'Somente avaliações aprovadas são incluídas.',
    'Não há inferência de qualidade quando a amostra é vazia.',
  ],
};

export const FIXTURE_REPUTATION_LARGE: GetIntegratorReputationPayload = {
  schema_version: '1.0.0',
  data_as_of: '2026-11-24T03:59:12Z',
  source_type: 'review_aggregate',
  data: {
    total_approved: 1042,
    average_rating: 4.82,
    rating_distribution: { '1': 12, '2': 8, '3': 30, '4': 112, '5': 880 },
    verified_total: 615,
    replied_total: 740,
    sample_size: 1042,
  },
  limitations: [
    'Somente avaliações aprovadas são incluídas.',
  ],
};

export const FIXTURE_COMPARE: CompareIntegratorsPayload = {
  schema_version: '1.0.0',
  data_as_of: '2026-11-24T03:59:12Z',
  source_type: 'platform_derived',
  data: {
    companies: [
      {
        id: 3,
        name: 'Solar Staging Alfa LTDA',
        slug: 'solar-staging-alfa',
        profile_url: 'https://www.avaliasolar.com.br/companies/solar-staging-alfa',
        logo_url: null,
        verification_state: 'platform_verified',
      },
      {
        id: 4,
        name: 'Solar Staging Beta Engenharia Fotovoltaica LTDA',
        slug: 'solar-staging-beta',
        profile_url: 'https://www.avaliasolar.com.br/companies/solar-staging-beta',
        logo_url: null,
        verification_state: 'unverified',
      },
      {
        id: 5,
        name: 'Helios Sul Energia Solar',
        slug: 'helios-sul-energia',
        profile_url: 'https://www.avaliasolar.com.br/companies/helios-sul-energia',
        logo_url: null,
        verification_state: 'platform_verified',
      },
    ],
    comparison_matrix: {
      reputation: {
        '3': { total_approved: 1, average_rating: 5.0 },
        '4': { total_approved: 0, average_rating: null },
        '5': { total_approved: 1042, average_rating: 4.82 },
      },
      headquarters: {
        '3': { city: 'Florianópolis', state: 'SC' },
        '4': { city: 'Joinville', state: 'SC' },
        '5': { city: 'Curitiba', state: 'PR' },
      },
      declared_coverage: {
        '3': { states: ['SC'], cities: ['Florianópolis'] },
        '4': null,
        '5': { states: ['PR', 'SC'], cities: ['Curitiba', 'Maringá'] },
      },
      categories: {
        '3': [{ id: 16, name: 'Instalação Solar Residencial', slug: 'instalacao-solar-residencial' }],
        '4': [{ id: 17, name: 'Projetos Comerciais', slug: 'projetos-comerciais' }],
        '5': [
          { id: 16, name: 'Instalação Solar Residencial', slug: 'instalacao-solar-residencial' },
          { id: 17, name: 'Projetos Comerciais', slug: 'projetos-comerciais' },
        ],
      },
      services: {
        '3': ['Projeto fotovoltaico', 'Homologação'],
        '4': null,
        '5': ['Residencial', 'Comercial', 'Monitoramento'],
      },
    },
    unknown_fields: ['4:declared_coverage', '4:services'],
    criteria_used: ['reputation', 'headquarters', 'declared_coverage', 'categories', 'services'],
  },
  limitations: [
    'Comparação informativa; não identifica melhor empresa ou vencedor absoluto.',
    'Patrocínio não influencia esta matriz.',
    'Ausência de evidência é desconhecida, não resposta negativa.',
  ],
};

