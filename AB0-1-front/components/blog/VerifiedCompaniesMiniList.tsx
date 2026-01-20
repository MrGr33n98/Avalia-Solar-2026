'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Company {
  id: number;
  name: string;
  rating: number;
  city: string;
  logo_url?: string;
}

interface VerifiedCompaniesMiniListProps {
  companies: Company[];
  isLoading?: boolean;
}

export function VerifiedCompaniesMiniList({ companies, isLoading }: VerifiedCompaniesMiniListProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40 mb-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          Empresas Verificadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {companies.map((company) => (
          <Link 
            key={company.id} 
            href={`/companies/${company.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-slate-200">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded" />
              ) : (
                company.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-primary transition-colors">
                {company.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="flex items-center text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="ml-1 font-medium">{company.rating}</span>
                </div>
                <span>•</span>
                <span className="truncate flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {company.city}
                </span>
              </div>
            </div>
          </Link>
        ))}
        <Button variant="outline" className="w-full text-xs h-8" asChild>
           <Link href="/companies">Ver todas as empresas</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
