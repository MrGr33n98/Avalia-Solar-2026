'use client';

import { ExternalLink, Pencil, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CompanySellerData {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  linkedin?: string;
  cnpj?: string;
  founded_year?: number;
  employees_count?: number;
  city?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  email_public?: string;
  instagram?: string;
  facebook?: string;
}

export type SellerPublicDetails = CompanySellerData;
export type SellerEditorMode = 'profile' | 'channels' | 'contacts';

export interface SellerInformationPanelProps {
  company: CompanySellerData;
  draft: CompanySellerData | null;
  editorOpen: boolean;
  editorMode: SellerEditorMode;
  saving: boolean;
  refreshing: boolean;
  onEdit: (mode: SellerEditorMode) => void;
  onEditorOpenChange: (open: boolean) => void;
  onFieldChange: (field: keyof CompanySellerData, value: string | number | undefined) => void;
  onSave: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

function fieldValue(value?: string | number) {
  if (value === undefined || value === null || value === '') return 'Não informado';
  return String(value);
}

function safeWebUrl(raw?: string) {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function FieldDisplay({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | number;
  href?: string | null;
}) {
  const readable = fieldValue(value);
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-semibold leading-4 text-[hsl(var(--dashboard-muted))]">{label}</dt>
      <dd className="min-w-0 break-words text-xs leading-[19px] text-[hsl(var(--dashboard-ink))]">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 text-[hsl(var(--dashboard-accent))] underline-offset-2 hover:underline"
          >
            <span className="min-w-0 break-all">{readable}</span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          readable
        )}
      </dd>
    </div>
  );
}

const editorInputClass =
  'block h-10 w-full rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-3 text-xs text-[hsl(var(--dashboard-ink))] outline-none transition placeholder:text-[hsl(var(--dashboard-muted))] focus:border-[hsl(var(--dashboard-accent))] focus:bg-[hsl(var(--dashboard-panel))] focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';

function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  placeholder,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: 'text' | 'url' | 'email' | 'tel' | 'number';
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0 space-y-1.5 text-xs font-medium text-[hsl(var(--dashboard-ink))]">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className={editorInputClass}
      />
    </label>
  );
}

export default function SellerInformationPanel({
  company,
  draft,
  editorOpen,
  editorMode,
  saving,
  refreshing,
  onEdit,
  onEditorOpenChange,
  onFieldChange,
  onSave,
  onRefresh,
}: SellerInformationPanelProps) {
  const publicProfileUrl = company.slug || company.id
    ? `https://www.avaliasolar.com.br/companies/${encodeURIComponent(company.slug || company.id || '')}`
    : null;
  const location = [company.city, company.state].filter(Boolean).join(', ') || undefined;
  const draftData = draft || company;

  function numberChange(field: 'founded_year' | 'employees_count', raw: string) {
    onFieldChange(field, raw === '' ? undefined : Number(raw));
  }

  return (
    <>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section
          aria-labelledby="seller-information-title"
          data-testid="seller-information-card"
          className="min-w-0 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-5 py-5 shadow-xs sm:px-6"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="seller-information-title" className="text-xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
                Informações da empresa
              </h3>
              <p className="mt-1 max-w-[650px] text-xs leading-[18px] text-[hsl(var(--dashboard-muted))]">
                Estes dados representam as informações públicas da empresa no Avalia Solar. Mantenha o perfil atualizado para que os visitantes conheçam seu negócio.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit('profile')}
                aria-label="Editar informações da empresa"
                title="Editar informações"
                data-testid="seller-information-edit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--dashboard-accent))] transition-colors hover:bg-[hsl(var(--dashboard-surface))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--dashboard-accent))]"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={refreshing}
                aria-label="Atualizar informações da empresa"
                title="Atualizar informações"
                data-testid="seller-information-refresh"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--dashboard-accent))] transition-colors hover:bg-[hsl(var(--dashboard-surface))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--dashboard-accent))] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
          </div>

          <dl className="mt-5 grid min-w-0 grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <FieldDisplay label="Nome da empresa" value={company.name} />
            <FieldDisplay label="Sede" value={location} />
            <FieldDisplay label="Domínio oficial" value={company.website} href={safeWebUrl(company.website)} />
            <FieldDisplay label="LinkedIn" value={company.linkedin} href={safeWebUrl(company.linkedin)} />
            <FieldDisplay label="Página pública no Avalia Solar" value={publicProfileUrl ?? undefined} href={publicProfileUrl} />
            <FieldDisplay label="CNPJ" value={company.cnpj} />
            <FieldDisplay label="Ano de fundação" value={company.founded_year} />
            <FieldDisplay label="Colaboradores" value={company.employees_count} />
          </dl>

          <div className="mt-5 border-t border-[hsl(var(--dashboard-border))] pt-4">
            <h4 className="text-xs font-semibold text-[hsl(var(--dashboard-ink))]">Descrição da empresa</h4>
            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-[20px] text-[hsl(var(--dashboard-muted))]">
              {fieldValue(company.description)}
            </p>
          </div>

          <div className="mt-5 rounded-lg border-l-2 border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-surface))] px-4 py-3 text-xs leading-[19px] text-[hsl(var(--dashboard-ink))]" role="note">
            As informações enviadas podem passar por revisão antes de aparecerem na página pública. A disponibilidade da edição depende das permissões da conta.
          </div>
          <p className="mt-3 text-[11px] text-[hsl(var(--dashboard-muted))]">
            Para atualizar contatos e redes sociais, utilize a seção Canais de contato abaixo.
          </p>
        </section>

        <aside className="h-fit min-w-0 overflow-hidden rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))]" aria-label="Sobre as informações da empresa">
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-[hsl(var(--dashboard-ink))]">Sobre estas informações</h4>
            <p className="mt-2 text-xs leading-[19px] text-[hsl(var(--dashboard-muted))]">
              Os dados ajudam compradores a identificar a empresa e entender seus serviços antes de entrar em contato.
            </p>
          </div>
          <div className="border-t border-[hsl(var(--dashboard-border))] px-5 py-3">
            <button
              type="button"
              onClick={() => onEdit('profile')}
              className="text-left text-xs font-semibold text-[hsl(var(--dashboard-accent))] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--dashboard-accent))]"
            >
              Atualizar informações do perfil
            </button>
          </div>
        </aside>
      </div>

      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}>
        <DialogContent
          fallbackTitle={null}
          hideCloseButton
          className="!flex max-h-[min(88dvh,810px)] w-[calc(100vw-24px)] !max-w-[760px] !flex-col !gap-0 !overflow-hidden rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] !p-0 shadow-lg"
          data-testid="seller-information-dialog"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-[hsl(var(--dashboard-border))] px-5 py-4 text-left sm:px-8">
            <DialogTitle className="text-xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
              {editorMode === 'profile' ? 'Editar informações da empresa' : 'Editar canais de contato'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[hsl(var(--dashboard-muted))]">
              Os campos editados seguem as mesmas regras de salvamento e revisão do Avalia Solar.
            </DialogDescription>
          </DialogHeader>
          <form
            id="seller-information-form"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              if (!saving) void onSave();
            }}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8" data-testid="seller-information-form-fields">
              {editorMode === 'profile' ? (
                <>
                  <label className="block space-y-1.5 text-xs font-medium text-[hsl(var(--dashboard-ink))]">
                    <span>URL da página pública no Avalia Solar</span>
                    <input value={publicProfileUrl ?? 'Gerada automaticamente'} readOnly className={`${editorInputClass} cursor-not-allowed opacity-60`} />
                    <span className="block text-[11px] font-normal text-[hsl(var(--dashboard-muted))]">O endereço do perfil é administrado pela plataforma.</span>
                  </label>
                  <EditableField label="Nome da empresa" value={draftData.name} onChange={(v) => onFieldChange('name', v)} />
                  <EditableField label="Site oficial" placeholder="https://empresa.com.br" value={draftData.website} onChange={(v) => onFieldChange('website', v)} />
                  <EditableField label="CNPJ" value={draftData.cnpj} onChange={(v) => onFieldChange('cnpj', v)} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <EditableField label="Ano de fundação" type="number" value={draftData.founded_year} onChange={(v) => numberChange('founded_year', v)} />
                    <EditableField label="Número de colaboradores" type="number" min={0} value={draftData.employees_count} onChange={(v) => numberChange('employees_count', v)} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <EditableField label="Cidade da sede" value={draftData.city} onChange={(v) => onFieldChange('city', v)} />
                    <EditableField label="UF da sede" value={draftData.state} onChange={(v) => onFieldChange('state', v.toUpperCase().slice(0, 2))} placeholder="SC" />
                  </div>
                  <label className="block space-y-1.5 text-xs font-medium text-[hsl(var(--dashboard-ink))]">
                    <span>Descrição da empresa</span>
                    <textarea
                      rows={4}
                      value={draftData.description ?? ''}
                      onChange={(event) => onFieldChange('description', event.target.value)}
                      className={`${editorInputClass} h-auto min-h-[100px] resize-y py-3`}
                    />
                  </label>
                </>
              ) : (
                <>
                  <EditableField label="Telefone" type="tel" value={draftData.phone} onChange={(v) => onFieldChange('phone', v)} />
                  <EditableField label="WhatsApp" type="tel" value={draftData.whatsapp} onChange={(v) => onFieldChange('whatsapp', v)} />
                  <EditableField label="E-mail público" type="email" value={draftData.email_public} onChange={(v) => onFieldChange('email_public', v)} />
                  <EditableField label="Website" value={draftData.website} onChange={(v) => onFieldChange('website', v)} />
                  <EditableField label="LinkedIn" value={draftData.linkedin} onChange={(v) => onFieldChange('linkedin', v)} />
                  <EditableField label="Instagram" value={draftData.instagram} onChange={(v) => onFieldChange('instagram', v)} />
                  <EditableField label="Facebook" value={draftData.facebook} onChange={(v) => onFieldChange('facebook', v)} />
                </>
              )}
            </div>
            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-5 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => onEditorOpenChange(false)}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-4 text-xs font-semibold text-[hsl(var(--dashboard-ink))] transition-colors hover:bg-[hsl(var(--dashboard-panel))] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 text-xs font-semibold text-white transition-colors hover:bg-[hsl(var(--dashboard-accent))/0.9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--dashboard-accent))] disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
