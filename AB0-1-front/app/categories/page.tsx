import { Metadata } from 'next';
import { Suspense } from 'react';
import CategoriesIndex from '@/components/CategoriesIndex';

// Configuração de SEO Dinâmico
export const metadata: Metadata = {
  title: 'Categorias de Energia Solar | Avalia Solar',
  description: 'Explore as melhores empresas e produtos de energia solar organizados por categorias. Painéis, Inversores, Instalação e mais.',
  keywords: ['energia solar', 'categorias', 'painéis solares', 'inversores', 'instalação solar'],
  alternates: {
    canonical: 'https://avaliasolar.com.br/categories',
  },
  openGraph: {
    title: 'Categorias de Energia Solar | Avalia Solar',
    description: 'Explore categorias de energia solar',
    url: 'https://avaliasolar.com.br/categories',
    siteName: 'Avalia Solar',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function CategoriesPage() {
  // JSON-LD para Schema.org (Lista de Itens)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categorias de Energia Solar',
    description: 'Diretório completo de categorias do setor solar.',
    url: 'https://avaliasolar.com.br/categories',
  };

  return (
    <>
      {/* Injeção do Schema.org para o Google entender a lista */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Componente Visual Principal */}
      <Suspense fallback={<div className="p-10 text-center">Carregando categorias...</div>}>
        <CategoriesIndex />
      </Suspense>
    </>
  );
}
