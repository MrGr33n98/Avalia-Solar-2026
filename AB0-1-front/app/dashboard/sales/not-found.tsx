'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Building2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

export default function CRMNotFound() {
  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-sans select-none">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Página Indisponível</h1>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">
          A rota solicitada não existe ou foi movida para uma nova localização no CRM Avalia Solar.
        </p>

        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-9 px-4 gap-2">
            <Link href="/dashboard/sales/leads">
              <Target className="w-4 h-4" />
              <span>Voltar para Leads</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 px-4 gap-2">
            <Link href="/dashboard/sales/accounts">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Ver Empresas</span>
            </Link>
          </Button>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
