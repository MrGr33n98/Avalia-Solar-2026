import Link from 'next/link';
import { Instagram, Linkedin, Mail, Phone, Clock3 } from 'lucide-react';

import {
  CONTACT,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_LOCAL_SOLAR_LINKS,
  FOOTER_TRUST_LINKS,
  SOCIAL_PROFILES,
} from '@/lib/site';

export default function Footer() {
  return (
    <footer className="bg-[#020617] border-t border-brand-border/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand & Contact Info */}
          <div className="flex flex-col items-start space-y-4">
            <Link href="/" className="font-extrabold text-2xl tracking-tight mb-2 hover:text-brand-blue transition-colors">
              Avalia Solar
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
