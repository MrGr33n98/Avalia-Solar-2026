# frozen_string_literal: true

module Billing
  class SlackNotifier
    CHANNEL = :billing

    def self.alerts_enabled?
      ENV.fetch('BILLING_SLACK_ALERTS_ENABLED', 'true') == 'true'
    end

    # 1. Nova Assinatura Pro/SaaS
    def self.notify_new_subscription(company:, plan:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        "💳 *Nova Assinatura #{plan.name}*",
        [{
          color: '#2eb886',
          fields: [
            { title: 'Empresa',  value: company.name, short: true },
            { title: 'Plano',    value: plan.name, short: true },
            { title: 'Cidade',   value: "#{company.city}/#{company.state}", short: true },
            { title: 'Segmento', value: company.segment.to_s.capitalize, short: true }
          ],
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL
      )
    end

    # 2. Enterprise Marcado Manualmente
    def self.notify_enterprise_manual(company:, admin:, notes: nil)
      return unless alerts_enabled?

      fields = [
        { title: 'Empresa', value: company.name, short: true },
        { title: 'Admin',   value: admin.email, short: true }
      ]
      fields << { title: 'Motivo', value: notes, short: false } if notes.present?

      SlackNotificationService.notify(
        '🏢 *Enterprise Manual Ativado*',
        [{
          color: '#f59e0b',
          fields: fields,
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL,
        synchronous: true
      )
    end

    # 3. Pagamento Bem-Sucedido
    def self.notify_payment_succeeded(company:, amount_cents:, plan:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '✅ *Pagamento Confirmado*',
        [{
          color: '#2eb886',
          fields: [
            { title: 'Empresa', value: company.name, short: true },
            { title: 'Plano',   value: plan&.name || 'N/A', short: true },
            { title: 'Valor',   value: format_brl(amount_cents), short: true }
          ],
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL
      )
    end

    # 4. Pagamento Falhou
    def self.notify_payment_failed(company:, amount_cents:, decline_reason:, attempt_count: nil)
      return unless alerts_enabled?

      fields = [
        { title: 'Empresa', value: company.name, short: true },
        { title: 'Valor',   value: format_brl(amount_cents), short: true },
        { title: 'Motivo',  value: translate_decline_reason(decline_reason), short: true }
      ]
      fields << { title: 'Tentativa', value: "#{attempt_count}/4", short: true } if attempt_count

      SlackNotificationService.notify(
        '🚨 *Falha de Pagamento*',
        [{
          color: '#e74c3c',
          fields: fields,
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL,
        synchronous: true
      )
    end

    # 5. Assinatura Cancelada
    def self.notify_subscription_canceled(company:, plan:, reason:, period_end: nil)
      return unless alerts_enabled?

      fields = [
        { title: 'Empresa', value: company.name, short: true },
        { title: 'Plano',   value: plan&.name || 'N/A', short: true },
        { title: 'Motivo',  value: reason, short: true }
      ]
      fields << { title: 'Acesso até', value: period_end&.strftime('%d/%m/%Y'), short: true } if period_end

      SlackNotificationService.notify(
        '📤 *Assinatura Cancelada*',
        [{
          color: '#f59e0b',
          fields: fields,
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL
      )
    end

    # 6. Downgrade para Free
    def self.notify_force_downgrade(company:, admin:, reason:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '⬇️ *Downgrade para Free*',
        [{
          color: '#f59e0b',
          fields: [
            { title: 'Empresa', value: company.name, short: true },
            { title: 'De',      value: company.plan&.name || 'N/A', short: true },
            { title: 'Para',    value: 'Free', short: true },
            { title: 'Motivo',  value: reason, short: true },
            { title: 'Admin',   value: admin.respond_to?(:email) ? admin.email : admin.to_s, short: false }
          ],
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL,
        synchronous: true
      )
    end

    # 7. Assinatura Past Due
    def self.notify_subscription_past_due(company:, plan:, since:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '⚠️ *Assinatura Past Due*',
        [{
          color: '#e74c3c',
          fields: [
            { title: 'Empresa', value: company.name, short: true },
            { title: 'Plano',   value: plan&.name || 'N/A', short: true },
            { title: 'Desde',   value: since&.strftime('%d/%m/%Y %H:%M') || Time.current.strftime('%d/%m/%Y %H:%M'),
              short: true },
            { title: 'Ação',    value: 'Stripe fará retry automático', short: true }
          ],
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL,
        synchronous: true
      )
    end

    # 8. Webhook Stripe Inválido (Vai para #alertas)
    def self.notify_invalid_webhook(error:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '⚠️ *Webhook Stripe Inválido — Billing*',
        [{
          color: '#ff0000',
          fields: [
            { title: 'Erro', value: error, short: false },
            { title: 'Provider', value: 'Stripe (billing)', short: true },
            { title: 'Timestamp', value: Time.current.strftime('%d/%m/%Y %H:%M'), short: true }
          ],
          footer: 'Verificar STRIPE_BILLING_WEBHOOK_SECRET'
        }],
        channel: :alertas,
        synchronous: true
      )
    end

    # 9. Webhook Falhou no Processamento (Vai para #alertas)
    def self.notify_webhook_failed(event_type:, event_id:, error:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '💥 *Erro no Processamento de Webhook Billing*',
        [{
          color: '#ff0000',
          fields: [
            { title: 'Event Type', value: event_type, short: true },
            { title: 'Event ID',   value: event_id.to_s.last(12), short: true },
            { title: 'Erro',       value: error, short: false },
            { title: 'Ação necessária', value: 'Reprocessar manualmente no Admin', short: false }
          ],
          footer: "Billing System Failure | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: :alertas,
        synchronous: true
      )
    end

    # 10. Ação Administrativa Sensível
    def self.notify_admin_action(action_type:, company:, admin:, justification:, metadata: {})
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '👤 *Ação Admin Executada*',
        [{
          color: '#f59e0b',
          fields: [
            { title: 'Ação',          value: action_type, short: true },
            { title: 'Empresa',       value: company.name, short: true },
            { title: 'Admin',         value: admin.email, short: true },
            { title: 'Justificativa', value: justification, short: false }
          ],
          footer: "Company ID: #{company.id} | Metadata: #{metadata.to_json} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL,
        synchronous: true
      )
    end

    # 11. Divergência Stripe ↔ Banco (Vai para #alertas)
    def self.notify_reconciliation_divergence(company:, local_status:, local_period_end:, stripe_status:,
                                              stripe_period_end:)
      return unless alerts_enabled?

      SlackNotificationService.notify(
        '🔄 *Divergência Detectada: Stripe vs Banco*',
        [{
          color: '#e74c3c',
          fields: [
            { title: 'Empresa',       value: company.name, short: true },
            { title: 'Banco (local)',
              value: "status=#{local_status}, period_end=#{local_period_end&.strftime('%d/%m/%Y')}", short: false },
            { title: 'Stripe (live)',
              value: "status=#{stripe_status}, period_end=#{stripe_period_end&.strftime('%d/%m/%Y')}", short: false },
            { title: 'Ação necessária', value: 'Sincronizar via Admin ou investigar', short: false }
          ],
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: :alertas,
        synchronous: true
      )
    end

    # Helper format BRL
    def self.format_brl(cents)
      return 'R$ 0,00' if cents.nil? || cents.to_i.zero?

      "R$ #{format('%.2f', cents / 100.0)}".gsub('.', ',')
    end

    # Helper decline reasons
    def self.translate_decline_reason(code)
      {
        'insufficient_funds' => 'Saldo insuficiente',
        'card_declined' => 'Cartão recusado',
        'expired_card' => 'Cartão vencido',
        'incorrect_cvc' => 'CVC incorreto',
        'processing_error' => 'Erro de processamento',
        'do_not_honor' => 'Banco recusou sem motivo informado'
      }.fetch(code.to_s, code.to_s.humanize)
    end
  end
end
