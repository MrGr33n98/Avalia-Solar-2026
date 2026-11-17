'use client';

import { ReviewAction } from '@/components/company/ReviewAction';
import { buildCompanySubPath } from '@/lib/slug';

type ReviewCompanyButtonProps = {
  company: {
    id: number | string;
    slug?: string | null;
    name?: string | null;
  };
  label?: string;
  compactLabel?: string;
  className?: string;
  iconClassName?: string;
  stopPropagation?: boolean;
};

export default function ReviewCompanyButton({
  company,
  label = 'Deixe sua avaliação',
  compactLabel,
  className,
  iconClassName,
  stopPropagation = false,
}: ReviewCompanyButtonProps) {
  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);
  const accessibleName = company.name ? `Deixe sua avaliação de ${company.name}` : label;

  return (
    <ReviewAction
      href={reviewPath}
      label={label}
      compactLabel={compactLabel}
      ariaLabel={accessibleName}
      className={className}
      iconClassName={iconClassName}
      stopPropagation={stopPropagation}
    />
  );
}
