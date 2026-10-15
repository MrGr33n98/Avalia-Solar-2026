'use client';

import { useState } from 'react';
import { Power, Shield, Database, Lock, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { companyDashboardApi, type ProspectsWorkspaceResponse } from '@/lib/api';

interface Props {
  data: ProspectsWorkspaceResponse;
  companyId: string | number;
  onRefresh: () => void;
}

export default function ProspectsSettingsTab({ data, companyId, onRefresh }: Props) {
  const { tag_info } = data;
  const [isActive, setIsActive] = useState(tag_info.active ?? true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const handleToggleActive = async (checked: boolean) => {
    setIsUpdating(true);
    setUpdateMessage(null);
    try {
      await companyDashboardApi.updateProspectsSettings(companyId, {
        active: checked,
      });
      setIsActive(checked);
      setUpdateMessage(checked ? 'Tag de rastreamento ativada com sucesso.' : 'Tag de rastreamento pausada com sucesso.');
      onRefresh();
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar status da tag:', err);
      setUpdateMessage('Erro ao atualizar configuração.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Switch de Ativação Geral */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
              <Power className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
                  Status de Rastreamento da Tag
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isActive
                      ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                      : 'border-slate-500/30 text-slate-500 bg-slate-500/10'
                  }
                >
                  {isActive ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                {isActive
                  ? 'A Tag Parceira está autorizada a processar eventos e chegadas atribuídas ao seu domínio.'
                  : 'O rastreamento está desativado no servidor. Novos eventos enviados pelo snippet serão ignorados.'}
              </p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleActive}
            disabled={isUpdating}
            aria-label="Ativar ou pausar rastreamento da tag"
          />
        </div>

        {updateMessage && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {updateMessage}
          </p>
        )}
      </section>

      {/* Governança e Retenção de Dados */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Retenção */}
        <article className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--dashboard-ink))]">
            <Database className="h-4 w-4 text-blue-600" />
            Política de Retenção de Dados
          </div>
          <ul className="text-xs text-[hsl(var(--dashboard-muted))] space-y-2 leading-relaxed">
            <li>
              <strong>Eventos e Sessões Brutas:</strong> Mantidos por <strong>90 dias</strong> no cluster operacional antes da consolidação em métricas históricas diárias.
            </li>
            <li>
              <strong>Sessões com Consentimento Pendente:</strong> Descartadas e expurgadas automaticamente após <strong>30 dias</strong> se nenhum consentimento for manifestado.
            </li>
            <li>
              <strong>Tokens de Clique:</strong> Time-to-Live (TTL) estrito de <strong>30 dias</strong>.
            </li>
          </ul>
        </article>

        {/* Privacidade e LGPD */}
        <article className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--dashboard-ink))]">
            <Shield className="h-4 w-4 text-emerald-600" />
            Conformidade de Privacidade (LGPD)
          </div>
          <ul className="text-xs text-[hsl(var(--dashboard-muted))] space-y-2 leading-relaxed">
            <li>
              <strong>Consent-Aware por Padrão:</strong> A tag suspende armazenamento e despacho até a confirmação de consentimento pelo usuário ou CMP.
            </li>
            <li>
              <strong>Revogação Imediata:</strong> Chamadas a <code className="font-mono text-[11px]">avaliaTrack.revokeConsent()</code> expurgam identificadores locais no navegador.
            </li>
            <li>
              <strong>Zero Captura de PII:</strong> Campos de formulário, nomes, e-mails e telefones são rejeitados pelo sanitizador estrutural do servidor.
            </li>
          </ul>
        </article>
      </div>

      {/* Isolamento Criptográfico */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--dashboard-ink))]">
          <Lock className="h-4 w-4 text-purple-600" />
          Segurança Criptográfica e Multi-Tenant
        </div>
        <p className="text-xs text-[hsl(var(--dashboard-muted))] leading-relaxed">
          O parâmetro <code className="font-mono text-xs">as_click_id</code> é assinado com chave HMAC-SHA256 do servidor do Avalia Solar.
          Mesmo em posse de um token válido emitido para outra empresa, a política Pundit e o validador de tenant no Rails impedem que um clique pertença a outro perfil. Tentativas de injeção e adulteração são bloqueadas e registradas em auditoria.
        </p>
      </section>
    </div>
  );
}
