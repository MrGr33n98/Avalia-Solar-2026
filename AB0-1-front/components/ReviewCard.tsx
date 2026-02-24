'use client';

import { motion } from 'framer-motion';
import { Star, ThumbsUp, User, Building2 } from 'lucide-react';
import { Review } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReviewCardProps {
  review: Review;
  className?: string;
  variant?: 'user' | 'company';
  onReply?: (review: Review) => void;
}

export default function ReviewCard({ review, className = "", variant = 'user', onReply }: ReviewCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const isCompany = variant === 'company';
  const displayName = isCompany ? review.company?.name : (review.user?.name || `Usuário ${review.user_id}`);
  const displayImage = isCompany ? review.company?.logo_url : review.user?.avatar_url;

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={displayImage || undefined} />
          <AvatarFallback className="bg-gray-200">
            {isCompany ? (
              <Building2 className="h-6 w-6 text-gray-600" />
            ) : (
              <User className="h-6 w-6 text-gray-600" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Info & Rating */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">
                {isCompany && review.company ? (
                  <span>Avaliou <strong>{review.company.name}</strong></span>
                ) : (
                  displayName
                )}
              </h4>
              <div className="flex items-center">
                {/* Verification badge logic could go here */}
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
          {onReply && (
            <button
              className="hover:text-gray-700 transition-colors"
              type="button"
              onClick={() => onReply(review)}
            >
              Responder
            </button>
          )}
          <button className="hover:text-gray-700 transition-colors" type="button">
            Compartilhar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
