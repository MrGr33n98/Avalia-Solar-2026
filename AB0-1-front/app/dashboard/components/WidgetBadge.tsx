'use client';

import React from 'react';
import { Star, Check, ExternalLink } from 'lucide-react';

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
}

export default function WidgetBadge({ companyData, theme }: WidgetBadgeProps) {
  const bgColor = theme === 'light' 
    ? 'bg-white border-gray-200' 
    : 'bg-slate-900 border-slate-700';
  
  const textColor = theme === 'light' 
    ? 'text-gray-900' 
    : 'text-white';
  
  const mutedColor = theme === 'light' 
    ? 'text-gray-600' 
    : 'text-gray-400';

  return (
    <div className={`${bgColor} border rounded-lg p-6 shadow-lg max-w-sm w-full`}>
      {/* Company Logo/Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-800'} flex items-center justify-center`}>
          {companyData.verified_badge_image_url ? (
            <img 
              src={companyData.verified_badge_image_url} 
              alt={companyData.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-900'} flex items-center justify-center`}>
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>
                {companyData.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`${textColor} font-semibold`}>{companyData.name}</h3>
          {companyData.verified && (
            <div className="flex items-center gap-1 mt-1">
              <Check className="w-4 h-4 text-green-500" />
              <span className={`text-xs ${mutedColor}`}>Verificado</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating Section */}
      <div className={`py-3 border-y ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'} mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(companyData.rating_avg)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className={`text-sm font-semibold ${textColor}`}>
            {companyData.rating_avg.toFixed(1)}
          </span>
        </div>
        <p className={`text-xs ${mutedColor}`}>
          {companyData.reviews_count} avaliações
        </p>
      </div>

      {/* Trust Score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${textColor}`}>Score de Confiança</span>
          <span className="text-sm font-bold text-blue-600">{companyData.trust_score}%</span>
        </div>
        <div className={`w-full h-2 rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-slate-700'} overflow-hidden`}>
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${companyData.trust_score}%` }}
          />
        </div>
      </div>

      {/* Call to Action */}
      <a
        href={companyData.public_profile_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
      >
        Ver Perfil
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {/* Footer */}
      <p className={`text-xs text-center mt-3 ${mutedColor}`}>
        Verificado por Avalia Solar
      </p>
    </div>
  );
}
