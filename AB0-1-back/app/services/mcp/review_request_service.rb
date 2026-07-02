# frozen_string_literal: true

module Mcp
  class ReviewRequestService < BaseService
    def call
      company = authorized_company!
      form = company.review_forms.active.find_by(is_default: true) || company.review_forms.active.first
      form ||= company.review_forms.create!(
        name: 'Avaliação geral', public_title: "Avalie #{company.name}", form_type: 'general', is_default: true
      )
      base_url = ENV.fetch('FRONTEND_URL', 'https://www.avaliasolar.com.br').sub(%r{/$}, '')
      url = "#{base_url}#{form.public_path}"
      template = arguments[:message].presence || form.settings['whatsapp_message']

      { company_id: company.id, review_form_id: form.id, url: url, message: template.to_s.gsub('{{review_form_link}}', url) }
    end
  end
end
