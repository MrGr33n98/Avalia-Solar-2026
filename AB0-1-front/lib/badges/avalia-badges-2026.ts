import type { Badge } from '@/lib/api';

/**
 * Catálogo de campanhas 2026. Estes são CANDIDATOS a conquistas.
 * Somente o registro oficial em badges + company_badges concede um badge.
 * Nenhuma assinatura paga é necessária para conquistar reconhecimento.
 */
export type AvaliaBadgeCategory = 'geral' | 'comercial' | 'residencial';

export interface AvaliaBadgeDefinition {
  id: string;
  title: string;
  shortLabel: string;
  edition: string;
  segment: AvaliaBadgeCategory;
  image: string;
  criterion: string;
  mission: string;
  evidence: string;
}

const PATH = '/assets/badges/2026/';

export const AVALIA_BADGES_2026: readonly AvaliaBadgeDefinition[] = [
  {
    id: 'pioneira-2026',
    title: 'Pioneira 2026',
    shortLabel: 'Primeira geração',
    edition: '2026',
    segment: 'geral',
    image: PATH + 'pioneira-2026.svg',
    criterion: 'Participar da primeira geração de empresas de Santa Catarina, dentro do lote inicial publicado pela plataforma, com perfil reivindicado e validado.',
    mission: 'Reivindique seu perfil e conclua a validação cadastral para participar da campanha inaugural.',
    evidence: 'Concessão pela equipe Avalia Solar; quantidade e período definidos no regulamento da campanha.',
  },
  {
    id: 'lider-de-categoria',
    title: 'Líder de Categoria',
    shortLabel: 'Reconhecimento competitivo',
    edition: '2026',
    segment: 'geral',
    image: PATH + 'lider-de-categoria.svg',
    criterion: 'Classificação superior na categoria com amostra suficiente de avaliações autênticas e metodologia pública, em uma temporada concluída.',
    mission: 'Cultive avaliações genuínas e mantenha informações consistentes sobre suas soluções.',
    evidence: 'Apuração por categoria e período; não é concedido automaticamente por quantidade de avaliações.',
  },
  {
    id: 'lider-de-crescimento',
    title: 'Líder de Crescimento',
    shortLabel: 'Evolução de reputação',
    edition: '2026',
    segment: 'geral',
    image: PATH + 'lider-de-crescimento.svg',
    criterion: 'Crescimento consistente de engajamento e reputação entre dois períodos comparáveis, com base amostral suficiente.',
    mission: 'Acompanhe a evolução de avaliações legítimas ao longo de mais de um período.',
    evidence: 'Comparação de períodos encerrados; não confundir aumento de visitas com mérito competitivo.',
  },
  {
    id: 'referencia-regional',
    title: 'Referência Regional',
    shortLabel: 'Destaque local',
    edition: '2026',
    segment: 'geral',
    image: PATH + 'referencia-regional.svg',
    criterion: 'Destaque em avaliação de clientes na cidade ou região de atuação, com amostra mínima, comparação justa e localização validada.',
    mission: 'Mantenha a região atendida atualizada e estimule avaliações autênticas de clientes.',
    evidence: 'A equipe valida o recorte geográfico, os concorrentes elegíveis e o período.',
  },
  {
    id: 'melhor-suporte',
    title: 'Melhor Suporte',
    shortLabel: 'Atendimento e pós-venda',
    edition: '2026',
    segment: 'geral',
    image: PATH + 'melhor-suporte.svg',
    criterion: 'Desempenho destacado nos critérios auditáveis de atendimento e suporte avaliados por clientes reais.',
    mission: 'Responda avaliações e aperfeiçoe a experiência de atendimento e pós-venda.',
    evidence: 'Exige avaliações sobre suporte em amostra qualificada; simples resposta não garante o título.',
  },
  {
    id: 'especialista-comercial',
    title: 'Especialista Comercial',
    shortLabel: 'Segmento comercial',
    edition: '2026',
    segment: 'comercial',
    image: PATH + 'especialista-comercial.svg',
    criterion: 'Atuação comprovada em projetos e soluções comerciais, validada pelo portfólio e pelas categorias da empresa.',
    mission: 'Documente as soluções para estabelecimentos e negócios e solicite validação da especialidade.',
    evidence: 'Reconhecimento de especialidade, não de liderança, preço ou satisfação.',
  },
  {
    id: 'especialista-residencial',
    title: 'Especialista Residencial',
    shortLabel: 'Segmento residencial',
    edition: '2026',
    segment: 'residencial',
    image: PATH + 'especialista-residencial.svg',
    criterion: 'Atuação comprovada em projetos e soluções residenciais, validada pelo portfólio e pelas categorias da empresa.',
    mission: 'Documente projetos residenciais e solicite validação da especialidade.',
    evidence: 'Reconhecimento de especialidade, não de liderança, preço ou satisfação.',
  },
];

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Só combina um selo com um registro que já tenha sido atribuído pelo backend.
 * Nenhuma métrica ou assinatura gera concessão na interface.
 */
export function findOfficialAward(definition: AvaliaBadgeDefinition, awards: readonly Badge[]): Badge | undefined {
  return awards.find((award) => {
    if (!award || !award.id || !award.public_slug) return false;
    const name = normalize(award.name || '');
    const slug = normalize(award.public_slug);
    return name === normalize(definition.title) ||
      slug === definition.id ||
      slug.startsWith(definition.id + '-');
  });
}

/** O link de verificação sempre permanece no nosso próprio domínio. */
export function officialBadgeUrl(award: Badge): string | null {
  if (!award.public_slug) return null;
  return '/badges/' + encodeURIComponent(award.public_slug);
}

export function badgeEmbedHtml(definition: AvaliaBadgeDefinition, award: Badge): string | null {
  const verificationPath = officialBadgeUrl(award);
  if (!verificationPath) return null;
  const url = 'https://www.avaliasolar.com.br';
  return [
    '<a href="' + url + verificationPath + '" target="_blank" rel="noopener noreferrer" title="Verificar reconhecimento Avalia Solar">',
    '  <img src="' + url + definition.image + '" width="160" height="187" alt="Selo ' + definition.title + ' — Avalia Solar" loading="lazy" />',
    '</a>',
  ].join('\n');
}
