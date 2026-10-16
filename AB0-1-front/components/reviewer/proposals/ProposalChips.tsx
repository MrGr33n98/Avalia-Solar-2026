'use client';

import React from 'react';
import {
  Check,
  CheckCircle2,
  Star,
  Camera,
  FileText,
  Clock,
  Shield,
  Zap,
  Wrench,
  ChevronRight,
  X,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * C1 — StatusChip "recebida", "em_analise", "escolhida", "concluida", "recusada"
 * Altura visual 22px, pill, padding 0x8px, ícone 12px, texto 11/14 600
 */
export type ProposalStatusType =
  | 'received'
  | 'under_review'
  | 'chosen'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'viewed';

export interface StatusChipProps {
  status: ProposalStatusType | string;
  dateStr?: string;
  className?: string;
}

export function StatusChip({ status, dateStr, className }: StatusChipProps) {
  let label = 'Proposta recebida';
  let badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  let Icon = CheckCircle2;

  switch (status) {
    case 'under_review':
    case 'draft':
      label = 'Em análise';
      badgeClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      Icon = Clock;
      break;
    case 'chosen':
    case 'accepted':
      label = 'Escolhida';
      badgeClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
      Icon = Check;
      break;
    case 'completed':
      label = 'Projeto concluído';
      badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      Icon = CheckCircle2;
      break;
    case 'rejected':
      label = 'Recusada';
      badgeClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = X;
      break;
    case 'expired':
      label = 'Expirada';
      badgeClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      Icon = Clock;
      break;
    case 'viewed':
      label = 'Visualizada';
      badgeClasses = 'bg-slate-50 text-slate-700 border-slate-200';
      Icon = Check;
      break;
    default:
      label = 'Proposta recebida';
      badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      Icon = CheckCircle2;
      break;
  }

  return (
    <div className={cn('flex flex-col items-end shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none shadow-2xs',
          badgeClasses
        )}
      >
        <Icon className="h-3 w-3 shrink-0" />
        <span>{label}</span>
      </span>
      {dateStr && (
        <span className="mt-1 text-[10px] font-medium text-slate-400 tabular-nums">
          em {dateStr}
        </span>
      )}
    </div>
  );
}

/**
 * C2 — Chip overlay do hero (detalhes da proposta)
 * Canto inferior direito da imagem hero, fundo branco 92% opaco, sombra suave
 */
export function HeroOverlayChip({
  title = 'Proposta recebida',
  dateStr = '06/10/2026',
}: {
  title?: string;
  dateStr?: string;
}) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/92 px-2.5 py-1.5 shadow-md backdrop-blur-xs text-right">
      <p className="text-[11px] font-bold text-slate-900 leading-tight">{title}</p>
      <p className="text-[10px] font-medium text-slate-500 tabular-nums">em {dateStr}</p>
    </div>
  );
}

/**
 * C3 — Chip benchmark ("Dentro da média da região", "Abaixo da média", "Acima da média")
 * Pill, altura 22px
 */
export function BenchmarkChip({
  type = 'average',
  label,
}: {
  type?: 'below' | 'average' | 'above';
  label?: string;
}) {
  const isBelow = type === 'below';
  const isAbove = type === 'above';

  const defaultText = isBelow
    ? 'Abaixo da média da região'
    : isAbove
    ? 'Acima da média da região'
    : 'Dentro da média da região';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none',
        isAbove
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      )}
    >
      {isBelow && <TrendingDown className="h-3 w-3 text-emerald-600" />}
      {isAbove && <TrendingUp className="h-3 w-3 text-amber-600" />}
      <span>{label || defaultText}</span>
    </span>
  );
}

/**
 * C4 — Contador da galeria (ex: 📷 1/12)
 * Fundo marinho 60%, texto branco 11px font-bold
 */
export function GalleryCounter({ current = 1, total = 12 }: { current?: number; total?: number }) {
  if (total <= 1) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs tabular-nums">
      <Camera className="h-3 w-3" />
      <span>
        {current}/{total}
      </span>
    </span>
  );
}

/**
 * C5 — Contador de página (PDF) (ex: 1 / 12)
 * Fundo marinho 75%, texto branco 11px
 */
export function PdfPageCounter({ current = 1, total = 12 }: { current?: number; total?: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs tabular-nums">
      {current} / {total}
    </span>
  );
}

/**
 * C6 — Chips segmentados (kWp)
 * Seleção única: 5, 8.5, 10, 15, Outro
 */
export function SegmentedChips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-1">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-10 rounded-lg text-xs font-semibold transition-all focus:outline-none min-h-[40px]',
              isSelected
                ? 'bg-blue-50 text-blue-700 border border-blue-600 font-bold shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * C7 — Toggle Sim / Não
 * 2 colunas iguais, altura 40px
 */
export function BooleanToggle({
  value,
  onChange,
  yesLabel = 'Sim',
  noLabel = 'Não',
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'h-10 rounded-xl text-xs font-semibold transition-all min-h-[40px]',
          value
            ? 'bg-blue-50 text-blue-700 border border-blue-600 font-bold shadow-2xs'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'h-10 rounded-xl text-xs font-semibold transition-all min-h-[40px]',
          !value
            ? 'bg-blue-50 text-blue-700 border border-blue-600 font-bold shadow-2xs'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        )}
      >
        {noLabel}
      </button>
    </div>
  );
}

/**
 * C8 & C9 — Chips de atalho e respostas sugeridas (Chat)
 * 32px altura, pill, touch-target >= 40px
 */
export function ChatQuickChips({
  chips,
  onSelect,
}: {
  chips: string[];
  onSelect: (chip: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(chip)}
          className="shrink-0 h-8 px-3 rounded-full border border-blue-200 bg-white text-xs font-medium text-blue-600 hover:bg-blue-50/50 transition-colors focus:outline-none min-h-[40px] flex items-center"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

/**
 * C11 — ContextChip (Barra de contexto na conversa)
 */
export function ContextChip({
  code,
  value,
  status = 'Recebida',
  onClick,
}: {
  code: string;
  value: string;
  status?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full h-8 px-3 rounded-xl border border-blue-200 bg-blue-50/80 text-xs font-medium text-slate-800 hover:bg-blue-100/70 transition-colors min-h-[40px]"
    >
      <span className="truncate">
        Proposta #{code} • {value} • {status}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1" />
    </button>
  );
}

/**
 * C12 — UnreadBadge
 * Fundo vermelho, texto branco
 */
export function UnreadBadge({ count }: { count?: number }) {
  if (count == null || count <= 0) return null;
  return (
    <span className="inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-2xs leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/**
 * C13 — VerifiedBadge (selo azul de verificado)
 */
export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white shrink-0"
      style={{ width: size, height: size }}
      aria-label="Empresa verificada"
      title="Empresa verificada no Avalia Solar"
    >
      <Check className="h-2.5 w-2.5 stroke-[3]" />
    </span>
  );
}

/**
 * C14 — Rating (★ 4,8 (126 avaliações))
 */
export function RatingBadge({
  rating,
  reviewsCount,
}: {
  rating?: number | string | null;
  reviewsCount?: number | null;
}) {
  if (!rating || Number(rating) <= 0) {
    return <span className="text-xs font-semibold text-slate-400">Novo</span>;
  }
  const formatted = typeof rating === 'number' ? rating.toFixed(1).replace('.', ',') : rating;

  return (
    <div className="inline-flex items-center gap-1 text-xs leading-none">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
      <span className="font-bold text-slate-800">{formatted}</span>
      {reviewsCount != null && reviewsCount > 0 && (
        <span className="font-normal text-slate-400 tabular-nums">({reviewsCount} avaliações)</span>
      )}
    </div>
  );
}

/**
 * C15 — Selo de confiança da empresa (3 colunas)
 */
export function TrustSealTile({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
      <Icon className="h-5 w-5 text-blue-600 mb-1" />
      <p className="text-[11px] font-bold text-slate-900 leading-tight">{title}</p>
      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{subtitle}</p>
    </div>
  );
}

/**
 * C16 — Tile de Comparação no topo da tela 4
 */
export function ComparisonTile({
  companyName,
  logoUrl,
  brandColor = '#2563EB',
  onRemove,
}: {
  companyName: string;
  logoUrl?: string;
  brandColor?: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative flex h-14 w-18 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${companyName} da comparação`}
        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow-xs hover:bg-slate-900 focus:outline-none"
      >
        <X className="h-3 w-3 stroke-[2.5]" />
      </button>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={companyName}
          className="h-7 w-full object-contain"
        />
      ) : (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs"
          style={{ backgroundColor: brandColor }}
        >
          {companyName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="mt-1 text-[10px] font-semibold text-slate-700 truncate w-full text-center">
        {companyName}
      </span>
    </div>
  );
}

/**
 * SpecRow — 3 colunas técnicas padronizadas do ProposalCard
 */
export function ProposalSpecRow({
  deadline = '45 dias',
  warranty = '10 anos',
  service = 'Instalação',
}: {
  deadline?: string;
  warranty?: string;
  service?: string;
}) {
  return (
    <div className="grid grid-cols-3 divide-x divide-slate-200/80 rounded-xl bg-slate-50/80 py-2 border border-slate-100 text-center">
      <div className="flex flex-col items-center justify-center px-1">
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium">Prazo</span>
        </div>
        <span className="mt-0.5 text-xs font-bold text-slate-800 tabular-nums">{deadline}</span>
      </div>

      <div className="flex flex-col items-center justify-center px-1">
        <div className="flex items-center gap-1 text-slate-400">
          <Shield className="h-3 w-3 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium">Garantia</span>
        </div>
        <span className="mt-0.5 text-xs font-bold text-slate-800 tabular-nums">{warranty}</span>
      </div>

      <div className="flex flex-col items-center justify-center px-1">
        <div className="flex items-center gap-1 text-slate-400">
          <Wrench className="h-3 w-3 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium">Escopo</span>
        </div>
        <span className="mt-0.5 text-xs font-bold text-slate-800 truncate max-w-full">{service}</span>
      </div>
    </div>
  );
}
