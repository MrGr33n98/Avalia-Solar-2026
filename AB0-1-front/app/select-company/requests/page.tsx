'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { companyAccessApi, type CompanyAccessPendingRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; badge: string }
> = {
  pending: {
    label: 'Em análise',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    badge: 'bg-amber-100 text-amber-700',
  },
  approved: {
    label: 'Aprovada',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    badge: 'bg-emerald-100 text-emerald-700',
  },
  rejected: {
    label: 'Não aprovada',
    color: 'text-red-600 bg-red-50 border-red-100',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    badge: 'bg-red-100 text-red-700',
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ─── Componente de card de solicitação ───────────────────────────────────────

function RequestCard({
  request,
  onCancel,
  onAccess,
  cancelling,
}: {
  request: CompanyAccessPendingRequest;
  onCancel: (id: number) => void;
  onAccess: (id: number) => void;
  cancelling: boolean;
}) {
  const cfg = getStatusConfig(request.status);

  return (
    <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${cfg.color}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0">
          {cfg.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">{request.company_name}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          {request.requested_at && (
            <p className="text-xs text-gray-400 mt-0.5">
              Enviado em {formatDate(request.requested_at)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {request.status === 'approved' && (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 text-xs"
            onClick={() => onAccess(request.company_id)}
          >
            Acessar painel
            <ChevronRight className="w-3 h-3" />
          </Button>
        )}
        {request.status === 'pending' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-500 hover:text-red-500 text-xs"
            onClick={() => onCancel(request.id)}
            disabled={cancelling}
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancelar'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<CompanyAccessPendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await companyAccessApi.context(
        { limit: 50 },
        { retries: 3, timeout: 15000, useClientCache: false }
      );
      setRequests(context?.pending_requests ?? []);
    } catch {
      setError('Não foi possível carregar as solicitações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await companyAccessApi.cancelRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silently fail — deixa o item na lista
    } finally {
      setCancellingId(null);
    }
  };

  const handleAccess = (companyId: number) => {
    router.push(`/select-company?access=${companyId}`);
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const rejected = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 flex items-start justify-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/select-company')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Acompanhar solicitações</h1>
            <p className="text-sm text-gray-500">Status das suas solicitações de acesso</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'Todas', count: requests.length },
            { label: 'Em análise', count: pending.length },
            { label: 'Aprovadas', count: approved.length },
            { label: 'Rejeitadas', count: rejected.length },
          ].map((tab) => (
            <div
              key={tab.label}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                ${tab.label === 'Todas' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs
                  ${tab.label === 'Todas' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Nenhuma solicitação enviada ainda.</p>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                onClick={() => router.push('/select-company')}
              >
                Buscar empresas
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onCancel={handleCancel}
                onAccess={handleAccess}
                cancelling={cancellingId === req.id}
              />
            ))}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => router.push('/select-company')}
          >
            Voltar para início
          </button>
        </div>
      </div>
    </div>
  );
}
