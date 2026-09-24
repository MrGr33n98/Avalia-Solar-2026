'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SITE } from '@/lib/site-core';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';

type CompanyProps = {
  id?: number | string;
  slug?: string | null;
  name?: string | null;
};

type Props = {
  companyId: string;
  company?: CompanyProps;
};

type DestinationMode = 'company_profile' | 'quote_request' | 'custom';

type FormState = {
  destinationMode: DestinationMode;
  customPath: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
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
    .replace(/[^\p{L}\p{N}_.-]/gu, '');

export default function UtmLinkBuilder({ companyId, company }: Props) {
  const defaultPath = useMemo(() => {
    return buildCompanyPath(company?.slug, company?.name, companyId);
  }, [company?.slug, company?.name, companyId]);

  const quotePath = useMemo(() => {
    return buildCompanySubPath(company?.slug, company?.name, 'quote', companyId);
  }, [company?.slug, company?.name, companyId]);

  const initialForm: FormState = useMemo(
    () => ({
      destinationMode: 'company_profile',
      customPath: defaultPath,
      source: 'google',
      medium: 'cpc',
      campaign: '',
      content: '',
      term: '',
    }),
    [defaultPath]
  );

  const [form, setForm] = useState<FormState>(initialForm);
  const [copied, setCopied] = useState(false);

  const selectedPath = useMemo(() => {
    if (form.destinationMode === 'company_profile') return defaultPath;
    if (form.destinationMode === 'quote_request') return quotePath;
    return form.customPath.trim() || defaultPath;
  }, [form.destinationMode, form.customPath, defaultPath, quotePath]);

  const generatedUrl = useMemo(() => {
    try {
      const base = SITE.url;
      const destination = selectedPath.trim();
      const url = destination.startsWith('/') ? new URL(destination, base) : new URL(destination);
      if (!['http:', 'https:'].includes(url.protocol)) return '';

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

      url.search = params.toString();
      return url.toString();
    } catch {
      return '';
    }
  }, [selectedPath, form.source, form.medium, form.campaign, form.content, form.term]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const copyUrl = async () => {
    if (!generatedUrl) return;
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
          Monte um link rastreável para campanhas de entrada na superfície pública da plataforma.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="destination-mode-select">Destino da campanha</Label>
          <select
            id="destination-mode-select"
            value={form.destinationMode}
            onChange={(e) => update('destinationMode', e.target.value as DestinationMode)}
            className="w-full rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-3 py-2 text-sm text-[hsl(var(--dashboard-ink))]"
          >
            <option value="company_profile">Perfil público da empresa ({defaultPath})</option>
            <option value="quote_request">Solicitar orçamento ({quotePath})</option>
            <option value="custom">Caminho personalizado</option>
          </select>
        </div>

        {form.destinationMode === 'custom' ? (
          <div className="space-y-2">
            <Label htmlFor="utm-custom-path">Caminho personalizado</Label>
            <Input
              id="utm-custom-path"
              value={form.customPath}
              placeholder="Ex.: /companies/minha-empresa"
              onChange={(e) => update('customPath', e.target.value)}
            />
          </div>
        ) : null}
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
        <Label htmlFor="generated-tracking-url">Link público gerado</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="generated-tracking-url"
            readOnly
            value={generatedUrl}
            aria-describedby="tracking-url-help"
          />
          <Button type="button" onClick={copyUrl} className="shrink-0" disabled={!generatedUrl}>
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => window.open(generatedUrl, '_blank', 'noopener,noreferrer')}
            disabled={!generatedUrl}
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Abrir
          </Button>
        </div>
        {!generatedUrl ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            Destino precisa ser um caminho interno ou uma URL http(s).
          </p>
        ) : null}
        <p id="tracking-url-help" className="text-xs text-[hsl(var(--dashboard-muted))]">
          Links apontam para a superfície pública www.avaliasolar.com.br. Não inclua PII em parâmetros UTM.
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
