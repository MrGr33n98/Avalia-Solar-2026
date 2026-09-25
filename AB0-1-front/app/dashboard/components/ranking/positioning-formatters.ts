import {
  ShieldCheck,
  CheckCircle2,
  Star,
  Award,
  Users,
  TrendingUp,
  Eye,
  Filter,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface BreakdownItemDef {
  key: string;
  label: string;
  icon: LucideIcon;
  maxScore: number;
}

export const AUTHORITY_FACTORS: BreakdownItemDef[] = [
  { key: 'trust_score', label: 'Trust Score', icon: ShieldCheck, maxScore: 45 },
  { key: 'verification', label: 'Verificação', icon: CheckCircle2, maxScore: 20 },
  { key: 'review_credibility', label: 'Credibilidade de avaliações', icon: Star, maxScore: 15 },
  { key: 'badge_depth', label: 'Badges e certificações', icon: Award, maxScore: 10 },
  { key: 'social_proof', label: 'Prova social e presença', icon: Users, maxScore: 10 },
];

export const EXECUTION_FACTORS: BreakdownItemDef[] = [
  { key: 'leads', label: 'Geração de leads', icon: TrendingUp, maxScore: 35 },
  { key: 'engagement', label: 'Engajamento', icon: Eye, maxScore: 25 },
  { key: 'conversion_efficiency', label: 'Eficiência de conversão', icon: Filter, maxScore: 20 },
  { key: 'operational_maturity', label: 'Maturidade operacional', icon: Settings, maxScore: 10 },
];

export function formatScore(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '0.0';
  return Number(value).toFixed(1);
}

export function formatDiff(diff: number): string {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}`;
}
