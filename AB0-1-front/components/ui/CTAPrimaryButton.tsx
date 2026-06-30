'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

import Link from 'next/link';

interface CTAPrimaryButtonProps extends ButtonProps {
  label?: string;
  href?: string;
  companyId?: string;
  companySlug?: string;
  ctaType?: 'budget' | 'lead' | 'contact' | 'external' | 'quote_request' | 'search_submitted' | 'blog_view';
  ctaDestination?: string;
  loading?: boolean;
  trackProps?: Record<string, any>;
}

/**
 * Standardized Primary CTA Button with built-in tracking
 * Following Growth Architect principles: clear hierarchy, consistent tracking
 */
export const CTAPrimaryButton = React.forwardRef<HTMLButtonElement, CTAPrimaryButtonProps>(
  ({ 
    children, 
    label = 'Solicitar Orçamento', 
    href,
    companyId, 
    companySlug, 
    ctaType = 'budget',
    ctaDestination,
    loading = false,
    trackProps = {},
    className,
    onClick,
    ...props 
  }, ref) => {
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Track event
      track('cta_click', {
        cta_label: label,
        cta_type: ctaType,
        cta_destination: ctaDestination,
        company_id: companyId,
        company_slug: companySlug,
        ...trackProps
      }, { critical: true });

      if (onClick) {
        onClick(e);
      }
    };

    const button = (
      <Button
        ref={ref}
        className={cn(
          "bg-[#FFF7ED] hover:bg-[#FFEED5] border border-[#FDBA74] text-[#C2410C] font-bold rounded-lg shadow-none transition-colors duration-150",
          "dark:bg-orange-950/20 dark:hover:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400",
          className
        )}
        onClick={handleClick}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processando...
          </>
        ) : (
          children || label
        )}
      </Button>
    );

    if (href) {
      return (
        <Link href={href} className="contents">
          {button}
        </Link>
      );
    }

    return button;
  }
);

CTAPrimaryButton.displayName = 'CTAPrimaryButton';
