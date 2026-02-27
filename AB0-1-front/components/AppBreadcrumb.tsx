'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

export interface BreadcrumbItemData {
  label: string;
  href?: string;
  active?: boolean;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItemData[];
  className?: string;
  compact?: boolean;
}

export function AppBreadcrumb({ items, className, compact = false }: AppBreadcrumbProps) {
  const homeClassName = compact
    ? 'flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors'
    : 'flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors';
  const homeIconClassName = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const homeLabelClassName = compact
    ? 'sr-only sm:not-sr-only text-[10px] font-medium tracking-[0.02em]'
    : 'sr-only sm:not-sr-only text-[11px] font-medium uppercase tracking-wider';
  const separatorClassName = compact ? 'text-slate-300 [&>svg]:size-3' : 'text-gray-300';
  const pageClassName = compact
    ? 'text-[10px] font-semibold tracking-[0.02em] text-slate-900'
    : 'text-[11px] font-bold uppercase tracking-wider text-gray-900';
  const linkClassName = compact
    ? 'text-[10px] font-medium tracking-[0.02em] text-slate-500 hover:text-slate-900 transition-colors'
    : 'text-[11px] font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors';

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className={compact ? 'gap-1 text-[10px] text-slate-500 sm:gap-1.5' : undefined}>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className={homeClassName}>
              <Home className={homeIconClassName} />
              <span className={homeLabelClassName}>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator className={separatorClassName} />
            <BreadcrumbItem>
              {item.active || !item.href ? (
                <BreadcrumbPage className={pageClassName}>
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link 
                    href={item.href} 
                    className={linkClassName}
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
