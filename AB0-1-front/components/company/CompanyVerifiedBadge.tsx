import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CompanyVerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn(
        "h-[18px] w-[18px] shrink-0 fill-blue-600 text-white",
        className
      )}
      aria-label="Perfil Verificado"
    />
  );
}
