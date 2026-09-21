'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Link2, PlayCircle, Save, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AnalyticsSettings from './AnalyticsSettings';
import { fetchApi, type Company } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { startDashboardTour } from '@/lib/tour';

interface CompanySettingsProps {
  companyId: string;
  company?: Company;
}

type CtaField =
  | 'cta_primary_label'
  | 'cta_primary_url'
  | 'cta_secondary_label'
  | 'cta_secondary_url'
  | 'cta_whatsapp_template'
  | 'cta_utm_source'
  | 'cta_utm_medium'
  | 'cta_utm_campaign';

type CtaForm = Record<CtaField, string>;

const formFromCompany = (company?: Company): CtaForm => ({
  cta_primary_label: company?.cta_primary_label ?? '',
  cta_primary_url: company?.cta_primary_url ?? '',
  cta_secondary_label: company?.cta_secondary_label ?? '',
  cta_secondary_url: company?.cta_secondary_url ?? '',
  cta_whatsapp_template: company?.cta_whatsapp_template ?? '',
  cta_utm_source: company?.cta_utm_source ?? '',
  cta_utm_medium: company?.cta_utm_medium ?? '',
  cta_utm_campaign: company?.cta_utm_campaign ?? '',
});

export default function CompanySettings({ companyId, company }: CompanySettingsProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<CtaForm>(() => formFromCompany(company));
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChangeId, setPendingChangeId] = useState<number | null>(null);

  useEffect(() => {
    setForm(formFromCompany(company));
    setPendingChangeId(null);
  }, [company]);

  const originalForm = useMemo(() => formFromCompany(company), [company]);
  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);
  const configuredCtas = [form.cta_primary_url, form.cta_secondary_url].filter(Boolean).length;

  const updateField = (field: CtaField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetchApi<{ message: string; pending_change: { id: number } }>(
        '/company_dashboard/update_ctas',
        {
          method: 'POST',
          params: { company_id: companyId },
          body: JSON.stringify(form),
        }
      );

      setPendingChangeId(response.pending_change.id);
      toast({ title: 'Configurações enviadas', description: response.message });
    } catch (error) {
      console.error('Não foi possível atualizar os CTAs da empresa:', error);
      toast({
        title: 'Não foi possível enviar as configurações',
        description: 'Revise os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Settings2 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conversão e atribuição</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Configurações da empresa</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-white/50">
            Defina os CTAs exibidos no perfil e os parâmetros usados para atribuir as conversões.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {configuredCtas} de 2 CTAs com destino configurado
        </div>
      </div>

      {pendingChangeId && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription>
            Alteração #{pendingChangeId} enviada para aprovação. O perfil mantém a configuração atual até a publicação.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        <form className="space-y-8 lg:col-span-8" onSubmit={handleSubmit}>
          <Card className="border-white/10 bg-[#002B4D]/50 shadow-none">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-white">Chamadas para ação</CardTitle>
              <CardDescription className="text-white/50">Os rótulos e links devem direcionar o visitante para o próximo passo mais útil.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
              <CtaInputs label="CTA principal" labelValue={form.cta_primary_label} urlValue={form.cta_primary_url} onLabelChange={(value) => updateField('cta_primary_label', value)} onUrlChange={(value) => updateField('cta_primary_url', value)} />
              <CtaInputs label="CTA secundário" labelValue={form.cta_secondary_label} urlValue={form.cta_secondary_url} onLabelChange={(value) => updateField('cta_secondary_label', value)} onUrlChange={(value) => updateField('cta_secondary_url', value)} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cta-whatsapp-template" className="text-xs font-semibold text-white/70">Mensagem inicial do WhatsApp</Label>
                <Textarea id="cta-whatsapp-template" value={form.cta_whatsapp_template} onChange={(event) => updateField('cta_whatsapp_template', event.target.value)} placeholder="Olá, gostaria de solicitar uma proposta para energia solar." rows={4} className="resize-none border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#002B4D]/50 shadow-none">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-white">Atribuição de campanha</CardTitle>
              <CardDescription className="text-white/50">Valores opcionais adicionados aos links gerados no perfil da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <FieldInput id="cta-utm-source" label="Origem" value={form.cta_utm_source} onChange={(value) => updateField('cta_utm_source', value)} placeholder="website" />
              <FieldInput id="cta-utm-medium" label="Mídia" value={form.cta_utm_medium} onChange={(value) => updateField('cta_utm_medium', value)} placeholder="organic" />
              <FieldInput id="cta-utm-campaign" label="Campanha" value={form.cta_utm_campaign} onChange={(value) => updateField('cta_utm_campaign', value)} placeholder="lancamento-solar" />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={!hasChanges || isSaving} className="min-w-52">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Enviando...' : 'Enviar para aprovação'}
            </Button>
          </div>
        </form>

        <div className="space-y-8 lg:col-span-4">
          <Card className="border-white/10 bg-[#002B4D]/50 shadow-none">
            <CardHeader className="p-6">
              <PlayCircle className="mb-3 h-7 w-7 text-primary" />
              <CardTitle className="text-lg font-bold text-white">Tour do dashboard</CardTitle>
              <CardDescription className="text-white/50">Reveja os fluxos principais com a orientação guiada da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button type="button" variant="outline" onClick={() => startDashboardTour()} className="w-full">Iniciar tour</Button>
            </CardContent>
          </Card>
          <AnalyticsSettings companyId={companyId} />
        </div>
      </div>
    </div>
  );
}

function CtaInputs({ label, labelValue, urlValue, onLabelChange, onUrlChange }: { label: string; labelValue: string; urlValue: string; onLabelChange: (value: string) => void; onUrlChange: (value: string) => void }) {
  return (
    <div className="space-y-4">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <FieldInput id={`${label}-label`} label="Rótulo" value={labelValue} onChange={onLabelChange} placeholder="Solicitar orçamento" />
      <div className="space-y-2">
        <Label htmlFor={`${label}-url`} className="text-xs font-semibold text-white/70">URL de destino</Label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input id={`${label}-url`} type="url" value={urlValue} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://..." className="border-white/10 bg-black/20 pl-10 text-white placeholder:text-white/30" />
        </div>
      </div>
    </div>
  );
}

function FieldInput({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold text-white/70">{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="border-white/10 bg-black/20 text-white placeholder:text-white/30" />
    </div>
  );
}
