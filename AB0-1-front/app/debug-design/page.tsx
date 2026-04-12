'use client';

import PremiumBadge from '@/components/PremiumBadge';
import CompanyCard from '@/components/CompanyCard';
import { Company } from '@/lib/api';

const MOCK_COMPANY: Company = {
  id: 999,
  name: "Empresa de Teste Premium",
  slug: "empresa-teste-premium",
  verified: true,
  city: "Florianópolis",
  state: "SC",
  status: "active",
  category: "Solar",
  description: "Uma empresa premium verificada para teste do sistema de design.",
  website: "https://exemplo.com",
  phone: "48999999999",
  address: "Rua do Sol, 123",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  rating_avg: 4.8,
  rating_count: 124,
};

export default function DebugDesignPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-4">Debug Design: Premium Badge</h1>
        <div className="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <PremiumBadge />
          <PremiumBadge className="h-8 px-4" />
          <div className="bg-slate-900 p-4 rounded-lg">
             <PremiumBadge />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Preview: CompanyCard</h2>
        <div className="max-w-sm">
          <CompanyCard company={MOCK_COMPANY} />
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
        <p><strong>Nota:</strong> Esta página é apenas para depuração visual do selo Premium e diamante.</p>
        <p>Se o diamante não estiver aparecendo acima, o problema está no SVG ou nas cores do Tailwind.</p>
      </div>
    </div>
  );
}
