'use client';

import { toast } from 'sonner';
import type { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';
import { track } from '@/lib/analytics/lazy';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';

/**
 * Research-intent action (public in all plan tiers).
 * Rendering in the identity header keeps this concern separate from the paid
 * conversion CTAs without changing the comparison store or analytics contract.
 */
export default function CompanyCompareToggle({ company }: { company: Company }) {
  const companyId = Number(company.id);
  const { isInComparison, addToComparison, removeFromComparison, canAddMore } = useComparison();
  const checked = isInComparison(companyId);

  const handleCheckedChange = (next: boolean) => {
    if (next === checked) return;

    if (next) {
      if (!canAddMore) return;
      track('company_compare_click', {
        company_id: company.id,
        company_name: company.name,
        action: 'add',
      });
      sendIntentSignal({
        company_id: company.id,
        signal_type: 'comparison_usage',
        signal_category: 'research_intent',
        element_type: 'comparison_toggle',
        metadata: { action: 'add', source: 'company_hero' },
      });
      addToComparison(company);
      toast.success(`${company.name} adicionada para comparação!`);
      return;
    }

    track('company_compare_click', {
      company_id: company.id,
      company_name: company.name,
      action: 'remove',
    });
    removeFromComparison(companyId);
    toast.info(`${company.name} removida da comparação.`);
  };

  return (
    <CompareCheckboxControl
      companyName={company.name}
      checked={checked}
      disabled={!checked && !canAddMore}
      onCheckedChange={handleCheckedChange}
      density="comfortable"
      className="!px-1 min-[380px]:!px-2 [&>span:last-child]:text-[12px] min-[380px]:[&>span:last-child]:text-[13px] [&>span:last-child]:font-medium"
    />
  );
}
