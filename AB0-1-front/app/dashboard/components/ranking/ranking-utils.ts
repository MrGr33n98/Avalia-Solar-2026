import type { RankingData } from '@/lib/api';

export const QUALITY_FLAG_LABELS: Record<string, string> = {
  snapshot_processing: 'Primeiro ranking em processamento',
  snapshot_stale: 'Atualização pendente',
  population_empty: 'Sem empresas comparáveis neste escopo',
  local_ranking_preview_not_persisted: 'Comparação calculada em tempo real',
  trust_score_missing: 'Dados de confiança incompletos',
  stale_trust_score: 'Dados de confiança aguardando atualização',
};

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

export const translatedQualityFlags = (flags: string[] | undefined) =>
  (flags || []).map((flag) => QUALITY_FLAG_LABELS[flag] || 'Atualização de dados em andamento');

export const stateName = (state: string | null | undefined) =>
  state ? STATE_NAMES[state] || state : null;

export const comparisonScopeLabel = (scope: RankingData['comparison_scope']) => {
  if (!scope?.active) return null;
  const location = scope.city || stateName(scope.state);
  return location || scope.sector || 'escopo selecionado';
};

export const formatEligiblePopulation = (population: number | null | undefined) =>
  population == null ? null : `${population} ${population === 1 ? 'empresa elegível' : 'empresas elegíveis'}`;

export const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : null;

export const formatPosition = (position: number | null | undefined, population: number | null | undefined) => {
  if (position == null || population == null) return '—';
  return `${position}º de ${population}`;
};
