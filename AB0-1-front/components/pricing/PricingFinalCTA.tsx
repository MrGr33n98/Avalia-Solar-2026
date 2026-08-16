import Link from 'next/link';
export function PricingFinalCTA({ onCompare }: { onCompare: () => void }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-brand-blue p-6 text-white sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-black">Comece gratuitamente.</h2>
        <p className="text-blue-100">Faça upgrade quando sua operação pedir mais.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/register?plan=free"
          className="rounded-lg bg-amber-400 px-5 py-3 text-center text-sm font-bold text-slate-950"
        >
          Criar perfil gratuito
        </Link>
        <button
          type="button"
          onClick={onCompare}
          className="rounded-lg border border-white px-5 py-3 text-sm font-bold"
        >
          Comparar planos
        </button>
      </div>
    </section>
  );
}
