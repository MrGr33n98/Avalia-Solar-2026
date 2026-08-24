'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function CreatorStudioError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { errorBoundary: 'creator-studio' } });
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Creator Studio indisponível</h1>
      <p className="mt-2 text-sm text-slate-600">Não conseguimos carregar esta seção agora.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Tentar novamente
      </button>
    </main>
  );
}