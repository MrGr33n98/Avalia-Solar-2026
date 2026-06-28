import {
  BadgeCheck,
  Clock3,
  MapPinned,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react';

const trustSignals = [
  {
    icon: ShieldCheck,
    title: 'Verificação rigorosa',
    description: 'Documentos e regularidade validados',
  },
  {
    icon: MessagesSquare,
    title: 'Reputação comprovada',
    description: 'Avaliações reais de clientes',
  },
  {
    icon: Clock3,
    title: 'Resposta monitorada',
    description: 'Prazos claros para o seu contato',
  },
  {
    icon: MapPinned,
    title: 'Cobertura regional',
    description: 'Empresas que atendem sua cidade',
  },
  {
    icon: BadgeCheck,
    title: 'Qualidade comparável',
    description: 'Critérios iguais para uma escolha justa',
  },
];

export default function HomeTrustSignature() {
  return (
    <section className="border-b border-slate-200 bg-white" aria-labelledby="trust-signature-title">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
              Decisão com transparência
            </p>
            <h2 id="trust-signature-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Raio-X de Confiança Solar
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600">
            Os sinais essenciais para comparar empresas antes de compartilhar seus dados ou pedir propostas.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:grid-cols-2 lg:grid-cols-5">
          {trustSignals.map((signal) => (
            <div
              key={signal.title}
              className="flex gap-3 border-b border-slate-200 p-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-slate-200">
                <signal.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-900">{signal.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                  {signal.description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
