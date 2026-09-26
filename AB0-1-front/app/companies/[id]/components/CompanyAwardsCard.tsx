'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Award, Trophy, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';

function SafeBadgeImage({ src, alt, fallback }: { src: string; alt: string; fallback: React.ReactNode }) {
  const [error, setError] = useState(false);

  if (error) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="64px"
      className="object-contain"
      onError={() => setError(true)}
    />
  );
}

type CompanyBadgeItem = NonNullable<Company['badges']>[number];

interface CompanyAwardsCardProps {
  company: Company;
}

const formatBadgeHeadline = (badge: CompanyBadgeItem): string => {
  const parts = [badge.name].filter((part): part is string => Boolean(part && String(part).trim().length > 0));
  const edition = [badge.year ? `Ano ${badge.year}` : null, badge.edition ? `Ed. ${badge.edition}` : null]
    .filter(Boolean)
    .join(' · ');
  if (edition) parts.push(edition);
  return parts.join(' - ') || 'Reconhecimento Avalia Solar';
};

export default function CompanyAwardsCard({ company }: CompanyAwardsCardProps) {
  const recognitions = Array.isArray(company.recognitions) && company.recognitions.length > 0
    ? company.recognitions
    : (Array.isArray(company.badges) ? company.badges : []);

  if (recognitions.length === 0) return null;

  const sortedBadges = [...recognitions].sort((a, b) => {
    const posA = a?.position ?? Number.POSITIVE_INFINITY;
    const posB = b?.position ?? Number.POSITIVE_INFINITY;
    if (posA !== posB) return posA - posB;
    return (Number(a?.id) || 0) - (Number(b?.id) || 0);
  });

  const featuredBadge = sortedBadges[0];
  const featuredBadgeImage = featuredBadge?.image_url ? getFullImageUrl(featuredBadge.image_url) : null;
  const featuredSlug = featuredBadge?.public_slug;
  const verificationUrl = featuredBadge?.verification_url || featuredBadge?.verifiable_url || (featuredSlug ? `/badges/${featuredSlug}` : null);

  return (
    <Card className="overflow-hidden relative border-blue-100/60 dark:border-blue-900/30 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20 shadow-sm rounded-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      <CardContent className="p-6 space-y-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Selos & Reconhecimentos Oficiais
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            Ativos de distinção histórica emitidos e verificados pelo ecossistema Avalia Solar.
          </p>
        </div>

        {featuredBadge && (
          <div className="rounded-xl border border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-all duration-300 p-4">
            <div className="flex items-start gap-4">
              {featuredBadgeImage ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1">
                  <SafeBadgeImage
                    src={featuredBadgeImage}
                    alt={featuredBadge?.name || 'Selo de reconhecimento'}
                    fallback={
                      <div className="flex h-full w-full items-center justify-center bg-blue-50/50 text-blue-600">
                        <Trophy className="h-8 w-8" />
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50/50 text-blue-600">
                  <Trophy className="h-8 w-8" />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {formatBadgeHeadline(featuredBadge)}
                  </p>
                  {featuredBadge.category && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 font-semibold">
                      {featuredBadge.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                  {featuredBadge?.description?.trim() || 'Reconhecimento oficial conferido pelo Avalia Solar por desempenho e conformidade.'}
                </p>

                {verificationUrl && (
                  <div className="pt-2">
                    <Link
                      href={verificationUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verificar autenticidade do selo
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {sortedBadges.length > 1 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="h-auto p-0 text-xs font-bold text-primary hover:underline group inline-flex items-center">
                Ver todos os {sortedBadges.length} reconhecimentos
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Galeria de Selos Oficiais
                </DialogTitle>
                <DialogDescription>
                  Reconhecimentos e selos históricos outorgados para {company.name}.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {sortedBadges.map((badge, index) => {
                  const imageUrl = badge.image_url ? getFullImageUrl(badge.image_url) : null;
                  const itemVerificationUrl = badge.verification_url || badge.verifiable_url || (badge.public_slug ? `/badges/${badge.public_slug}` : null);

                  return (
                    <div key={`${badge.id || index}-${badge.name || 'badge'}`} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                      <div className="flex items-start gap-4">
                        {imageUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-1">
                            <SafeBadgeImage
                              src={imageUrl}
                              alt={badge.name || 'Selo'}
                              fallback={
                                <div className="flex h-full w-full items-center justify-center bg-white text-primary">
                                  <Trophy className="h-6 w-6" />
                                </div>
                              }
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 text-primary">
                            <Trophy className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatBadgeHeadline(badge)}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {badge.description?.trim() || 'Distinção formal auditada e confirmada.'}
                          </p>
                          {itemVerificationUrl && (
                            <div className="pt-1">
                              <Link
                                href={itemVerificationUrl}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Página oficial de verificação
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
