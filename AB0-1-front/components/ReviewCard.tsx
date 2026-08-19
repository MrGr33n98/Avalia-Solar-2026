'use client';

import { motion } from 'framer-motion';
import { Star, User, Building2, ArrowRight, ThumbsUp, Check, X } from 'lucide-react';
import { Review, fetchApi } from '@/lib/api';
import { hasAnalyticsConsent } from '@/lib/analytics/consent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PublicUserBadges } from '@/components/badges/PublicUserBadges';
import { ReviewDetailModal } from '@/components/ReviewDetailModal';
import { normalizeReviewList } from '@/lib/reviews/normalizeReviewList';
import { getReviewAuthorHref } from '@/lib/reviews/getReviewAuthorHref';
import { track } from '@/lib/analytics/lazy';
import Link from 'next/link';

interface ReviewCardProps {
  review: Review;
  className?: string;
  variant?: 'user' | 'company';
  onReply?: (review: Review) => void;
}

const TRACKED_REVIEWS_KEY = 'avalia_tracked_reviews_v1';

export default function ReviewCard({ review, className = "", variant = 'user', onReply }: ReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [hasTrackedRead, setHasTrackedRead] = useState(false);
  const [hasTrackedClick, setHasTrackedClick] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derivação de badges públicas para exibição de reputação
  const unlockedBadgeIds = useMemo(() => {
    if (!review.user || variant === 'company') return [];
    
    // Se for o próprio usuário logado, buscar dados dinâmicos do localStorage
    const isCurrentUser = user && user.id === review.user.id;
    if (isCurrentUser) {
      const cached = localStorage.getItem(`reviewer_solutions_${user.id}`);
      let hasEVSolution = false;
      let hasSolarSolution = false;
      if (cached) {
        try {
          const sols = JSON.parse(cached);
          hasEVSolution = sols.some((s: { category?: string }) => s.category?.toLowerCase().includes('mobilidade') || s.category?.toLowerCase().includes('bateria'));
          hasSolarSolution = sols.some((s: { category?: string }) => s.category?.toLowerCase().includes('solar'));
        } catch {}
      }
      
      const list = ['verified_customer', 'solar_project_validated'];
      if (hasEVSolution) list.push('mobility_activated');
      if (hasSolarSolution) list.push('solar_specialist');
      return list;
    }
    
    // Para outros usuários, fornecer um conjunto padrão baseado no tipo de projeto do review
    const list = ['verified_customer'];
    if (review.project_type === 'residential' || review.project_type === 'commercial') {
      list.push('solar_project_validated');
    }
    if (review.rating >= 4) {
      list.push('helpful_review');
    }
    return list;
  }, [review.user, review.project_type, review.rating, user, variant]);

  // Safe access for pros/cons
  const prosList = normalizeReviewList(review.pros);
  const consList = normalizeReviewList(review.cons);

  // Check session storage on mount
  useEffect(() => {
    const tracked = JSON.parse(sessionStorage.getItem(TRACKED_REVIEWS_KEY) || '[]') as number[];
    if (tracked.includes(review.id)) {
      setHasTrackedRead(true);
    }
  }, [review.id]);

  // Telemetry: Track 'review_read' with Dwell Time (70% visible for 2s)
  useEffect(() => {
    if (hasTrackedRead || !review.id || !review.company_id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          // Start dwell timer
          dwellTimerRef.current = setTimeout(() => {
            trackEvent('review_read');
            markAsTracked(review.id);
          }, 2000); // 2 seconds dwell time
        } else {
          // Cancel if user scrolls away before 2s
          if (dwellTimerRef.current) {
            clearTimeout(dwellTimerRef.current);
            dwellTimerRef.current = null;
          }
        }
      },
      { threshold: [0, 0.7] }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [review.id, hasTrackedRead]);

  const markAsTracked = (id: number) => {
    setHasTrackedRead(true);
    const tracked = JSON.parse(sessionStorage.getItem(TRACKED_REVIEWS_KEY) || '[]') as number[];
    if (!tracked.includes(id)) {
      sessionStorage.setItem(TRACKED_REVIEWS_KEY, JSON.stringify([...tracked, id]));
    }
  };

  const trackEvent = async (eventType: 'review_read' | 'review_cta_click') => {
    if (!hasAnalyticsConsent()) return;

    try {
      await fetchApi('/analytics/track', {
        method: 'POST',
        body: JSON.stringify({
          event_type: eventType,
          company_id: review.company_id,
          metadata: {
            review_id: review.id,
            source: 'review_card',
            project_type: review.project_type
          }
        })
      });
    } catch (err) {
      console.warn(`[Telemetry] Failed to track ${eventType}:`, err);
    }
  };

  const handleCTAClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasTrackedClick) return; // Spam protection
    
    setHasTrackedClick(true);
    trackEvent('review_cta_click');
    console.log('[CTA] User interested in review project:', review.id);
  };

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
  const companyObj = typeof review.company === 'string' ? null : review.company;
  const displayName = isCompany
    ? companyObj?.name || (typeof review.company === 'string' ? review.company : `Empresa ${review.company_id}`)
    : (review.user?.name || `Usuário ${review.user_id}`);
  const authorProfileHref = !isCompany ? getReviewAuthorHref(review) : null;
  const publicDisplayName = !isCompany
    ? review.user?.display_name || review.user?.name || `Usuário ${review.user_id}`
    : displayName;
  let displayImage = isCompany
    ? companyObj?.logo_url
    : review.user?.avatar_url;

  if (!displayImage && !isCompany && displayName) {
    displayImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=128`;
  }

  return (
    <>
    <motion.div
      ref={cardRef}
      onClick={() => setIsModalOpen(true)}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        {/* Avatar */}
        {authorProfileHref ? (
          <Link
            href={authorProfileHref}
            onClick={(event) => {
              event.stopPropagation();
              track('review_author_profile_clicked', {
                review_id: review.id,
                user_id: review.user?.id,
                source: 'review_card',
              });
            }}
            aria-label={`Ver perfil de ${publicDisplayName}`}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Avatar className="h-12 w-12 overflow-hidden transition-opacity hover:opacity-80">
              <AvatarImage src={displayImage || undefined} alt="" />
              <AvatarFallback className="bg-gray-200">
                <User className="h-6 w-6 text-gray-600" />
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-12 w-12 shrink-0 overflow-hidden">
            <AvatarImage src={displayImage || undefined} alt="" />
            <AvatarFallback className="bg-gray-200">
              {isCompany ? (
                <Building2 className="h-6 w-6 text-gray-600" />
              ) : (
                <User className="h-6 w-6 text-gray-600" />
              )}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Info & Rating */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="max-w-[180px] truncate font-semibold text-gray-900">
                {isCompany && review.company ? (
                  <span>
                    Avaliou <strong>{typeof review.company === 'string' ? review.company : review.company.name}</strong>
                  </span>
                ) : (
                  authorProfileHref ? (
                    <Link
                      href={authorProfileHref}
                      onClick={(event) => {
                        event.stopPropagation();
                        track('review_author_profile_clicked', {
                          review_id: review.id,
                          user_id: review.user?.id,
                          source: 'review_card',
                        });
                      }}
                      title={publicDisplayName}
                      className="cursor-pointer hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      {publicDisplayName}
                    </Link>
                  ) : (
                    publicDisplayName
                  )
                )}
              </h4>
              <div className="flex items-center gap-1.5">
                {/* Verification badge logic could go here */}
                {!isCompany && review.user && (
                  <PublicUserBadges unlockedBadgeIds={unlockedBadgeIds} maxVisible={3} size="sm" />
                )}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {formatDate(review.created_at)}
            </span>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center space-x-2 mb-1">
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

          {/* Technical Context Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {review.project_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {review.project_type === 'residential' ? 'Residencial' : 
                 review.project_type === 'commercial' ? 'Comercial' :
                 review.project_type === 'industrial' ? 'Industrial' : 'Rural'}
              </span>
            )}
            {review.estimated_power && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {review.estimated_power} kWp
              </span>
            )}
            {review.installation_status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {review.installation_status === 'completed' ? 'Instalado' :
                 review.installation_status === 'in_progress' ? 'Em andamento' : 'Aguardando'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        {review.display_headline && (
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {review.display_headline}
          </h3>
        )}
        
        {/* Pros & Cons Section */}
        {(prosList.length > 0 || consList.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {prosList.length > 0 && (
              <div className="bg-green-50/60 p-4 rounded-xl border border-green-100">
                <h5 className="flex items-center gap-2 text-xs font-bold text-green-700 uppercase mb-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-3 w-3" />
                  </span>
                  O que foi bom
                </h5>
                <ul className="text-sm text-green-800 space-y-1.5 pl-8">
                  {prosList.map((pro, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-green-500">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {consList.length > 0 && (
              <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
                <h5 className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase mb-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <X className="h-3 w-3" />
                  </span>
                  O que melhorar
                </h5>
                <ul className="text-sm text-red-800 space-y-1.5 pl-8">
                  {consList.map((con, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-red-500">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {review.comment}
          </p>
        )}

        {review.buyer_tip && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h5 className="text-xs font-bold text-blue-700 uppercase mb-1">Dica para o comprador</h5>
            <p className="text-sm text-blue-900 italic">&ldquo;{review.buyer_tip}&rdquo;</p>
          </div>
        )}

        {/* Action CTA */}
        {review.project_type && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCTAClick}
              disabled={hasTrackedClick}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all shadow-sm ${
                hasTrackedClick 
                  ? 'bg-gray-100 text-gray-400 cursor-default' 
                  : 'bg-slate-900 text-white hover:bg-blue-600'
              }`}
            >
              {hasTrackedClick ? 'Interesse registrado' : 'Tenho interesse em projeto similar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Granular Scores */}
      {review.review_criterion_scores && review.review_criterion_scores.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {review.review_criterion_scores.map((score) => (
            <div key={score.id} className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{score.title}</span>
              <div className="flex items-center gap-1.5">
                {score.not_applicable ? (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase">N/A</span>
                ) : (
                  <>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(score.score)
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black text-slate-700">{Number(score.score).toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 transition-colors rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">Útil</span>
        </button>
        
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          {onReply && (
            <button
              className="hover:text-slate-700 transition-colors rounded-lg px-3 py-1.5 hover:bg-slate-50"
              type="button"
              onClick={() => onReply(review)}
            >
              Responder
            </button>
          )}
          <button className="hover:text-slate-700 transition-colors rounded-lg px-3 py-1.5 hover:bg-slate-50" type="button">
            Compartilhar
          </button>
        </div>
      </div>
    </motion.div>
    <ReviewDetailModal review={review} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
