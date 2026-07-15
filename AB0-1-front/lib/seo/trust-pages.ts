export type TrustPageSlug =
  | 'metodologia'
  | 'como-funciona-o-ranking'
  | 'empresas-verificadas'
  | 'criterios-de-avaliacao'
  | 'dados-do-setor';

export type TrustPageSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type TrustPageDefinition = {
  slug: TrustPageSlug;
  title: string;
  shortTitle: string;
  description: string;
  eyebrow: string;
  updatedAt: string;
  owner: string;
  quickAnswer: string;
  sections: TrustPageSection[];
  facts: string[];
  relatedLinks?: Array<{
    href: string;
    label: string;
    description: string;
  }>;
};

export const TRUST_PAGES: Record<TrustPageSlug, TrustPageDefinition> = {
  metodologia: {
    slug: 'metodologia',
    title: 'Metodologia do Avalia Solar',
    shortTitle: 'Metodologia',
    eyebrow: 'Transparencia operacional',
    description:
      'Entenda como o Avalia Solar organiza empresas, categorias, sinais de confianca, reviews e informacoes publicas para apoiar comparacao no setor solar.',
    updatedAt: '2026-07-15',
    owner: 'Produto, SEO e Operacoes',
    quickAnswer:
      'A metodologia do Avalia Solar combina dados declarados pelas empresas, sinais publicos de confianca, categorias de atuacao, localizacao, reviews e verificacoes operacionais. A plataforma nao vende nem instala sistemas solares; o objetivo e organizar informacoes para ajudar usuarios a comparar fornecedores com mais clareza antes do contato comercial.',
    facts: ['Dados visiveis ao usuario', 'Criterios revisaveis', 'Foco em comparacao'],
    sections: [
      {
        heading: 'O que avaliamos',
        body:
          'Avaliamos consistencia de cadastro, categoria de atuacao, area atendida, canais de contato, reputacao, reviews publicados, sinais de verificacao e informacoes comerciais relevantes para decisao.',
        bullets: [
          'nome publico e identificacao da empresa',
          'cidade, estado e regioes atendidas',
          'categorias e tipos de projeto',
          'reviews e nota media quando disponiveis',
          'sinais de verificacao e documentacao',
        ],
      },
      {
        heading: 'O que nao fazemos',
        body:
          'O Avalia Solar nao executa instalacoes, nao garante resultado tecnico de terceiros e nao substitui contrato, vistoria, ART, projeto eletrico ou analise financeira individual.',
      },
      {
        heading: 'Como a metodologia evolui',
        body:
          'Os criterios podem ser ajustados conforme qualidade dos dados, feedback de usuarios, novas categorias, mudancas regulatórias e necessidades de confianca do mercado.',
      },
    ],
  },
  'como-funciona-o-ranking': {
    slug: 'como-funciona-o-ranking',
    title: 'Como funciona o ranking do Avalia Solar',
    shortTitle: 'Ranking',
    eyebrow: 'Criterios de ordenacao',
    description:
      'Veja quais sinais podem influenciar ranking, destaque e ordenacao de empresas no Avalia Solar.',
    updatedAt: '2026-07-15',
    owner: 'Produto e Growth',
    quickAnswer:
      'O ranking do Avalia Solar considera sinais como relevancia da categoria, localizacao, verificacao, reputacao, reviews, qualidade do perfil, cobertura de atendimento e disponibilidade comercial. A ordenacao pode variar por pagina, filtro e contexto de busca para priorizar empresas mais relevantes para a intencao do usuario.',
    facts: ['Relevancia por contexto', 'Sinais de confianca', 'Filtros por localidade'],
    sections: [
      {
        heading: 'Sinais que podem influenciar',
        body:
          'A ordenacao pode considerar a combinacao de dados estruturados e sinais de utilidade para o usuario.',
        bullets: [
          'correspondencia com categoria pesquisada',
          'proximidade e cobertura comercial',
          'perfil completo e atualizado',
          'reviews e reputacao',
          'verificacao e sinais de confianca',
          'destaques comerciais identificados quando aplicavel',
        ],
      },
      {
        heading: 'Transparencia sobre destaque',
        body:
          'Quando uma empresa recebe destaque comercial, a interface deve tratar isso como sinal separado da reputacao organica para evitar confusao entre publicidade, verificacao e avaliacao.',
      },
      {
        heading: 'Por que rankings mudam',
        body:
          'Rankings podem mudar quando empresas atualizam cadastro, recebem reviews, alteram area de atendimento, melhoram verificacao ou quando o usuario aplica filtros diferentes.',
      },
    ],
  },
  'empresas-verificadas': {
    slug: 'empresas-verificadas',
    title: 'Empresas verificadas no Avalia Solar',
    shortTitle: 'Empresas verificadas',
    eyebrow: 'Sinais de confianca',
    description:
      'Entenda o que significa uma empresa verificada no Avalia Solar e quais limites esse sinal possui.',
    updatedAt: '2026-07-15',
    owner: 'Operacoes e Suporte',
    quickAnswer:
      'Uma empresa verificada no Avalia Solar possui sinais de cadastro, identificacao ou consistencia operacional revisados pela plataforma. Esse selo ajuda a reduzir incerteza inicial, mas nao substitui diligencia do consumidor, analise de contrato, validacao tecnica, garantias formais ou conferencia de documentacao antes da contratacao.',
    facts: ['Verificacao nao e garantia', 'Sinal visivel no perfil', 'Revisao operacional'],
    sections: [
      {
        heading: 'O que pode ser verificado',
        body:
          'A verificacao pode considerar dados cadastrais, canais oficiais, presenca digital, consistencia de informacoes, categoria declarada e materiais enviados pela empresa.',
      },
      {
        heading: 'Limites da verificacao',
        body:
          'A verificacao nao garante preco, prazo, qualidade tecnica, disponibilidade, resultado financeiro ou cumprimento futuro de contrato por parte da empresa listada.',
      },
      {
        heading: 'Como usuarios devem usar o sinal',
        body:
          'Use a verificacao como ponto de partida. Antes de contratar, compare propostas, leia reviews, confirme documentacao, solicite garantias por escrito e valide responsaveis tecnicos.',
      },
    ],
  },
  'criterios-de-avaliacao': {
    slug: 'criterios-de-avaliacao',
    title: 'Critérios de avaliação no Avalia Solar',
    shortTitle: 'Critérios de avaliação',
    eyebrow: 'Reviews e reputacao',
    description:
      'Conheça os critérios usados para organizar avaliações, reviews e sinais de reputação no Avalia Solar.',
    updatedAt: '2026-07-15',
    owner: 'Produto, Reviews e Suporte',
    quickAnswer:
      'Os criterios de avaliacao do Avalia Solar buscam medir experiencia, clareza comercial, atendimento, confianca, qualidade percebida e resposta da empresa quando existem reviews publicados. Reviews devem representar experiencias reais e nao substituem analise tecnica ou contratual antes da escolha de fornecedor.',
    facts: ['Reviews reais', 'Moderacao operacional', 'Contexto por empresa'],
    sections: [
      {
        heading: 'Criterios comuns',
        body:
          'Os criterios podem variar por fluxo, mas normalmente envolvem atendimento, clareza da proposta, confianca, documentacao, prazo, comunicacao e satisfacao geral.',
      },
      {
        heading: 'Moderacao',
        body:
          'Reviews podem ser moderados para remover spam, dados sensiveis, ataques pessoais, duplicidade ou conteudo que nao ajude outros usuarios a tomar uma decisao.',
      },
      {
        heading: 'Direito de resposta',
        body:
          'Empresas podem responder publicamente quando o fluxo estiver disponivel, especialmente para esclarecer pontos, corrigir informacoes e orientar proximos passos.',
      },
    ],
  },
  'dados-do-setor': {
    slug: 'dados-do-setor',
    title: 'Dados do setor solar no Avalia Solar',
    shortTitle: 'Dados do setor',
    eyebrow: 'Inteligencia de mercado',
    description:
      'Veja como o Avalia Solar pretende publicar dados agregados sobre categorias, localidades, reputação e comportamento de busca no setor solar.',
    updatedAt: '2026-07-15',
    owner: 'Produto, Dados e Conteudo',
    quickAnswer:
      'Os dados do setor no Avalia Solar devem ser publicados de forma agregada, sem expor informacoes privadas de usuarios ou empresas. A prioridade e transformar buscas, categorias, localidades, reviews e sinais de atendimento em insights uteis para consumidores, fornecedores, imprensa e pesquisadores do mercado solar.',
    facts: ['Dados agregados', 'Sem dados privados', 'Foco em insights citaveis'],
    sections: [
      {
        heading: 'Tipos de dados planejados',
        body:
          'A plataforma pode publicar rankings agregados, categorias mais buscadas, cobertura por cidade, sinais de reputacao, tempo de resposta e evolucao de demanda por tipo de projeto.',
      },
      {
        heading: 'Como evitar distorcao',
        body:
          'Dados devem ser acompanhados de metodologia, data de atualizacao, tamanho da amostra, limitacoes e explicacao do que pode ou nao ser concluido.',
      },
      {
        heading: 'Uso por IA e imprensa',
        body:
          'Relatorios com metodologia clara, tabelas e respostas curtas aumentam chance de citacao por mecanismos de busca, assistentes de IA e conteudo editorial.',
      },
    ],
    relatedLinks: [
      {
        href: '/dados-do-setor/cobertura-energia-solar-capitais',
        label: 'Cobertura de energia solar por capitais',
        description:
          'Tabela publica com capitais, UFs, slugs e URLs locais canonicas usadas na arquitetura programatica.',
      },
    ],
  },
};
