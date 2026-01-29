'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchApi } from '@/lib/api';

interface ApprovalsPanelProps {
  companyId: string;
}

export default function ApprovalsPanel({ companyId }: ApprovalsPanelProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchApi<{ pending_changes: any[] }>(
          '/company_dashboard/pending_changes',
          { params: { company_id: companyId } }
        );
        setItems(data?.pending_changes || []);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar pendências');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando pendências...</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração pendente.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((pc) => (
        <Card key={pc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{String(pc.change_type).replace(/_/g,' ').toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">Criado em {new Date(pc.created_at).toLocaleString()}</p>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
              Pendente
            </Badge>
          </CardContent>
          {pc.rejection_reason && (
            <div className="px-4 pb-4">
              <p className="text-xs text-destructive">Motivo da rejeição: {pc.rejection_reason}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
