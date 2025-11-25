'use client';

import { useState } from 'react';
import { Megaphone, Plus, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CampaignsMarketingProps {
  companyId: string;
}

export default function CampaignsMarketing({ companyId }: CampaignsMarketingProps) {
  const [campaigns] = useState([
    { 
      id: '1', 
      name: 'Campanha Verão 2024', 
      status: 'active',
      goal: 100,
      achieved: 67,
      budget: 5000,
      spent: 3200,
      start_date: '2024-01-01',
      end_date: '2024-03-31'
    },
    { 
      id: '2', 
      name: 'Black Friday', 
      status: 'completed',
      goal: 200,
      achieved: 215,
      budget: 10000,
      spent: 8500,
      start_date: '2023-11-15',
      end_date: '2023-11-30'
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campanhas de Marketing</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe suas campanhas</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.start_date} - {campaign.end_date}
                  </p>
                </div>
                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {campaign.status === 'active' ? 'Ativa' : 'Finalizada'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Meta de Conversões</span>
                    <span className="text-sm font-semibold">
                      {campaign.achieved} / {campaign.goal}
                    </span>
                  </div>
                  <Progress value={(campaign.achieved / campaign.goal) * 100} className="h-2" />
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    {((campaign.achieved / campaign.goal) * 100).toFixed(1)}% atingido
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Orçamento</span>
                    <span className="text-sm font-semibold">
                      R$ {campaign.spent.toLocaleString()} / R$ {campaign.budget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    {((campaign.spent / campaign.budget) * 100).toFixed(1)}% utilizado
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm">Ver Detalhes</Button>
                <Button variant="outline" size="sm">Relatório</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha criada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie campanhas para promover seus produtos e serviços.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
