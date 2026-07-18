'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CompanyCatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ id: string }>();
  const companyPath = `/companies/${encodeURIComponent(params.id)}`;

  useEffect(() => {
    console.error('[CompanyCatalogError]', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16 sm:px-6">
      <section
        className="mx-auto max-w-2xl border border-slate-300 bg-white p-8 sm:p-12"
        aria-labelledby="catalog-error-title"
      >
        <AlertTriangle className="h-9 w-9 text-amber-600" aria-hidden="true" />
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-700">
          Produtos e serviços
        </p>
        <h1 id="catalog-error-title" className="mt-3 text-3xl font-bold text-[#0B1F4B]">
          Catálogo temporariamente indisponível
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar esta categoria agora. Você pode tentar novamente ou voltar ao
          perfil da empresa para consultar avaliações e formas de contato.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-[#0B1F4B] px-5 text-sm font-semibold text-white hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
          <Link
            href={companyPath}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para a empresa
          </Link>
        </div>
      </section>
    </main>
  );
}
