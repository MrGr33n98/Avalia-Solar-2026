'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { companiesApiSafe } from '@/lib/api-client';
import { getFullImageUrl } from '@/utils/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Check, 
  X, 
  ArrowLeftRight, 
  Search, 
  ArrowRight,
  Zap,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import debounce from 'lodash/debounce';
import ReviewCompanyButton from '@/components/company/ReviewCompanyButton';

interface CompanyComparisonSectionProps {
  currentCompany: Company;
  enabled?: boolean;
}

export default function CompanyComparisonSection({
  currentCompany,
  enabled = true,
}: CompanyComparisonSectionProps) {
  const { comparisonList, addToComparison, removeFromComparison, clearComparison } = useComparison();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Add current company to comparison on mount if not already there
  useEffect(() => {
    if (!comparisonList.some(c => c.id === currentCompany.id)) {
      addToComparison(currentCompany);
    }
  }, [currentCompany, addToComparison, comparisonList]);

  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      try {
        const results = await companiesApiSafe.getAll({ q: term, limit: 5 });
        // Filter out companies already in comparison
        const filtered = results.filter(r => !comparisonList.some(c => c.id === r.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error('Error searching companies:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [comparisonList]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsSearching(true);
    setShowResults(true);
    debouncedSearch(term);
  };

  const handleAdd = (company: Company) => {
    addToComparison(company);
    setSearchTerm('');
    setShowResults(false);
  };

  // Organize companies: Current company first, then others
  const displayedCompanies = useMemo(() => {
    const others = comparisonList.filter(c => c.id !== currentCompany.id);
    return [currentCompany, ...others].slice(0, 3);
  }, [comparisonList, currentCompany]);

  const slotsRemaining = 3 - displayedCompanies.length;

  if (!enabled) return null;

  return (
    <section className="mt-20 border-t border-slate-200 bg-slate-50/30 -mx-4 px-4 md:-mx-8 md:px-8 py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-4">
              <ArrowLeftRight className="h-3.5 w-3.5" /> Comparativo de Mercado
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
              A decisão certa para o seu projeto
            </h2>
            <p className="text-slate-500 mt-4 text-lg max-w-2xl">
              Compare a <span className="text-blue-600 font-bold">{currentCompany.name}</span> com outras empresas e escolha a melhor opção técnica e comercial.
            </p>
          </div>

          {comparisonList.length > 1 && (
            <Button variant="ghost" size="sm" onClick={clearComparison} className="text-slate-400 hover:text-red-600 font-bold transition-all">
              <X className="h-4 w-4 mr-2" /> Limpar tudo
            </Button>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-x-auto md:overflow-hidden scrollbar-hide max-w-full">
          <div className="min-w-[800px] md:min-w-0 w-full max-w-full">
            {/* Header Row */}
            <div className="grid grid-cols-4">
              <div className="p-10 flex flex-col justify-end bg-slate-50/40 border-r border-slate-100">
                <h3 className="text-xl font-black text-slate-900 leading-tight">Empresas em análise</h3>
              </div>

              <AnimatePresence mode="popLayout">
                {displayedCompanies.map((company, idx) => (
                  <motion.div 
                    key={company.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-8 flex flex-col items-center text-center relative border-r border-slate-100 last:border-r-0",
                      idx === 0 && "bg-blue-50/20"
                    )}
                  >
                    {idx > 0 && (
                      <button onClick={() => removeFromComparison(company.id)} className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all">
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <div className="h-20 w-20 mb-6 rounded-3xl bg-white p-3 shadow-xl shadow-slate-200/40 border border-slate-50 flex items-center justify-center overflow-hidden">
                      <Image 
                        src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                        alt={company.name} 
                        width={64}
                        height={64}
                        className="max-h-full max-w-full object-contain" 
                      />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-1">{company.name}</h4>
                    <div className="flex items-center text-amber-500 text-sm font-black mb-6">
                      <Star className="h-4 w-4 fill-current mr-1.5" />
                      {company.average_rating?.toFixed(1) || '0.0'}
                    </div>

                    <Button asChild variant={idx === 0 ? "default" : "outline"} className="w-full rounded-2xl font-black h-11 transition-all hover:scale-[1.02]">
                      <Link href={`/companies/${company.slug}`}>Ver perfil</Link>
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Slots */}
              {Array.from({ length: slotsRemaining }).map((_, i) => (
                <div key={`empty-${i}`} className="p-8 flex flex-col items-center justify-center border-slate-100 bg-slate-50/20 min-h-[280px]">
                  <div className="w-full text-center">
                    <div className="h-14 w-14 mx-auto mb-6 rounded-3xl bg-white flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                      <Plus className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Adicionar empresa</p>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar..." 
                        className="pl-11 h-12 rounded-2xl bg-white border-slate-200 text-sm focus-visible:ring-blue-500/20 shadow-sm"
                        value={i === 0 ? searchTerm : ''}
                        onChange={i === 0 ? handleSearchChange : undefined}
                        onFocus={() => setShowResults(true)}
                        disabled={i > 0}
                      />

                      {/* Search Results Dropdown */}
                      {i === 0 && showResults && (searchTerm || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden">
                          {isSearching ? (
                            <div className="p-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Buscando...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map(result => (
                              <button 
                                key={result.id} 
                                onClick={() => handleAdd(result)} 
                                className="w-full p-4 text-left hover:bg-blue-50 flex items-center gap-4 transition-all border-b border-slate-50 last:border-0 group"
                              >
                                <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:shadow-md transition-all">
                                  <Image 
                                    src={getFullImageUrl(result.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                                    alt={result.name} 
                                    width={32}
                                    height={32}
                                    className="max-h-full max-w-full object-contain" 
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate">{result.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{result.city}, {result.state}</p>
                                </div>
                              </button>
                            ))
                          ) : searchTerm.length >= 2 ? (
                            <div className="p-6 text-center text-sm text-slate-400">Nenhuma empresa encontrada</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-50">
              <ComparisonRow 
                label="Reputação" 
                companies={displayedCompanies} 
                value={(c) => (
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-xl font-black text-slate-900">{c.average_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.rating_count || 0} avaliações</span>
                  </div>
                )} 
              />

              <ComparisonRow 
                label="Localização" 
                companies={displayedCompanies} 
                value={(c) => (
                  <span className="text-sm font-bold text-slate-600">{c.city}, {c.state}</span>
                )} 
              />

              <ComparisonRow 
                label="Verificação" 
                companies={displayedCompanies} 
                value={(c) => (
                  c.verified ? (
                    <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl text-xs font-black">
                      <Check className="h-3.5 w-3.5" /> Verificada
                    </div>
                  ) : <span className="text-slate-300 font-medium">—</span>
                )} 
              />

              <ComparisonRow 
                label="Selo Premium" 
                companies={displayedCompanies} 
                value={(c) => (
                  c.featured ? (
                    <div className="inline-flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-1.5 rounded-xl text-xs font-black">
                      <Zap className="h-3.5 w-3.5 fill-current" /> Premium
                    </div>
                  ) : <span className="text-slate-300 font-medium">—</span>
                )} 
              />

              <ComparisonRow 
                label="Experiência" 
                companies={displayedCompanies} 
                value={(c) => {
                  const year = (c as Company & { founded_year?: number | string | null }).founded_year;
                  const foundedYear = Number(year);
                  if (!Number.isFinite(foundedYear) || foundedYear <= 0) {
                    return <span className="text-slate-300 font-medium">—</span>;
                  }
                  const years = new Date().getFullYear() - foundedYear;
                  return <span className="text-sm font-bold text-slate-700">{years > 0 ? `${years} anos no mercado` : 'Novo no mercado'}</span>;
                }} 
              />
            </div>

            {/* Footer Row */}
            <div className="grid grid-cols-4 bg-slate-50/30">
              <div className="p-8 flex items-center justify-center border-r border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ação imediata</span>
              </div>
              {displayedCompanies.map((company, idx) => (
                <div key={`cta-${company.id}`} className={cn(
                  "p-8 border-r border-slate-100 last:border-r-0",
                  idx === 0 && "bg-blue-50/20"
                )}>
                  <ReviewCompanyButton
                    company={company}
                    className="h-14 w-full rounded-2xl bg-blue-600 font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] hover:bg-blue-700"
                    iconClassName="fill-white text-white"
                  />
                </div>
              ))}
              {Array.from({ length: 3 - displayedCompanies.length }).map((_, i) => (
                <div key={`empty-cta-${i}`} className="p-8 border-r border-slate-100 last:border-r-0"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="link" className="text-slate-400 hover:text-blue-600 transition-colors">
            <Link href="/compare" className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              Ver comparação completa <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ComparisonRow({ 
  label, 
  companies, 
  value 
}: { 
  label: string; 
  companies: Company[]; 
  value: (c: Company) => React.ReactNode 
}) {
  return (
    <div className="grid grid-cols-4 group hover:bg-slate-50/50 transition-colors">
      <div className="p-8 flex items-center bg-slate-50/10 border-r border-slate-100">
        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{label}</span>
      </div>

      {companies.map((company, idx) => (
        <div key={`val-${company.id}`} className={cn(
          "p-8 flex items-center justify-center md:justify-start border-r border-slate-100 last:border-r-0",
          idx === 0 && "bg-blue-50/10"
        )}>
          {value(company)}
        </div>
      ))}

      {Array.from({ length: 3 - companies.length }).map((_, i) => (
        <div key={`empty-val-${i}`} className="p-8 border-r border-slate-100 last:border-r-0"></div>
      ))}
    </div>
  );
}
