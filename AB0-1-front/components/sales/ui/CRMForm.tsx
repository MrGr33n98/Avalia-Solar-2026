'use client';

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CRMFormFieldProps {
  label?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  children: ReactNode;
  className?: string;
}

export function CRMFormField({
  label,
  required,
  error,
  helperText,
  children,
  className,
}: CRMFormFieldProps) {
  return (
    <div className={cn('space-y-2 font-sans', className)}>
      {label && (
        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>}
    </div>
  );
}

interface CRMFormRowProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function CRMFormRow({ children, cols = 2, className }: CRMFormRowProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return <div className={cn('grid gap-6', gridCols, className)}>{children}</div>;
}

interface CRMFormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function CRMFormSection({ title, description, children, className }: CRMFormSectionProps) {
  return (
    <div className={cn('space-y-5 pt-3 border-t border-slate-100 first:border-t-0 first:pt-0', className)}>
      {(title || description) && (
        <div>
          {title && <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">{title}</h4>}
          {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  );
}
