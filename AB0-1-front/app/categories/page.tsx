import { Metadata } from 'next';
import CategoriesIndexWithSidebar from '@/components/CategoriesIndexWithSidebar';

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
  return <CategoriesIndexWithSidebar />;
}
