'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReviewShareCard, ShareableReviewForm } from './ReviewShareCard';
import { RequestReviewEmailDrawer } from './RequestReviewEmailDrawer';
import { ReputationMilestones } from './ReputationMilestones';
import { ReviewButtonEmbed } from './ReviewButtonEmbed';
import { ReviewCollectionAnalytics } from './ReviewCollectionAnalytics';
import { PlusCircle, QrCode } from 'lucide-react';

interface ReviewCollectionHubProps {
  forms: ShareableReviewForm[];
  selectedFormId?: number;
  onSelectForm: (id: number) => void;
  onCreateForm: () => void;
  companyName: string;
  companyId?: string;
  approvedReviewsCount: number;
  onTrackAction?: (event: string, meta?: Record<string, unknown>) => void;
}

export function ReviewCollectionHub({
  forms,
  selectedFormId,
  onSelectForm,
  onCreateForm,
  companyName,
  companyId,
  approvedReviewsCount,
  onTrackAction,
}: ReviewCollectionHubProps) {
  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);

  // Seleciona o formulário ativo padrão (ou o primeiro ativo, ou o primeiro existente)
  const activeForms = forms.filter((f) => f.status === 'active');
  const selectedForm =
    forms.find((f) => f.id === selectedFormId) || activeForms[0] || forms[0];

  if (!forms || forms.length === 0) {
    return (
      <div className="space-y-4">
        <ReputationMilestones approvedReviewsCount={approvedReviewsCount} />
        <Card className="rounded-xl border-dashed border-slate-300 bg-white">
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <QrCode className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">
            Nenhum canal de coleta configurado
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500">
            Crie seu primeiro formulário personalizado para começar a solicitar avaliações via
            WhatsApp, E-mail, QR Code e Link Direto.
          </p>
          <Button
            onClick={onCreateForm}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Criar Primeiro Formulário
          </Button>
        </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReputationMilestones approvedReviewsCount={approvedReviewsCount} />
      {/* Seletor de Formulário (se houver mais de 1) */}
      {forms.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Formulário ativo para compartilhamento:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Selecione o formulário para coleta"
              value={selectedForm?.id}
              onChange={(e) => onSelectForm(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.status === 'inactive' ? '(Pausado)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Card Principal de Compartilhamento e Ações Rápidas */}
      {selectedForm && (
        <ReviewShareCard
          form={selectedForm}
          companyName={companyName}
          onOpenEmailDrawer={() => setEmailDrawerOpen(true)}
          onTrack={onTrackAction}
        />
      )}

      {/* Funil de Atribuição por Canal (QW-08) */}
      {selectedForm && companyId && (
        <ReviewCollectionAnalytics formId={selectedForm.id} companyId={companyId} />
      )}

      {/* Botão Embed HTML para Sites Externos */}
      {selectedForm && (
        <ReviewButtonEmbed
          formToken={selectedForm.token}
          companyName={companyName}
          isActive={selectedForm.status === 'active'}
          onTrack={onTrackAction}
        />
      )}

      {/* Drawer de E-mail Desacoplado */}
      {selectedForm && (
        <RequestReviewEmailDrawer
          open={emailDrawerOpen}
          onOpenChange={setEmailDrawerOpen}
          formName={selectedForm.name}
          formToken={selectedForm.token}
          companyName={companyName}
          onTrack={onTrackAction}
        />
      )}
    </div>
  );
}
