'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FinancialInstitution, FinancingOption, CompanyFinancingPartner } from '@/lib/api';
import { financialInstitutionsApiSafe } from '@/lib/api-client';

interface Props {
  partners?: CompanyFinancingPartner[];
  selectedPartnerId?: number | null;
  onSelectPartner?: (partner: CompanyFinancingPartner) => void;
  onSelectOption?: (option: FinancingOption, institution: FinancialInstitution) => void;
  className?: string;
}

export function FinancialInstitutionDropdown({
  partners = [],
  selectedPartnerId,
  onSelectPartner,
  onSelectOption,
  className
}: Props) {
  const [open, setOpen] = useState(false);
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(selectedPartnerId || null);

  useEffect(() => {
    financialInstitutionsApiSafe.getAll().then((data) => {
      setInstitutions(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPartnerId !== undefined) {
      setActivePartnerId(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId);
  const selectedOption = selectedInstitution?.financing_options?.find(o => o.id === selectedOptionId);
  const selectedPartner = partners.find(p => p.id === activePartnerId);

  const handleSelectInstitutionOption = (institutionId: number, optionId: number) => {
    setSelectedInstitutionId(institutionId);
    setSelectedOptionId(optionId);
    setActivePartnerId(null);
    setOpen(false);
    
    const institution = institutions.find(i => i.id === institutionId);
    const option = institution?.financing_options?.find(o => o.id === optionId);
    if (option && institution && onSelectOption) {
      onSelectOption(option, institution);
    }
  };

  const handleSelectPartnerItem = (partner: CompanyFinancingPartner) => {
    setActivePartnerId(partner.id);
    setSelectedInstitutionId(null);
    setSelectedOptionId(null);
    setOpen(false);
    if (onSelectPartner) {
      onSelectPartner(partner);
    }
  };

  // Determine what logo and label to display on button trigger
  const displayLogo = selectedPartner?.logo_url || selectedInstitution?.logo_url;
  const displayName = selectedPartner?.name || selectedInstitution?.name;
  const displaySubtext = selectedOption?.credit_line || (selectedPartner ? 'Parceiro Oficial' : null);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Instituição financeira
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full h-11 justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl px-3.5", className)}
          >
            <div className="flex items-center gap-2.5 truncate">
              {displayLogo ? (
                <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                  <Image src={displayLogo} alt={displayName || 'Banco'} width={24} height={24} className="max-h-6 w-auto object-contain" />
                </div>
              ) : (
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {displayName ? (
                  <>
                    {displayName}
                    {displaySubtext && <span className="text-slate-400 font-normal ml-1">({displaySubtext})</span>}
                  </>
                ) : (
                  <span className="text-slate-400">Selecione o banco ou financeira...</span>
                )}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl overflow-hidden shadow-xl" align="start">
          <Command>
            <CommandInput placeholder="Buscar instituição financeira..." className="h-10 text-xs" />
            <CommandEmpty className="py-3 text-center text-xs text-slate-500">Nenhuma instituição encontrada.</CommandEmpty>
            
            <CommandGroup className="max-h-[280px] overflow-auto p-1">
              {/* 1. Parceiros de Financiamento da Empresa */}
              {partners.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-md mb-1">
                    Parceiros de Financiamento
                  </div>
                  {partners.map((partner) => (
                    <CommandItem
                      key={`partner-${partner.id}`}
                      value={partner.name}
                      onSelect={() => handleSelectPartnerItem(partner)}
                      className="flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {partner.logo_url ? (
                          <Image src={partner.logo_url} alt={partner.name} width={20} height={20} className="h-5 w-auto object-contain shrink-0" />
                        ) : (
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{partner.name}</span>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 text-blue-600 shrink-0",
                          activePartnerId === partner.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </div>
              )}

              {/* 2. Instituições Globais da Plataforma */}
              {institutions.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-md mb-1">
                    Instituições de Mercado
                  </div>
                  {institutions.map((institution) => (
                    <div key={`inst-${institution.id}`} className="mb-1">
                      <div className="px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {institution.logo_url ? (
                          <Image src={institution.logo_url} alt={institution.name} width={16} height={16} className="h-4 w-auto object-contain" />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        {institution.name}
                      </div>
                      {institution.financing_options?.map((option) => (
                        <CommandItem
                          key={`inst-opt-${institution.id}-${option.id}`}
                          value={`${institution.name} ${option.credit_line}`}
                          onSelect={() => handleSelectInstitutionOption(institution.id, option.id)}
                          className="pl-6 py-1.5 px-2 rounded-lg cursor-pointer text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5 text-blue-600 shrink-0",
                              selectedOptionId === option.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{option.credit_line}</span>
                            {option.interest_rate_percent !== undefined && option.interest_rate_percent !== null && (
                              <span className="text-[10px] text-slate-500">Taxa: {option.interest_rate_percent}% a.m.</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                      {(!institution.financing_options || institution.financing_options.length === 0) && (
                        <CommandItem
                          key={`inst-only-${institution.id}`}
                          value={institution.name}
                          onSelect={() => handleSelectInstitutionOption(institution.id, 0)}
                          className="pl-6 py-1.5 px-2 rounded-lg cursor-pointer text-xs font-medium text-slate-700"
                        >
                          Seleção padrão ({institution.name})
                        </CommandItem>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Fallback se vazio */}
              {partners.length === 0 && institutions.length === 0 && !loading && (
                <div className="p-3 text-center text-xs text-slate-500">
                  Nenhum parceiro de financiamento configurado para esta empresa.
                </div>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
