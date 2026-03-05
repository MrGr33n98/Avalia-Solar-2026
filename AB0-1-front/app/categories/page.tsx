import { Metadata } from 'next';
import CategoriesIndexWithSidebar from '@/components/CategoriesIndexWithSidebar';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

// ... (SEO meta)

export default function CategoriesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Categorias', item: '/categories' }
        ]}
      />
      <CategoriesIndexWithSidebar />
    </>
  );
}
