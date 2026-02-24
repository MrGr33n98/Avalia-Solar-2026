'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  count?: number;
  showCount?: boolean;
  showRatingValue?: boolean;
  lang?: string;
  className?: string;
  starClassName?: string;
  countClassName?: string;
  ratingValueClassName?: string;
}

export function RatingStars({
  rating,
  count = 0,
  showCount = true,
  showRatingValue = false,
  lang = 'pt-BR',
  className,
  starClassName,
  countClassName,
  ratingValueClassName
}: RatingStarsProps) {
  const parsedRating = Number(rating);
  const normalizedRating = Number.isFinite(parsedRating)
    ? Math.min(5, Math.max(0, parsedRating))
    : 0;
  const parsedCount = Number(count);
  const normalizedCount = Number.isFinite(parsedCount)
    ? Math.max(0, Math.floor(parsedCount))
    : 0;

  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star 
            key={`full-${i}`} 
            className={cn("w-3.5 h-3.5 fill-yellow-400 text-yellow-400", starClassName)} 
            strokeWidth={0} 
            data-testid="star-icon"
          />
        ))}
        {hasHalfStar && (
          <div className="relative w-3.5 h-3.5">
            <Star 
              className={cn("absolute inset-0 w-3.5 h-3.5 text-gray-200 fill-gray-200", starClassName)} 
              strokeWidth={0} 
            />
            <StarHalf 
              className={cn("absolute inset-0 w-3.5 h-3.5 fill-yellow-400 text-yellow-400 z-10", starClassName)} 
              strokeWidth={0} 
              data-testid="star-icon"
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className={cn("w-3.5 h-3.5 text-gray-200 fill-gray-200", starClassName)} 
            strokeWidth={0} 
            data-testid="star-icon"
          />
        ))}
      </div>
      {showRatingValue && (
        <span className={cn("text-sm font-bold text-foreground", ratingValueClassName)}>
          {normalizedRating.toFixed(1)}
        </span>
      )}
      {showCount && normalizedCount > 0 && (
        <span className={cn("text-[11px] text-gray-400 font-bold", countClassName)}>
          ({normalizedCount.toLocaleString(lang)})
        </span>
      )}
    </div>
  );
}
