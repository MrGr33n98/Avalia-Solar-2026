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

  it 'renders all 27 UFs ordered by acronym with sigla' do
    get '/admin/companies/new'
    expect(response).to have_http_status(:ok)

    doc = Nokogiri::HTML(response.body)
    values = doc.css('#company_state option').map { |o| o['value'].to_s }.reject(&:blank?)
    texts = doc.css('#company_state option').map { |o| o.text.to_s.strip }.reject(&:blank?)
    texts = texts.reject { |t| t == 'Selecione um estado' }

    states = Locations::BrLocations.states
    expected_values = states.map { |state| state['acronym'] }
    expected_texts = states.map { |state| "#{state['name']} (#{state['acronym']})" }

    expect(values).to eq(expected_values)
    expect(texts).to eq(expected_texts)
  end
end
