import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, CheckCircle2, ShieldAlert, Share2, ExternalLink, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationData {
  status: 'valid' | 'revoked' | 'not_found';
  error?: string;
  badge?: {
    slug: string;
    name: string;
    description: string;
    criteria_description?: string;
    tier: string;
    category: string;
    icon_url: string;
    points: number;
  };
  recipient?: {
    display_name: string;
    member_since: string;
  };
  verification?: {
    token: string;
    unlocked_at: string;
    verified_at: string;
    authenticity_url: string;
  };
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300' },
  gold: { bg: 'bg-yellow-100 dark:bg-yellow-950/40', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300' },
  special: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300' },
};

async function getVerificationData(token: string): Promise<VerificationData> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/api/v1/achievements/verify/${token}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });

    if (res.status === 410) {
      return { status: 'revoked', error: 'Esta conquista foi revogada pela moderação.' };
    }
    if (!res.ok) {
      return { status: 'not_found', error: 'Certificado de conquista não encontrado ou inválido.' };
    }

    return await res.json();
  } catch {
    return { status: 'not_found', error: 'Não foi possível verificar este certificado no momento.' };
  }
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const data = await getVerificationData(params.token);

  if (data.status !== 'valid' || !data.badge || !data.recipient) {
    return {
      title: 'Verificação de Conquista | Avalia Solar',
      description: 'Verificação oficial de certificações e conquistas na maior plataforma solar do Brasil.',
      robots: { index: false, follow: false },
    };
  }

  const title = `Conquista Verificada: ${data.badge.name} | Avalia Solar`;
  const description = `Certificado emitido para ${data.recipient.display_name} pela plataforma Avalia Solar. Conquista: ${data.badge.name} (${data.badge.points} XP).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://avaliasolar.com.br/conquistas/verificar/${params.token}`,
      siteName: 'Avalia Solar',
      images: [
        {
          url: data.badge.icon_url,
          width: 512,
          height: 512,
          alt: data.badge.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [data.badge.icon_url],
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function AchievementVerificationPage({ params }: { params: { token: string } }) {
  const data = await getVerificationData(params.token);

  if (data.status === 'revoked') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-amber-200 dark:border-amber-900/40 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Conquista Revogada</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            Este certificado de conquista foi revogado pela moderação da Avalia Solar e não possui mais validade oficial.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Voltar para o Início</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (data.status === 'not_found' || !data.badge || !data.recipient || !data.verification) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-red-200 dark:border-red-900/40 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Certificado Não Encontrado</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            O token de autenticidade informado não corresponde a nenhuma conquista registrada no ecossistema Avalia Solar.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Explorar Avalia Solar</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { badge, recipient, verification } = data;
  const tierStyle = TIER_COLORS[badge.tier.toLowerCase()] || TIER_COLORS.bronze;
  const formattedDate = new Date(verification.unlocked_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    verification.authenticity_url
  )}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-500/5 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top brand navigation */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 transition-colors"
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span>Avalia Solar</span>
          </Link>
          <span className="text-xs font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
            Registro Oficial
          </span>
        </div>

        {/* Certificate Card */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-10 relative overflow-hidden backdrop-blur-sm">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Verification Badge Header */}
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2.5 w-fit">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Certificado Autêntico & Verificado pela Plataforma</span>
          </div>

          {/* Badge Art & Info */}
          <div className="text-center py-4 space-y-4">
            <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center p-3 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-inner">
              <Image
                src={badge.icon_url}
                alt={badge.name}
                width={160}
                height={160}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span
                  className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                >
                  {badge.tier}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  +{badge.points} XP
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {badge.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
                {badge.description}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 my-6" />

          {/* Verification Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase tracking-wide font-medium">
                Concedido Para
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {recipient.display_name}
              </span>
              <span className="text-slate-500 block text-xs">Membro desde {recipient.member_since}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase tracking-wide font-medium">
                Data da Conquista
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{formattedDate}</span>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase tracking-wide font-medium">
                Código de Autenticidade (Hash)
              </span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
                {verification.token}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-6 rounded-2xl gap-2 shadow-md"
            >
              <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="w-4 h-4" />
                <span>Compartilhar no LinkedIn</span>
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="py-6 rounded-2xl border-slate-300 dark:border-slate-700 font-semibold gap-2"
            >
              <Link href="/companies">
                <ExternalLink className="w-4 h-4" />
                <span>Explorar Empresas Solares</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Emitido pelo sistema de gamificação e reputação transparente da Avalia Solar. © 2026 Avalia Solar.
        </p>
      </div>
    </main>
  );
}
