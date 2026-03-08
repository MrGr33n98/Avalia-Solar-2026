'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  MapPin, 
  Check, 
  X, 
  Scale, 
  Trophy,
  ShieldCheck,
  Zap,
  Clock,
  Briefcase,
  CircleDollarSign,
  Phone,
  MessageCircle,
  Award,
  Crown,
  ExternalLink
} from 'lucide-react';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

interface CompanyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onRemoveCompany: (id: number) => void;
  onClearAll: () => void;
}

export default function CompanyComparisonModal({
  isOpen,
  onClose,
  companies,
  onRemoveCompany,
  onClearAll
}: CompanyComparisonModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      track('comparison_modal_opened', { companies_count: companies.length });
    }
  }, [isOpen, companies.length]);

  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const handleQuoteClick = (companyId: number) => {
    track('comparison_modal_quote_click', { company_id: companyId });
    openLeadModal({ preferredCompanyId: companyId, source: 'comparison-modal', type: 'quick' });
  };

  const isPremiumCompany = (company: Company) => {
    return company.featured || company.plan_status === 'active' || company.has_paid_plan;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 bg-gradient-to-br from-slate-50 to-white border-0 shadow-2xl">
        <DialogHeader className="p-4 md:p-6 pb-0 space-y-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                <Scale className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">
                  Comparação Detalhada
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-xs md:text-sm">
                  {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} em análise
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearAll}
              className="text-slate-500 hover:text-red-600 hover:border-red-200 font-bold transition-all w-full md:w-auto h-9 md:h-10"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-4 md:px-6">
              <TabsList className="flex md:grid w-full md:grid-cols-5 h-12 bg-slate-100/50 rounded-2xl p-1 overflow-x-auto scrollbar-hide justify-start md:justify-center">
                <TabsTrigger value="overview" className="flex-1 md:flex-none text-xs font-bold rounded-xl whitespace-nowrap px-4 md:px-2">
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="credentials" className="flex-1 md:flex-none text-xs font-bold rounded-xl whitespace-nowrap px-4 md:px-2">
                  Credibilidade
                </TabsTrigger>
                <TabsTrigger value="commercial" className="flex-1 md:flex-none text-xs font-bold rounded-xl whitespace-nowrap px-4 md:px-2">
                  Comercial
                </TabsTrigger>
                <TabsTrigger value="technical" className="flex-1 md:flex-none text-xs font-bold rounded-xl whitespace-nowrap px-4 md:px-2">
                  Técnico
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex-1 md:flex-none text-xs font-bold rounded-xl whitespace-nowrap px-4 md:px-2">
                  Contato
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 md:p-6 pt-4 pb-20">
                  {/* Companies Header */}
                  <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-6">
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="min-w-[800px]">
                        <div className="grid grid-cols-4 divide-x divide-slate-100">
                          <div className="p-6 bg-slate-50/30 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-wide">
                              Empresas
                            </span>
                          </div>
                          
                          <AnimatePresence mode="popLayout">
                            {companies.slice(0, 3).map((company, idx) => (
                              <motion.div
                                key={company.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                  "p-6 flex flex-col items-center text-center relative",
                                  isPremiumCompany(company) && "bg-gradient-to-br from-amber-50/30 to-orange-50/30"
                                )}
                              >
                                {/* Premium Crown */}
                                {isPremiumCompany(company) && (
                                  <div className="absolute -top-2 -right-2">
                                    <div className="relative">
                                      <Crown className="h-6 w-6 text-amber-500 fill-current" />
                                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full animate-pulse" />
                                    </div>
                                  </div>
                                )}

                                <button
                                  onClick={() => onRemoveCompany(company.id)}
                                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <X className="h-4 w-4" />
                                </button>

                                <div className={cn(
                                  "h-20 w-20 mb-4 rounded-3xl p-3 shadow-lg border flex items-center justify-center overflow-hidden transition-all hover:scale-105",
                                  isPremiumCompany(company) 
                                    ? "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-200/50" 
                                    : "bg-white border-slate-100"
                                )}>
                                  <img
                                    src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
                                    alt={company.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>

                                <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-2 px-2">
                                  {company.name}
                                </h4>

                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-black mb-4">
                                  <Star className="h-3 w-3 fill-current" />
                                  {formatRating(company.rating_avg || company.average_rating)} 
                                  ({company.rating_count || 0})
                                </div>

                                {isPremiumCompany(company) && (
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200 text-xs font-bold"
                                  >
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Empty slots */}
                          {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-6 flex items-center justify-center bg-slate-50/20 border-dashed border-2 border-slate-200">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                Slot vazio
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <TabsContent value="overview" className="mt-0 space-y-0">
                    <ComparisonSection title="Informações Gerais">
                      <ComparisonRow
                        label="Localização"
                        icon={<MapPin className="h-4 w-4 text-blue-500" />}
                        companies={companies}
                        render={(company) => (
                          <span className="text-sm font-bold text-slate-600">
                            {company.city}, {company.state}
                          </span>
                        )}
                      />
                      <ComparisonRow
                        label="Verificação"
                        icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
                        companies={companies}
                        render={(company) =>
                          company.verified ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Check className="h-3 w-3 mr-1" />
                              Verificada
                            </Badge>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )
                        }
                      />
                      <ComparisonRow
                        label="Anos de Mercado"
                        icon={<Clock className="h-4 w-4 text-orange-500" />}
                        companies={companies}
                        render={(company) => {
                          const years = company.founded_year ? new Date().getFullYear() - company.founded_year : null;
                          return years !== null ? (
                            <span className="text-sm font-bold text-slate-700">
                              {years > 0 ? `${years} anos` : 'Novo no mercado'}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          );
                        }}
                      />
                    </ComparisonSection>
                  </TabsContent>

                  <TabsContent value="credentials" className="mt-0 space-y-0">
                    <ComparisonSection title="Credibilidade & Conquistas">
                      <ComparisonRow
                        label="Badges"
                        icon={<Trophy className="h-4 w-4 text-amber-500" />}
                        companies={companies}
                        render={(company) => (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {company.badges && company.badges.length > 0 ? (
                              company.badges.slice(0, 2).map((badge, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {badge.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-300 font-medium">—</span>
                            )}
                          </div>
                        )}
                      />
                      <ComparisonRow
                        label="Prêmios"
                        icon={<Award className="h-4 w-4 text-blue-500" />}
                        companies={companies}
                        render={(company) => (
                          <p className="text-xs text-slate-600 line-clamp-2 italic text-center">
                            {company.awards || <span className="text-slate-300 not-italic">—</span>}
                          </p>
                        )}
                      />
                    </ComparisonSection>
                  </TabsContent>

                  <TabsContent value="commercial" className="mt-0 space-y-0">
                    <ComparisonSection title="Informações Comerciais">
                      <ComparisonRow
                        label="Financiamento"
                        icon={<CircleDollarSign className="h-4 w-4 text-emerald-500" />}
                        companies={companies}
                        render={(company) =>
                          company.financing_enabled ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Check className="h-3 w-3 mr-1" />
                              Disponível
                            </Badge>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )
                        }
                      />
                      <ComparisonRow
                        label="Parceiros"
                        icon={<Briefcase className="h-4 w-4 text-blue-500" />}
                        companies={companies}
                        render={(company) => (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {company.financing_partners && company.financing_partners.length > 0 ? (
                              company.financing_partners.slice(0, 2).map((partner, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {partner.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-300 font-medium">—</span>
                            )}
                          </div>
                        )}
                      />
                    </ComparisonSection>
                  </TabsContent>

                  <TabsContent value="technical" className="mt-0 space-y-0">
                    <ComparisonSection title="Capacidades Técnicas">
                      <ComparisonRow
                        label="Serviços"
                        icon={<Zap className="h-4 w-4 text-purple-500" />}
                        companies={companies}
                        render={(company) => (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {company.services && company.services.length > 0 ? (
                              company.services.slice(0, 2).map((service, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-300 font-medium">—</span>
                            )}
                          </div>
                        )}
                      />
                      <ComparisonRow
                        label="Ticket Mínimo"
                        icon={<CircleDollarSign className="h-4 w-4 text-green-500" />}
                        companies={companies}
                        render={(company) =>
                          company.minimum_ticket ? (
                            <span className="text-sm font-bold text-slate-700">
                              R$ {company.minimum_ticket.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )
                        }
                      />
                    </ComparisonSection>
                  </TabsContent>

                  <TabsContent value="contact" className="mt-0 space-y-0">
                    <ComparisonSection title="Contato & Suporte">
                      <ComparisonRow
                        label="WhatsApp"
                        icon={<MessageCircle className="h-4 w-4 text-green-500" />}
                        companies={companies}
                        render={(company) =>
                          company.whatsapp ? (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              Disponível
                            </Badge>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )
                        }
                      />
                      <ComparisonRow
                        label="Telefone"
                        icon={<Phone className="h-4 w-4 text-blue-500" />}
                        companies={companies}
                        render={(company) =>
                          company.phone ? (
                            <span className="text-sm font-mono text-slate-600">{company.phone}</span>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )
                        }
                      />
                    </ComparisonSection>
                  </TabsContent>

                  {/* CTA Section */}
                  <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mt-6">
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="min-w-[800px]">
                        <div className="grid grid-cols-4 divide-x divide-slate-100">
                          <div className="p-6 bg-slate-50/30 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-wide">
                              Ação
                            </span>
                          </div>

                          {companies.slice(0, 3).map((company, idx) => (
                            <div
                              key={`cta-${company.id}`}
                              className={cn(
                                "p-6",
                                isPremiumCompany(company) && "bg-gradient-to-br from-amber-50/30 to-orange-50/30"
                              )}
                            >
                              <Button
                                className={cn(
                                  "w-full rounded-2xl font-black h-12 shadow-lg transition-all hover:scale-[1.02] active:scale-95",
                                  isPremiumCompany(company)
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                                )}
                                onClick={() => handleQuoteClick(company.id)}
                              >
                                {isPremiumCompany(company) && <Crown className="h-4 w-4 mr-2" />}
                                Pedir Orçamento
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          ))}

                          {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                            <div key={`empty-cta-${i}`} className="p-6"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComparisonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-6">
      <div className="p-6 pb-0">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          {title}
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {children}
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  icon,
  companies,
  render,
}: {
  label: string;
  icon: React.ReactNode;
  companies: Company[];
  render: (company: Company) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-4 divide-x divide-slate-50 group hover:bg-blue-50/10 transition-colors">
          <div className="p-6 flex items-center gap-3 bg-slate-50/10">
            <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-blue-500 transition-colors">
              {icon}
            </div>
            <span className="text-sm font-black text-slate-700 uppercase tracking-wide group-hover:text-slate-900 transition-colors">
              {label}
            </span>
          </div>

          {companies.slice(0, 3).map((company, idx) => (
            <div
              key={`${company.id}-${label}`}
              className="p-6 flex items-center justify-center text-center"
            >
              {render(company)}
            </div>
          ))}

          {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
            <div key={`empty-${i}`} className="p-6"></div>
          ))}
        </div>
      </div>
    </div>
  );
}