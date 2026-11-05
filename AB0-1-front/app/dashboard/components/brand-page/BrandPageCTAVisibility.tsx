'use client';

import { useEffect, useState } from 'react';
import type { Company } from '@/lib/api';
import { fetchApi } from '@/lib/api';
import { canUsePaidConversion } from '@/lib/feature-access';
import { useToast } from '@/hooks/use-toast';

type Preference = { quote_cta_enabled: boolean; whatsapp_enabled: boolean };

export default function BrandPageCTAVisibility({ company, companyId }: {
  company?: Company;
  companyId: string;
}) {
  const { toast } = useToast();
  const [selection, setSelection] = useState<Preference>({
    quote_cta_enabled: company?.quote_cta_enabled !== false,
    whatsapp_enabled: company?.whatsapp_enabled ?? company?.cta_whatsapp_enabled ?? false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelection({
      quote_cta_enabled: company?.quote_cta_enabled !== false,
      whatsapp_enabled: company?.whatsapp_enabled ?? company?.cta_whatsapp_enabled ?? false,
    });
  }, [companyId, company?.quote_cta_enabled, company?.whatsapp_enabled, company?.cta_whatsapp_enabled]);

  const quoteEntitled = Boolean(company && canUsePaidConversion(company, 'quote'));
  const whatsappEntitled = Boolean(company && canUsePaidConversion(company, 'whatsapp'));

  async function update(key: keyof Preference, checked: boolean) {
    if (saving || (key === 'quote_cta_enabled' ? !quoteEntitled : !whatsappEntitled)) return;
    const previous = selection;
    setSelection({ ...previous, [key]: checked });
    setSaving(true);
    try {
      const updated = await fetchApi<Preference>('/company_dashboard/cta_visibility', {
        method: 'PATCH',
        params: { company_id: companyId },
        body: JSON.stringify({ [key]: checked }),
      });
      setSelection({
        quote_cta_enabled: updated.quote_cta_enabled,
        whatsapp_enabled: updated.whatsapp_enabled,
      });
      toast({ title: 'Visibilidade atualizada', description: 'Os botões da página pública seguem a nova preferência.' });
    } catch {
      setSelection(previous);
      toast({ title: 'Não foi possível atualizar', description: 'A preferência anterior foi mantida.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="brand-cta-visibility-title" data-testid="brand-cta-visibility">
      <div className="mb-4">
        <h3 id="brand-cta-visibility-title" className="text-sm font-bold text-slate-950">Visibilidade dos botões</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Escolha como os compradores podem entrar em contato no topo do seu perfil. Os botões não aparecem duplicados em Informações de Contato.
        </p>
      </div>
      <div className="space-y-3">
        {([
          { key: 'quote_cta_enabled', label: 'Solicitar orçamento', description: 'Abre o formulário de orçamento.', enabled: quoteEntitled },
          { key: 'whatsapp_enabled', label: 'WhatsApp', description: 'Contato direto, disponível quando houver número válido.', enabled: whatsappEntitled },
        ] as const).map(({ key, label, description, enabled }) => (
          <label key={key} className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{enabled ? description : 'Disponível conforme os recursos do seu plano.'}</span>
            </span>
            <input
              type="checkbox"
              aria-label={'Exibir ' + label}
              checked={enabled && selection[key]}
              disabled={saving || !enabled}
              onChange={(event) => void update(key, event.currentTarget.checked)}
              className="h-5 w-5 shrink-0 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40"
            />
          </label>
        ))}
      </div>
      <p role="status" className="mt-3 text-xs text-slate-500">
        {saving ? 'Salvando preferências…' : 'Comparar e Avaliar permanecem disponíveis para visitantes.'}
      </p>
    </section>
  );
}
