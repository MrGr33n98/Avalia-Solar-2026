'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Clock, ChevronDown, Trophy, Zap, CircleDollarSign, Briefcase } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

interface CompanyComparisonCardProps {
  company: Company;
  onRemove: (id: number) => void;
  onQuote: (id: number) => void;
  className?: string;
}

export default function CompanyComparisonCard({
  company,
  onRemove,
  onQuote,
  className,
}: CompanyComparisonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPremium = company.featured || company.plan_status === 'active' || company.has_paid_plan;

  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const getYearsInMarket = () => {
    return company.founded_year ? new Date().getFullYear() - company.founded_year : null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "bg-white rounded-3xl p-6 shadow-lg border relative",
        isPremium ? "border-orange-100 bg-gradient-to-br from-orange-50/10 to-white" : "border-slate-100",
        className
      )}
    >
      {/* Remove Button */}
      <button
        onClick={() => onRemove(company.id)}
        aria-label={`Remover ${company.name} da comparação`}
        className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-4 pr-8">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border p-1 shadow-md",
          isPremium ? "bg-gradient-to-br from-orange-50 to-white border-orange-200" : "bg-white border-slate-100"
        )}>
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={`Logo da ${company.name}`}
            className="h-full w-full scale-[1.14] object-contain"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-1">
            {company.name}
          </h3>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-black w-fit"
            role="img"
            aria-label={`Avaliação ${formatRating(company.rating_avg || company.average_rating)} de 5, ${company.rating_count || 0} avaliações`}
          >
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            {formatRating(company.rating_avg || company.average_rating)} ({company.rating_count || 0})
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span className="font-semibold">{company.city}, {company.state}</span>
        </div>

        {company.verified && (
          <div className="flex items-center gap-2">
            <PremiumBadge className="h-6" />
          </div>
        )}

        {getYearsInMarket() && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-orange-500" aria-hidden="true" />
            <span className="font-semibold">
              {getYearsInMarket()} {getYearsInMarket() === 1 ? 'ano' : 'anos'} no mercado
            </span>
          </div>
        )}
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Ver menos atributos' : 'Ver todos atributos'}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-blue-600 py-2 hover:bg-blue-50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isExpanded ? 'Ver menos' : 'Ver todos atributos'}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />
      </button>

      {/* Expanded Attributes */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-3 mt-4 pt-4 border-t border-slate-100"
          >
            {/* Badges */}
            {company.badges && company.badges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-700 uppercase">Conquistas</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.badges.slice(0, 3).map((badge, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Financing */}
            {company.financing_enabled && (
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                <span className="text-sm text-emerald-600 font-semibold">Financiamento Disponível</span>
              </div>
            )}

            {/* Services */}
            {company.services && company.services.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-700 uppercase">Serviços</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.services.slice(0, 3).map((service, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Financing Partners */}
            {company.financing_partners && company.financing_partners.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-700 uppercase">Parceiros</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.financing_partners.slice(0, 3).map((partner, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {partner.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <Button
        className={cn(
          "w-full mt-6 rounded-2xl font-black h-12 shadow-lg transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white bg-blue-600 hover:bg-blue-700 shadow-blue-200"
        )}
        onClick={() => onQuote(company.id)}
      >
        Solicitar Orçamento
      </Button>
    </motion.div>
  );
}
