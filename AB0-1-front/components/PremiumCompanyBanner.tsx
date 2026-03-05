'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Star, 
  Zap, 
  ArrowRight, 
  Trophy,
  Shield,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

interface PremiumCompanyBannerProps {
  company: Company;
  isVisible?: boolean;
  onRedirect?: (url: string) => void;
  className?: string;
}

export default function PremiumCompanyBanner({ 
  company, 
  isVisible = true, 
  onRedirect,
  className 
}: PremiumCompanyBannerProps) {
  const isPremium = company.featured || company.plan_status === 'active' || company.has_paid_plan;
  
  if (!isPremium || !isVisible) return null;

  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const getYearsInMarket = () => {
    return company.founded_year ? new Date().getFullYear() - company.founded_year : null;
  };

  const handleClick = () => {
    const url = `/companies/${company.slug}`;
    onRedirect?.(url);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn("relative overflow-hidden", className)}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50 shadow-xl shadow-amber-200/40 hover:shadow-2xl hover:shadow-amber-200/60 transition-all duration-500 group cursor-pointer"
                onClick={handleClick}>
            
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-400/30 to-transparent rounded-full blur-2xl animate-pulse delay-1000" />
            </div>

            {/* Premium Crown Floating Element */}
            <motion.div 
              className="absolute top-4 right-4 z-10"
              animate={{ 
                rotate: [0, -5, 5, -5, 0],
                y: [0, -2, 0, -2, 0] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <div className="relative">
                <Crown className="h-8 w-8 text-amber-500 fill-current drop-shadow-lg" />
                <motion.div 
                  className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Premium Badge */}
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg text-xs font-black uppercase tracking-wider">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium Partner
              </Badge>
            </div>

            <div className="relative z-10 p-6">
              <div className="flex items-start gap-6">
                {/* Company Logo */}
                <motion.div 
                  className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-white to-amber-50/50 p-3 shadow-xl shadow-amber-200/40 border border-amber-200/50 flex items-center justify-center overflow-hidden">
                    <img
                      src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
                      alt={company.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  {/* Verified Shield */}
                  {company.verified && (
                    <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Shield className="h-3 w-3 text-white fill-current" />
                    </div>
                  )}
                </motion.div>

                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {company.name}
                    </h3>
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/70 text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-sm font-black">
                        {formatRating(company.rating_avg || company.average_rating)}
                      </span>
                      <span className="text-xs text-amber-600">
                        ({company.rating_count || 0})
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {company.city}, {company.state} • 
                    {getYearsInMarket() && ` ${getYearsInMarket()} anos de experiência •`}
                    {company.verified && ' Empresa Verificada'}
                  </p>

                  {/* Features Row */}
                  <div className="flex items-center gap-4 mb-4">
                    {company.badges && company.badges.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Trophy className="h-4 w-4" />
                        <span className="text-xs font-bold">
                          {company.badges.length} {company.badges.length === 1 ? 'Badge' : 'Badges'}
                        </span>
                      </div>
                    )}
                    
                    {company.financing_enabled && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Zap className="h-4 w-4" />
                        <span className="text-xs font-bold">Financiamento</span>
                      </div>
                    )}

                    {company.response_time_sla && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <span className="text-xs font-bold">Resp. Rápida</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-3">
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black shadow-lg shadow-amber-200/50 hover:shadow-xl transition-all duration-300 group/btn"
                    >
                      <Link href={`/companies/${company.slug}`}>
                        <Crown className="h-4 w-4 mr-2" />
                        Ver Perfil Premium
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </motion.div>
                      </Link>
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 font-bold transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger quick quote modal
                      }}
                    >
                      Orçamento Rápido
                    </Button>
                  </div>
                </div>
              </div>

              {/* Premium Benefits Footer */}
              <div className="mt-6 pt-4 border-t border-amber-200/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-amber-700">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Suporte Prioritário
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Resposta em 2h
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Empresa Destacada
                    </span>
                  </div>
                  
                  <div className="text-amber-600 font-bold uppercase tracking-wider">
                    Parceiro Premium
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Shine Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              initial={{ x: '-100%' }}
              whileHover={{ 
                x: '200%',
                transition: { duration: 0.8, ease: 'easeOut' }
              }}
            />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}