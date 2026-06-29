import Link from 'next/link';
import { Instagram, Linkedin, Mail, Phone, Clock3 } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

import {
  CONTACT,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_LOCAL_SOLAR_LINKS,
  FOOTER_TRUST_LINKS,
  SOCIAL_PROFILES,
} from '@/lib/site';

type FooterProps = {
  compact?: boolean;
};

export default function Footer({ compact = false }: FooterProps) {
  if (compact) return <HomeFooter />;

  return (
    <footer className="bg-[#020617] border-t border-brand-border/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand & Contact Info */}
          <div className="flex flex-col items-start space-y-4">
            <Link href="/" className="mb-2 inline-flex rounded-lg bg-white px-2 py-1 transition-opacity hover:opacity-90" aria-label="Página inicial da Avalia Solar">
              <BrandLogo className="h-9" sizes="157px" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Compare empresas verificadas, encontre a melhor solução para sua casa ou empresa e fale com os responsáveis certos sem ruído.
            </p>
            <div className="space-y-3 pt-2 w-full">
              <a
                href={`mailto:${CONTACT.founder.email}`}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Fale com Felipe</span>
              </a>
              <a
                href={`mailto:${CONTACT.team.email}`}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Fale com a equipe</span>
              </a>
              <a
                href={CONTACT.phone.href}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{CONTACT.phone.display}</span>
              </a>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock3 className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{CONTACT.hours}</span>
              </div>
              <p className="text-slate-400 text-xs">{CONTACT.coverage}</p>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Empresa</h3>
            <ul className="space-y-2.5">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-300 hover:text-brand-blue transition-colors duration-200 text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Confiança</h3>
            <ul className="space-y-2.5">
              {FOOTER_TRUST_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-300 hover:text-brand-blue transition-colors duration-200 text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-300 hover:text-brand-blue transition-colors duration-200 text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Local Solar Links */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Energia Solar por cidade</h3>
            <ul className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2.5">
              {FOOTER_LOCAL_SOLAR_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-300 hover:text-brand-blue transition-colors duration-200 text-xs">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="text-slate-400 text-sm">
              © 2026 Avalia Solar. Todos os direitos reservados.
            </div>
            <div className="flex space-x-5">
              {SOCIAL_PROFILES.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  className="text-slate-400 hover:text-white transition-colors duration-200"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.name === 'Instagram' ? (
                    <Instagram className="h-5 w-5" />
                  ) : (
                    <Linkedin className="h-5 w-5" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label="Página inicial da Avalia Solar">
              <BrandLogo className="h-10" sizes="174px" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Compare empresas de energia solar com informações públicas, critérios claros e mais confiança para decidir.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIAL_PROFILES.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-700"
                >
                  {social.name === 'Instagram' ? <Instagram className="h-4 w-4" /> : <Linkedin className="h-4 w-4" />}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Navegação" links={[
            { label: 'Empresas', href: '/companies' },
            { label: 'Categorias', href: '/categories' },
            { label: 'Como funciona', href: '/#como-funciona' },
            { label: 'Conteúdo', href: '/blog' },
          ]} />
          <FooterColumn title="Institucional" links={FOOTER_COMPANY_LINKS.slice(0, 4)} />
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Contato</h3>
            <div className="mt-4 space-y-3 text-sm">
              <a href={`mailto:${CONTACT.team.email}`} className="flex items-center gap-2 hover:text-blue-700">
                <Mail className="h-4 w-4 text-slate-400" /> {CONTACT.team.email}
              </a>
              <a href={CONTACT.phone.href} className="flex items-center gap-2 hover:text-blue-700">
                <Phone className="h-4 w-4 text-slate-400" /> {CONTACT.phone.display}
              </a>
              <span className="flex items-center gap-2 text-slate-600">
                <Clock3 className="h-4 w-4 text-slate-400" /> {CONTACT.hours}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>© 2026 Avalia Solar. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-4">
            {FOOTER_LEGAL_LINKS.slice(0, 3).map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-blue-700">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-700">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
