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
  sm: 'max-w-[580px]',
  md: 'max-w-[680px]', // Ergonomic spacious creation modal width
  lg: 'max-w-[880px]', // Rich multi-column creation & inline combobox modal width
  xl: 'max-w-[1080px]', // Workspace & 360 view modal width
  '2xl': 'max-w-[1240px]',
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
          'max-h-[90vh] overflow-y-auto p-8 font-sans border-slate-200 bg-white shadow-2xl rounded-2xl'
        )}
      >
        {/* Header Bar */}
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 rounded-lg bg-indigo-50 text-indigo-900">{icon}</div>}
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">{title}</DialogTitle>
              {description && <DialogDescription className="text-xs text-slate-500 mt-0.5">{description}</DialogDescription>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showCustomizeFields && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-semibold rounded-lg shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Customize fields
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Hero Avatar Badge if provided */}
        {heroIcon && (
          <div className="pt-3 pb-2 flex items-center justify-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              {heroIcon}
            </div>
          </div>
        )}

        {/* Form Body Container with Generous Spacing */}
        <div className="py-3 text-xs space-y-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between font-sans">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
