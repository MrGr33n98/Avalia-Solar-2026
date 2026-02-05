# frozen_string_literal: true

require 'net/http'
require 'json'

class SlackNotificationService
  def self.notify(message, attachments = [], synchronous: false)
    webhook_url = ENV['SLACK_WEBHOOK_URL']
    if webhook_url.blank?
      Rails.logger.warn("[SlackNotificationService] SLACK_WEBHOOK_URL is missing")
      return
    end

    payload = {
      text: message,
      attachments: attachments
    }

    send_request = -> do
      begin
        uri = URI(webhook_url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        
        request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
        request.body = payload.to_json
        
        response = http.request(request)
        unless response.is_a?(Net::HTTPSuccess)
          Rails.logger.error("[SlackNotificationService] Slack API error: #{response.code} - #{response.body}")
        end
        response
      rescue StandardError => e
        Rails.logger.error("[SlackNotificationService] Failed to send notification: #{e.message}")
        nil
      end
    end

    if synchronous
      send_request.call
    else
      Thread.new { send_request.call }
    end
  end

  def self.notify_lead(lead)
    message = "🆕 *Novo Lead Recebido!*"
    attachments = [
      {
        color: "#36a64f",
        fields: [
          { title: "Nome", value: lead.name, short: true },
          { title: "Email", value: lead.email, short: true },
          { title: "Telefone", value: lead.phone, short: true },
          { title: "Vertical", value: lead.product_vertical, short: true },
          { title: "Projeto", value: lead.project_profile, short: true },
          { title: "Endereço", value: lead.address_full, short: false }
        ],
        footer: "Lead ID: #{lead.id}"
      }
    ]
    notify(message, attachments)
  end

  def self.notify_review(review)
    message = "⭐ *Nova Avaliação Recebida!*"
    attachments = [
      {
        color: "#ffcc00",
        fields: [
          { title: "Empresa", value: review.company.name, short: true },
          { title: "Usuário", value: review.user.name, short: true },
          { title: "Nota", value: "#{review.rating} / 5", short: true },
          { title: "Comentário", value: review.comment, short: false }
        ],
        footer: "Review ID: #{review.id}"
      }
    ]
    notify(message, attachments)
  end

  def self.notify_company_access_request(request)
    message = "🏢 *Nova Solicitação de Acesso a Empresa!*"
    attachments = [
      {
        color: "#439FE0",
        fields: [
          { title: "Empresa", value: request.company.name, short: true },
          { title: "Usuário", value: request.user.name, short: true },
          { title: "Email", value: request.user.email, short: true },
          { title: "Mensagem", value: request.message, short: false }
        ],
        footer: "Request ID: #{request.id}"
      }
    ]
    notify(message, attachments)
  end

  def self.notify_company_access_approved(request)
    message = "✅ *Solicitação de Acesso Aprovada!*"
    attachments = [
      {
        color: "#2eb886",
        fields: [
          { title: "Empresa", value: request.company.name, short: true },
          { title: "Usuário", value: request.user.name, short: true },
          { title: "Aprovado por", value: request.reviewed_by_admin_user&.email || "Sistema", short: true }
        ],
        footer: "Request ID: #{request.id}"
      }
    ]
    notify(message, attachments)
  end

  def self.notify_member_assigned(member)
    message = "👤 *Novo Membro Designado!*"
    attachments = [
      {
        color: "#9b59b6",
        fields: [
          { title: "Empresa", value: member.company.name, short: true },
          { title: "Usuário", value: member.user.name, short: true },
          { title: "Papel", value: member.role.capitalize, short: true },
          { title: "Status", value: member.status.capitalize, short: true }
        ],
        footer: "Member ID: #{member.id}"
      }
    ]
    notify(message, attachments)
  end
end
