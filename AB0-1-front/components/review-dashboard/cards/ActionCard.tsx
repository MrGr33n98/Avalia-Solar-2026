'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
  href,
  onClick,
  className,
}: ActionCardProps) {
  const content = (
    <>
      <div className={cn('rounded-xl p-3 shrink-0 ring-1 ring-black/[0.03]', iconBgColor)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[12px] text-slate-500 leading-4">{description}</p>
      </div>
    </>
  );

  const sharedClasses = cn(
    'flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all shadow-[0_10px_30px_-24px_rgb(15_23_42_/_0.5)]',
    'hover:border-blue-200 hover:shadow-sm hover:-translate-y-[1px] cursor-pointer',
    className
  );

  if (href) {
    return (
      <Link href={href} className={sharedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(sharedClasses, 'text-left w-full')}>
      {content}
    </button>
  );
}
