'use client';

import CategoryImporter from '@/components/admin/CategoryImporter';

export default function AdminCategoriesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Categories Management</h1>
      <CategoryImporter />
      
      {/* Your existing categories management UI */}
    </div>
  );
}