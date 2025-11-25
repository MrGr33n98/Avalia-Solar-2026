'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
        >
          <Star
            className={`h-6 w-6 ${
              rating <= value ? 'fill-current' : 'fill-transparent'
            }`}
          />
        </button>
      ))}
    </div>
  );
}