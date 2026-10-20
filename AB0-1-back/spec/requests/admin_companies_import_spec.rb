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

  it 'importa com cabeçalhos capitalizados, delimitador vírgula e atributos ricos' do
    csv = <<~CSV
      Name,Description,Website,Phone,Cnpj,Email,State,City,Segment,Project types,Services offered,Status
      Solplanet Teste,Fabricante de inversores,https://solplanet.net,(11) 3141-3669,50.982.813/0001-00,teste@solplanet.net,SC,São José,supplier,"[""Residenciais"", ""Comerciais""]","[""Projeto"", ""Instalação""]",active
    CSV

    file = Tempfile.new(['companies_rich', '.csv'])
    file.write(csv)
    file.rewind

    upload = Rack::Test::UploadedFile.new(file.path, 'text/csv')
    post '/admin/companies/import_csv', params: { csv_file: upload }

    file.close
    file.unlink

    expect(response).to have_http_status(:found)
    imported = Company.find_by(cnpj: '50982813000100')
    expect(imported).to be_present
    expect(imported.name).to eq('Solplanet Teste')
    expect(imported.phone).to eq('1131413669')
    expect(imported.segment).to eq('supplier')
    expect(imported.project_types).to include('Residenciais', 'Comerciais')
    expect(imported.services_offered).to include('Projeto', 'Instalação')
    expect(imported.intent_tier).to eq('free')
  end

  it 'importa com a coluna Plan definida como planfree e vincula plano gratuito com seguranca' do
    csv = <<~CSV
      Name,Description,Website,Phone,Cnpj,Email,State,City,Segment,Plan,Status
      Solplanet Free,Fabricante de inversores,https://solplanet.net,(11) 3141-3669,50.982.813/0001-00,free@solplanet.net,SC,São José,supplier,planfree,active
    CSV

    file = Tempfile.new(['companies_free', '.csv'])
    file.write(csv)
    file.rewind

    upload = Rack::Test::UploadedFile.new(file.path, 'text/csv')
    post '/admin/companies/import_csv', params: { csv_file: upload }

    file.close
    file.unlink

    expect(response).to have_http_status(:found)
    imported = Company.find_by(cnpj: '50982813000100')
    expect(imported).to be_present
    expect(imported.intent_tier).to eq('free')
  end

  it 'redireciona com alerta e nao estoura erro 500 em caso de CSV com aspas quebradas' do
    broken_csv = "Name,Description\n\"Solplanet Quebrado,Sem fechar aspas"

    file = Tempfile.new(['companies_broken', '.csv'])
    file.write(broken_csv)
    file.rewind

    upload = Rack::Test::UploadedFile.new(file.path, 'text/csv')
    post '/admin/companies/import_csv', params: { csv_file: upload }

    file.close
    file.unlink

    expect(response).to have_http_status(:found)
    follow_redirect!
    expect(response.body).to include('Arquivo CSV com formatação inválida')
  end
end
