import { ShieldCheck, UserRoundCheck, XCircle, Headphones } from 'lucide-react';
const items = [
  ['Pagamento seguro', ShieldCheck],
  ['Após aprovação, recursos liberados', UserRoundCheck],
  ['Cancele quando quiser', XCircle],
  ['Suporte humano', Headphones],
] as const;
export function PricingTrustStrip() {
  return (
    <section className="grid gap-4 rounded-2xl bg-brand-blue p-5 text-white sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, Icon]) => (
        <div key={label} className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-brand-yellow" />
          <span className="text-xs font-bold">{label}</span>
        </div>
      ))}
    </section>
  );
}
