import { Company, Product, Review } from "@/lib/api";

export interface CompanyStats {
  rating: string;
  reviewCount: number;
  productCount: number;
  yearsInBusiness: number;
}

export interface PremiumProfileProps {
  company: Company;
  companyStats: CompanyStats;
  products: Product[];
  reviews: Review[];
  productsLoading: boolean;
  reviewsLoading: boolean;
  canRequestQuote: boolean;
  ctaEnabled: boolean;
  ctaUrl: string | null;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}
