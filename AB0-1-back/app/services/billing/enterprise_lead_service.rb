module Billing
  class EnterpriseLeadService
    def initialize(company:, plan:, current_user:, params:)
      @company = company
      @plan    = plan
      @user    = current_user
      @params  = params
    end

    def call
      subscription = Billing::CompanySubscription.find_or_initialize_by(company: @company)
      subscription.plan = @plan
      subscription.status = 'enterprise_lead'

      notes = build_notes
      subscription.enterprise_notes = notes
      subscription.save!

      notify_slack(subscription)

      subscription
    end

    private

    def build_notes
      [
        "Enterprise Lead solicitado em #{Time.current.strftime('%d/%m/%Y %H:%M')}",
        "Solicitante: #{@user.name} (#{@user.email})",
        "Telefone Contato: #{@params[:phone_contact]}",
        "MRR Estimado: #{@params[:estimated_mrr]}",
        "Justificativa / Necessidades: #{@params[:justification]}"
      ].join("\n")
    end

    def notify_slack(subscription)
      message = '🏢 *Novo Lead Comercial Enterprise SaaS*'
      attachments = [
        {
          color: '#7C3AED', # roxo do premium / Enterprise
          fields: [
            { title: 'Empresa', value: @company.name, short: true },
            { title: 'Solicitante', value: "#{@user.name} (#{@user.email})", short: true },
            { title: 'Telefone Contato', value: @params[:phone_contact].to_s, short: true },
            { title: 'MRR Estimado', value: @params[:estimated_mrr].to_s, short: true },
            { title: 'Necessidades / Justificativa', value: @params[:justification].to_s, short: false }
          ],
          footer: "Subscription ID: #{subscription.id} | Company ID: #{@company.id}"
        }
      ]
      SlackNotificationService.notify(message, attachments, channel: :billing)
    end
  end
end
