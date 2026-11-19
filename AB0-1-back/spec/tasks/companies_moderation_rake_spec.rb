# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe 'companies:suspend_banking_entities', type: :task do
  let(:task) { Rake::Task['companies:suspend_banking_entities'] }

  before(:all) do
    Rails.application.load_tasks unless Rake::Task.task_defined?('companies:suspend_banking_entities')
  end

  before do
    task.reenable
  end

  let!(:bank_company_1) do
    create(:company,
           name: 'Banco Safra Test',
           slug: 'reso-comercio-engenharia-e-servicos-ltda',
           status: 'active',
           moderation_status: 'approved',
           featured: true)
  end

  let!(:bank_company_2) do
    create(:company,
           name: 'Banco ABC Test',
           slug: 'banco-abc',
           status: 'active',
           moderation_status: 'approved',
           featured: false)
  end

  let!(:solar_company) do
    create(:company,
           name: 'Solar Energy Legitimate Partner',
           slug: 'solar-energy-partner',
           status: 'active',
           moderation_status: 'approved',
           featured: true)
  end

  it 'suspends only banking entities and preserves legitimate solar companies active' do
    expect { task.invoke }.to output(/Concluída com sucesso/i).to_stdout

    bank_company_1.reload
    bank_company_2.reload
    solar_company.reload

    expect(bank_company_1.status).to eq('inactive')
    expect(bank_company_1.moderation_status).to eq('suspended')
    expect(bank_company_1.featured).to be(false)

    expect(bank_company_2.status).to eq('inactive')
    expect(bank_company_2.moderation_status).to eq('suspended')

    # Confirma que a empresa solar permanece ativa e featured
    expect(solar_company.status).to eq('active')
    expect(solar_company.moderation_status).to eq('approved')
    expect(solar_company.featured).to be(true)
  end
end

