'use client';

import { track } from '@/lib/analytics';

// Palavra-chave exata para o fluxo de cadastro no WhatsApp/WAHA.
// O disparo do bot ocorre somente após o visitante enviar a mensagem.
export const COMPANY_REGISTRATION_WHATSAPP_URL =
  'https://wa.me/5565993465055?text=CADASTRAR';

export default function CompanyRegistrationTicker() {
  const handleCtaClick = () => {
    track('cta_click', {
      cta_text: 'Cadastrar',
      cta_type: 'whatsapp_company_signup',
      cta_location: 'navbar_top_ticker',
      channel: 'whatsapp',
      keyword: 'CADASTRAR',
    });
  };

  return (
    <div
      role="region"
      aria-label="Cadastro de empresas no Avalia Solar"
      data-testid="company-registration-ticker"
      className="flex h-10 w-full items-center gap-2 overflow-hidden bg-[#062653] px-3 text-white sm:gap-4 sm:px-6"
    >
      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="company-ticker-track flex w-max items-center whitespace-nowrap">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
              className="inline-flex shrink-0 items-center pr-8 text-[11px] font-medium sm:text-xs"
            >
              Cadastre sua empresa no&nbsp;
              <strong className="font-semibold text-[#FFC400]">Avalia Solar</strong>
            </span>
          ))}
        </div>
      </div>

      <a
        href={COMPANY_REGISTRATION_WHATSAPP_URL}
        onClick={handleCtaClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Cadastrar empresa via WhatsApp"
        data-testid="company-registration-cta"
        className="relative inline-flex h-[34px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#15803D] px-[14px] text-xs font-semibold leading-none text-white transition-colors hover:bg-[#166534] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white before:absolute before:-inset-y-[5px] before:-inset-x-1 before:content-['']"
      >
        Cadastrar
      </a>

      <style jsx>{`
        .company-ticker-track {
          animation: company-ticker-marquee 5s linear infinite;
        }
        @keyframes company-ticker-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .company-ticker-track {
            animation: none;
          }
        }
        .company-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
