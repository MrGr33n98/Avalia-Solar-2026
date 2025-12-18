import { motion } from 'framer-motion';
import DashboardStats from '@/components/DashboardStats';
import { Company } from '@/lib/api';

interface CompanyStatsProps {
  company: Company;
  companyStats: {
    reviewCount: number;
    rating: number;
    productCount: number;
    recentViews?: number;
    responseRate?: number;
  };
}

export default function CompanyStats({ company, companyStats }: CompanyStatsProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-semibold mb-6">Desempenho da Empresa</h3>
      <DashboardStats 
        reviewsCount={companyStats.reviewCount}
        averageRating={companyStats.rating}
        productsCount={companyStats.productCount}
        leadsCount={companyStats.recentViews ?? 0}
        activeCampaigns={companyStats.responseRate ?? 0}
        companiesCount={1}
        monthlyRevenue={0}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Placeholder for charts */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm h-64 flex items-center justify-center bg-muted/5">
          <p className="text-muted-foreground font-medium">Gráfico de Avaliações (Em Breve)</p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm h-64 flex items-center justify-center bg-muted/5">
           <p className="text-muted-foreground font-medium">Distribuição de Produtos (Em Breve)</p>
        </div>
      </div>
    </div>
  );
}
