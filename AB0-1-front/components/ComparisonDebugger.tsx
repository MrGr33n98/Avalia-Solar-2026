'use client';

import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { useEffect } from 'react';

// Mock company data for testing
const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Test Company 1',
    slug: 'test-company-1',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    verified: true,
    category: 'Solar',
    description: 'Test description 1',
    website: 'https://test1.com',
    phone: '11999999999',
    address: 'Test address 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Test Company 2',
    slug: 'test-company-2',
    city: 'Rio de Janeiro',
    state: 'RJ',
    status: 'active',
    verified: true,
    category: 'Solar',
    description: 'Test description 2',
    website: 'https://test2.com',
    phone: '21999999999',
    address: 'Test address 2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Test Company 3',
    slug: 'test-company-3',
    city: 'Belo Horizonte',
    state: 'MG',
    status: 'active',
    verified: true,
    category: 'Solar',
    description: 'Test description 3',
    website: 'https://test3.com',
    phone: '31999999999',
    address: 'Test address 3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function ComparisonDebugger() {
  const { 
    comparisonList, 
    addToComparison, 
    removeFromComparison, 
    clearComparison,
    count,
    isInComparison 
  } = useComparison();

  useEffect(() => {
    console.log('[DEBUG] Comparison list updated:', comparisonList);
    console.log('[DEBUG] Count:', count);
    console.log('[DEBUG] List contents:', comparisonList.map(c => ({ id: c.id, name: c.name })));
  }, [comparisonList, count]);

  const handleTestAdd = (company: Company) => {
    console.log('[DEBUG] Adding company:', company.name);
    addToComparison(company);
  };

  const handleTestRemove = (companyId: number) => {
    console.log('[DEBUG] Removing company ID:', companyId);
    removeFromComparison(companyId);
  };

  const handleClearAll = () => {
    console.log('[DEBUG] Clearing all companies');
    clearComparison();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="text-sm font-bold mb-2">
        Comparison Debug ({count}/{3})
      </div>
      
      <div className="space-y-2 mb-4">
        {comparisonList.map((company) => (
          <div key={company.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
            <span>{company.name}</span>
            <button 
              onClick={() => handleTestRemove(company.id)}
              className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
            >
              Remove
            </button>
          </div>
        ))}
        {comparisonList.length === 0 && (
          <div className="text-gray-400 text-xs text-center py-2">
            No companies in comparison
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium">Add Test Companies:</div>
        {mockCompanies.map((company) => (
          <Button
            key={company.id}
            size="sm"
            variant={isInComparison(company.id) ? "secondary" : "outline"}
            onClick={() => handleTestAdd(company)}
            className="w-full text-xs h-8"
            disabled={isInComparison(company.id)}
          >
            {isInComparison(company.id) ? '✓ ' : '+ '}
            {company.name}
          </Button>
        ))}
        
        <Button
          size="sm"
          variant="destructive"
          onClick={handleClearAll}
          className="w-full text-xs h-8 mt-2"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}