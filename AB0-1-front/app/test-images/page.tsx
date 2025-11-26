'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';

export default function TestImagesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const categories = await categoriesApi.getAll();
        const category = categories.find(c => c.seo_url === 'paineis-solares');
        
        if (category) {
          const companiesData = await categoriesApi.getCompanies(category.id, { status: 'active' });
          console.log('Companies loaded:', companiesData);
          setCompanies(companiesData || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Imagens</h1>
      
      {companies.map((company) => (
        <div key={company.id} className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">{company.name}</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Banner URL:</h3>
            <p className="text-sm text-gray-600 mb-2">{company.banner_url || 'Não disponível'}</p>
            {company.banner_url && (
              <div className="w-full h-32 bg-gray-200 rounded relative overflow-hidden">
                <img 
                  src={company.banner_url} 
                  alt={`Banner ${company.name}`}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log(`Banner loaded for ${company.name}:`, company.banner_url)}
                  onError={() => console.log(`Banner failed for ${company.name}:`, company.banner_url)}
                />
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Logo URL:</h3>
            <p className="text-sm text-gray-600 mb-2">{company.logo_url || 'Não disponível'}</p>
            {company.logo_url && (
              <div className="w-16 h-16 bg-gray-200 rounded-full relative overflow-hidden">
                <img 
                  src={company.logo_url} 
                  alt={`Logo ${company.name}`}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log(`Logo loaded for ${company.name}:`, company.logo_url)}
                  onError={() => console.log(`Logo failed for ${company.name}:`, company.logo_url)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}