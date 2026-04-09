# frozen_string_literal: true

require 'net/http'
require 'json'

# ============================================================
# SlackNotificationService
#
# Roteamento por canal via ENV vars separadas:
#
#   SLACK_WEBHOOK_URL           → fallback geral (avalia-solar-geral)
#   SLACK_LEADS_WEBHOOK_URL     → #leads
#   SLACK_REVIEWS_WEBHOOK_URL   → #reviews
#   SLACK_EMPRESAS_WEBHOOK_URL  → #avalia-solar-geral (novas empresas, acessos)
#   SLACK_ALERTAS_WEBHOOK_URL   → #critical (alertas internos, SYNC)
#
# Se a ENV específica não estiver definida, cai no SLACK_WEBHOOK_URL.
# ============================================================
class SlackNotificationService
  WEBHOOKS = {
    leads:    -> { ENV.fetch('SLACK_LEADS_WEBHOOK_URL',    ENV.fetch('SLACK_WEBHOOK_URL', nil)) },
    reviews:  -> { ENV.fetch('SLACK_REVIEWS_WEBHOOK_URL',  ENV.fetch('SLACK_WEBHOOK_URL', nil)) },
    empresas: -> { ENV.fetch('SLACK_EMPRESAS_WEBHOOK_URL', ENV.fetch('SLACK_WEBHOOK_URL', nil)) },
    alertas:  -> { ENV.fetch('SLACK_ALERTAS_WEBHOOK_URL',  ENV.fetch('SLACK_WEBHOOK_URL', nil)) },
    vendas_intent: -> { ENV.fetch('SLACK_VENDAS_INTENT_WEBHOOK_URL', ENV.fetch('SLACK_WEBHOOK_URL', nil)) }
  }.freeze

  # ----------------------------------------------------------
  # INTERFACE PÚBLICA
  # ----------------------------------------------------------

  # 🆕 Novo Lead
  def self.notify_lead(lead)
    message = '🆕 *Novo Lead Recebido!*'
    attachments = [
      {
        color: '#36a64f',
        fields: [
          { title: 'Nome',      value: lead.name,             short: true },
          { title: 'Email',     value: lead.email,            short: true },
          { title: 'Telefone',  value: lead.phone,            short: true },
          { title: 'Vertical',  value: lead.product_vertical, short: true },
          { title: 'Projeto',   value: lead.project_profile,  short: true },
          { title: 'Endereço',  value: lead.address_full,     short: false }
        ],
        footer: "Lead ID: #{lead.id}"
      }
    ]
    notify(message, attachments, channel: :leads)
  end

  # ⭐ Nova Review (pendente — aguardando moderação)
  def self.notify_review(review)
    stars = '⭐' * review.rating.to_i
    message = '⭐ *Nova Avaliação Recebida — Aguardando Moderação*'
    attachments = [
      {
        color: '#ffcc00',
        fields: [
          { title: 'Empresa',    value: review.company.name,          short: true },
          { title: 'Usuário',    value: review.user.name,             short: true },
          { title: 'Nota',       value: "#{stars} (#{review.rating}/5)", short: true },
          { title: 'Status',     value: '⏳ Pendente',                 short: true },
          { title: 'Comentário', value: review.comment.truncate(300), short: false }
        ],
        footer: "Review ID: #{review.id} | #{review.created_at.strftime('%d/%m/%Y %H:%M')}"
      }
    ]
    notify(message, attachments, channel: :reviews)
  end

  # ✅ Review Aprovada
  def self.notify_review_approved(review, admin_user: nil, notes: nil)
    stars = '⭐' * review.rating.to_i
    message = '✅ *Avaliação Aprovada*'
    fields = [
      { title: 'Empresa',   value: review.company.name,             short: true },
      { title: 'Usuário',   value: review.user.name,                short: true },
      { title: 'Nota',      value: "#{stars} (#{review.rating}/5)", short: true },
      { title: 'Aprovado por', value: admin_user&.email || 'Sistema', short: true }
    ]
    fields << { title: 'Notas do Admin', value: notes, short: false } if notes.present?

    attachments = [{ color: '#2eb886', fields: fields, footer: "Review ID: #{review.id}" }]
    notify(message, attachments, channel: :reviews)
  end

  # ❌ Review Reprovada
  def self.notify_review_rejected(review, admin_user: nil, notes: nil)
    message = '❌ *Avaliação Reprovada*'
    fields = [
      { title: 'Empresa',     value: review.company.name,             short: true },
      { title: 'Usuário',     value: review.user.name,                short: true },
      { title: 'Nota',        value: "#{review.rating}/5",            short: true },
      { title: 'Reprovado por', value: admin_user&.email || 'Sistema', short: true }
    ]
    fields << { title: 'Motivo / Notas', value: notes, short: false } if notes.present?

    attachments = [{ color: '#e74c3c', fields: fields, footer: "Review ID: #{review.id}" }]
    notify(message, attachments, channel: :reviews)
  end

  # 🏢 Nova Solicitação de Acesso a Empresa
  def self.notify_company_access_request(request)
    message = '🏢 *Nova Solicitação de Acesso a Empresa!*'
    attachments = [
      {
        color: '#439FE0',
        fields: [
          { title: 'Empresa',   value: request.company.name,  short: true },
          { title: 'Usuário',   value: request.user.name,     short: true },
          { title: 'Email',     value: request.user.email,    short: true },
          { title: 'Mensagem',  value: request.message,       short: false }
        ],
        footer: "Request ID: #{request.id}"
      }
    ]
    notify(message, attachments, channel: :empresas)
  end

  # ✅ Acesso a Empresa Aprovado
  def self.notify_company_access_approved(request)
    message = '✅ *Solicitação de Acesso Aprovada!*'
    attachments = [
      {
        color: '#2eb886',
        fields: [
          { title: 'Empresa',     value: request.company.name,                                     short: true },
          { title: 'Usuário',     value: request.user.name,                                        short: true },
          { title: 'Aprovado por', value: request.reviewed_by_admin_user&.email || 'Sistema',      short: true }
        ],
        footer: "Request ID: #{request.id}"
      }
    ]
    notify(message, attachments, channel: :empresas)
  end

  # 👤 Novo Membro Designado
  def self.notify_member_assigned(member)
    message = '👤 *Novo Membro Designado!*'
    attachments = [
      {
        color: '#9b59b6',
        fields: [
          { title: 'Empresa', value: member.company.name,    short: true },
          { title: 'Usuário', value: member.user.name,       short: true },
          { title: 'Papel',   value: member.role.capitalize, short: true },
          { title: 'Status',  value: member.status.capitalize, short: true }
        ],
        footer: "Member ID: #{member.id}"
      }
    ]
    notify(message, attachments, channel: :empresas)
  end

  # 🚨 Alerta Crítico de Reconciliação de Analytics (sempre SÍNCRONO)
  def self.notify_reconciliation_alert(reconciliation)
    message = '🚨 *ALERTA CRÍTICO: Reconciliação de Analytics*'
    attachments = [
      {
        color: '#e74c3c',
        title: "Discrepância detectada no dia #{reconciliation.day}",
        fields: [
          { title: 'Empresa',          value: reconciliation.company&.name || "ID: #{reconciliation.company_id}", short: true },
          { title: 'Métrica',          value: reconciliation.metric_name.upcase,                                  short: true },
          { title: 'Canônico (Stats)', value: reconciliation.canonical_value.to_s,                                short: true },
          { title: 'Observado (Logs)', value: reconciliation.observed_value.to_s,                                 short: true },
          { title: 'Desvio Absoluto',  value: reconciliation.delta_abs.to_s,                                      short: true },
          { title: 'Desvio %',         value: "#{reconciliation.delta_percent}%",                                 short: true }
        ],
        footer: "Reconciliation ID: #{reconciliation.id}"
      }
    ]
    notify(message, attachments, channel: :alertas, synchronous: true)
  end

  # 🔥 Mudança de Intent (Lead Esquenta)
  def self.notify_intent_change(score)
    message = "🔥 *INTENT ALERT: Lead atingiu #{score.intent_level.upcase}*"
    
    # Prepara lead name. Se lead id existir, tenta usar do objeto, se for anônimo trata.
    lead_identifier = score.lead_id ? "Lead ID #{score.lead_id}" : "Anônimo (ID #{score.anonymous_id})"
    
    attachments = [
      {
        color: '#ff4500',
        fields: [
          { title: 'Nível',       value: "#{score.thermometer_emoji} #{score.intent_level.upcase}", short: true },
          { title: 'Pontuação',   value: "#{score.total_score} pts",             short: true },
          { title: 'Empresa',     value: score.company&.name || 'Desconhecida',  short: true },
          { title: 'Visitante',   value: lead_identifier,                        short: true },
          { title: 'Ação Recomendada', value: score.recommended_action || 'Contatar rapidamente', short: false },
          { title: 'SLA Window',  value: score.sla_window || 'N/A',              short: true }
        ],
        footer: "Intent Score ID: #{score.id}"
      }
    ]
    notify(message, attachments, channel: :vendas_intent)
  end

  # ----------------------------------------------------------
  # PRIMITIVA GENÉRICA (uso interno e utilitário)
  # ----------------------------------------------------------
  def self.notify(message, attachments = [], channel: nil, synchronous: false)
    webhook_url = resolve_webhook(channel)

    if webhook_url.blank?
      Rails.logger.warn('[SlackNotificationService] Nenhum webhook configurado. Defina SLACK_WEBHOOK_URL.')
      return
    end

    payload = { text: message, attachments: attachments }

    send_request = lambda do
      uri = URI(webhook_url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
      request.body = payload.to_json

      response = http.request(request)
      unless response.is_a?(Net::HTTPSuccess)
        Rails.logger.error("[SlackNotificationService] Erro na API Slack (canal=#{channel}): #{response.code} - #{response.body}")
      end
      response
    rescue StandardError => e
      Rails.logger.error("[SlackNotificationService] Falha ao enviar notificação (canal=#{channel}): #{e.message}")
      nil
    end

    synchronous ? send_request.call : Thread.new { send_request.call }
  end

  # ----------------------------------------------------------
  private_class_method def self.resolve_webhook(channel)
    return WEBHOOKS[channel]&.call if channel && WEBHOOKS.key?(channel)

    ENV.fetch('SLACK_WEBHOOK_URL', nil)
  end
end
