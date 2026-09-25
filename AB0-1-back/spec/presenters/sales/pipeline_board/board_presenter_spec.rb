# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::PipelineBoard::BoardPresenter do
  let(:company) do
    Company.new(name: 'Empresa Teste', slug: "empresa-#{SecureRandom.hex(4)}").tap { |c| c.save!(validate: false) }
  end

  let(:user) do
    User.new(
      name: 'Sales User',
      email: "sales.#{SecureRandom.hex(4)}@avaliasolar.com.br",
      password: 'Password123!',
      role: 'admin',
      company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end

  let(:pipeline) { Sales::Pipeline.create!(name: 'B2B Pipeline', key: "b2b_#{SecureRandom.hex(4)}", active: true) }
  let!(:stage) { pipeline.stages.create!(key: 'prospect', name: 'Prospect', position: 1, probability: 20) }
  let(:account) { Sales::Account.create!(company_id: company.id, owner: user, name: 'WEG Solar') }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'Felipe', last_name: 'Oliveira', email: 'felipe@weg.com') }

  let(:opportunity) do
    account.opportunities.create!(
      pipeline: pipeline,
      stage: stage,
      primary_contact: contact,
      owner: user,
      name: 'Usina Solar 500kWp',
      value_cents: 1_500_000,
      temperature: 'hot',
      status: 'open'
    )
  end

  it 'presents board data correctly without errors when activity and qualification are present' do
    activity = Sales::Activity.create!(
      account: account,
      opportunity: opportunity,
      actor: user,
      activity_type: 'email',
      subject: 'Envio de Proposta',
      body: 'Segue proposta comercial para usina solar 500kWp',
      occurred_at: Time.current
    )

    qualification = Sales::Qualification.create!(
      opportunity: opportunity,
      situation: 'Empresa consumindo 100MWh/mês',
      spin_completion: 90,
      bant_completion: 75
    )

    board_data = {
      pipeline: pipeline,
      stages: [stage],
      opportunities: [
        {
          record: opportunity,
          latest_activity: activity,
          next_task: nil
        }
      ]
    }

    result = described_class.call(board_data)

    expect(result[:pipeline][:id]).to eq(pipeline.id)
    expect(result[:cards].size).to eq(1)

    card = result[:cards].first
    expect(card[:id]).to eq(opportunity.id)
    expect(card[:last_activity][:type]).to eq('email')
    expect(card[:last_activity][:description]).to eq('Segue proposta comercial para usina solar 500kWp')
    expect(card[:qualification][:spin_completion]).to eq(90)
    expect(card[:qualification][:bant_completion]).to eq(75)
  end
end
