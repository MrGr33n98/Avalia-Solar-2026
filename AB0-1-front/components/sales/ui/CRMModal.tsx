'use client';

import { ReactNode } from 'react';
import { Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CRMModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface CRMModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description?: string;
  size?: CRMModalSize;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  heroIcon?: ReactNode;
  showCustomizeFields?: boolean;
}

const sizeClasses: Record<CRMModalSize, string> = {
  sm: 'max-w-[480px]',
  md: 'max-w-[540px]', // Nutshell canonical narrow vertical modal width
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
  '2xl': 'max-w-[960px]',
};

export default function CRMModal({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  icon,
  heroIcon,
  showCustomizeFields = true,
}: CRMModalProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) onOpenChange(isOpen);
    if (!isOpen && onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto p-7 font-sans border-slate-200 bg-white shadow-2xl rounded-xl sm:rounded-2xl'
        )}
      >
        {/* Header Bar */}
        <DialogHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">{title}</DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            {showCustomizeFields && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="h-7 px-2.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-medium rounded-md"
              >
                <Settings className="w-3 h-3 mr-1 text-slate-500" />
                Customize fields
              </Button>
            )}
          </div>
        </DialogHeader>

        {description && <DialogDescription className="text-xs text-slate-500 mt-1">{description}</DialogDescription>}

        {/* Hero Avatar Badge if provided */}
        {heroIcon && (
          <div className="pt-2 pb-1">
            <div className="w-16 h-16 rounded-full bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
              {heroIcon}
            </div>
          </div>
        )}

        {/* Single Column Form Body */}
        <div className="py-2 text-xs space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between font-sans">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
