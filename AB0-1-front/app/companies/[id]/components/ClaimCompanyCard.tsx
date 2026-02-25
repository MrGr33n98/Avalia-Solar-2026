'use client';

import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Company } from '@/lib/api';

interface ClaimCompanyCardProps {
  company: Company;
}

export default function ClaimCompanyCard({ company }: ClaimCompanyCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5 shadow-md">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <ShieldCheck className="h-6 w-6" />
          <h3 className="font-bold text-lg leading-tight">Você é o proprietário desta empresa?</h3>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          Verifique seu perfil para responder a avaliações, atualizar suas informações e obter o 
          <span className="font-semibold text-foreground"> Selo de Confiança Avalia Solar</span>.
        </p>

        <Button asChild className="w-full group" variant="default">
          <Link href={`/companies/${company.id}/claim`}>
            Reivindicar Empresa
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        
        <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-wider font-medium">
          Acesso gratuito para instaladores
        </p>
      </CardContent>
    </Card>
  );
}
