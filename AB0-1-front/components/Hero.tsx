'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, Users, TrendingUp, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import SearchBar from '@/components/SearchBar';

export default function Hero() {
  const { stats, loading } = useDashboard();
  const { isAuthenticated } = useAuth();

  const statsData = [
    {
      icon: Users,
      value: loading ? '...' : (stats?.companies_count ? `${stats.companies_count}+` : '500+'),
      label: 'Empresas Parceiras',
    },
    {
      icon: Star,
      value: loading ? '...' : (stats?.average_rating ? `${stats.average_rating.toFixed(1)}/5` : '4.8/5'),
      label: 'Avaliação Média',
    },
    {
      icon: TrendingUp,
      value: loading ? '...' : (stats?.projects_count ? `${stats.projects_count}k+` : '10k+'),
      label: 'Projetos Realizados',
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Empresas Verificadas',
    },
  ];

  return (
    <section className="relative bg-white py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary-light to-accent rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-accent to-primary-light rounded-full opacity-20 blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-foreground">Compare e Encontre a</span>{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Melhor Empresa Solar
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Conecte-se com as melhores empresas de energia solar do Brasil.
              Compare preços, avaliações e encontre a solução perfeita para sua
              casa ou empresa.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="relative">
              <SearchBar placeholder="Busque empresas, produtos ou serviços..." />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Painel Solar', 'Inversor', 'Bateria', 'Instalação'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-card rounded-full text-muted-foreground border border-border hover:border-accent-dark cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Solicitar Orçamento Grátis
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
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {statsData.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
                    <stat.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
