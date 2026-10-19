'use client';

import * as React from 'react';
import { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { track } from '@/lib/analytics/lazy';
import { useComparisonIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { openComparisonDock } from '@/lib/floating-widget-events';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';

export interface ComparisonToggleButtonProps {
  company: Company;
  variant?: 'default' | 'minimal' | 'card' | 'floating' | 'home-compact';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showPosition?: boolean;
  animated?: boolean;
  compactLabel?: boolean;
  disabled?: boolean;
}

export default function ComparisonToggleButton({
  company,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
}: ComparisonToggleButtonProps) {
  const {
    isInComparison,
    addToComparison,
    removeFromComparison,
    getCompanyPosition,
    canAddMore,
    count,
    maxComparison,
    isLoading: comparisonLoading,
  } = useComparison();

  const isSelected = isInComparison(company.id);
  const position = getCompanyPosition(company.id);
  const isPremium = Boolean(
    company.featured || company.plan_status === 'active' || company.has_paid_plan
  );

  const { trackComparisonUsage } = useComparisonIntent(String(company.id), {
    elementSelector: `comparison-toggle-${variant}`,
    metadata: {
      source: 'comparison_toggle_button',
    },
  });

  const handleCheckedChange = (nextChecked: boolean) => {
    if (nextChecked === isSelected) return;

    if (isSelected) {
      removeFromComparison(company.id);
      track('comparison_remove', {
        company_id: company.id,
        company_name: company.name,
        position: position,
        source: 'list',
      });
      trackComparisonUsage('remove', {
        company_name: company.name,
        comparison_count: Math.max(count - 1, 0),
        position: position || null,
      });
    } else {
      if (!canAddMore) return;
      addToComparison(company);
      openComparisonDock();
      track('comparison_add', {
        company_id: company.id,
        company_name: company.name,
        total_companies: count + 1,
        is_premium: isPremium,
        source: 'list',
      });
      trackComparisonUsage('add', {
        company_name: company.name,
        comparison_count: count + 1,
        is_premium: isPremium,
      });
    }
  };

  const isDisabled = disabled || comparisonLoading || (!isSelected && !canAddMore);

  const tooltipTitle = isSelected
    ? `Remover ${company.name} da comparação`
    : !canAddMore
      ? `Limite máximo de empresas atingido (${count}/${maxComparison})`
      : `Adicionar ${company.name} à comparação`;

  return (
    <CompareCheckboxControl
      companyName={company.name}
      checked={isSelected}
      disabled={isDisabled}
      onCheckedChange={handleCheckedChange}
      className={className}
      density={size === 'sm' || variant === 'home-compact' ? 'compact' : 'compact'}
      title={tooltipTitle}
    />
  );
}
