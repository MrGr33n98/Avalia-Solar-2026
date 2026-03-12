'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, ExternalLink, ShieldCheck, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, badgesApi } from '@/lib/api';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface BadgesManagementProps {
  companyId: string | number;
}

export default function BadgesManagement({ companyId }: BadgesManagementProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBadges() {
      try {
        const data = await badgesApi.getByCompany(companyId);
        setBadges(data);
      } catch (error) {
        console.error('Error loading badges:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBadges();
  }, [companyId]);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Award className="h-12 w-12 text-white/40 mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">Nenhum selo atribuido</h3>
          <p className="text-sm text-white/40 max-w-xs mt-2">
            Sua empresa ainda n�o possui selos de distin��o atribuidos pela nossa equipe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <Card key={badge.id} className="overflow-hidden flex flex-col">
            <div className="bg-[#002B4D] dark:bg-[#002B4D] p-8 flex justify-center items-center h-48 border-b">
              <OptimizedImage
                src={badge.image_url || ''}
                alt={badge.name}
                width={120}
                height={120}
                className="object-contain drop-shadow-none"
              />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{badge.name}</CardTitle>
                {badge.category && (
                  <UIBadge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    {badge.category}
                  </UIBadge>
                )}
              </div>
              <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                {badge.description || 'Selo de reconhecimento oficial do Avalia Solar.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 mt-auto">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[11px] h-8"
                  onClick={() => copyToClipboard(badge.image_url || '', 'URL da imagem copiada!')}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  URL Imagem
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[11px] h-8"
                  onClick={() => copyToClipboard(badge.verifiable_url || '', 'Link de verifica��o copiado!')}
                >
                  <ShieldCheck className="h-3 w-3 mr-1.5" />
                  Verific�vel
                </Button>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase">Snippet HTML</label>
                <div className="relative group">
                  <pre className="p-2 bg-muted rounded text-[9px] overflow-x-hidden truncate border border-border">
                    {`<a href="${badge.verifiable_url || ''}"><img src="${badge.image_url || ''}" width="150" alt="${badge.name}" /></a>`}
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(
                      `<a href="${badge.verifiable_url || ''}"><img src="${badge.image_url || ''}" width="150" alt="${badge.name}" /></a>`,
                      'Snippet HTML copiado!'
                    )}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Button asChild variant="ghost" size="sm" className="w-full text-[11px] h-8 text-primary">
                <a href={badge.verifiable_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Abrir p�gina do selo
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
