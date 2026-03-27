'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { companiesApi } from '@/lib/api';
import { useCompany } from '@/app/dashboard/hooks';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Users, 
  Shield, 
  Banknote,
  TrendingUp,
  RefreshCw,
  X,
  AlertCircle,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CompanyOption {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  verified: boolean;
  rating?: number | null;
  total_reviews?: number;
  logo_url: string | null | undefined;
}

interface CompaniesManagementProps {
  currentCompanyId: string;
  onCompanyChange: (companyId: string) => void;
}

export default function CompaniesManagement({ currentCompanyId, onCompanyChange }: CompaniesManagementProps) {
  // State variables
  const [companiesData, setCompaniesData] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(currentCompanyId);
  const [isOpen, setIsOpen] = useState(false);
  
  // Navigation and routing
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Load companies from API
  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companiesApi.getAll({ mine: true });
      
      // Handle both possible response formats
      let companyList: any[] = [];
      if (Array.isArray(response)) {
        companyList = response;
      } else if (response && typeof response === 'object' && Array.isArray((response as any).companies)) {
        companyList = (response as any).companies;
      }
      
      // Convert to our CompanyOption type
      const processedCompanies: CompanyOption[] = companyList.map((company: any) => ({
        id: company.id,
        name: company.name || '',
        slug: company.slug || '',
        city: company.city || '',
        state: company.state || '',
        verified: company.verified || false,
        rating: company.rating ?? null,
        total_reviews: company.total_reviews ?? 0,
        logo_url: company.logo_url
      }));
      
      setCompaniesData(processedCompanies);
      
      // Set selected company to current or first available
      if (!selectedCompanyId && processedCompanies.length > 0) {
        setSelectedCompanyId(processedCompanies[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError('Falha ao carregar lista de empresas');
    } finally {
      setLoading(false);
    }
  };

  // Handle company change
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setIsOpen(false);
    onCompanyChange(companyId);
    
    // Update URL without triggering full page reload
    const params = new URLSearchParams(searchParams.toString());
    params.set('company', companyId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Get company by ID
  const getCompany = (id: string): CompanyOption | undefined => {
    return companiesData.find(c => c.id.toString() === id);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground">
            Trocar Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground">
            Trocar Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center py-8">
            <AlertCircle className="h-6 w-6 text-destructive mb-3" />
            <p className="text-center text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadCompanies}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!companiesData || companiesData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground">
            Trocar Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center py-8">
            <Users className="h-6 w-6 text-muted-foreground mb-3" />
            <p className="text-center text-sm text-muted-foreground">
              Nenhuma empresa encontrada. Solicite acesso a uma empresa ou entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get current company
  const currentCompany = getCompany(selectedCompanyId);

  // Helper function to render star rating
  const renderStarRating = (rating: number | null) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: JSX.Element[] = [];
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-full-${i}`} className="h-3 w-3 text-yellow-400" />);
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(<Star key="star-half" className="h-3 w-3 text-yellow-400/50" />);
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`star-empty-${i}`} className="h-3 w-3 text-yellow-400/20" />);
    }
    
    return (
      <>
        {stars}
        <span className="ml-1 text-xs">{rating.toFixed(1)}</span>
      </>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground">
          Trocar Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Current Company Display */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/100 transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {currentCompany?.logo_url ? (
            <Image 
              src={currentCompany.logo_url} 
              alt={`${currentCompany?.name} logo`} 
              width={32} 
              height={32} 
              className="rounded-full border border-muted/200 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{currentCompany?.name || 'Empresa não selecionada'}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {currentCompany?.city}, {currentCompany?.state} 
              {currentCompany?.verified && <Shield className="h-3 w-3 ml-1 inline-block text-primary" />}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" 
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
        </div>

        {/* Dropdown Menu */}
        <DropdownMenu 
          open={isOpen} 
          onOpenChange={setIsOpen}
          className="w-56 p-0 border-none shadow-xl"
        >
          <DropdownMenuTrigger className="w-full inline-block">
            {/* Trigger is handled by the outer div */}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-0 border-none shadow-xl">
            <div className="space-y-1">
              {companiesData.map(company => (
                <DropdownMenuItem 
                  key={company.id} 
                  onClick={() => handleCompanyChange(company.id.toString())}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50',
                    selectedCompanyId === company.id.toString() ? 'bg-primary/50' : ''
                  )}
                >
                  {company.logo_url ? (
                    <Image 
                      src={company.logo_url} 
                      alt={`${company.name} logo`} 
                      width={24} 
                      height={24} 
                      className="rounded-full border border-muted/200 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
                      <Shield className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{company.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.city}, {company.state} 
                      {company.verified && <Shield className="h-3 w-3 ml-1 inline-block text-primary" />}
                      {company.rating && renderStarRating(company.rating)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}