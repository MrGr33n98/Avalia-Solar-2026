'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { route: 'creator-profile' }, extra: { digest: error.digest } });
  }, [error]);

  return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-bold text-slate-900">Não foi possível carregar esta página.</h1><button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-amber-400 px-5 py-3 font-semibold">Tentar novamente</button></main>;
}
