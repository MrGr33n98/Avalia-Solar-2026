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
}

export function AppBreadcrumb({ items, className }: AppBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only text-[11px] font-medium uppercase tracking-wider">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator className="text-gray-300" />
            <BreadcrumbItem>
              {item.active || !item.href ? (
                <BreadcrumbPage className="text-[11px] font-bold uppercase tracking-wider text-gray-900">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link 
                    href={item.href} 
                    className="text-[11px] font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
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
