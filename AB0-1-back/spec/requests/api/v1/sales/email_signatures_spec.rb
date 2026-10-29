# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::EmailSignatures', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company, role: 'admin') }

  before do
    allow_any_instance_of(Api::V1::Sales::BaseController).to receive(:authenticate_sales_user!).and_return(true)
    allow_any_instance_of(Api::V1::Sales::BaseController).to receive(:current_user).and_return(user)
    allow_any_instance_of(Api::V1::Sales::BaseController).to receive(:current_company).and_return(company)
  end

  describe 'POST /api/v1/sales/email_signatures' do
    it 'persiste settings estruturados e normaliza o HTML V3 com WhatsApp responsivo .button2 e largura fluida' do
      raw_html = Sales::EmailSignature.build_v2_html(
        full_name: 'Felipe Henrique',
        role_title: 'Fundador do Avalia Solar',
        email: 'felipe@avaliasolar.com.br',
        phone: '(65) 99346-5055'
      )

      post '/api/v1/sales/email_signatures', params: {
        signature: {
          name: 'Assinatura V3 Oficial',
          body_html: raw_html,
          is_default: true,
          settings: {
            full_name: 'Felipe Henrique',
            role_title: 'Fundador do Avalia Solar',
            email: 'felipe@avaliasolar.com.br',
            phone: '(65) 99346-5055'
          }
        }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('signature', 'fields', 'phone')).to eq('(65) 99346-5055')
      expect(json.dig('signature', 'body_html')).to include('https://wa.me/5565993465055')
      expect(json.dig('signature', 'body_html')).to include('(65) 99346-5055</span>')
      expect(json.dig('signature', 'body_html')).to include('max-width:480px')
      expect(json.dig('signature', 'body_html')).to include('width="76"')
      expect(json.dig('signature', 'body_html')).to include('WhatsApp</span>')
    end
  end
end
