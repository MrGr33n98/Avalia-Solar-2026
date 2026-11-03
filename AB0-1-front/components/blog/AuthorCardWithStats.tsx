'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Linkedin, Star, Users, ArrowUpRight } from 'lucide-react';

interface AuthorCardWithStatsProps {
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
  linkedinUrl?: string;
  bookingUrl?: string;
  stats?: {
    posts: number;
    likes: number;
    followers: number;
  };
}

export function AuthorCardWithStats({
  name = 'Felipe Henrique Morais',
  bio,
  avatarUrl = '/images/felipe-morais-fundador.jpg',
  role = 'Fundador',
  linkedinUrl = 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/',
  bookingUrl = 'https://zbooking.us/6shCH',
  stats,
}: AuthorCardWithStatsProps) {
  const displayName = name === 'Equipe Avalia Solar' ? 'Felipe Henrique Morais' : name;
  const displayAvatar = avatarUrl || '/images/felipe-morais-fundador.jpg';

  return (
    <Card className="bg-slate-50 border border-slate-200/80 shadow-sm my-12 overflow-hidden">
      <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
        <div className="flex flex-col items-center gap-3 shrink-0 mx-auto sm:mx-0">
          <Avatar className="w-24 h-24 border-2 border-white shadow-md ring-1 ring-slate-200">
            <AvatarImage
              src={displayAvatar}
              alt={displayName}
              className="object-cover object-top w-full h-full"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-full border-slate-300 hover:bg-[#0077b5]/10 text-slate-600 hover:text-[#0077b5] transition-colors"
            >
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir LinkedIn de ${displayName}`}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <Linkedin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>LinkedIn</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-3 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-xl text-slate-900">{displayName}</h3>
              <p className="text-sm font-semibold text-primary">{role}</p>
            </div>

            {bookingUrl && (
              <Button
                asChild
                size="sm"
                className="bg-[#f8ca3a] hover:bg-[#fed957] text-[#09172f] font-bold text-xs h-9 px-4 rounded-lg shadow-sm transition-all"
              >
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#09172f]" />
                  <span>Agendar Apresentação</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>

          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
            {bio ||
              'Fundador da Avalia Solar. Conectando consumidores e empresas de energia solar com transparência, avaliações auditadas e dados reais para transformar a escolha de soluções energéticas.'}
          </p>

          {stats && (
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4 mt-4 w-full max-w-md mx-auto sm:mx-0">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Posts</span>
                </div>
                <span className="font-bold text-slate-900">{stats.posts}</span>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
                  <Star className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Likes</span>
                </div>
                <span className="font-bold text-slate-900">{stats.likes}</span>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
                  <Users className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Seguidores</span>
                </div>
                <span className="font-bold text-slate-900">
                  {stats.followers >= 1000 ? `${(stats.followers / 1000).toFixed(1)}k` : stats.followers}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
