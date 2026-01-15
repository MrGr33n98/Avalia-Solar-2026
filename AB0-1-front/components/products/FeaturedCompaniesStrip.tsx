import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Building2, CheckCircle2, Star } from 'lucide-react';

interface CompanySummary {
  name: string;
  logo_url?: string; // Optional, might not be in product payload yet
  productCount: number;
  isVerified?: boolean; // Mock for now
  rating?: number; // Mock for now
  city?: string; // Mock for now
}

interface FeaturedCompaniesStripProps {
  companies: CompanySummary[];
}

export function FeaturedCompaniesStrip({ companies }: FeaturedCompaniesStripProps) {
  if (companies.length === 0) return null;

  return (
    <div className="w-full mb-8 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Fornecedores em Destaque
        </h2>
        <span className="text-sm text-muted-foreground">
          {companies.length} parceiros verificados
        </span>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <div className="flex w-max space-x-4 pb-4 px-1">
          {companies.map((company) => (
            <Card 
              key={company.name} 
              className="w-[280px] flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer border-slate-200"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={company.logo_url} alt={company.name} />
                  <AvatarFallback className="bg-primary/5 font-bold text-primary">
                    {company.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold truncate text-sm" title={company.name}>
                      {company.name}
                    </span>
                    {company.isVerified && (
                      <CheckCircle2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {company.productCount} prods
                    </span>
                    {company.rating && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3 h-3 fill-amber-600" />
                        {company.rating}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}