'use client';

import { motion } from 'framer-motion';
import { Star, ThumbsUp, User } from 'lucide-react';
import { Review } from '@/lib/api';

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export default function ReviewCard({ review, className = "" }: ReviewCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        {/* User Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
          <User className="h-6 w-6 text-gray-600" />
        </div>

        {/* User Info & Rating */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">
                Usuário {review.user_id}
              </h4>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 ml-1">Verificado</span>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {formatDate(review.created_at)}
            </span>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {review.rating}/5
            </span>
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {review.comment}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">Útil</span>
        </button>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <button className="hover:text-gray-700 transition-colors">
            Responder
          </button>
          <button className="hover:text-gray-700 transition-colors">
            Compartilhar
          </button>
        </div>
      </div>
    </motion.div>
  );
}