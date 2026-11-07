'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Type } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Invite = {
  company: { display_name: string; logo_url?: string | null };
  voice_available: boolean;
  privacy_url: string;
  text_fallback_url: string;
  whatsapp_url?: string | null;
  expires_at?: string | null;
};

export default function VoiceReviewLanding({ params }: { params: { code: string } }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi<Invite>(`/voice_review_invites/${encodeURIComponent(params.code)}/public`, {
      skipAuthRefresh: true,
      noCache: true,
      retries: 1,
    })
      .then(setInvite)
      .catch(() => setError('Este convite não está disponível ou expirou.'));
  }, [params.code]);

  if (error) return <main className="mx-auto max-w-lg px-6 py-24 text-center"><h1 className="text-2xl font-bold">Convite indisponível</h1><p className="mt-3 text-slate-600">{error}</p></main>;
  if (!invite) return <main className="flex min-h-dvh items-center justify-center text-slate-600">Carregando convite...</main>;

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-10 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-12">
        <div className="flex items-center gap-3 text-sm font-semibold text-violet-700"><ShieldCheck className="h-5 w-5" /> Avalia Solar · avaliações independentes</div>
        <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-xl font-black text-violet-700">{invite.company.display_name.slice(0, 2).toUpperCase()}</div>
        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Conte como foi sua experiência com {invite.company.display_name}.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Sua opinião, positiva ou crítica, ajuda outras pessoas. Você pode falar pelo WhatsApp oficial do Avalia Solar ou escrever pelo formulário. Não pedimos uma nota específica.</p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">Antes da publicação, você poderá revisar o texto gerado a partir da sua fala e escolher a nota. O áudio fica privado e não é publicado nesta fase.</div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {invite.voice_available && invite.whatsapp_url ? <Button asChild size="lg" className="w-full"><a href={invite.whatsapp_url} onClick={() => undefined}><MessageCircle className="mr-2 h-5 w-5" /> Continuar no WhatsApp</a></Button> : <Button disabled size="lg" className="w-full"><MessageCircle className="mr-2 h-5 w-5" /> WhatsApp temporariamente indisponível</Button>}
          <Button asChild variant="outline" size="lg" className="w-full"><a href={invite.text_fallback_url}><Type className="mr-2 h-5 w-5" /> Prefiro escrever</a></Button>
        </div>
        <p className="mt-7 text-xs leading-5 text-slate-500">Ao continuar, você falará com o canal oficial do Avalia Solar. Consulte o <a className="underline" href={invite.privacy_url}>Aviso de Privacidade</a>. A avaliação é opcional e passa pelos mesmos critérios de moderação.</p>
        <Link href="/" className="mt-8 inline-flex items-center text-sm font-semibold text-violet-700">Voltar ao Avalia Solar <ArrowRight className="ml-1 h-4 w-4" /></Link>
      </div>
    </main>
  );
}
