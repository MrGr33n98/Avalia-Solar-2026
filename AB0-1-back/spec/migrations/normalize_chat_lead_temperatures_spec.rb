# frozen_string_literal: true

require 'rails_helper'
require_relative '../../db/migrate/20260802100003_normalize_chat_lead_temperatures'

RSpec.describe NormalizeChatLeadTemperatures, type: :migration do
  subject(:migration) { described_class.new }

  def run_migration
    migration.version = 2026_08_02_100003
    migration.exec_migration(ActiveRecord::Base.connection, :up)
  end

  def create_lead
    session = ChatSession.create!
    ChatLead.create!(chat_session: session, consent_given: true, consent_given_at: Time.current)
  end

  it 'converte valores legados cold, warm, hot para o contrato pt-br' do
    lead_cold = create_lead
    lead_warm = create_lead
    lead_hot = create_lead
    lead_pt = create_lead

    lead_cold.update_column(:lead_temperature, 'cold')
    lead_warm.update_column(:lead_temperature, 'warm')
    lead_hot.update_column(:lead_temperature, 'hot')
    lead_pt.update_column(:lead_temperature, 'quente')

    run_migration

    expect(lead_cold.reload.lead_temperature).to eq('frio')
    expect(lead_warm.reload.lead_temperature).to eq('morno')
    expect(lead_hot.reload.lead_temperature).to eq('quente')
    expect(lead_pt.reload.lead_temperature).to eq('quente')
  end

  it 'é idempotente em execuções subsequentes' do
    lead_cold = create_lead
    lead_cold.update_column(:lead_temperature, 'cold')

    run_migration
    expect(lead_cold.reload.lead_temperature).to eq('frio')

    expect { run_migration }.not_to raise_error
    expect(lead_cold.reload.lead_temperature).to eq('frio')
  end
end
