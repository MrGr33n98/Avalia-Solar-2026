'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Moon,
  Bot,
  User,
  Building2,
  Code2,
  Play,
  KeyRound,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ApprovalRequest,
  ApprovalPolicyInfo,
  ApprovalEvent,
  useApprovalDetail,
  useApprovalEvents,
} from '@/lib/api/mcp/approvals';

function formatSafeDate(d: any, fmt = "dd/MM/yyyy 'às' HH:mm:ss"): string {
  if (!d) return '--:--';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return '--:--';
  return format(parsed, fmt, { locale: ptBR });
}

interface ApprovalInspectorProps {
  requestUuid: string | null;
  onOpenApprove: (req: ApprovalRequest) => void;
  onOpenReject: (req: ApprovalRequest) => void;
  onOpenSnooze: (req: ApprovalRequest) => void;
  onExecute: (req: ApprovalRequest) => void;
  isExecuting?: boolean;
}

export function ApprovalInspector({
  requestUuid,
  onOpenApprove,
  onOpenReject,
  onOpenSnooze,
  onExecute,
  isExecuting,
}: ApprovalInspectorProps) {
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);

  const { data: detailData, isLoading, error } = useApprovalDetail(requestUuid);
  const { data: events = [] } = useApprovalEvents(requestUuid);

  if (!requestUuid) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
        <Bot className="w-12 h-12 text-slate-300 stroke-[1.2] mb-3" />
        <p className="text-sm font-semibold text-slate-700">Nenhuma solicitação selecionada</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Selecione uma solicitação da fila à esquerda para inspecionar parâmetros, impacto e revisar aprovação.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Carregando detalhes da solicitação de aprovação...</p>
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="h-full p-8 flex flex-col items-center justify-center text-center text-slate-500">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <p className="text-sm font-semibold text-slate-800">Falha ao carregar solicitação</p>
        <p className="text-xs text-slate-500 mt-1">Não foi possível recuperar os dados da aprovação.</p>
      </div>
    );
  }

  const req = detailData.data;
  const policy = detailData.policy;

  const copyDigest = () => {
    navigator.clipboard.writeText(req.payload_digest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  const getRiskBorder = (tier: string) => {
    switch (tier) {
      case 'r4':
        return 'border-rose-500 text-rose-700 bg-rose-50/40';
      case 'r3':
        return 'border-orange-500 text-orange-700 bg-orange-50/40';
      case 'r2':
        return 'border-amber-500 text-amber-700 bg-amber-50/40';
      default:
        return 'border-indigo-500 text-indigo-700 bg-indigo-50/40';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">{req.tool_name}</h2>
            <span
              className={cn(
                'text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider',
                getRiskBorder(req.risk_tier)
              )}
            >
              RISK {req.risk_tier.toUpperCase()}
            </span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                req.status === 'approved' && 'bg-emerald-100 text-emerald-800',
                req.status === 'executed' && 'bg-blue-100 text-blue-800',
                req.status === 'rejected' && 'bg-rose-100 text-rose-800',
                req.status === 'pending' && 'bg-amber-100 text-amber-800',
                req.status === 'expired' && 'bg-slate-100 text-slate-600'
              )}
            >
              {req.status}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>UUID: {req.request_uuid}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {req.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onOpenSnooze(req)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Moon className="w-3.5 h-3.5 text-slate-500" />
                Adiar
              </button>
              <button
                type="button"
                onClick={() => onOpenReject(req)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Rejeitar
              </button>
              <button
                type="button"
                onClick={() => onOpenApprove(req)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Aprovar Ação
              </button>
            </>
          )}

          {req.status === 'approved' && (
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => onExecute(req)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {isExecuting ? 'Executando...' : 'Executar Agora'}
            </button>
          )}
        </div>
      </div>

      {/* Main Body Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* WHY APPROVAL IS REQUIRED */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Por que esta ação requer aprovação humana (HITL)?
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {policy?.risk_policy?.level}: Esta ferramenta executa mutações com classificação{' '}
            <strong className="text-slate-900 font-mono">{req.risk_tier.toUpperCase()}</strong>. O sistema exige
            revisão explícita por operador autorizado antes do despacho.
          </p>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Requisito de aprovação: {policy?.who_can_approve}</span>
            <span>Efeito: {policy?.execution_policy?.effect_type}</span>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Agente Solicitante</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-900 font-mono">
              <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{req.agent_id}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresa / Tenant</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{req.tenant_name || (req.tenant_id ? `Tenant #${req.tenant_id}` : 'Global / Sistema')}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Usuário Solicitante</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{req.requester_name || 'Agente Autônomo'}</span>
            </div>
          </div>
        </div>

        {/* TIME & EXPIRATION */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Criado em</span>
            <span className="font-medium text-slate-800">{formatSafeDate(req.created_at)}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Expiração</span>
            <span className="font-medium text-slate-800">{formatSafeDate(req.expires_at)}</span>
          </div>

          {req.executed_at && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Executado em</span>
              <span className="font-medium text-emerald-700">{formatSafeDate(req.executed_at)}</span>
            </div>
          )}

          {req.execution_id && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution ID</span>
              <span className="font-mono text-slate-700 text-[11px]">{req.execution_id}</span>
            </div>
          )}
        </div>

        {/* CANONICAL PAYLOAD & ARGUMENTS */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-900">Parâmetros Canônicos Aprovados</span>
            </div>

            <button
              type="button"
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {showRawPayload ? 'Ver Resumo Estruturado' : 'Ver JSON Bruto'}
            </button>
          </div>

          <div className="p-4 text-xs">
            {showRawPayload ? (
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {JSON.stringify(req.parameters_payload, null, 2)}
              </pre>
            ) : (
              <div className="space-y-2">
                {Object.entries(req.parameters_payload || {}).length === 0 ? (
                  <p className="text-slate-400 italic">Nenhum parâmetro extra informado.</p>
                ) : (
                  Object.entries(req.parameters_payload || {}).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-100 gap-1">
                      <span className="font-mono font-semibold text-slate-700 text-[11px] shrink-0">{key}:</span>
                      <span className="font-mono text-slate-900 text-[11px] text-right break-all">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* CRYPTOGRAPHIC INTEGRITY BINDING */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>SHA-256 Digest:</span>
              <span className="font-mono font-bold text-slate-900">{req.payload_digest.slice(0, 16)}...</span>
            </div>

            <button
              type="button"
              onClick={copyDigest}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedDigest ? 'Copiado!' : 'Copiar Hash SHA-256'}
            </button>
          </div>
        </div>

        {/* TIMELINE OF EVENTS */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-slate-600" />
            Timeline de Auditoria e Eventos
          </div>

          {events.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">Nenhum evento adicional registrado.</p>
          ) : (
            <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {events.map((evt) => (
                <div key={evt.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{evt.event_type}</span>
                    <span className="text-[10px] text-slate-400">{formatSafeDate(evt.occurred_at, 'dd/MM HH:mm:ss')}</span>
                  </div>
                  {evt.payload && Object.keys(evt.payload).length > 0 && (
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">
                      {JSON.stringify(evt.payload)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
