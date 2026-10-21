import type { Metadata } from 'next';
import { FavoritesClient } from '@/components/favorites/FavoritesClient';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Meus Favoritos | Avalia Solar',
  description: 'Gerencie suas empresas e produtos de energia solar favoritos no Avalia Solar.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: absoluteUrl('/favorites'),
  },
};

export default function FavoritesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Favoritos', item: '/favorites' },
        ]}
      />
      <main className="min-h-[calc(100vh-var(--app-navbar-height)-60px)] bg-slate-50/60 pb-16">
        <FavoritesClient />
      </main>
    </>
  );
}
