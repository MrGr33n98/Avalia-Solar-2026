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
import { FinancialInstitution, FinancingOption } from '@/lib/api';
import { financialInstitutionsApiSafe } from '@/lib/api-client';

interface Props {
  onSelectOption: (option: FinancingOption, institution: FinancialInstitution) => void;
  className?: string;
}

export function FinancialInstitutionDropdown({ onSelectOption, className }: Props) {
  const [open, setOpen] = useState(false);
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  useEffect(() => {
    financialInstitutionsApiSafe.getAll().then((data) => {
      setInstitutions(data || []);
      setLoading(false);
    });
  }, []);

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId);
  const selectedOption = selectedInstitution?.financing_options?.find(o => o.id === selectedOptionId);

  const handleSelect = (institutionId: number, optionId: number) => {
    setSelectedInstitutionId(institutionId);
    setSelectedOptionId(optionId);
    setOpen(false);
    
    const institution = institutions.find(i => i.id === institutionId);
    const option = institution?.financing_options?.find(o => o.id === optionId);
    if (option && institution) {
      onSelectOption(option, institution);
    }
  };

  if (loading) {
    return <Button variant="outline" className={cn("w-full justify-start", className)} disabled>Carregando instituições...</Button>;
  }

  if (institutions.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedInstitution ? (
              <>
                {selectedInstitution.logo_url ? (
                  <Image src={selectedInstitution.logo_url} alt={selectedInstitution.name} width={20} height={20} className="object-contain" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                <span className="truncate">{selectedInstitution.name} - {selectedOption?.credit_line || 'Padrão'}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Selecione um banco ou financeira...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar instituição..." />
          <CommandEmpty>Nenhuma instituição encontrada.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {institutions.map((institution) => (
              <div key={institution.id}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                  {institution.logo_url ? (
                    <Image src={institution.logo_url} alt={institution.name} width={16} height={16} className="object-contain" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                  {institution.name}
                </div>
                {institution.financing_options?.map((option) => (
                  <CommandItem
                    key={`${institution.id}-${option.id}`}
                    value={`${institution.name} ${option.credit_line}`}
                    onSelect={() => handleSelect(institution.id, option.id)}
                    className="pl-6"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedOptionId === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.credit_line}</span>
                      {option.interest_rate_percent !== undefined && option.interest_rate_percent !== null && (
                        <span className="text-xs text-muted-foreground">Taxa: {option.interest_rate_percent}% a.m.</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
                {(!institution.financing_options || institution.financing_options.length === 0) && (
                  <div className="pl-6 py-2 text-sm text-muted-foreground">Nenhuma opção cadastrada</div>
                )}
              </div>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
