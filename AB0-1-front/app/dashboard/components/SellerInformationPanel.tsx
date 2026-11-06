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

export type SellerEditorMode = 'profile' | 'contacts';

type SellerEditorField =
  | 'name'
  | 'website'
  | 'cnpj'
  | 'city'
  | 'state'
  | 'founded_year'
  | 'employees_count'
  | 'description'
  | 'phone'
  | 'whatsapp'
  | 'email_public'
  | 'instagram'
  | 'facebook'
  | 'linkedin';

export interface SellerPublicDetails {
  id?: string;
  slug?: string;
  name?: string;
  website?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  founded_year?: number;
  employees_count?: number;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email_public?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

interface SellerInformationPanelProps {
  company: SellerPublicDetails;
  draft: SellerPublicDetails | null;
  editorOpen: boolean;
  editorMode: SellerEditorMode;
  saving: boolean;
  refreshing: boolean;
  onEdit: (mode: SellerEditorMode) => void;
  onEditorOpenChange: (open: boolean) => void;
  onFieldChange: (field: SellerEditorField, value: string | number | undefined) => void;
  onSave: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

function fieldValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Não informado';
  return String(value);
}

function safeWebUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
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
      <dt className="text-[12px] font-semibold leading-4 text-[#45414f]">{label}</dt>
      <dd className="min-w-0 break-words text-[13px] leading-[19px] text-[#35323c]">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 text-[#5146b5] underline-offset-2 hover:underline"
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
  'block h-10 w-full rounded-[3px] border border-[#b9b8c0] bg-[#fafafa] px-3 text-[13px] text-[#24212b] outline-none transition placeholder:text-[#92909b] focus:border-[#5a4dc4] focus:bg-white focus:ring-1 focus:ring-[#5a4dc4]';

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
    <label className="block min-w-0 space-y-1.5 text-[12px] font-medium text-[#403d48]">
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
          className="min-w-0 rounded-[15px] border border-[#e3e3e8] bg-white px-5 py-5 shadow-none sm:px-6"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="seller-information-title" className="text-[21px] font-bold tracking-[-0.025em] text-[#24212b]">
                Informações da empresa
              </h3>
              <p className="mt-1 max-w-[650px] text-[12px] leading-[18px] text-[#696674]">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#594bbc] transition-colors hover:bg-[#f0edfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#594bbc]"
              >
                <Pencil className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={refreshing}
                aria-label="Atualizar informações da empresa"
                title="Atualizar informações"
                data-testid="seller-information-refresh"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#594bbc] transition-colors hover:bg-[#f0edfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#594bbc] disabled:opacity-50"
              >
                <RefreshCw className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
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

          <div className="mt-5 border-t border-[#eeeeef] pt-4">
            <h4 className="text-[12px] font-semibold text-[#45414f]">Descrição da empresa</h4>
            <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-[20px] text-[#35323c]">
              {fieldValue(company.description)}
            </p>
          </div>

          <div className="mt-5 rounded-[4px] border-l-[3px] border-[#0f62fe] bg-[#e5efff] px-4 py-3 text-[12px] leading-[19px] text-[#33415c]" role="note">
            As informações enviadas podem passar por revisão antes de aparecerem na página pública. A disponibilidade da edição depende das permissões da conta.
          </div>
          <p className="mt-3 text-[11px] text-[#777480]">
            Para atualizar contatos e redes sociais, utilize a seção Canais de contato abaixo.
          </p>
        </section>

        <aside className="h-fit min-w-0 overflow-hidden rounded-[14px] border border-[#dedbf0] bg-[#f0eef9]" aria-label="Sobre as informações da empresa">
          <div className="px-5 py-4">
            <h4 className="text-[13px] font-bold text-[#292335]">Sobre estas informações</h4>
            <p className="mt-2 text-[12px] leading-[19px] text-[#56516a]">
              Os dados ajudam compradores a identificar a empresa e entender seus serviços antes de entrar em contato.
            </p>
          </div>
          <div className="border-t border-[#dedbf0] px-5 py-3">
            <button
              type="button"
              onClick={() => onEdit('profile')}
              className="text-left text-[12px] font-semibold text-[#5146b5] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5146b5]"
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
          overlayClassName="bg-[#17151f]/60 backdrop-blur-[1px]"
          className="!flex max-h-[min(88dvh,810px)] w-[calc(100vw-24px)] !max-w-[760px] !flex-col !gap-0 !overflow-hidden !rounded-[4px] border-[#d8d7dc] !p-0 shadow-[0_22px_65px_rgba(19,16,31,.25)]"
          data-testid="seller-information-dialog"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-[#e9e8ed] px-5 py-4 text-left sm:px-8">
            <DialogTitle className="text-[21px] font-bold leading-7 tracking-[-.025em] text-[#28242f]">
              {editorMode === 'profile' ? 'Editar informações da empresa' : 'Editar canais de contato'}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#716c79]">
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
                  <label className="block space-y-1.5 text-[12px] font-medium text-[#403d48]">
                    <span>URL da página pública no Avalia Solar</span>
                    <input value={publicProfileUrl ?? 'Gerada automaticamente'} readOnly className={`${editorInputClass} cursor-not-allowed bg-[#f0f0f1] text-[#64616e]`} />
                    <span className="block text-[11px] font-normal text-[#85818c]">O endereço do perfil é administrado pela plataforma.</span>
                  </label>
                  <EditableField label="Nome da empresa" value={draftData.name} onChange={(v) => onFieldChange('name', v)} />
                  <EditableField label="Site oficial" type="url" placeholder="https://empresa.com.br" value={draftData.website} onChange={(v) => onFieldChange('website', v)} />
                  <EditableField label="CNPJ" value={draftData.cnpj} onChange={(v) => onFieldChange('cnpj', v)} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <EditableField label="Ano de fundação" type="number" min={1800} max={2100} value={draftData.founded_year} onChange={(v) => numberChange('founded_year', v)} />
                    <EditableField label="Número de colaboradores" type="number" min={0} value={draftData.employees_count} onChange={(v) => numberChange('employees_count', v)} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <EditableField label="Cidade da sede" value={draftData.city} onChange={(v) => onFieldChange('city', v)} />
                    <EditableField label="UF da sede" value={draftData.state} onChange={(v) => onFieldChange('state', v.toUpperCase().slice(0, 2))} placeholder="SC" />
                  </div>
                  <label className="block space-y-1.5 text-[12px] font-medium text-[#403d48]">
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
                  <EditableField label="Website" type="url" value={draftData.website} onChange={(v) => onFieldChange('website', v)} />
                  <EditableField label="LinkedIn" value={draftData.linkedin} onChange={(v) => onFieldChange('linkedin', v)} />
                  <EditableField label="Instagram" value={draftData.instagram} onChange={(v) => onFieldChange('instagram', v)} />
                  <EditableField label="Facebook" value={draftData.facebook} onChange={(v) => onFieldChange('facebook', v)} />
                </>
              )}
            </div>
            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-[#e9e8ed] bg-white px-5 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => onEditorOpenChange(false)}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6e3ed] bg-[#fafafa] px-5 text-[12px] font-semibold text-[#5347b4] transition-colors hover:bg-[#f0edfa] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#594bbc] px-5 text-[12px] font-semibold text-white transition-colors hover:bg-[#493da5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#594bbc] disabled:cursor-wait disabled:opacity-60"
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
