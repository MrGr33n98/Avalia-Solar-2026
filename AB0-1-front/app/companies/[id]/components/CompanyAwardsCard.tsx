'use client';

import Image from 'next/image';
import { ArrowRight, Award, Trophy } from 'lucide-react';

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
    <Card className="border border-blue-100 bg-white shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="inline-block bg-blue-700 px-2 py-1 text-xl font-extrabold leading-none text-white">
            Prêmio Avalia Solar
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Reconhecimento anual do Avalia Solar para empresas destaque em qualidade e confiança.
          </p>
        </div>

        {(featuredBadge || awardsText.length > 0) && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-start gap-3">
              {featuredBadgeImage ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                  <Image
                    src={featuredBadgeImage}
                    alt={featuredBadge?.name || 'Selo de prêmio'}
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-600">
                  <Trophy className="h-6 w-6" />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {featuredBadge ? formatBadgeHeadline(featuredBadge) : awardsText[0]}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {featuredBadge?.description?.trim() || 'Selo concedido pelo Avalia Solar para empresas com alta performance.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="h-auto p-0 text-base font-bold text-blue-700">
              Ver todos os prêmios
              <ArrowRight className="ml-1 h-4 w-4" />
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
                          <Image
                            src={imageUrl}
                            alt={badge.name || 'Selo de prêmio'}
                            fill
                            sizes="56px"
                            className="object-contain"
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
