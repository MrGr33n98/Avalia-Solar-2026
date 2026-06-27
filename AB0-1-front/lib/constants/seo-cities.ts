// lib/constants/seo-cities.ts

export interface SeoCity {
  name: string;
  state: string;
  slug: string;
}

export const SEO_CITIES: SeoCity[] = [
  // Distrito Federal
  { name: 'Brasília', state: 'DF', slug: 'brasilia' },

  // São Paulo (SP)
  { name: 'São Paulo', state: 'SP', slug: 'sao-paulo' },
  { name: 'Campinas', state: 'SP', slug: 'campinas' },
  { name: 'Ribeirão Preto', state: 'SP', slug: 'ribeirao-preto' },
  { name: 'São José dos Campos', state: 'SP', slug: 'sao-jose-dos-campos' },
  { name: 'Sorocaba', state: 'SP', slug: 'sorocaba' },
  { name: 'Santos', state: 'SP', slug: 'santos' },
  { name: 'São José do Rio Preto', state: 'SP', slug: 'sao-jose-do-rio-preto' },
  { name: 'Jundiaí', state: 'SP', slug: 'jundiai' },
  { name: 'Bauru', state: 'SP', slug: 'bauru' },
  { name: 'Piracicaba', state: 'SP', slug: 'piracicaba' },
  { name: 'Osasco', state: 'SP', slug: 'osasco' },
  { name: 'Santo André', state: 'SP', slug: 'santo-andre' },
  { name: 'São Bernardo do Campo', state: 'SP', slug: 'sao-bernardo-do-campo' },

  // Rio de Janeiro (RJ)
  { name: 'Rio de Janeiro', state: 'RJ', slug: 'rio-de-janeiro' },
  { name: 'Niterói', state: 'RJ', slug: 'niteroi' },
  { name: 'São Gonçalo', state: 'RJ', slug: 'sao-goncalo' },
  { name: 'Duque de Caxias', state: 'RJ', slug: 'duque-de-caxias' },
  { name: 'Nova Iguaçu', state: 'RJ', slug: 'nova-iguacu' },
  { name: 'Campos dos Goytacazes', state: 'RJ', slug: 'campos-dos-goytacazes' },

  // Minas Gerais (MG)
  { name: 'Belo Horizonte', state: 'MG', slug: 'belo-horizonte' },
  { name: 'Uberlândia', state: 'MG', slug: 'uberlandia' },
  { name: 'Contagem', state: 'MG', slug: 'contagem' },
  { name: 'Juiz de Fora', state: 'MG', slug: 'juiz-de-fora' },
  { name: 'Betim', state: 'MG', slug: 'betim' },
  { name: 'Montes Claros', state: 'MG', slug: 'montes-claros' },
  { name: 'Uberaba', state: 'MG', slug: 'uberaba' },

  // Paraná (PR)
  { name: 'Curitiba', state: 'PR', slug: 'curitiba' },
  { name: 'Londrina', state: 'PR', slug: 'londrina' },
  { name: 'Maringá', state: 'PR', slug: 'maringa' },
  { name: 'Ponta Grossa', state: 'PR', slug: 'ponta-grossa' },
  { name: 'Cascavel', state: 'PR', slug: 'cascavel' },

  // Rio Grande do Sul (RS)
  { name: 'Porto Alegre', state: 'RS', slug: 'porto-alegre' },
  { name: 'Caxias do Sul', state: 'RS', slug: 'caxias-do-sul' },
  { name: 'Canoas', state: 'RS', slug: 'canoas' },
  { name: 'Pelotas', state: 'RS', slug: 'pelotas' },
  { name: 'Santa Maria', state: 'RS', slug: 'santa-maria' },

  // Santa Catarina (SC)
  { name: 'Florianópolis', state: 'SC', slug: 'florianopolis' },
  { name: 'Joinville', state: 'SC', slug: 'joinville' },
  { name: 'Blumenau', state: 'SC', slug: 'blumenau' },
  { name: 'São José', state: 'SC', slug: 'sao-jose' },
  { name: 'Chapecó', state: 'SC', slug: 'chapeco' },

  // Espírito Santo (ES)
  { name: 'Vitória', state: 'ES', slug: 'vitoria' },
  { name: 'Vila Velha', state: 'ES', slug: 'vila-velha' },
  { name: 'Serra', state: 'ES', slug: 'serra' },

  // Bahia (BA)
  { name: 'Salvador', state: 'BA', slug: 'salvador' },
  { name: 'Feira de Santana', state: 'BA', slug: 'feira-de-santana' },
  { name: 'Vitória da Conquista', state: 'BA', slug: 'vitoria-da-conquista' },

  // Ceará (CE)
  { name: 'Fortaleza', state: 'CE', slug: 'fortaleza' },
  { name: 'Caucaia', state: 'CE', slug: 'caucaia' },
  { name: 'Juazeiro do Norte', state: 'CE', slug: 'juazeiro-do-norte' },

  // Pernambuco (PE)
  { name: 'Recife', state: 'PE', slug: 'recife' },
  { name: 'Jaboatão dos Guararapes', state: 'PE', slug: 'jaboatao-dos-guararapes' },
  { name: 'Olinda', state: 'PE', slug: 'olinda' },
  { name: 'Caruaru', state: 'PE', slug: 'caruaru' },

  // Goiás (GO)
  { name: 'Goiânia', state: 'GO', slug: 'goiania' },
  { name: 'Aparecida de Goiânia', state: 'GO', slug: 'aparecida-de-goiania' },
  { name: 'Anápolis', state: 'GO', slug: 'anapolis' },

  // Outras Capitais Brasileiras
  { name: 'Manaus', state: 'AM', slug: 'manaus' },
  { name: 'Belém', state: 'PA', slug: 'belem' },
  { name: 'Ananindeua', state: 'PA', slug: 'ananindeua' },
  { name: 'São Luís', state: 'MA', slug: 'sao-luis' },
  { name: 'Maceió', state: 'AL', slug: 'maceio' },
  { name: 'Natal', state: 'RN', slug: 'natal' },
  { name: 'João Pessoa', state: 'PB', slug: 'joao-pessoa' },
  { name: 'Campina Grande', state: 'PB', slug: 'campina-grande' },
  { name: 'Teresina', state: 'PI', slug: 'teresina' },
  { name: 'Aracaju', state: 'SE', slug: 'aracaju' },
  { name: 'Cuiabá', state: 'MT', slug: 'cuiaba' },
  { name: 'Várzea Grande', state: 'MT', slug: 'varzea-grande' },
  { name: 'Campo Grande', state: 'MS', slug: 'campo-grande' },
  { name: 'Porto Velho', state: 'RO', slug: 'porto-velho' },
  { name: 'Rio Branco', state: 'AC', slug: 'rio-branco' },
  { name: 'Macapá', state: 'AP', slug: 'macapa' },
  { name: 'Boa Vista', state: 'RR', slug: 'boa-vista' },
  { name: 'Palmas', state: 'TO', slug: 'palmas' }
];
