'use client';

import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { ArrowRight, CheckCircle } from 'lucide-react';

// Configure the same Zoho Bookings onboarding calendar in both registration channels.
// Never expose a non-HTTPS or third-party redirect from public environment values.
const DEFAULT_ONBOARDING_BOOKING_URL =
  'https://avaliasolar.zohobookings.com/5012013000000038009/#/5012013000000038009?bookedFrom=ShortenURL';

export function getOnboardingBookingUrl(configured = process.env.NEXT_PUBLIC_B2B_ONBOARDING_BOOKING_URL): string {
  if (!configured) return DEFAULT_ONBOARDING_BOOKING_URL;
  try {
    const url = new URL(configured);
    if (url.protocol === 'https:' && url.hostname === 'avaliasolar.zohobookings.com') {
      return url.toString();
    }
  } catch {
    // Keep the existing booking link if the deployment variable is invalid.
  }
  return DEFAULT_ONBOARDING_BOOKING_URL;
}

export default function RegistrationPendingSuccess({
  companyName,
  onDashboard,
  onHome,
}: {
  companyName: string;
  onDashboard: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-4 gap-6">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-blue-600" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cadastro recebido para análise</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
          Estamos analisando as informações da{' '}
          <span className="font-semibold text-gray-700">{companyName}</span>. Você receberá um
          e-mail assim que houver novidades.
        </p>
      </div>

      <div className="w-full rounded-xl bg-blue-50 border border-blue-100 p-4 text-left space-y-1">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Próximos passos
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mt-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Nossa equipe verificará as informações
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Enviaremos confirmação por e-mail
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Acesso ao painel liberado após aprovação
          </li>
        </ul>
      </div>

      <section className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Próximo passo opcional</p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">Converse com o fundador</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          Agende uma conversa rápida de 15 minutos para apresentar sua empresa e tirar dúvidas.
          O agendamento não substitui a análise do cadastro nem a confirmação do e-mail.
        </p>
        <a
          href={getOnboardingBookingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track('cta_click', {
              cta_text: 'Agendar conversa de 15 minutos',
              cta_type: 'b2b_onboarding_booking',
              cta_location: 'register_company_success',
              channel: 'app',
              booking_provider: 'zoho',
            })
          }
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ffb900] px-4 py-2 text-center text-sm font-semibold text-[#15284c] hover:bg-[#e5a600] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15284c]"
        >
          Agendar conversa de 15 minutos
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button variant="outline" className="flex-1 h-11" onClick={onHome}>
          Voltar para início
        </Button>
        <Button
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
          onClick={onDashboard}
        >
          Acompanhar solicitação
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
