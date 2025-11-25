'use client';

import { useState } from 'react';
import { Sparkles, Plus, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BannersSponsorshipProps {
  companyId: string;
}

export default function BannersSponsorship({ companyId }: BannersSponsorshipProps) {
  const [banners] = useState([
    { id: '1', title: 'Banner Home', category: 'Arquitetura', status: 'active', position: 'top' },
    { id: '2', title: 'Banner Sidebar', category: 'Design', status: 'pending', position: 'sidebar' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banners & Patrocínios</h2>
          <p className="text-muted-foreground">Gerencie campanhas de banners e planos patrocinados</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Contratar Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{banner.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{banner.category}</p>
                </div>
                <Badge variant={banner.status === 'active' ? 'default' : 'secondary'}>
                  {banner.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Posição: {banner.position}</span>
                <Button variant="outline" size="sm">Ver Detalhes</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha ativa</h3>
            <p className="text-muted-foreground text-center mb-4">
              Contrate banners para aumentar sua visibilidade.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Contratar Primeiro Banner
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
