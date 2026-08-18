import Link from 'next/link';
import { Heart } from 'lucide-react';

export function FavoritesEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Heart className="mx-auto h-10 w-10 text-rose-300" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-slate-900">Nenhum favorito ainda</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Salve empresas e produtos que chamaram sua atenção para encontrá-los rapidamente depois.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/companies" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Explorar empresas</Link>
        <Link href="/products" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Explorar produtos</Link>
      </div>
    </div>
  );
}
