import { Badge } from '@/components/ui/badge';
import { Company } from '@/lib/api';
import { CheckCircle2, Award, Zap, ShieldCheck, MessageSquare } from 'lucide-react';
import SponsoredBanner from './SponsoredBanner';
import { RatingStars } from '@/components/RatingStars';

interface CompanyOverviewProps {
  company: Company;
}

export default function CompanyOverview({ company }: CompanyOverviewProps) {
  const averageRating = Number(
    (company as any).average_rating ?? (company as any).rating_avg ?? (company as any).rating ?? 0
  );
  const ratingCount = Number(
    (company as any).rating_count ?? (company as any).total_reviews ?? (company as any).reviews_count ?? 0
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sobre a Empresa */}
      <section>
        <h2 className="text-xl md:text-2xl font-black text-slate-950 mb-4 flex items-center gap-2">
          Sobre a Empresa
          <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4 rounded-full" />
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          {company.description ? (
            <p>{company.description}</p>
          ) : (
            <p className="italic text-slate-400">Nenhuma descrição disponível.</p>
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
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Tipos de Projetos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {company.project_types.map((type) => (
              <div 
                key={type} 
                className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="bg-blue-50 p-2 rounded-lg mr-3 text-blue-600 group-hover:scale-110 transition-transform">
                   <Zap className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="text-sm font-bold text-slate-700">{type}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Avaliações
        </h3>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          {ratingCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <RatingStars
                rating={averageRating}
                count={ratingCount}
                showCount={true}
                showRatingValue={true}
                starClassName="h-4 w-4"
                ratingValueClassName="text-base font-extrabold text-slate-900"
                countClassName="text-sm font-semibold text-slate-500"
              />
              <span className="text-sm font-semibold text-slate-600">
                {ratingCount} avaliações publicadas
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Esta empresa ainda não possui avaliações publicadas.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Serviços Oferecidos */}
        {company.services && Array.isArray(company.services) && company.services.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Serviços Oferecidos
            </h3>
            <ul className="space-y-2">
              {company.services.map((service) => (
                <li key={service} className="flex items-center text-slate-600 group text-sm">
                  <span className="mr-3 h-1.5 w-1.5 rounded-full bg-emerald-400/40 group-hover:bg-emerald-500 transition-colors" />
                  <span className="group-hover:text-slate-900 transition-colors font-medium">{service}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Certificações */}
        {company.certifications && Array.isArray(company.certifications) && company.certifications.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Certificações
            </h3>
            <div className="flex flex-wrap gap-2">
              {company.certifications.map((cert) => (
                <Badge 
                  key={cert} 
                  variant="outline" 
                  className="px-3 py-1.5 text-[11px] font-bold gap-1.5 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors uppercase tracking-tight"
                >
                  <ShieldCheck className="h-3 w-3" />
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
