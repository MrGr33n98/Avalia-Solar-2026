import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Boxes,
  Building2,
  ChevronDown,
  Clock3,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  CONTACT,
  FOOTER_DISCOVERY_SECTIONS,
  FOOTER_PRIORITY_LOCAL_SOLAR_LINKS,
  SOCIAL_PROFILES,
} from '@/lib/site';

type FooterProps = {
  compact?: boolean;
};

type FooterLink = {
  readonly href: string;
  readonly label: string;
};

export default function Footer({ compact: _compact = false }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#020617] text-white" aria-label="Rodapé">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_repeat(5,minmax(0,1fr))] lg:gap-8">
          <FooterBrand />

          <FooterSection
            id="footer-cities"
            title="Energia solar por cidade"
            icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
            links={FOOTER_PRIORITY_LOCAL_SOLAR_LINKS}
            cta={{
              href: '/dados-do-setor/cobertura-energia-solar-capitais',
              label: 'Ver cobertura por cidade',
            }}
          />
          <FooterSection
            id="footer-companies"
            title="Empresas e serviços"
            icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
            links={FOOTER_DISCOVERY_SECTIONS.companies}
          />
          <FooterSection
            id="footer-products"
            title="Produtos e soluções"
            icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
            links={FOOTER_DISCOVERY_SECTIONS.products}
          />
          <FooterSection
            id="footer-content"
            title="Conteúdo e confiança"
            icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
            links={FOOTER_DISCOVERY_SECTIONS.content}
          />
          <FooterSection
            id="footer-support"
            title="Suporte e legal"
            icon={<Scale className="h-5 w-5" aria-hidden="true" />}
            links={FOOTER_DISCOVERY_SECTIONS.support}
          />
        </div>

        <TrustStrip />

        <div className="mt-8 flex flex-col gap-5 border-t border-slate-800 pt-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Avalia Solar. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/about" className="transition-colors hover:text-white">
              Sobre a Avalia Solar
            </Link>
            <Link href="/metodologia" className="transition-colors hover:text-white">
              Metodologia
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              Contato
            </Link>
          </div>
          <span>Feito para escolhas mais seguras em energia no Brasil.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterBrand() {
  return (
    <div className="pb-8 lg:pb-0 lg:pr-3">
      <Link
        href="/"
        className="inline-flex rounded-[2px] bg-white px-2.5 py-1.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
        aria-label="Página inicial da Avalia Solar"
      >
        <BrandLogo className="h-9" sizes="157px" />
      </Link>
      <p className="mt-5 max-w-xs text-sm leading-6 text-slate-300">
        Compare empresas, produtos e avaliações reais para escolher soluções de energia com mais
        confiança.
      </p>
      <ul className="mt-5 space-y-3 text-sm text-slate-300" aria-label="Compromissos Avalia Solar">
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-[#F5B800]" aria-hidden="true" />
          Empresas verificadas
        </li>
        <li className="flex items-center gap-2">
          <Star className="h-4 w-4 text-[#F5B800]" aria-hidden="true" />
          Avaliações transparentes
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#F5B800]" aria-hidden="true" />
          Critérios claros
        </li>
      </ul>
      <Link
        href="/register"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-[#F5B800] px-4 text-sm font-bold text-[#020617] transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
      >
        Cadastre sua empresa
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <div className="mt-6 flex gap-2">
        {SOCIAL_PROFILES.map((social) => (
          <a
            key={social.url}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] border border-slate-700 text-slate-300 transition-colors hover:border-[#F5B800] hover:text-[#F5B800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]"
          >
            {social.name === 'Instagram' ? (
              <Instagram className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Linkedin className="h-5 w-5" aria-hidden="true" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function FooterSection({
  id,
  title,
  icon,
  links,
  cta,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  links: readonly FooterLink[];
  cta?: FooterLink;
}) {
  return (
    <details className="group border-t border-slate-800 lg:border-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F5B800] lg:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="text-[#F5B800]">{icon}</span>
          {title}
        </span>
        <ChevronDown
          className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <h2
        id={id}
        className="hidden min-h-12 items-start gap-2 text-xs font-bold uppercase leading-5 tracking-[0.12em] text-white lg:flex"
      >
        <span className="mt-0.5 text-[#F5B800]">{icon}</span>
        {title}
      </h2>

      <ul
        className="hidden space-y-1 pb-5 group-open:block lg:!block lg:pb-0 lg:pt-3"
        aria-label={title}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-11 items-center text-sm leading-5 text-slate-300 transition-colors hover:text-[#F5B800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] lg:min-h-0 lg:py-1.5"
            >
              {link.label}
            </Link>
          </li>
        ))}
        {cta && (
          <li className="pt-2">
            <Link
              href={cta.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#F5B800] transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] lg:min-h-0"
            >
              {cta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </details>
  );
}

function TrustStrip() {
  return (
    <div className="mt-10 grid gap-6 border-t border-slate-800 pt-8 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#F5B800]" aria-hidden="true" />
          Empresas verificadas
        </span>
        <span className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#F5B800]" aria-hidden="true" />
          Avaliações reais
        </span>
        <a
          href={`mailto:${CONTACT.team.email}`}
          className="flex min-h-11 items-center gap-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] sm:min-h-0"
        >
          <Mail className="h-5 w-5 text-[#F5B800]" aria-hidden="true" />
          {CONTACT.team.email}
        </a>
        <a
          href={CONTACT.phone.href}
          className="flex min-h-11 items-center gap-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] sm:min-h-0"
        >
          <Phone className="h-5 w-5 text-[#F5B800]" aria-hidden="true" />
          {CONTACT.phone.display}
        </a>
      </div>
      <span className="flex items-center gap-2 text-xs text-slate-400">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {CONTACT.hours}
      </span>
    </div>
  );
}
