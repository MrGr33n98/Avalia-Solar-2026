'use client';

import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  Check,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  RotateCw,
  Send,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PersonListItem } from '../PeopleTable';

interface PeopleCardViewProps {
  contacts: PersonListItem[];
  loading: boolean;
  error: string | null;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEmailContact?: (contact: PersonListItem) => void;
  onRetry?: () => void;
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-800 border-sky-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-rose-100 text-rose-800 border-rose-300',
  'bg-purple-100 text-purple-800 border-purple-300',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const DECISION_ROLE_LABELS: Record<string, { label: string; class: string }> = {
  economic_buyer: { label: 'Comprador Econômico', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  champion: { label: 'Champion / Promotor', class: 'bg-amber-50 text-amber-800 border-amber-200' },
  technical_buyer: { label: 'Avaliador Técnico', class: 'bg-sky-50 text-sky-800 border-sky-200' },
  decision_maker: { label: 'Decisor Final', class: 'bg-purple-50 text-purple-800 border-purple-200' },
  influencer: { label: 'Influenciador', class: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function PeopleCardView({
  contacts,
  loading,
  error,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEmailContact,
  onRetry,
}: PeopleCardViewProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2 w-1/3 hidden md:block">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
            <div className="flex gap-2 w-1/4 justify-end">
              <div className="h-8 w-16 bg-slate-200 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Erro ao carregar pessoas</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="bg-white text-red-800 border-red-300 text-xs"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" /> Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Nenhuma pessoa encontrada</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Tente ajustar os filtros da barra lateral ou limpe a busca para visualizar mais decisores.
        </p>
      </div>
    );
  }

  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  return (
    <div className="space-y-2.5 font-sans">
      {/* Top Select All Row */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-600">
        <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 accent-sky-500"
          />
          <span>
            {selectedIds.length > 0
              ? `${selectedIds.length} selecionado(s) de ${contacts.length}`
              : `Selecionar todos (${contacts.length})`}
          </span>
        </label>
        <span className="text-[11px] text-slate-400">Layout Prospecting Card (Nutshell Bento)</span>
      </div>

      {/* Cards List */}
      <div className="space-y-2">
        {contacts.map((contact) => {
          const isSelected = selectedIds.includes(contact.id);
          const initials = getInitials(contact.name);
          const colorClass = getAvatarColor(contact.name);
          const roleConfig = contact.decision_role ? DECISION_ROLE_LABELS[contact.decision_role] : null;

          const locationString = [contact.account_city, contact.account_state].filter(Boolean).join(', ');
          const hasPhoneOrWa = Boolean(contact.phone || contact.whatsapp);

          return (
            <div
              key={contact.id}
              className={`bg-white border transition-all rounded-lg p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 shadow-2xs hover:shadow-xs hover:border-sky-300 ${
                isSelected ? 'border-sky-400 bg-sky-50/30 ring-1 ring-sky-300' : 'border-slate-200'
              }`}
            >
              {/* Left Column: Checkbox, Avatar, Person Details */}
              <div className="flex items-start sm:items-center gap-3 min-w-0 lg:w-[35%]">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(contact.id)}
                  className="mt-1 sm:mt-0 h-4 w-4 rounded border-slate-300 text-sky-600 accent-sky-500 shrink-0 cursor-pointer"
                />

                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 select-none ${colorClass}`}
                >
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/sales/contacts/${contact.id}`}
                      className="font-bold text-slate-900 text-sm hover:text-sky-600 hover:underline truncate"
                    >
                      {contact.name}
                    </Link>
                    {roleConfig && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${roleConfig.class}`}
                      >
                        {roleConfig.label}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                    {contact.job_title || 'Cargo não informado'}
                  </p>
                </div>
              </div>

              {/* Middle Column: Company & Organization Metadata */}
              <div className="min-w-0 lg:w-[35%] space-y-1 pl-7 sm:pl-13 lg:pl-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {contact.sales_account_id ? (
                    <Link
                      href={`/sales/accounts/${contact.sales_account_id}`}
                      className="font-bold text-slate-800 text-xs hover:text-sky-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.account_name || 'Conta sem nome'}</span>
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-700 text-xs flex items-center gap-1 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.account_name || 'Autônomo / Sem conta'}</span>
                    </span>
                  )}

                  {contact.account_website && (
                    <a
                      href={
                        contact.account_website.startsWith('http')
                          ? contact.account_website
                          : `https://${contact.account_website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-sky-600"
                      title={contact.account_website}
                    >
                      <Globe className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  {locationString && (
                    <span className="flex items-center gap-1" title="Localização">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{locationString}</span>
                    </span>
                  )}

                  {contact.account_segment && (
                    <span className="flex items-center gap-1" title="Segmento">
                      <span className="text-amber-500 font-bold">⚡</span>
                      <span className="truncate">{contact.account_segment}</span>
                    </span>
                  )}

                  {contact.account_company_size && (
                    <span className="flex items-center gap-1 text-slate-400" title="Porte da empresa">
                      <Users className="w-3 h-3" />
                      <span>{contact.account_company_size}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Channels Status & Quick Outreach Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100 pl-7 sm:pl-0">
                {/* Channel Indicators (Nutshell Style: Checkmark + Icon) */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md">
                  {/* Email Status */}
                  <div
                    title={contact.email ? `E-mail: ${contact.email}` : 'E-mail não disponível'}
                    className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      contact.email
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                        : 'text-slate-300 opacity-60'
                    }`}
                  >
                    {contact.email && <Check className="w-3 h-3 stroke-[3]" />}
                    <Mail className="w-3.5 h-3.5" />
                  </div>

                  {/* Phone / Whatsapp Status */}
                  <div
                    title={
                      hasPhoneOrWa
                        ? `Telefone: ${contact.phone || contact.whatsapp}`
                        : 'Telefone não disponível'
                    }
                    className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      hasPhoneOrWa
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                        : 'text-slate-300 opacity-60'
                    }`}
                  >
                    {hasPhoneOrWa && <Check className="w-3 h-3 stroke-[3]" />}
                    <Phone className="w-3.5 h-3.5" />
                  </div>

                  {/* LinkedIn Status */}
                  {contact.linkedin_url ? (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir perfil no LinkedIn"
                      className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div
                      title="LinkedIn não disponível"
                      className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded text-slate-300 opacity-60"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEmailContact && onEmailContact(contact)}
                  className="h-8 text-xs font-semibold bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-800"
                >
                  <Send className="w-3 h-3 mr-1.5 text-sky-600" />
                  E-mail
                </Button>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 text-xs">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/sales/contacts/${contact.id}`}>Ver Perfil Completo</Link>
                    </DropdownMenuItem>
                    {contact.sales_account_id && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/sales/accounts/${contact.sales_account_id}`}>
                          Ver Empresa ({contact.account_name})
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {contact.whatsapp && (
                      <DropdownMenuItem asChild className="cursor-pointer font-medium text-emerald-700">
                        <a
                          href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-2" /> Iniciar WhatsApp
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEmailContact && onEmailContact(contact)}
                      className="cursor-pointer font-bold text-sky-800"
                    >
                      <Send className="w-3.5 h-3.5 mr-2" /> Disparar E-mail 1-to-1
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
