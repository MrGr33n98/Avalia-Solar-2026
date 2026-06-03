import React from 'react';
import { Star, CheckCircle, MapPin, TrendingUp, MessageSquare } from 'lucide-react';

export interface CompanyCardProps {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  state: string;
  categories: string[];
  vertical: string;
  average_rating: number | null;
  reviews_count: number;
  verified: boolean;
  premium: boolean;
  plan_tier: string | null;
  profile_url: string;
  whatsapp_url: string | null;
  quote_enabled: boolean;
  comparison_enabled: boolean;
  short_reason: string;
  rank_position?: number;
  onCompare?: (companyId: number) => void;
  onViewProfile?: (slug: string) => void;
  onWhatsApp?: (url: string) => void;
  onQuote?: (companyId: number) => void;
}

const MobiVoltCompanyCard: React.FC<CompanyCardProps> = ({
  id,
  slug,
  name,
  logo_url,
  city,
  state,
  categories,
  average_rating,
  reviews_count,
  verified,
  premium,
  short_reason,
  rank_position,
  onCompare,
  onViewProfile,
  onWhatsApp,
  onQuote,
}) => {
  const handleCompare = () => {
    if (onCompare) {
      onCompare(id);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(slug);
    } else {
      window.open(`/empresas/${slug}`, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (whatsapp_url) {
      if (onWhatsApp) {
        onWhatsApp(whatsapp_url);
      } else {
        window.open(whatsapp_url, '_blank');
      }
    }
  };

  const handleQuote = () => {
    if (onQuote) {
      onQuote(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Logo */}
        <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
          {logo_url ? (
            <img src={logo_url} alt={name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl font-bold text-gray-400">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
            {verified && (
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" title="Empresa verificada" />
            )}
            {premium && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Destaque
              </span>
            )}
          </div>

          {/* Location */}
          {(city || state) && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
              <MapPin className="w-3 h-3" />
              <span>{city ? `${city}/${state}` : state}</span>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            {average_rating !== null && average_rating !== undefined ? (
              <>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-900">{average_rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {reviews_count} {reviews_count === 1 ? 'avaliação' : 'avaliações'}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">Ainda sem avaliações públicas</span>
            )}
          </div>
        </div>

        {/* Rank Position */}
        {rank_position && (
          <div className="text-xs font-medium text-gray-400">#{rank_position}</div>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {categories.slice(0, 3).map((category, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
            >
              {category}
            </span>
          ))}
          {categories.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{categories.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Recommendation Reason */}
      {short_reason && (
        <div className="flex items-start gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
          <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">{short_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={handleViewProfile}
          className="flex-1 min-w-[100px] px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver perfil
        </button>

        {whatsapp_url && (
          <button
            onClick={handleWhatsApp}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </button>
        )}

        <button
          onClick={handleQuote}
          disabled={!quote_enabled}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            quote_enabled
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Pedir orçamento
        </button>

        <button
          onClick={handleCompare}
          disabled={!comparison_enabled}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            comparison_enabled
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Comparar
        </button>
      </div>
    </div>
  );
};

export default MobiVoltCompanyCard;
