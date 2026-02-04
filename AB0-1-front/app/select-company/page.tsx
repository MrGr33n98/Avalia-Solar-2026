'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Check, 
  MapPin, 
  Search, 
  Plus, 
  ArrowRight, 
  Loader2,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SelectCompanyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { companies, activeCompany, setActiveCompany, isLoading } = useCompanyContext();
  const [search, setSearch] = useState('');

  const handleSelect = (company: any) => {
    setActiveCompany(company);
    router.push('/dashboard');
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando suas empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-[750px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10 pb-6 space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Escolha a empresa para administrar</h1>
          <p className="text-gray-500 text-lg">Você pode alternar depois pelo menu.</p>
        </div>

        <div className="px-10 pb-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Digite o nome da empresa..." 
              className="pl-12 h-14 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 text-lg rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["Perto de mim", "Verificadas", "Minha cidade", "Com avaliações"].map((filter) => (
              <Badge 
                key={filter} 
                variant="secondary" 
                className="px-5 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer font-semibold transition-colors rounded-full"
              >
                {filter}
              </Badge>
            ))}
          </div>

          <div className="space-y-8 py-4">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Minhas empresas</h4>
              <div className="space-y-4">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-5 p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group cursor-pointer"
                      onClick={() => handleSelect(company)}
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 rounded-full border-2 border-white bg-white overflow-hidden flex items-center justify-center shadow-md">
                        {company.logo_url ? (
                          <Image
                            src={company.logo_url}
                            alt={company.name}
                            fill
                            className="object-cover p-1.5"
                          />
                        ) : (
                          <Building2 className="h-7 w-7 text-gray-300" />
                        )}
                      </div>
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xl truncate">{company.name}</span>
                          {company.verified && (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500">
                              <Check className="h-3.5 w-3.5 text-white stroke-[4]" />
                            </div>
                          )}
                        </div>
                        <span className="text-gray-500 font-medium text-base">{company.city}, {company.state}</span>
                      </div>

                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-6 text-lg rounded-xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(company);
                        }}
                      >
                        Selecionar
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">Nenhuma empresa encontrada para sua busca.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Sugestões</h4>
              <div className="space-y-4 opacity-50">
                {[
                  { name: "Energia Boa", city: "Goiânia", state: "GO", verified: true },
                  { name: "Volitbras", city: "São Paulo", state: "SP", verified: true },
                ].map((suggestion, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-5 p-5 rounded-2xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="h-14 w-14 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm">
                      <Building2 className="h-7 w-7 text-gray-200" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xl truncate">{suggestion.name}</span>
                        {suggestion.verified && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500">
                            <Check className="h-3.5 w-3.5 text-white stroke-[4]" />
                          </div>
                        )}
                      </div>
                      <span className="text-gray-500 font-medium text-base">{suggestion.city}, {suggestion.state}</span>
                    </div>
                    <Button variant="outline" className="border-gray-200 text-gray-400 font-bold px-8 py-6 text-lg rounded-xl">
                      Selecionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <p className="text-gray-500 font-bold text-lg">Não encontrei minha empresa</p>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-3 px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-600/20"
            onClick={() => router.push('/register')}
          >
            <Plus className="h-5 w-5 stroke-[3]" />
            Cadastrar empresa
          </Button>
        </div>
      </div>
    </div>
  );
}
