'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-bold text-slate-900">Não foi possível carregar perfil.</h1><button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-amber-400 px-5 py-3 font-semibold">Tentar novamente</button></main>;
}
