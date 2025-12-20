require 'rails_helper'

RSpec.describe 'ActiveAdmin Company location selector', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.create!(
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  before do
    sign_in admin_user
  end

  it 'renders all 27 UFs ordered by name with sigla' do
    get '/admin/companies/new'
    expect(response).to have_http_status(:ok)

    doc = Nokogiri::HTML(response.body)
    values = doc.css('#company_state option').map { |o| o['value'].to_s }.reject(&:blank?)
    texts = doc.css('#company_state option').map { |o| o.text.to_s.strip }.reject(&:blank?)
    texts = texts.reject { |t| t == 'Selecione um estado' }

    expect(values).to match_array(
      %w[
        AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO
      ]
    )

    expect(texts).to eq(
      [
        'Acre (AC)',
        'Alagoas (AL)',
        'Amapá (AP)',
        'Amazonas (AM)',
        'Bahia (BA)',
        'Ceará (CE)',
        'Distrito Federal (DF)',
        'Espírito Santo (ES)',
        'Goiás (GO)',
        'Maranhão (MA)',
        'Mato Grosso (MT)',
        'Mato Grosso do Sul (MS)',
        'Minas Gerais (MG)',
        'Pará (PA)',
        'Paraíba (PB)',
        'Paraná (PR)',
        'Pernambuco (PE)',
        'Piauí (PI)',
        'Rio de Janeiro (RJ)',
        'Rio Grande do Norte (RN)',
        'Rio Grande do Sul (RS)',
        'Rondônia (RO)',
        'Roraima (RR)',
        'Santa Catarina (SC)',
        'São Paulo (SP)',
        'Sergipe (SE)',
        'Tocantins (TO)',
      ]
    )
  end
end

