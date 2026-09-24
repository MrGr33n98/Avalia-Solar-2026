'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = { companyId: string };
type FormState = {
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};

const initialForm: FormState = {
  destination: '/companies',
  source: 'google',
  medium: 'cpc',
  campaign: '',
  content: '',
  term: '',
};

const presets = [
  { label: 'Google Ads', source: 'google', medium: 'cpc' },
  { label: 'Instagram', source: 'instagram', medium: 'social' },
  { label: 'LinkedIn', source: 'linkedin', medium: 'social' },
  { label: 'E-mail', source: 'email', medium: 'email' },
  { label: 'WhatsApp', source: 'whatsapp', medium: 'messaging' },
];

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '');

export default function UtmLinkBuilder({ companyId }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const generatedUrl = useMemo(() => {
    const base = origin || 'https://www.avaliasolar.com.br';
    const url = new URL(form.destination || '/companies', base);
    const params = new URLSearchParams();
    const values = {
      utm_source: form.source,
      utm_medium: form.medium,
      utm_campaign: form.campaign,
      utm_content: form.content,
      utm_term: form.term,
    };
    Object.entries(values).forEach(([key, value]) => {
      const normalized = normalize(value);
      if (normalized) params.set(key, normalized);
    });
    params.set('company_id', companyId);
    url.search = params.toString();
    return url.toString();
  }, [companyId, form, origin]);

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const copyUrl = async () => {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      aria-labelledby="utm-builder-title"
      className="space-y-5 rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-sm sm:p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--dashboard-muted))]">
          Aquisição
        </p>
        <h2 id="utm-builder-title" className="text-xl font-semibold">
          Gerador de links UTM
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-muted))]">
          Monte um link rastreável para campanhas de entrada. A origem de entrada é editável e o
          link não é salvo automaticamente.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Presets de campanha">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((current) => ({ ...current, source: preset.source, medium: preset.medium }))
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ['destination', 'Destino', 'Ex.: /companies/minha-empresa'],
            ['source', 'utm_source', 'Ex.: google'],
            ['medium', 'utm_medium', 'Ex.: cpc'],
            ['campaign', 'utm_campaign', 'Ex.: black-friday'],
            ['content', 'utm_content', 'Ex.: hero'],
            ['term', 'utm_term', 'Ex.: energia solar'],
          ] as const
        ).map(([key, label, placeholder]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={'utm-' + key}>{label}</Label>
            <Input
              id={'utm-' + key}
              value={form[key]}
              placeholder={placeholder}
              onChange={(event) => update(key, event.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="generated-tracking-url">Link gerado</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="generated-tracking-url"
            readOnly
            value={generatedUrl}
            aria-describedby="tracking-url-help"
          />
          <Button type="button" onClick={copyUrl} className="shrink-0">
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => window.open(generatedUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Abrir
          </Button>
        </div>
        <p id="tracking-url-help" className="text-xs text-[hsl(var(--dashboard-muted))]">
          A empresa é vinculada por company_id. Não inclua PII em parâmetros UTM.
        </p>
      </div>
      <Button type="button" variant="ghost" onClick={() => setForm(initialForm)}>
        <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
        Limpar
      </Button>
      {copied ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Link copiado.
        </p>
      ) : null}
    </section>
  );
}
