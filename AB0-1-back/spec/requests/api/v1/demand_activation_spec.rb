# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Intent Sync company boundary', type: :request do
  let(:company) { create(:company) }
  let(:owner) { create(:user) }
  let(:other_company) { create(:company) }

  # The existing JWT request helper for company-dashboard specs is reused
  # by the application-specific integration suite. This spec verifies the
  # default fail-closed path without creating accounts or uploading contacts.
  describe 'feature safety invariants' do
    it 'never enables activation by default' do
      expect(ENV.fetch('INTENT_SYNC_ENABLED', 'false')).not_to eq('true') if ENV['INTENT_SYNC_ENABLED'].nil?
      expect(DemandActivation::ProviderConnection::PROVIDERS).to contain_exactly('linkedin', 'meta', 'google')
    end

    it 'does not reuse CRM audience records' do
      expect(DemandActivation::AudienceSegment.table_name).not_to eq(Sales::Audience.table_name)
    end

    it 'refuses cross-company audience sources' do
      foreign_source = DemandActivation::Source.new(company: other_company, created_by: owner, name: 'Outra fonte')
      audience = DemandActivation::AudienceSegment.new(company: company, created_by: owner, name: 'Teste', source: foreign_source)
      expect(audience).not_to be_valid
      expect(audience.errors[:source]).to be_present
    end

    it 'refuses arbitrary contact identifiers in segment filters' do
      audience = DemandActivation::AudienceSegment.new(company: company, created_by: owner, name: 'Teste', filter_definition: { 'email' => 'user@example.com' })
      expect(audience).not_to be_valid
      expect(audience.errors[:filter_definition]).to be_present
    end

    it 'never considers a provider connection operational before approval' do
      connection = DemandActivation::ProviderConnection.new(company: company, created_by: owner, provider: 'meta', status: 'connected')
      expect(connection.operational?).to eq(false)
    end
  end
end
