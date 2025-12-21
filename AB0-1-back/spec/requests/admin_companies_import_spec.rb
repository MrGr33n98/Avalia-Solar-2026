require 'rails_helper'
require 'rack/test'

RSpec.describe 'Admin Companies CSV import', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.create!(
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  let!(:category) do
    Category.create!(name: 'Solar', description: 'Categoria de testes')
  end

  before do
    sign_in admin_user
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  it 'faz matching por CNPJ e email e força pending em status inválido' do
    company_by_cnpj = Company.create!(
      name: 'Empresa CNPJ',
      description: 'Descrição',
      email: 'contato@empresa.com',
      cnpj: '12345678000199',
      state: 'SP',
      city: 'São Paulo',
      status: 'pending'
    )

    company_by_email = Company.create!(
      name: 'Empresa Email',
      description: 'Descrição',
      email: 'email@empresa.com',
      state: 'SP',
      city: 'São Paulo',
      status: 'pending'
    )

    csv = <<~CSV
      name;cnpj;email;state;city;status;phone;categories
      Empresa Atualizada;12345678000199;cnpj@empresa.com;SP;São Paulo;active;11999999999;Solar
      Empresa Email Atualizada;;email@empresa.com;SP;São Paulo;invalido;11999999999;Solar
    CSV

    file = Tempfile.new(['companies', '.csv'])
    file.write(csv)
    file.rewind

    upload = Rack::Test::UploadedFile.new(file.path, 'text/csv')
    post '/admin/companies/import_csv', params: { csv_file: upload }

    file.close
    file.unlink

    expect(response).to have_http_status(:found)
    expect(company_by_cnpj.reload.name).to eq('Empresa Atualizada')
    expect(company_by_email.reload.name).to eq('Empresa Email Atualizada')
    expect(company_by_email.reload.status).to eq('pending')
  end
end
