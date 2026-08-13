'use client';

import { cn } from '@/lib/utils';

interface ReviewerPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode;
}

export function ReviewerPageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: ReviewerPageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-1 flex items-center gap-1.5 text-sm text-slate-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-slate-300">›</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-blue-600 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-9 text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
