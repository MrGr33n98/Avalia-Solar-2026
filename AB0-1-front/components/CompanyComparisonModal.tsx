'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Mail,
  Award,
  Crown,
  ExternalLink
} from 'lucide-react';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { useAuth } from '@/contexts/AuthContext';
import { openSignupGate } from '@/lib/signup-gate';
import { cn } from '@/lib/utils';
import {
  formatCompanyYears,
  formatCurrencyBRL,
  isPremiumCompany,
} from '@/components/compare/compare-company-utils';

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
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1080px] max-h-[82vh] gap-0 overflow-hidden rounded-[2rem] border-0 bg-white/95 p-0 shadow-[0_34px_76px_-26px_rgba(15,23,42,0.38)] backdrop-blur-xl transition-all duration-500">
        <DialogHeader className="space-y-0 border-b border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.92))] p-5 pb-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 shrink-0">
                <Scale className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
                  Análise Comparativa
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest mt-1">
                  {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} selecionadas
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="h-10 w-full rounded-xl px-6 text-slate-400 font-black transition-all hover:bg-red-50 hover:text-red-600 md:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Comparação
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 md:px-8 py-4 bg-white/50 border-b border-slate-50">
              <TabsList className="flex h-12 w-full gap-1 rounded-[1.15rem] border border-slate-200/70 bg-slate-100/85 p-1.5 shadow-inner md:grid md:grid-cols-5">
                {[
                  { value: 'overview', label: 'Visão Geral' },
                  { value: 'credentials', label: 'Credibilidade' },
                  { value: 'commercial', label: 'Comercial' },
                  { value: 'technical', label: 'Técnico' },
                  { value: 'contact', label: 'Contato' }
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className={cn(
                      "flex-1 text-[11px] font-black uppercase tracking-wider transition-all duration-300 rounded-[0.85rem] px-4",
                      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:scale-[1.02]"
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 pb-16 md:p-5">
                  {/* Companies Header */}
                  <div className="mb-5 overflow-hidden rounded-[1.8rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.94))] shadow-[0_24px_48px_-30px_rgba(15,23,42,0.35)] clay-surface clay-convex">
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100">
                          <div className="flex items-center justify-center bg-slate-50/30 p-4">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
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
                                  "group relative flex flex-col items-center p-4 text-center transition-colors duration-500",
                                  isPremiumCompany(company) && "bg-gradient-to-br from-blue-50/20 to-indigo-50/20"
                                )}
                              >
                                {/* Premium Crown */}
                                {isPremiumCompany(company) && (
                                  <div className="absolute -top-2 -right-2">
                                    <div className="relative">
                                      <Crown className="h-6 w-6 text-indigo-500 fill-current" />
                                      <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-400 rounded-full animate-pulse shadow-sm shadow-blue-200" />
                                    </div>
                                  </div>
                                )}

                                <button
                                  onClick={() => onRemoveCompany(company.id)}
                                  aria-label={`Remover ${company.name} da comparação`}
                                  className="absolute top-4 right-4 rounded-full bg-slate-100 p-1.5 text-slate-400 transition-all hover:bg-red-100 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                                >
                                  <X className="h-4 w-4" />
                                </button>

                                <div className={cn(
                                  "mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.25rem] border p-1 shadow-lg transition-all hover:scale-[1.04]",
                                  isPremiumCompany(company) 
                                    ? "bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-blue-200/40" 
                                    : "bg-white border-slate-100 shadow-slate-200/30"
                                )}>
                                  <Image
                                    src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
                                    alt={company.name}
                                    width={46}
                                    height={46}
                                    className="h-full w-full scale-[1.14] object-contain"
                                  />
                                </div>

                                <h4 className="mb-2 line-clamp-2 px-2 text-base font-black tracking-tight text-slate-900">
                                  {company.name}
                                </h4>

                                <div className="mb-3 flex items-center gap-1.5 rounded-full border border-blue-100/50 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-600 shadow-sm">
                                  <Star className="h-3 w-3 fill-current" />
                                  {formatRating(company.rating_avg || company.average_rating)} 
                                  ({company.rating_count || 0})
                                </div>

                                {isPremiumCompany(company) && (
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 text-[10px] font-black uppercase tracking-wider shadow-sm"
                                  >
                                    Parceiro Premium
                                  </Badge>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Empty slots */}
                          {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50/20 p-4">
                              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
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
                          const yearsLabel = formatCompanyYears(company);
                          return yearsLabel ? (
                            <span className="text-sm font-bold text-slate-700">
                              {yearsLabel}
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
                          formatCurrencyBRL(company.minimum_ticket) ? (
                            <span className="text-sm font-bold text-slate-700">
                              {formatCurrencyBRL(company.minimum_ticket)}
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
                        render={(company) => {
                          if (!company.phone) return <span className="text-slate-300 font-medium">—</span>;
                          
                          const isMasked = !isAuthenticated && !authLoading;
                          const displayPhone = isMasked ? `${company.phone.substring(0, 6)}****` : company.phone;

                          return (
                            <button
                              onClick={(e) => {
                                if (isMasked) {
                                  openSignupGate({
                                    source: 'comparison_reveal',
                                    title: 'Crie sua conta para ver os contatos',
                                    description: 'Libere os canais de contato das empresas selecionadas.',
                                  });
                                }
                              }}
                              className={cn(
                                "text-sm font-mono transition-colors",
                                isMasked ? "text-slate-400 hover:text-blue-600 flex flex-col items-center gap-1" : "text-slate-600"
                              )}
                            >
                              <span>{displayPhone}</span>
                              {isMasked && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">
                                  Ver
                                </span>
                              )}
                            </button>
                          );
                        }}
                      />
                      <ComparisonRow
                        label="E-mail"
                        icon={<Mail className="h-4 w-4 text-slate-400" />}
                        companies={companies}
                        render={(company) => {
                          const email = company.email || (company as any).email_public;
                          if (!email) return <span className="text-slate-300 font-medium">—</span>;
                          
                          const isMasked = !isAuthenticated && !authLoading;
                          const displayEmail = isMasked 
                            ? `${email.split('@')[0].substring(0, 3)}****@${email.split('@')[1]}` 
                            : email;

                          return (
                            <button
                              onClick={(e) => {
                                if (isMasked) {
                                  openSignupGate({
                                    source: 'comparison_reveal',
                                    title: 'Crie sua conta para ver os contatos',
                                    description: 'Libere os canais de contato das empresas selecionadas.',
                                  });
                                }
                              }}
                              className={cn(
                                "text-[11px] font-medium transition-colors truncate max-w-[120px]",
                                isMasked ? "text-slate-400 hover:text-blue-600 flex flex-col items-center gap-1" : "text-slate-600"
                              )}
                            >
                              <span className="truncate">{displayEmail}</span>
                              {isMasked && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">
                                  Ver
                                </span>
                              )}
                            </button>
                          );
                        }}
                      />
                    </ComparisonSection>
                  </TabsContent>

                  {/* CTA Section */}
                  <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.94))] shadow-[0_24px_48px_-30px_rgba(15,23,42,0.35)] clay-surface clay-convex">
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] divide-x divide-slate-100">
                          <div className="flex items-center justify-center bg-slate-50/30 p-4">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                              Ação
                            </span>
                          </div>

                          {companies.slice(0, 3).map((company, idx) => (
                            <div
                              key={`cta-${company.id}`}
                              className={cn(
                                "p-4 transition-colors duration-500",
                                isPremiumCompany(company) && "bg-gradient-to-br from-blue-50/20 to-indigo-50/20"
                              )}
                            >
                              <Button
                                className={cn(
                                  "w-full rounded-[1.25rem] font-black h-12 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                  "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200/50 border-t border-blue-400/30",
                                  isPremiumCompany(company) && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 border-t border-indigo-400/30"
                                )}
                                onClick={() => handleQuoteClick(company.id)}
                              >
                                {isPremiumCompany(company) && <Crown className="h-4 w-4 mr-2" />}
                                Solicitar Orçamento
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          ))}

                          {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
                            <div key={`empty-cta-${i}`} className="p-4"></div>
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
    <div className="mb-5 overflow-hidden rounded-[1.8rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.94))] shadow-[0_24px_48px_-30px_rgba(15,23,42,0.35)] clay-surface clay-convex">
      <div className="p-5 pb-0">
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
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] divide-x divide-slate-50 group hover:bg-blue-50/10 transition-colors">
          <div className="flex items-center gap-3 bg-slate-50/10 p-4">
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
              className="flex items-center justify-center p-4 text-center"
            >
              {render(company)}
            </div>
          ))}

          {Array.from({ length: 3 - Math.min(companies.length, 3) }).map((_, i) => (
            <div key={`empty-${i}`} className="p-4"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
