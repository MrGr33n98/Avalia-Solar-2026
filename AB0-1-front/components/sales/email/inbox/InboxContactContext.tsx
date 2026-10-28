'use client';

import Link from 'next/link';
import {
  User,
  Building2,
  Briefcase,
  ExternalLink,
  Mail,
  Link2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InboxThreadDetail } from '@/lib/api/sales/types';

interface InboxContactContextProps {
  thread: InboxThreadDetail;
  onClose?: () => void;
  onLinkOpportunity?: () => void;
}

export default function InboxContactContext({
  thread,
  onClose,
  onLinkOpportunity,
}: InboxContactContextProps) {
  const hasContact = Boolean(thread.contact_name || thread.sales_contact_id);
  const hasAccount = Boolean(thread.company_name || thread.sales_account_id);
  const hasOpportunity = Boolean(thread.opportunity_title || thread.sales_opportunity_id);

  return (
    <div className="w-80 border-l border-slate-200 bg-slate-50/60 p-4 space-y-4 overflow-y-auto shrink-0 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-[#0F62FE]" />
          Contexto CRM
        </h3>
        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Contact Card */}
      {hasContact ? (
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-sky-600" />
              Contato
            </span>
            {thread.sales_contact_id && (
              <Link
                href={`/dashboard/sales/people`}
                className="text-[10px] text-sky-600 hover:text-sky-800 flex items-center gap-0.5"
              >
                Abrir <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            <p className="font-semibold text-slate-900 text-[13px]">
              {thread.contact_name || 'Contato Sem Nome'}
            </p>
            {thread.sender_email && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{thread.sender_email}</span>
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Account Card */}
      {hasAccount ? (
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-600" />
              Empresa
            </span>
            {thread.sales_account_id && (
              <Link
                href={`/dashboard/sales/accounts`}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
              >
                Abrir <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <p className="font-semibold text-slate-900 text-[12px]">
              {thread.company_name}
            </p>
            <p className="text-[10px] text-slate-400">Conta Comercial Vinculada</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Opportunity Card */}
      {hasOpportunity ? (
        <Card className="border-sky-200 bg-sky-50/40 shadow-2xs">
          <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-sky-600" />
              Oportunidade
            </span>
            {thread.sales_opportunity_id && (
              <Link
                href={`/dashboard/sales/deals`}
                className="text-[10px] text-sky-700 hover:text-sky-900 flex items-center gap-0.5 font-medium"
              >
                Funil <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <p className="font-semibold text-slate-900 text-[12px]">
              {thread.opportunity_title}
            </p>
            {thread.opportunity_stage && (
              <Badge variant="outline" className="text-[10px] border-sky-300 bg-sky-100/60 text-sky-900">
                Fase: {thread.opportunity_stage}
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="p-3 bg-white border border-dashed border-slate-200 rounded-md text-center space-y-2">
          <p className="text-[11px] text-slate-500">
            Esta conversa não está vinculada a nenhuma oportunidade no funil.
          </p>
          {onLinkOpportunity && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLinkOpportunity}
              className="text-xs h-7 text-sky-700 border-sky-200 hover:bg-sky-50 w-full flex items-center justify-center gap-1.5"
            >
              <Link2 className="w-3 h-3" /> Vincular Oportunidade
            </Button>
          )}
        </div>
      )}

      {/* Assigned Agent Card */}
      <Card className="border-slate-200 bg-white shadow-2xs">
        <CardHeader className="p-3 pb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Responsável Interno
          </span>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-[11px] text-slate-600">
          {thread.assigned_user_name ? (
            <span className="font-medium text-slate-800">{thread.assigned_user_name}</span>
          ) : (
            <span className="text-slate-400 italic">Não atribuído</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
