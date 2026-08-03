import { Metadata } from 'next';
import CategoriesIndexWithSidebar from '@/components/CategoriesIndexWithSidebar';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

export const metadata: Metadata = {
  title: 'Categorias de Energia Solar e Mobilidade Elétrica | Avalia Solar',
  description:
    'Explore todas as categorias de empresas de energia solar, mobilidade elétrica e frotas elétricas do Brasil. Compare avaliações reais, preços e serviços por segmento.',
  keywords:
    'categorias energia solar, empresas solares, mobilidade elétrica, wallbox, baterias solares, instaladores, frotas elétricas, inversores',
  alternates: {
    canonical: '/categories',
  },
  openGraph: {
    title: 'Categorias — Avalia Solar',
    description:
      'De painéis e inversores a wallbox e frotas elétricas. Compare empresas verificadas por categoria.',
    url: '/categories',
    type: 'website',
  },
};

export default function CategoriesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Categorias', item: '/categories' },
        ]}
      />
      <CategoriesIndexWithSidebar />
    </>
  );
}
