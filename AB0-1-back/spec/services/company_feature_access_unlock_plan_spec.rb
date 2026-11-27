# frozen_string_literal: true

require 'rails_helper'

# Spec 027 — T015: cada recurso travado informa o menor plano público que o libera
# (`unlock_plan`). `nil` significa "fale com o comercial".
RSpec.describe CompanyFeatureAccessResolver, 'unlock_plan' do
  before { Plan.update_all(is_public: false) }

  let!(:essential) { create(:plan, name: 'Essential Teste', price: 590, is_public: true, features_json: {}) }
  let!(:pro) { create(:plan, name: 'Pro Teste', price: 1500, is_public: true, features_json: {}) }
  let!(:hidden_essential) { create(:plan, name: 'Essencial 6 meses Teste', price: 330, features_json: {}) }
  let(:free) { create(:plan, name: 'Free Teste', price: 0, features_json: {}) }

  def access_for(plan)
    described_class.call(company: create(:company, plan: plan, active_admin: false))
  end

  def unlock_name(access, key)
    access.fetch(key).fetch('unlock_plan')&.fetch('name')
  end

  it 'aponta o Essencial público para um recurso do Essencial travado no Free (ignora o plano oculto)' do
    access = access_for(free)

    expect(access['custom_ctas']['state']).to eq('locked')
    expect(access['custom_ctas']['unlock_plan']).to eq('id' => essential.id, 'name' => 'Essential Teste',
                                                       'tier' => 'essential')
  end

  it 'aponta o Pro para um recurso que só o Pro libera, tanto no Free quanto no Essencial' do
    expect(unlock_name(access_for(free), 'projects_showcase')).to eq('Pro Teste')
    expect(unlock_name(access_for(essential), 'projects_showcase')).to eq('Pro Teste')
  end

  it 'nunca sugere o plano atual da empresa' do
    access = access_for(essential)
    locked = access.select { |_key, entry| entry.key?('unlock_plan') }

    expect(locked).not_to be_empty
    expect(locked.values.filter_map { |entry| entry['unlock_plan']&.fetch('id') }).not_to include(essential.id)
  end

  it 'devolve unlock_plan nulo quando nenhum plano público libera o recurso (comercial)' do
    access = access_for(pro)

    expect(access['webhooks']).to include('unlock_plan' => nil)
  end

  it 'não inclui unlock_plan em recursos liberados' do
    expect(access_for(pro)['projects_showcase']).not_to have_key('unlock_plan')
  end
end
