import { Phone, Globe, MapPin, ExternalLink, Mail, Clock, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Company } from '@/lib/api';
import SponsoredBanner from './SponsoredBanner';
import ClaimCompanyCard from './ClaimCompanyCard';
import CompanyAwardsCard from './CompanyAwardsCard';
import { track } from '@/lib/analytics/lazy';


interface CompanySidebarProps {
  company: Company;
}

export default function CompanySidebar({ company }: CompanySidebarProps) {
  const formatUrl = (url?: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* Claim Profile Card - Always visible */}
      <ClaimCompanyCard company={company} />

      {/* Awards Card - Visible when company has Avalia Solar awards */}
      <CompanyAwardsCard company={company} />

      {/* Sponsored Square Banner */}
      <SponsoredBanner
        slotKey="company_sidebar_square"
        companyId={company.id}
        variant="square"
      />

      {/* Contact Info Card */}
      <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {company.phone && (
            <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-0.5">Telefone</p>
                <a 
                  href={`tel:${company.phone.replace(/\D/g, '')}`} 
                  className="text-base font-semibold hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4"
                >
                  {company.phone}
                </a>
              </div>
            </div>
          )}

          {company.website && (
            <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-0.5">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold hover:text-primary transition-colors flex items-center gap-1.5 hover:underline decoration-primary/30 underline-offset-4 truncate w-full"
                >
                  <span className="truncate">{formatUrl(company.website)}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                </a>
              </div>
            </div>
          )}

          {(company.address || (company.city && company.state)) && (
            <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-0.5">Localização</p>
                <p className="text-base font-semibold leading-relaxed">
                  {company.address && <span className="block">{company.address}</span>}
                  {company.city && company.state && (
                    <span className="block text-muted-foreground font-normal">
                      {company.city}, {company.state}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {(company.email || company.email_public) && (
             <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-0.5">Email</p>
                <a 
                  href={`mailto:${company.email || company.email_public}`}
                  className="text-base font-semibold hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 truncate block"
                >
                  {company.email || company.email_public}
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Working Hours Card (Optional) */}
      {company.business_hours && (
        <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Horário de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {company.business_hours}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {company.faqs && company.faqs.length > 0 && (
        <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Dúvidas frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {company.faqs.slice(0, 5).map((faq, index) => (
                <AccordionItem
                  key={faq.id || index}
                  value={`faq-${faq.id ?? index}`}
                >
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
      {/* Map Placeholder (Future Feature) */}
      {(company.latitude && company.longitude) && (
        <div className="rounded-xl overflow-hidden shadow-lg border h-48 bg-muted relative group cursor-pointer">
           <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
             <MapPin className="h-8 w-8 text-gray-400" />
           </div>
           {/* Here you would implement the actual map component */}
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Ver no mapa
              </span>
           </div>
        </div>
      )}
    </div>
  );
}
