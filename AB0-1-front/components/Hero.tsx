'use client';

import { Zap, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import SearchBar from '@/components/SearchBar';
import { openQuoteWizard } from '@/lib/quote-wizard';

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative bg-white py-12 lg:py-16 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-primary-light to-accent rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-accent to-primary-light rounded-full opacity-20 blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Heading */}
          <div
            className="space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-700"
          >
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-950">
              Compare e Encontre a <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Melhor Empresa Solar
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Conecte-se com instaladores certificados. Economize tempo e garanta a melhor escolha para sua energia solar.
            </p>
          </div>

          {/* Search Bar */}
          <div
            className="mt-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both"
          >
            <div className="relative">
              <SearchBar placeholder="Busque empresas, produtos ou serviços..." />
              <div className="mt-4 overflow-x-auto no-scrollbar">
                <div className="inline-flex items-center gap-2 px-2 whitespace-nowrap snap-x snap-mandatory">
                  {['Painel Solar', 'Inversor', 'Bateria', 'Instalação'].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-card rounded-full text-muted-foreground border border-border hover:border-accent-dark cursor-pointer transition-colors snap-start"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both"
          >
            {isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => openQuoteWizard({ source: 'home-hero' })}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Fazer Orçamento Grátis
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary text-primary hover:bg-primary-light hover:text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300"
                >
                  Ver Empresas Verificadas
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => openQuoteWizard({ source: 'home-hero' })}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Fazer Orçamento Grátis
                </Button>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Começar Agora
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary text-primary hover:bg-primary-light hover:text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Já tenho conta
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
