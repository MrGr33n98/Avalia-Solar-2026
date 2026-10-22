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
  sm: 'max-w-[620px]',
  md: 'max-w-[740px]', // Ergonomic spacious creation modal width
  lg: 'max-w-[940px]', // Rich multi-column creation & inline combobox modal width
  xl: 'max-w-[1140px]', // Workspace & 360 view modal width
  '2xl': 'max-w-[1280px]',
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
          'w-[95vw] sm:w-full max-h-[88dvh] sm:max-h-[92vh] overflow-y-auto p-4 sm:p-8 md:p-10 font-sans border-slate-200/80 bg-white shadow-2xl rounded-2xl sm:rounded-3xl'
        )}
      >
        {/* Header Bar */}
        <DialogHeader className="pb-3 sm:pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-100 shrink-0">{icon}</div>}
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{title}</DialogTitle>
              {description ? (
                <DialogDescription className="text-xs text-slate-500 mt-0.5 sm:mt-1">{description}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">Formulário modal do CRM</DialogDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showCustomizeFields && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="hidden sm:inline-flex h-9 px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold rounded-xl shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Personalizar campos
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Hero Avatar Badge if provided */}
        {heroIcon && (
          <div className="pt-3 pb-1 flex items-center justify-start">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/80 text-indigo-700 flex items-center justify-center shadow-xs">
              {heroIcon}
            </div>
          </div>
        )}

        {/* Form Body Container with Generous Spacing */}
        <div className="py-3 sm:py-4 text-xs space-y-4 sm:space-y-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100 flex items-center justify-between font-sans">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
