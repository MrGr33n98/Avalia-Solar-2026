export type PlanSlug = 'free' | 'essential' | 'pro' | 'enterprise';

export type Availability = 'included' | 'not_included' | 'contact_sales';

export interface PricingPlan {
  slug: PlanSlug;
  name: string;
  badge?: string;
  featured?: boolean;
  priceLabel: string;
  priceFormatted?: string;
  billingNote: string;
  summary: string;
  audience: string;
  ctaLabel: string;
  ctaHref: string;
  highlights: string[];
}

export interface PricingFeatureRow {
  key: string;
  label: string;
  description: string;
  availability: Record<PlanSlug, Availability>;
}

export interface PricingFeatureGroup {
  id: string;
  title: string;
  rows: PricingFeatureRow[];
}

export interface PricingFaq {
  question: string;
  answer: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    slug: 'free',
    name: 'Gratuito',
    priceLabel: 'R$ 0',
    billingNote: 'Presença inicial no marketplace',
    summary: 'Perfil básico para descoberta orgânica e comparação aberta no marketplace.',
    audience: 'Empresas que querem entrar na plataforma e validar presença.',
    ctaLabel: 'Começar grátis',
    ctaHref: '/register',
    highlights: [
      'Descrição básica do produto e da empresa',
      'Área de funcionalidades',
      'Links essenciais da empresa',
      'Alternativas e banners de concorrentes visíveis',
    ],
  },
  {
    slug: 'essential',
    name: 'Essencial',
    badge: 'Ótimo custo-benefício',
    priceLabel: 'R$ 59',
    billingNote: 'Mais presença, mais confiança',
    summary: 'Ideal para empresas que querem sair do perfil básico e aparecer com mais destaque na plataforma.',
    audience: 'Empresas que buscam se diferenciar com baixo custo.',
    ctaLabel: 'Começar no Essencial',
    ctaHref: '/register',
    highlights: [
      'Tudo do gratuito',
      'Perfil com destaque visual',
      'Botão de WhatsApp ou orçamento',
      'Links comerciais',
      'Sem anúncios de concorrentes no perfil',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    badge: 'Mais vendido',
    featured: true,
    priceLabel: 'R$ 150',
    billingNote: 'Vitrine comercial com conversão',
    summary: 'Transforma o perfil em um ativo de geração de demanda com merchandising, CTA e remoção de distração competitiva.',
    audience: 'Empresas que querem converter melhor e controlar a vitrine pública.',
    ctaLabel: 'Quero o Pro',
    ctaHref: '/register',
    highlights: [
      'Tudo do Essencial',
      'Banner promocional, descrição patrocinada e oferta especial',
      'FAQ, materiais baixáveis, mídia e destaque de avaliação',
      'Destaque em categorias estratégicas',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    badge: 'Sob consulta',
    priceLabel: 'Customizado',
    billingNote: 'Dados, integração e operação avançada',
    summary: 'Camada para operação comercial madura com sinais de intenção, integrações e governança mais forte.',
    audience: 'Empresas com equipe comercial ativa, stack própria e metas de operação previsível.',
    ctaLabel: 'Falar com vendas',
    ctaHref: '/contact',
    highlights: [
      'Tudo do Pro',
      'Leads qualificados e sinais de intenção',
      'Webhooks para CRM e integrações',
      'Relatórios de categoria, cidade e concorrência',
      'Governança comercial e suporte consultivo',
    ],
  },
];

export const pricingFeatureGroups: PricingFeatureGroup[] = [
  {
    id: 'public-profile',
    title: 'Perfil público e posicionamento',
    rows: [
      {
        key: 'product_description',
        label: 'Descrição do produto e informações adicionais',
        description: 'Base narrativa do perfil público e contexto comercial da empresa.',
        availability: { free: 'included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'product_features_block',
        label: 'Área de funcionalidades do produto',
        description: 'Bloco para explicar diferenciais funcionais e capacidades da solução.',
        availability: { free: 'included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'ideal_customer_block',
        label: 'Para quem é indicado',
        description: 'Direciona o discurso do perfil para o público certo e melhora conversão.',
        availability: { free: 'not_included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'company_links_block',
        label: 'Links da empresa e páginas de apoio',
        description: 'Consolida site, landing pages, páginas institucionais e rotas de apoio.',
        availability: { free: 'included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'faq_block',
        label: 'FAQ comercial',
        description: 'Bloco de dúvidas frequentes para reduzir objeção e acelerar contato.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
    ],
  },
  {
    id: 'conversion',
    title: 'Conversão e merchandising',
    rows: [
      {
        key: 'promo_banner',
        label: 'Banner promocional do produto',
        description: 'Espaço visual de alto impacto para campanha, posicionamento e diferenciação.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'custom_ctas',
        label: 'CTAs personalizados',
        description: 'Configuração de CTA orientada ao objetivo comercial da empresa.',
        availability: { free: 'not_included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'pricing_table',
        label: 'Área de planos e preços',
        description: 'Bloco para apresentar oferta, escopo e precificação do produto.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'special_offer',
        label: 'Oferta especial',
        description: 'Espaço para incentivo de conversão com destaque promocional.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'sponsored_description',
        label: 'Descrição patrocinada',
        description: 'Conteúdo com prioridade comercial e apresentação reforçada.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
    ],
  },
  {
    id: 'trust-content',
    title: 'Prova social e conteúdo rico',
    rows: [
      {
        key: 'verified_product',
        label: 'Produto verificado',
        description: 'Sinal de confiança visual e credibilidade no marketplace.',
        availability: { free: 'not_included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'highlight_badges',
        label: 'Selos de destaque',
        description: 'Elementos de reputação e confiança destacados no perfil.',
        availability: { free: 'not_included', essential: 'included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'featured_review',
        label: 'Destaque de avaliação',
        description: 'Permite evidenciar uma avaliação que ajude a converter melhor.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'downloadable_materials',
        label: 'Materiais baixáveis',
        description: 'Guias, catálogos, propostas e materiais de apoio ao comprador.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'media_gallery',
        label: 'Mídias do produto',
        description: 'Galeria de imagens e vídeos com contexto comercial.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
    ],
  },
  {
    id: 'insights',
    title: 'Dados, inteligência e integração',
    rows: [
      {
        key: 'advanced_analytics',
        label: 'Analytics avançado',
        description: 'Métricas detalhadas de tráfego, engajamento e performance comercial.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'included', enterprise: 'included' },
      },
      {
        key: 'leads_marketplace',
        label: 'Leads e oportunidades',
        description: 'Acesso comercial mais profundo às oportunidades do marketplace.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'not_included', enterprise: 'included' },
      },
      {
        key: 'intent_scores',
        label: 'Intent scores',
        description: 'Sinais de intenção para priorização comercial e leitura de demanda.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'not_included', enterprise: 'included' },
      },
      {
        key: 'webhooks',
        label: 'Webhooks e integrações',
        description: 'Saída operacional para CRM, automações e stack comercial própria.',
        availability: { free: 'not_included', essential: 'not_included', pro: 'not_included', enterprise: 'included' },
      },
    ],
  },
  {
    id: 'marketplace-behavior',
    title: 'Comportamento competitivo no marketplace',
    rows: [
      {
        key: 'show_alternatives',
        label: 'Alternativas visíveis no perfil',
        description: 'No gratuito, o visitante continua vendo alternativas da categoria.',
        availability: { free: 'included', essential: 'not_included', pro: 'not_included', enterprise: 'not_included' },
      },
      {
        key: 'show_competitor_banners',
        label: 'Banners de concorrentes no entorno',
        description: 'No gratuito, o perfil continua convivendo com merchandising competitivo.',
        availability: { free: 'included', essential: 'not_included', pro: 'not_included', enterprise: 'not_included' },
      },
    ],
  },
];

export const pricingFaqs: PricingFaq[] = [
  {
    question: 'O plano pago remove concorrentes do meu perfil?',
    answer:
      'Sim. O modelo da Avalia Solar parte da premissa de que os planos pagos devem reduzir fuga de atenção, removendo alternativas e banners de concorrentes no perfil público.',
  },
  {
    question: 'O plano Enterprise é obrigatório para usar o dashboard?',
    answer:
      'Não. O dashboard de gestão de perfil e avaliações existe para todos os parceiros, mas os módulos liberados variam por plano. O Enterprise concentra dados avançados, integração via webhooks, leads qualificados e governança.',
  },
  {
    question: 'Posso começar no gratuito e evoluir depois?',
    answer:
      'Sim. O desenho da plataforma é progressivo: o Gratuito garante presença básica no marketplace; o Essencial habilita o WhatsApp de contato e selo de destaque; o Pro amplia merchandising e conversão; o Enterprise adiciona inteligência, leads e integração.',
  },
];
