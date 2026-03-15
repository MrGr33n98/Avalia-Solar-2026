'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCompanyContext } from '@/context/CompanyContext';
import { Building2, ChevronsUpDown, Plus, Settings, LayoutDashboard } from 'lucide-react';
import { CompanySelectorModal } from './CompanySelectorModal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const { activeCompany, companies, selectCompany, isLoading } = useCompanyContext();
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  if (isLoading && !activeCompany) {
    return (
      <div className={cn("h-10 w-48 animate-pulse rounded-md bg-muted", className)} />
    );
  }

  // If user has no companies, show "Cadastrar Empresa" button
  if (companies.length === 0 && !isLoading) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={cn("gap-2", className)}
        onClick={() => router.push('/register')}
      >
        <Plus className="h-4 w-4" />
        <span>Cadastrar Empresa</span>
      </Button>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between gap-2 px-2 hover:bg-muted/50 border border-transparent hover:border-border transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="relative h-6 w-6 flex-shrink-0 rounded bg-muted overflow-hidden border">
                  {activeCompany?.logo_url ? (
                    <Image
                      src={activeCompany.logo_url}
                      alt={activeCompany.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 m-1 text-muted-foreground" />
                  )}
                </div>
                <span className="truncate text-sm font-medium">
                  {activeCompany?.name || 'Selecionar Empresa'}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Suas empresas
            </DropdownMenuLabel>
            
            {companies.slice(0, 5).map((company) => (
              <DropdownMenuItem
                key={company.id}
                onSelect={() => {
                  void selectCompany(company).catch((error) => {
                    console.warn('[CompanySwitcher] Failed to select company', error);
                  });
                }}
                className="gap-2 cursor-pointer"
              >
                <div className="relative h-5 w-5 flex-shrink-0 rounded bg-muted overflow-hidden border">
                  {company.logo_url ? (
                    <Image
                      src={company.logo_url}
                      alt={company.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="h-3 w-3 m-1 text-muted-foreground" />
                  )}
                </div>
                <span className="truncate flex-1">{company.name}</span>
                {activeCompany?.id === company.id && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}

            {companies.length > 5 && (
              <DropdownMenuItem 
                onSelect={() => setModalOpen(true)}
                className="justify-center text-xs text-primary font-medium cursor-pointer"
              >
                Ver todas ({companies.length})
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onSelect={() => setModalOpen(true)}
              className="gap-2 cursor-pointer"
            >
              <ChevronsUpDown className="h-4 w-4" />
              <span>Trocar empresa</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onSelect={() => router.push('/dashboard')}
              className="gap-2 cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onSelect={() => router.push(`/companies/${activeCompany?.id}/settings`)}
              className="gap-2 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onSelect={() => router.push('/register')}
              className="gap-2 cursor-pointer text-primary focus:text-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar nova empresa</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CompanySelectorModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}
