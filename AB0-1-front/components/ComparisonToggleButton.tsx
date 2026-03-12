'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  Check, 
  Plus, 
  Crown,
  Star,
  ArrowRight 
} from 'lucide-react';
import { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { track } from '@/lib/analytics/lazy';
import { useComparisonIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { cn } from '@/lib/utils';

interface ComparisonToggleButtonProps {
  company: Company;
  variant?: 'default' | 'minimal' | 'card' | 'floating';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showPosition?: boolean;
  animated?: boolean;
}

export default function ComparisonToggleButton({
  company,
  variant = 'default',
  size = 'default',
  className,
  showPosition = false,
  animated = true
}: ComparisonToggleButtonProps) {
  const { 
    isInComparison, 
    addToComparison, 
    removeFromComparison, 
    getCompanyPosition,
    canAddMore,
    isFull,
    count
  } = useComparison();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const isSelected = isInComparison(company.id);
  const position = getCompanyPosition(company.id);
  const isPremium = Boolean(company.featured || company.plan_status === 'active' || company.has_paid_plan);
  const { trackComparisonUsage } = useComparisonIntent(String(company.id), {
    elementSelector: `comparison-toggle-${variant}`,
    metadata: {
      source: 'comparison_toggle_button',
    },
  });

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[DEBUG] ComparisonToggleButton: handleToggle called for company:', company.name);
    console.log('[DEBUG] Current state - isSelected:', isSelected, 'canAddMore:', canAddMore, 'count:', count);
    
    setIsLoading(true);
    
    try {
      if (isSelected) {
        console.log('[DEBUG] Removing company from comparison');
        removeFromComparison(company.id);
        track('comparison_remove', { 
          company_id: company.id,
          company_name: company.name,
          position: position 
        });
        trackComparisonUsage('remove', {
          company_name: company.name,
          comparison_count: Math.max(count - 1, 0),
          position: position || null,
        });
      } else {
        if (!canAddMore) {
          console.log('[DEBUG] Cannot add more companies, limit reached');
          setIsLoading(false);
          return;
        }
        console.log('[DEBUG] Adding company to comparison');
        addToComparison(company);
        track('comparison_add', { 
          company_id: company.id,
          company_name: company.name,
          total_companies: count + 1,
          is_premium: isPremium
        });
        trackComparisonUsage('add', {
          company_name: company.name,
          comparison_count: count + 1,
          is_premium: isPremium,
        });
      }
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        console.log('[DEBUG] Toggle loading finished');
      }, 300); // Small delay for better UX
    }
  };

  // Variant configurations
  const variants = {
    default: {
      button: cn(
        "relative overflow-hidden transition-all duration-300",
        isSelected
          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
          : "bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300",
        size === 'sm' && "h-8 px-3 text-xs",
        size === 'default' && "h-10 px-4 text-sm",
        size === 'lg' && "h-12 px-6 text-base font-bold"
      ),
      icon: size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    },
    minimal: {
      button: cn(
        "p-2 rounded-full border-2 transition-all duration-300 hover:scale-110",
        isSelected
          ? "bg-blue-600 border-blue-600 text-white shadow-lg"
          : "bg-white border-slate-200 text-slate-600 hover:border-blue-300",
        size === 'sm' && "p-1.5",
        size === 'lg' && "p-3"
      ),
      icon: size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
    },
    card: {
      button: cn(
        "w-full rounded-xl font-bold transition-all duration-300 relative overflow-hidden",
        isSelected
          ? isPremium
            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
        size === 'sm' && "h-8 text-xs",
        size === 'default' && "h-10 text-sm",
        size === 'lg' && "h-12 text-base"
      ),
      icon: size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    },
    floating: {
      button: cn(
        "rounded-full shadow-lg backdrop-blur-sm border transition-all duration-300",
        isSelected
          ? "bg-blue-600/90 border-blue-500 text-white shadow-blue-200"
          : "bg-white/90 border-slate-200 text-slate-700 hover:bg-blue-50/90",
        size === 'sm' && "h-8 w-8",
        size === 'default' && "h-10 w-10",
        size === 'lg' && "h-12 w-12"
      ),
      icon: size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    }
  };

  const currentVariant = variants[variant];

  const renderButtonContent = () => {
    const iconClass = currentVariant.icon;

    if (variant === 'minimal' || variant === 'floating') {
      return (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className={cn(iconClass, "animate-spin border-2 border-current border-t-transparent rounded-full")}
            />
          ) : isSelected ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex items-center justify-center"
            >
              <Check className={iconClass} />
              {showPosition && position && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-600 text-white"
                >
                  {position}
                </Badge>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="unselected"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <Scale className={iconClass} />
            </motion.div>
          )}
        </AnimatePresence>
      );
    }

    // For default and card variants
    return (
      <div className="flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 180 }}
              className={cn(iconClass, "animate-spin border-2 border-current border-t-transparent rounded-full")}
            />
          ) : isSelected ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <Check className={iconClass} />
            </motion.div>
          ) : (
            <motion.div
              key="unselected"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              {isPremium ? <Crown className={iconClass} /> : <Plus className={iconClass} />}
            </motion.div>
          )}
        </AnimatePresence>

        <span className="font-bold">
          {isSelected 
            ? showPosition && position ? `Posição ${position}` : 'Selecionada'
            : isPremium ? 'Comparar Premium' : 'Comparar'
          }
        </span>

        {/* Premium indicator */}
        {isPremium && !isSelected && (
          <Star className="h-3 w-3 text-amber-500 fill-current" />
        )}
      </div>
    );
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading || (!isSelected && !canAddMore)}
      className={cn(currentVariant.button, className)}
      variant="ghost"
      size={variant === 'minimal' || variant === 'floating' ? 'icon' : size}
      aria-label={
        isSelected 
          ? `Remover ${company.name} da comparação`
          : `Adicionar ${company.name} à comparação`
      }
      title={
        isSelected 
          ? `Remover ${company.name} da comparação`
          : !canAddMore
            ? 'Limite máximo de empresas atingido (3/3)'
            : `Adicionar ${company.name} à comparação`
      }
    >
      {renderButtonContent()}
      
      {/* Loading overlay */}
      {animated && isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-inherit"
        />
      )}

      {/* Success animation */}
      {animated && isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.2, 0], opacity: [1, 0.8, 0] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 border-2 border-current rounded-inherit"
        />
      )}
    </Button>
  );
}
