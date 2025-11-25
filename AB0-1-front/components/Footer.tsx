import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const companyLinks = [
    { href: '/about', label: 'Sobre Nós' },
    { href: '/careers', label: 'Carreiras' },
    { href: '/press', label: 'Imprensa' },
    { href: '/blog', label: 'Blog' },
  ];

  const supportLinks = [
    { href: '/help', label: 'Centro de Ajuda' },
    { href: '/contact', label: 'Contato' },
    { href: '/api-docs', label: 'API Docs' },
    { href: '/status', label: 'Status' },
  ];

  const legalLinks = [
    { href: '/terms', label: 'Termos de Uso' },
    { href: '/privacy', label: 'Política de Privacidade' },
    { href: '/cookies', label: 'Política de Cookies' },
    { href: '/dmca', label: 'DMCA' },
  ];

  const socialLinks = [
    { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
    { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
    { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
    { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Contact Info */}
          <div className="flex flex-col items-start space-y-4">
            <Link href="/" className="font-bold text-2xl mb-2 hover:text-orange-400 transition-colors">
              Compare Solar
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução para sua casa ou empresa.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">contato@comparesolar.com.br</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">(65) 99242-3309</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Florianópolis, SC</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Empresa</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-200 text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Suporte</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-200 text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-200 text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 Compare Solar. Todos os direitos reservados.
            </div>
            <div className="flex space-x-5">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}