'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  PhoneCall,
  Plus,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { buildWhatsAppUrl } from '@/lib/phone';
import CallLoggerModal from '@/components/sales/CallLoggerModal';

type CommitteeMember = {
  id: number;
  sales_contact_id: number;
  name: string;
  job_title?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  role: 'decision_maker' | 'economic_buyer' | 'champion' | 'influencer' | 'technical_evaluator' | 'approver' | 'legal' | 'procurement' | 'user' | 'gatekeeper' | 'unknown';
  influence: 'low' | 'medium' | 'high';
  support_level: 'blocker' | 'negative' | 'neutral' | 'positive' | 'champion';
  is_primary?: boolean;
};

export default function BuyingCommitteeMap({
  opportunityId,
  members = [],
  onUpdate,
}: {
  opportunityId?: number;
  members?: CommitteeMember[];
  onUpdate?: () => void;
}) {
  const REQUIRED_ROLES = [
    { key: 'decision_maker', label: 'Decision Maker' },
    { key: 'economic_buyer', label: 'Economic Buyer' },
    { key: 'champion', label: 'Champion' },
    { key: 'approver', label: 'Approver / CFO' },
  ];

  const rolesPresent = members.map((m) => m.role);
  const coveredCount = REQUIRED_ROLES.filter((r) => rolesPresent.includes(r.key as any)).length;
  const coveragePercent = Math.round((coveredCount / REQUIRED_ROLES.length) * 100);

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-blue-900 font-bold text-white text-[10px]">
              Buying Committee Coverage
            </Badge>
            <span className="text-xs font-bold text-blue-950">{coveragePercent}% Coberto</span>
          </div>
          <CardTitle className="mt-1 text-sm font-bold text-slate-900">
            Comitê de Decisão da Oportunidade
          </CardTitle>
        </div>

        <Button size="sm" className="bg-blue-900 font-bold text-white text-xs hover:bg-blue-950">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Adicionar ao Comitê
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {/* Coverage Checklist */}
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Mapeamento de Cobertura Comercial:</span>
            <span className="text-blue-900">{coveredCount} / {REQUIRED_ROLES.length} papéis</span>
          </div>
          <Progress value={coveragePercent} className="h-2 bg-slate-200" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            {REQUIRED_ROLES.map((role) => {
              const hasRole = rolesPresent.includes(role.key as any);
              return (
                <div key={role.key} className="flex items-center gap-1.5 text-[11px]">
                  {hasRole ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-slate-300 inline-block" />
                  )}
                  <span className={hasRole ? 'font-bold text-slate-900' : 'text-slate-500'}>
                    {role.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Committee Members Grid */}
        {members.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-300 rounded-lg space-y-1">
            <Users className="mx-auto h-8 w-8 text-slate-400" />
            <p className="font-semibold text-slate-800">Comitê ainda não mapeado para esta oportunidade</p>
            <p className="text-[11px] text-slate-500">Mapeie o Decision Maker e o Champion para aumentar a probabilidade de fechamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 hover:border-blue-300 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{member.name}</p>
                    <p className="text-[11px] text-slate-500">{member.job_title || 'Cargo não especificado'}</p>
                  </div>
                  <Badge className="border-0 bg-blue-900 font-bold text-white text-[10px]">
                    {member.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] border-t border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Influência: <strong className="text-slate-800">{member.influence.toUpperCase()}</strong></span>
                  <span className="text-slate-500">Suporte: <strong className="text-emerald-700">{member.support_level.toUpperCase()}</strong></span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-0.5">
                  <CallLoggerModal
                    contactId={member.sales_contact_id}
                    contactName={member.name}
                    phone={member.phone || member.whatsapp}
                    onSuccess={onUpdate}
                  />
                  {member.whatsapp && (
                    <Button
                      size="sm"
                      onClick={() => window.open(buildWhatsAppUrl(member.whatsapp), '_blank')}
                      className="h-7 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[10px] px-2"
                    >
                      <MessageSquare className="mr-1 h-3 w-3" /> Whats
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
