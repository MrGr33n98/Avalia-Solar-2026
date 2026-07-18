import Link from 'next/link';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface BlogPromoBannerProps {
  type?: 'promotional' | 'informative';
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  className?: string;
  onClose?: () => void;
}

export function BlogPromoBanner({
  type = 'informative',
  title,
  message,
  ctaText,
  ctaUrl,
  className = '',
  onClose,
}: BlogPromoBannerProps) {
  const isPromo = type === 'promotional';
  
  return (
    <div className={cn(
      'rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 border shadow-sm',
      isPromo 
        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20' 
        : 'bg-slate-50 border-slate-200',
      className
    )}>
      <div className="flex-1 text-center md:text-left">
        <h3 className={cn("font-bold text-lg", isPromo ? "text-primary" : "text-slate-900")}>
          {title}
        </h3>
        <p className="text-slate-600 text-sm mt-1">{message}</p>
      </div>
      
      <div className="flex items-center gap-2">
        {ctaText && ctaUrl && (
          <Button 
            variant={isPromo ? "default" : "outline"} 
            className="whitespace-nowrap" 
            asChild
          >
            <Link href={ctaUrl}>{ctaText}</Link>
          </Button>
        )}
        
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            aria-label="Fechar banner"
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
