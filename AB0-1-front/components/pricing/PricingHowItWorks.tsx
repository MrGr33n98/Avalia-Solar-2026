import { CheckCircle2 } from 'lucide-react';

const steps = [
  'Escolha o plano',
  'Entre ou crie sua conta',
  'Escolha sua empresa',
  'Cadastre se necessário',
  'Valide seu acesso',
  'Conclua o pagamento',
  'Recursos ativados',
];
export function PricingHowItWorks() {
  return (
    <section className="rounded-2xl bg-white py-10">
      <h2 className="text-2xl font-black text-slate-950">Como funciona a contratação</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {steps.map((step, index) => (
          <div key={step} className="flex items-start gap-2 lg:block">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-blue" />
            <p className="text-xs font-bold text-slate-700">
              <span className="text-brand-blue">{index + 1}. </span>
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
