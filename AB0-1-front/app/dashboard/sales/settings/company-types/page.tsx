'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type CompanyType = {
  id: number;
  name: string;
  is_default?: boolean;
};

export default function CompanyTypesPage() {
  const [items, setItems] = useState<CompanyType[]>([
    { id: 1, name: 'Standard Account (default)', is_default: true },
    { id: 2, name: 'Customer' },
    { id: 3, name: 'Partner' },
    { id: 4, name: 'Reseller' },
    { id: 5, name: 'Vendor' },
  ]);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    setItems([...items, { id: Date.now(), name: newName.trim() }]);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Company types"
        subtitle='Categorize the companies you work with, i.e. "Partner", "Vendor", "Potential customer"'
        helpTitle="What is a company type?"
        helpDescription="Every company has a company type. This allows you to choose between Customers, Potential Customers, Partners, etc. The first listed type is the default."
        extraHelpCards={[
          {
            title: 'Convert "Prospects" to "Customers" when leads are won',
            content: 'Use Sales Automation to automatically change a company\'s type to "Customer" for any company type when its lead is closed as won.',
          },
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-700">Company types ({items.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add company type...</span>
              </button>
            )}
          </div>

          {isAdding && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter type name..."
                className="h-8 text-xs bg-white"
                autoFocus
              />
              <Button size="sm" onClick={handleAdd} className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                Cancel
              </Button>
            </div>
          )}

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50/80 transition-colors">
                <span className="font-medium text-slate-800">{item.name}</span>
                {!item.is_default && (
                  <button
                    onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
