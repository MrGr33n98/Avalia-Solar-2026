'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './ReviewAction.module.css';

export interface ReviewActionProps {
  /** Keep the caller's current review destination (or use onClick for an in-page flow). */
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  label?: string;
  compactLabel?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
  title?: string;
  testId?: string;
  className?: string;
  iconClassName?: string;
  stopPropagation?: boolean;
}

/**
 * Avalia Solar / opção 07 — Open feedback.
 * Uma única apresentação do CTA de avaliação no PWA e web; a navegação
 * e as políticas de acesso permanecem com cada superfície chamadora.
 */
export function ReviewAction({
  href,
  onClick,
  label = 'Deixe sua avaliação',
  compactLabel,
  iconOnly = false,
  ariaLabel,
  title,
  testId,
  className,
  iconClassName,
  stopPropagation = false,
}: ReviewActionProps) {
  const content = (
    <>
      <MessageCircle className={cn(styles.icon, iconClassName)} aria-hidden="true" />
      {!iconOnly && (
        compactLabel ? (
          <>
            <span className={cn(styles.label, 'sm:hidden')} aria-hidden="true">{compactLabel}</span>
            <span className={cn(styles.label, 'hidden sm:inline')} aria-hidden="true">{label}</span>
          </>
        ) : <span className={styles.label}>{label}</span>
      )}
    </>
  );

  const accessibleName = ariaLabel || label;
  const actionClass = cn(styles.action, iconOnly && styles.iconOnly, className);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (stopPropagation) event.stopPropagation();
    onClick?.(event);
  };

  if (href) {
    return (
      <Link
        href={href}
        aria-label={accessibleName}
        title={title}
        data-testid={testId}
        className={actionClass}
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={accessibleName}
      title={title}
      data-testid={testId}
      className={actionClass}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}
