import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { CompanyVerifiedBadge } from './CompanyVerifiedBadge';
import { cn } from '@/lib/utils';
import { ElementType, ReactNode } from 'react';

interface CompanyIdentityLineProps {
  name: string;
  href?: string;
  verified?: boolean;
  sponsored?: boolean;
  className?: string; // Container classes
  nameClassName?: string; // Text classes
  badgeClassName?: string; // Verified badge classes
  as?: ElementType;
  children?: ReactNode; // Optional extra content next to name
}

export function CompanyIdentityLine({
  name,
  href,
  verified,
  sponsored,
  className,
  nameClassName,
  badgeClassName,
  as: Component = 'h3',
  children,
}: CompanyIdentityLineProps) {
  const NameComponent = (
    <Component className={cn("block truncate whitespace-nowrap", nameClassName)} title={name}>
      {name}
    </Component>
  );

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      {href ? (
        <Link href={href} className="min-w-0 flex-1 overflow-hidden focus:outline-none group">
          {NameComponent}
        </Link>
      ) : (
        <div className="min-w-0 flex-1 overflow-hidden">
          {NameComponent}
        </div>
      )}
      
      {children}
      
      {verified && <CompanyVerifiedBadge className={badgeClassName} />}
      
      {sponsored && (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
          <Megaphone className="h-2.5 w-2.5" aria-hidden="true" />
          Patrocinado
        </span>
      )}
    </div>
  );
}
