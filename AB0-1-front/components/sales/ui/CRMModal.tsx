'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type CRMModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface CRMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: CRMModalSize;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
}

const sizeClasses: Record<CRMModalSize, string> = {
  sm: 'max-w-[520px]',
  md: 'max-w-[620px]',
  lg: 'max-w-[760px]',
  xl: 'max-w-[960px]',
  '2xl': 'max-w-[1080px]',
};

export default function CRMModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  footer,
  icon,
}: CRMModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          'max-h-[88vh] overflow-y-auto p-6 font-sans border-slate-200 bg-white shadow-2xl'
        )}
      >
        <DialogHeader className="pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 text-blue-900">
            {icon}
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">{title}</DialogTitle>
          </div>
          {description && <DialogDescription className="text-xs text-slate-500 mt-0.5">{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-3 text-xs space-y-4">{children}</div>

        {footer && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white z-10">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
