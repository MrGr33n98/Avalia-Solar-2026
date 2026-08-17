import React from 'react';
import { AlertCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorBannerProps {
  error: string | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorBanner = ({
  error,
  title = 'Ocorreu um erro',
  onRetry,
  onDismiss,
  className = '',
}: ErrorBannerProps) => {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative overflow-hidden rounded-2xl border border-red-200 bg-red-50/80 p-5 backdrop-blur-md shadow-sm ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
            <AlertCircle className="h-5 w-5" />
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-red-900 tracking-tight">{title}</h3>
            <p className="text-sm leading-relaxed text-red-800/80">
              {error}
            </p>
            
            {(onRetry || onDismiss) && (
              <div className="flex gap-3 pt-3">
                {onRetry && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRetry}
                    className="h-8 rounded-full bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 border-0 transition-all font-medium"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Tentar novamente
                  </Button>
                )}
                {onDismiss && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onDismiss}
                    className="h-8 rounded-full text-red-600 hover:bg-red-50 transition-all"
                  >
                    Descartar
                  </Button>
                )}
              </div>
            )}
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 rounded-full p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
