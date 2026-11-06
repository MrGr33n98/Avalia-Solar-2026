import Link from 'next/link';
import { FolderSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CategorySlugNotFound() {
  return (
    <main className="min-h-[65vh] bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FolderSearch className="h-7 w-7 text-slate-600" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Categoria não encontrada
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            A categoria solicitada não existe, está inativa ou teve seu endereço atualizado.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/categories">Ver todas as categorias</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Voltar para a Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

