'use client';

import React from 'react';
import { ShieldCheck, Star, CheckCircle2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustRowProps {
  rating?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  className?: string;
}

/**
 * Standardized Trust/Social Proof row
 * Displays rating, reviews, verification badges
 */
export const TrustRow: React.FC<TrustRowProps> = ({
  rating,
  reviewsCount,
  isVerified = false,
  isFeatured = false,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-4 text-sm py-2", className)}>
      {rating !== undefined && (
        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-1 rounded-md font-bold">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          {rating.toFixed(1)}
          {reviewsCount !== undefined && (
            <span className="text-yellow-700 font-semibold ml-1">
              ({reviewsCount} avaliações)
            </span>
          )}
        </div>
      )}

      {isVerified && (
        <div className="flex items-center gap-1.5 text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded-md">
          <ShieldCheck className="w-4 h-4" />
          Verificada
        </div>
      )}

      {isFeatured && (
        <div className="flex items-center gap-1.5 text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-md">
          <Award className="w-4 h-4" />
          Destaque
        </div>
      )}

      <div className="flex items-center gap-1.5 text-green-800 font-semibold bg-green-50 px-2 py-1 rounded-md">
        <CheckCircle2 className="w-4 h-4" />
        Seguro
      </div>
    </div>
  );
};
