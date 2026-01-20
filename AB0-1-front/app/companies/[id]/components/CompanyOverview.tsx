import { Badge } from '@/components/ui/badge';
import { Company } from '@/lib/api';
import { CheckCircle2, Award, Zap, ShieldCheck } from 'lucide-react';
import SponsoredBanner from './SponsoredBanner';

interface CompanyOverviewProps {
  company: Company;
}

export default function CompanyOverview({ company }: CompanyOverviewProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sobre a Empresa */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          Sobre a Empresa
          <div className="h-1 flex-1 bg-gradient-to-r from-primary/20 to-transparent ml-4 rounded-full" />
        </h2>
        <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed bg-muted/20 p-6 rounded-2xl border border-border/50">
          {company.description ? (
            <p>{company.description}</p>
          ) : (
            <p className="italic text-gray-400">Nenhuma descrição disponível.</p>
          )}
        </div>
      </section>

      {/* Sponsored Inline Banner */}
      <SponsoredBanner
        slotKey="company_overview_inline"
        companyId={company.id}
        variant="inline"
      />

      {/* Tipos de Projetos */}
      {company.project_types && company.project_types.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Tipos de Projetos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {company.project_types.map((type) => (
              <div 
                key={type} 
                className="flex items-center p-4 bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="bg-primary/10 p-2 rounded-lg mr-3 text-primary group-hover:scale-110 transition-transform">
                   <Zap className="h-4 w-4" />
                </div>
                <span className="font-medium text-foreground">{type}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Serviços Oferecidos */}
        {company.services && Array.isArray(company.services) && company.services.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Serviços Oferecidos
            </h3>
            <ul className="space-y-3">
              {company.services.map((service) => (
                <li key={service} className="flex items-center text-muted-foreground group">
                  <span className="mr-3 h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="group-hover:text-foreground transition-colors">{service}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Certificações */}
        {company.certifications && Array.isArray(company.certifications) && company.certifications.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Certificações
            </h3>
            <div className="flex flex-wrap gap-3">
              {company.certifications.map((cert) => (
                <Badge 
                  key={cert} 
                  variant="outline" 
                  className="px-4 py-2 text-sm gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {cert}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
