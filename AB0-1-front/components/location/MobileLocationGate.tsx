'use client';

import { ChevronDown, LocateFixed, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MobileLocationGateProps {
  onAllow: () => void;
  onSkip: () => void;
  loading?: boolean;
}

export default function MobileLocationGate({
  onAllow,
  onSkip,
  loading = false,
}: MobileLocationGateProps) {
  return (
    <section className="flex min-h-[calc(100dvh-5.5rem)] flex-col bg-[#f4f2f2] px-6 pb-8 pt-14 text-center text-zinc-900 md:hidden">
      <div className="mx-auto max-w-sm">
        <h1 className="text-[2rem] font-black leading-tight tracking-tight">
          Então, você é daqui?
        </h1>
        <p className="mt-5 text-[1.35rem] font-semibold leading-snug text-zinc-600">
          Defina sua localização para ver empresas que atendem sua região e receber respostas mais
          rápidas.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex h-56 w-56 items-center justify-center rounded-full bg-slate-100/80">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-sm">
            <MapPin className="h-20 w-20 text-slate-400" strokeWidth={1.7} />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-6">
        <Button
          type="button"
          onClick={onAllow}
          disabled={loading}
          className="h-16 w-full rounded-full bg-zinc-950 text-xl font-black text-white shadow-none hover:bg-zinc-800"
        >
          <LocateFixed className="mr-2 h-5 w-5" />
          {loading ? 'Localizando...' : 'Permitir'}
        </Button>

        <button
          type="button"
          onClick={onSkip}
          className="mx-auto flex items-center justify-center gap-4 text-center text-2xl font-black leading-tight text-zinc-900"
        >
          <span>Como vocês usam minha localização?</span>
          <ChevronDown className="h-8 w-8 shrink-0" />
        </button>
      </div>
    </section>
  );
}
