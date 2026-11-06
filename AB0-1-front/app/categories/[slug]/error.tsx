'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CategorySlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error) {
      Sentry.captureException(error, {
        tags: {
          errorBoundary: 'category-slug',
          route: '/categories/[slug]',
        },
      });
    }
  }, [error]);

  return (
    <main className="min-h-[65vh] flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 space-y-6 text-center shadow-sm">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-50 p-4">
            <AlertTriangle className="h-10 w-10 text-amber-600" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Indisponibilidade temporária
          </h1>
          <p className="text-sm text-slate-600">
            Não foi possível carregar os dados desta categoria no momento. Por favor, tente novamente em instantes.
          </p>
        </div>

        {error?.digest && (
          <p className="text-xs font-mono text-slate-500">
            Código de referência: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/categories">
              <FolderTree className="mr-2 h-4 w-4" aria-hidden="true" />
              Categorias
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

