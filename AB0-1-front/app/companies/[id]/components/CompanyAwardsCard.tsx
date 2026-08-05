'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight, Award, Trophy } from 'lucide-react';

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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

type CompanyBadgeItem = NonNullable<Company['badges']>[number];

interface CompanyAwardsCardProps {
  company: Company;
}

const parseAwardsText = (awards?: string): string[] => {
  if (!awards || typeof awards !== 'string') return [];
  return awards
    .split(/[\n|;,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const formatBadgeHeadline = (badge: CompanyBadgeItem): string => {
  const parts = [badge.name].filter((part): part is string => Boolean(part && String(part).trim().length > 0));
  const edition = [badge.year, badge.edition].filter(Boolean).join(' / ');
  if (edition) parts.push(edition);
  const headline = parts.join(' - ');
  return headline || 'Premiação Avalia Solar';
};

export default function CompanyAwardsCard({ company }: CompanyAwardsCardProps) {
  const badges = Array.isArray(company.badges) ? company.badges : [];
  const awardsText = parseAwardsText(company.awards);
  const hasAwards = badges.length > 0 || awardsText.length > 0;

  if (!hasAwards) return null;

  const featuredBadge = badges[0];
  const featuredBadgeImage = featuredBadge?.image_url ? getFullImageUrl(featuredBadge.image_url) : null;

  return (
    <Card className="clay-precision overflow-hidden relative border-blue-100/50 bg-gradient-to-br from-white to-blue-50/30">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      <CardContent className="p-6 space-y-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 tracking-tight">
              Prêmio Avalia Solar
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 font-medium">
            Reconhecimento anual do Avalia Solar para empresas destaque em qualidade e confiança.
          </p>
        </div>

        {(featuredBadge || awardsText.length > 0) && (
          <div className="rounded-xl border border-blue-100/50 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 p-4">
            <div className="flex items-start gap-4">
              {featuredBadgeImage ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-1">
                  <SafeBadgeImage
                    src={featuredBadgeImage}
                    alt={featuredBadge?.name || 'Selo de prêmio'}
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

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 leading-snug">
                  {featuredBadge ? formatBadgeHeadline(featuredBadge) : awardsText[0]}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {featuredBadge?.description?.trim() || 'Selo concedido pelo Avalia Solar para empresas com alta performance.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="h-auto p-0 text-sm font-bold text-blue-600 hover:text-blue-700 group mt-2 inline-flex items-center">
              Ver todos os prêmios
              <ArrowRight className="ml-1.5 h-4 w-4 smooth-transition group-hover:translate-x-1" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Prêmios Avalia Solar
              </DialogTitle>
              <DialogDescription>
                Reconhecimentos recebidos por {company.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {badges.map((badge, index) => {
                const imageUrl = badge.image_url ? getFullImageUrl(badge.image_url) : null;
                return (
                  <div key={`${badge.id || index}-${badge.name || 'badge'}`} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start gap-3">
                      {imageUrl ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                          <SafeBadgeImage
                            src={imageUrl}
                            alt={badge.name || 'Selo de prêmio'}
                            fallback={
                              <div className="flex h-full w-full items-center justify-center bg-white text-blue-600">
                                <Trophy className="h-6 w-6" />
                              </div>
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-600">
                          <Trophy className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900">{formatBadgeHeadline(badge)}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {badge.description?.trim() || 'Reconhecimento oficial do Avalia Solar.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {awardsText.map((award, index) => (
                <div key={`award-text-${index}`} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-600">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{award}</p>
                      <p className="mt-1 text-xs text-slate-600">Premiação registrada no perfil da empresa.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
