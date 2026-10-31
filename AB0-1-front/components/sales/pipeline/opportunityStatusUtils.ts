import { Star, Bookmark, XCircle, Ban, CircleDot, LucideIcon } from 'lucide-react';

export type OpportunityStatusKey = 'won' | 'open' | 'lost' | 'cancelled' | 'pending';

export interface OpportunityStatusDefinition {
  key: OpportunityStatusKey;
  label: string;
  labelPt: string;
  icon: LucideIcon;
  iconColorClass: string;
  fillColorClass?: string;
  textColorClass: string;
  bgLightClass: string;
  borderClass: string;
  description: string;
}

export const OPPORTUNITY_STATUS_DEFINITIONS: Record<OpportunityStatusKey, OpportunityStatusDefinition> = {
  won: {
    key: 'won',
    label: 'Won',
    labelPt: 'Ganha',
    icon: Star,
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    fillColorClass: 'fill-emerald-600 dark:fill-emerald-400',
    textColorClass: 'text-emerald-700 dark:text-emerald-300',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    description: 'Negócio fechado e ganho',
  },
  open: {
    key: 'open',
    label: 'Open',
    labelPt: 'Aberta',
    icon: Bookmark,
    iconColorClass: 'text-sky-600 dark:text-sky-400',
    fillColorClass: 'fill-sky-600 dark:fill-sky-400',
    textColorClass: 'text-sky-700 dark:text-sky-300',
    bgLightClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200 dark:border-sky-800',
    description: 'Oportunidade em andamento',
  },
  lost: {
    key: 'lost',
    label: 'Lost',
    labelPt: 'Perdida',
    icon: XCircle,
    iconColorClass: 'text-slate-500 dark:text-slate-400',
    fillColorClass: 'fill-transparent',
    textColorClass: 'text-slate-600 dark:text-slate-300',
    bgLightClass: 'bg-slate-100 dark:bg-slate-800',
    borderClass: 'border-slate-200 dark:border-slate-700',
    description: 'Negócio perdido ou encerrado sem venda',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelled',
    labelPt: 'Cancelada',
    icon: Ban,
    iconColorClass: 'text-slate-500 dark:text-slate-400',
    fillColorClass: 'fill-transparent',
    textColorClass: 'text-slate-600 dark:text-slate-300',
    bgLightClass: 'bg-slate-100 dark:bg-slate-800',
    borderClass: 'border-slate-200 dark:border-slate-700',
    description: 'Oportunidade desqualificada ou cancelada',
  },
  pending: {
    key: 'pending',
    label: 'Pending',
    labelPt: 'Pendente',
    icon: CircleDot,
    iconColorClass: 'text-slate-400 dark:text-slate-500',
    fillColorClass: 'fill-transparent',
    textColorClass: 'text-slate-500 dark:text-slate-400',
    bgLightClass: 'bg-slate-50 dark:bg-slate-800/60',
    borderClass: 'border-slate-200 dark:border-slate-700',
    description: 'Oportunidade em espera ou pausada',
  },
};

export const STATUS_LIST: OpportunityStatusDefinition[] = [
  OPPORTUNITY_STATUS_DEFINITIONS.won,
  OPPORTUNITY_STATUS_DEFINITIONS.open,
  OPPORTUNITY_STATUS_DEFINITIONS.lost,
  OPPORTUNITY_STATUS_DEFINITIONS.cancelled,
  OPPORTUNITY_STATUS_DEFINITIONS.pending,
];

export function normalizeOpportunityStatus(rawStatus?: string | null): OpportunityStatusKey {
  if (!rawStatus) return 'open';
  const s = rawStatus.toLowerCase().trim();
  if (s === 'won' || s === 'win' || s === 'ganho' || s === 'ganha') return 'won';
  if (s === 'lost' || s === 'perda' || s === 'perdido' || s === 'perdida') return 'lost';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelado' || s === 'cancelada' || s === 'abandoned') {
    return 'cancelled';
  }
  if (s === 'pending' || s === 'pendente' || s === 'paused') return 'pending';
  return 'open';
}

export function getStatusConfig(rawStatus?: string | null, isHot = false) {
  const normalizedKey = normalizeOpportunityStatus(rawStatus);
  const base = OPPORTUNITY_STATUS_DEFINITIONS[normalizedKey];

  if (normalizedKey === 'open' && isHot) {
    return {
      ...base,
      iconColorClass: 'text-orange-500 dark:text-orange-400',
      fillColorClass: 'fill-orange-500 dark:fill-orange-400',
      textColorClass: 'text-orange-600 dark:text-orange-300',
      bgLightClass: 'bg-orange-50 dark:bg-orange-950/40',
      borderClass: 'border-orange-200 dark:border-orange-800',
      isHot: true,
    };
  }

  return {
    ...base,
    isHot: false,
  };
}

