# frozen_string_literal: true

class LeadMailer < ApplicationMailer
  def notify_company_of_new_lead(lead, recipients)
    @lead = lead
    @company = lead.assigned_company
    @inbox_url = frontend_url("/dashboard/inbox?company_id=#{@company.id}&session_id=#{lead.chat_session_id}")
    @whatsapp_url = whatsapp_url(lead.phone, lead.name) if lead.phone.present?

    mail(to: recipients, subject: "Novo lead qualificado para #{@company.name}")
  end

  private

  def whatsapp_url(phone, name)
    digits = phone.to_s.gsub(/\D/, '')
    digits = "55#{digits}" unless digits.start_with?('55')
    message = "Olá #{name.presence || 'tudo bem'}! Recebi seu contato pelo Avalia Solar e gostaria de ajudar com seu projeto."
    "https://wa.me/#{digits}?text=#{ERB::Util.url_encode(message)}"
  end
end
