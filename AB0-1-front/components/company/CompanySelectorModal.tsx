'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanyContext } from '@/context/CompanyContext';
import { AlertCircle, Check, Plus, Search, Building2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CompanySelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanySelectorModal({ open, onOpenChange }: CompanySelectorModalProps) {
  const { companies, selectCompany, isLoading } = useCompanyContext();
  const [search, setSearch] = useState('');
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const router = useRouter();

  const handleSelect = async (company: any) => {
    if (selectingId) return;
    setSelectError(null);
    setSelectingId(company.id);
    try {
      await selectCompany(company);
      onOpenChange(false);
    } catch (error) {
      console.error('[CompanySelectorModal] Failed to select company', error);
      setSelectError('Não foi possível selecionar a empresa. Tente novamente.');
    } finally {
      setSelectingId(null);
    }
  };

  const normalizedSearch = search.toLowerCase();
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(normalizedSearch) || 
    (c.city || '').toLowerCase().includes(normalizedSearch)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">Escolha a empresa para administrar</DialogTitle>
          <DialogDescription className="text-gray-500 text-base">
            Você pode alternar depois pelo menu.
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Digite o nome da empresa..." 
              className="pl-10 h-12 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["Perto de mim", "Verificadas", "Minha cidade", "Com avaliações"].map((filter) => (
              <Badge 
                key={filter} 
                variant="secondary" 
                className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer font-medium transition-colors"
              >
                {filter}
              </Badge>
            ))}
          </div>

          {selectError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{selectError}</span>
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4 -mr-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Minhas empresas</h4>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => {
                      const isSelecting = selectingId === company.id;
                      return (
                        <div
                          key={company.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group cursor-pointer ${selectingId ? 'opacity-70 pointer-events-none' : ''}`}
                          onClick={() => handleSelect(company)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelect(company);
                            }
                          }}
                        >
                        <div className="relative h-12 w-12 flex-shrink-0 rounded-full border border-gray-100 bg-white overflow-hidden flex items-center justify-center shadow-sm">
                          {company.logo_url ? (
                            <Image
                              src={company.logo_url}
                              alt={company.name}
                              fill
                              className="object-cover p-1"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 truncate">{company.name}</span>
                            {company.verified && (
                              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                                <Check className="h-3 w-3 text-white stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 font-medium">{company.city}, {company.state}</span>
                        </div>

                        <Button 
                          type="button"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSelecting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(company);
                          }}
                        >
                          {isSelecting ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Selecionando...
                            </div>
                          ) : (
                            'Selecionar'
                          )}
                        </Button>
                      </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma empresa encontrada.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Sugestões</h4>
                <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                  {/* Mock suggestions to match image */}
                  {[
                    { name: "Energia Boa", city: "Goiânia", state: "GO", verified: true },
                    { name: "Volitbras", city: "São Paulo", state: "SP", verified: true },
                    { name: "EcoSun Energia Solar", city: "Rio de Janeiro", state: "RJ", verified: false, special: true },
                  ].map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                    >
                      <div className="h-12 w-12 rounded-full border border-gray-100 bg-white flex items-center justify-center shadow-sm">
                        <Building2 className="h-6 w-6 text-gray-300" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 truncate">{suggestion.name}</span>
                          {suggestion.verified && (
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                              <Check className="h-3 w-3 text-white stroke-[3]" />
                            </div>
                          )}
                          {suggestion.special && (
                            <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500 font-medium">{suggestion.city}, {suggestion.state}</span>
                      </div>
                      <Button variant="outline" className="border-gray-200 text-gray-600 font-bold px-6 rounded-lg">
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-gray-600 font-medium">Não encontrei minha empresa</p>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-lg"
            onClick={() => router.push('/register')}
          >
            <Plus className="h-4 w-4" />
            Cadastrar empresa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
