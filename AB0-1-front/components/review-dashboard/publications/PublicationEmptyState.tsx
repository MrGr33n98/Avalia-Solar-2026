import Link from 'next/link';
import { PenLine } from 'lucide-react';
export function PublicationEmptyState({ status }: { status: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <PenLine className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">
        {status === 'draft' ? 'Nenhum rascunho' : 'Comece sua primeira publicação'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Compartilhe experiência real, aprendizados e soluções úteis para comunidade.
      </p>
      <Link
        href="/review-dashboard/publications/new"
        className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Nova publicação
      </Link>
    </div>
  );
}
