'use client';

import React from 'react';
import { Star, ExternalLink, ShieldCheck } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';

interface CompanyData {
  name: string;
  verified: boolean;
  trust_score: number;
  rating_avg: number;
  reviews_count: number;
  verified_badge_image_url?: string;
  public_profile_url: string;
}

interface WidgetBadgeProps {
  companyData: CompanyData;
  theme: 'light' | 'dark';
  style: 'default' | 'compact' | 'circular' | 'split';
  showRating: boolean;
  showReviewsCount: boolean;
  showTrustScore: boolean;
  showRank: boolean;
  highlightColor: string;
}

export default function WidgetBadge({
  companyData,
  theme,
  style,
  showRating,
  showReviewsCount,
  showTrustScore,
  showRank,
  highlightColor,
}: WidgetBadgeProps) {
  const safeRating = Number(companyData.rating_avg) || 0;

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-100';

  const stars = (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(safeRating)
              ? 'fill-yellow-400 text-yellow-400'
              : isDark ? 'text-slate-700' : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );

  // STYLE: CIRCULAR
  if (style === 'circular') {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-6 rounded-full border text-center aspect-square w-48 h-48 shadow-sm transition-all duration-300 ${bgColor}`}
      >
        <ShieldCheck className="w-8 h-8 mb-1" style={{ color: highlightColor }} />
        <h4 className={`text-xs font-bold truncate max-w-[120px] ${textColor}`}>{companyData.name}</h4>
        
        {showRating && (
          <div className="flex flex-col items-center mt-1">
            <span className={`text-lg font-black leading-tight ${textColor}`}>{safeRating.toFixed(1)}</span>
            {stars}
          </div>
        )}

        {showTrustScore && (
          <span className="text-[10px] font-bold mt-1" style={{ color: highlightColor }}>
            {companyData.trust_score}% Trust
          </span>
        )}
      </div>
    );
  }

  // STYLE: COMPACT
  if (style === 'compact') {
    return (
      <div className={`border rounded-xl p-4 shadow-sm w-72 transition-all duration-300 ${bgColor}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
              <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {companyData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className={`text-xs font-bold truncate ${textColor}`}>{companyData.name}</h3>
              {showRating && (
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold ${textColor}`}>{safeRating.toFixed(1)}</span>
                  {stars}
                </div>
              )}
            </div>
          </div>
          <a
            href={companyData.public_profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 transition-colors"
            style={{ backgroundColor: `${highlightColor}20`, color: highlightColor }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // STYLE: SPLIT
  if (style === 'split') {
    return (
      <div className={`border rounded-xl shadow-sm w-96 overflow-hidden flex transition-all duration-300 ${bgColor}`}>
        {/* Left column */}
        <div className={`p-4 flex-1 flex flex-col justify-between border-r ${borderColor}`}>
          <div>
            <h3 className={`text-sm font-bold truncate ${textColor}`}>{companyData.name}</h3>
            {companyData.verified && (
              <div className="flex items-center gap-1 mt-1">
                <PremiumBadge size="xs" />
                <span className={`text-[10px] font-bold ${mutedColor}`}>Premium</span>
              </div>
            )}
          </div>
          {showTrustScore && (
            <div className="mt-4">
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className={mutedColor}>Trust Score</span>
                <span style={{ color: highlightColor }}>{companyData.trust_score}%</span>
              </div>
              <div className={`w-full h-1 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${companyData.trust_score}%`, backgroundColor: highlightColor }}
                />
              </div>
            </div>
          )}
        </div>
        {/* Right column */}
        <div className="p-4 flex-1 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            {showRating && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-black ${textColor}`}>{safeRating.toFixed(1)}</span>
                  {stars}
                </div>
                {showReviewsCount && (
                  <p className={`text-[10px] ${mutedColor}`}>
                    {companyData.reviews_count} avaliações
                  </p>
                )}
              </div>
            )}
          </div>
          <a
            href={companyData.public_profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors mt-4"
            style={{ backgroundColor: highlightColor }}
          >
            Ver Perfil
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // STYLE: DEFAULT
  return (
    <div className={`border rounded-xl p-5 shadow-sm max-w-sm w-full transition-all duration-300 ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className={`w-11 h-11 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
          {companyData.verified_badge_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companyData.verified_badge_image_url}
              alt={companyData.name}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-blue-950' : 'bg-blue-50'} flex items-center justify-center`}>
              <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                {companyData.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className={`text-sm font-bold truncate ${textColor}`}>{companyData.name}</h3>
          {companyData.verified && (
            <div className="flex items-center gap-1 mt-0.5">
              <PremiumBadge size="xs" />
              <span className={`text-[10px] font-bold ${mutedColor}`}>Premium</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      {showRating && (
        <div className={`py-3 border-y ${borderColor} mb-4`}>
          <div className="flex items-center gap-2">
            {stars}
            <span className={`text-xs font-bold ${textColor}`}>
              {safeRating.toFixed(1)}
            </span>
            {showReviewsCount && (
              <span className={`text-[10px] ${mutedColor}`}>
                ({companyData.reviews_count} avaliações)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Trust Score */}
      {showTrustScore && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
            <span className={textColor}>Score de Confiança</span>
            <span style={{ color: highlightColor }}>{companyData.trust_score}%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${companyData.trust_score}%`, backgroundColor: highlightColor }}
            />
          </div>
        </div>
      )}

      {/* Call to Action */}
      <a
        href={companyData.public_profile_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
        style={{ backgroundColor: highlightColor }}
      >
        Ver Perfil
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {/* Footer */}
      {showRank && (
        <p className={`text-[10px] text-center mt-3 font-semibold ${mutedColor}`}>
          Selo Diamond por Avalia Solar
        </p>
      )}
    </div>
  );
}
