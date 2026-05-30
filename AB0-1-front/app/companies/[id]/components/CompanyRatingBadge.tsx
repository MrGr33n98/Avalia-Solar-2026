"use client";

import { Star } from "lucide-react";

interface CompanyRatingBadgeProps {
  rating: string;
  reviewCount: number;
}

export default function CompanyRatingBadge({ rating, reviewCount }: CompanyRatingBadgeProps) {
  const numericRating = Number.parseFloat(rating);
  const formattedRating = Number.isNaN(numericRating) || numericRating <= 0 ? "5.0" : numericRating.toFixed(1);
  const safeReviewCount = typeof reviewCount === "number" && reviewCount >= 0 ? reviewCount : 0;

  return (
    <div id="company-rating-badge" className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700 font-bold shadow-sm border border-amber-100">
        <Star className="h-4 w-4 fill-amber-500 text-amber-500" strokeWidth={0} />
        <span>{formattedRating}</span>
      </div>
      <span className="text-slate-500 font-medium">
        ({safeReviewCount} {safeReviewCount === 1 ? "avaliação" : "avaliações"})
      </span>
    </div>
  );
}
