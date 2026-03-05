'use client';

import { ArrowRight, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ComparisonFooterCTAProps {
  hasPremiumCompanies?: boolean;
  className?: string;
}

export default function ComparisonFooterCTA({
  hasPremiumCompanies = false,
  className,
}: ComparisonFooterCTAProps) {
  return (
    <footer className={className}>
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <h2 className="text-2xl font-black text-slate-900 mb-4">
          Não encontrou o que procura?
        </h2>
        
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          As informações acima são baseadas nos perfis oficiais das empresas e em avaliações de usuários reais.
          {hasPremiumCompanies && (
            <span className="block mt-2">
              Empresas premium recebem destaque especial por serem parceiros verificados da plataforma.
            </span>
          )}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            asChild 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Link href="/companies" className="flex items-center justify-center">
              Explorar mais empresas
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </Link>
          </Button>

          {hasPremiumCompanies && (
            <Button 
              asChild 
              variant="outline"
              size="lg"
              className="border-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Link href="/companies?featured=true" className="flex items-center justify-center">
                <Crown className="h-4 w-4 mr-2" aria-hidden="true" />
                Ver mais empresas premium
              </Link>
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
