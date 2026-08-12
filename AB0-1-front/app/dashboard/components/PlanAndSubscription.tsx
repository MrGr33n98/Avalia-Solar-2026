'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Zap, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  plan_tier: string;
  is_active: boolean;
  limits: Record<string, any>;
  usage: Record<string, any>;
  features: string[];
}

export default function PlanAndSubscription({ companyId }: { companyId: string }) {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch(`/api/v1/company_dashboard/subscription?company_id=${companyId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (e) {
        console.error('Failed to fetch subscription', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, [companyId]);

  if (loading) return <div>Carregando...</div>;
  if (!data) return <div>Não foi possível carregar as informações do plano.</div>;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              Plano Atual: <span className="uppercase text-primary">{data.plan_tier}</span>
            </CardTitle>
            <Badge variant={data.is_active ? 'default' : 'destructive'}>
              {data.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <CardDescription>
            Informações sobre sua assinatura e limites de uso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Uso de Recursos
              </h3>
              
              {/* Example metrics based on limits and usage */}
              {Object.keys(data.limits).map(limitKey => {
                const limitValue = data.limits[limitKey];
                const usageValue = data.usage[limitKey] || 0;
                
                // If limit is boolean (feature flag), we don't show a progress bar
                if (typeof limitValue === 'boolean') return null;

                const percentage = limitValue > 0 ? Math.min(100, Math.round((usageValue / limitValue) * 100)) : 0;
                
                return (
                  <div key={limitKey} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{limitKey.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">{usageValue} / {limitValue === -1 ? 'Ilimitado' : limitValue}</span>
                    </div>
                    {limitValue !== -1 && (
                      <Progress value={percentage} className="h-2" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-4">
               <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Funcionalidades Habilitadas
              </h3>
              <ul className="space-y-2">
                {data.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Button className="w-full">
                  Fazer Upgrade de Plano
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
