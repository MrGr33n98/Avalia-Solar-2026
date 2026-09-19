# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::RiskClassifier do
  describe '.classify' do
    it 'classifies read-only query tools as R0' do
      meta = described_class.classify('search_companies')
      expect(meta[:risk_tier]).to eq(:r0)
      expect(meta[:required_scopes]).to include('mcp:read')
      expect(meta[:hitl_required]).to be(false)
      expect(meta[:prohibited]).to be(false)
    end

    it 'classifies diagnostic and observability tools as R0' do
      meta = described_class.classify('diagnose_performance')
      expect(meta[:risk_tier]).to eq(:r0)
      expect(meta[:required_scopes]).to contain_exactly('mcp:read', 'mcp:admin')
      expect(meta[:hitl_required]).to be(false)
    end

    it 'classifies recommendation and computational draft tools as R1' do
      meta = described_class.classify('recommend_next_actions')
      expect(meta[:risk_tier]).to eq(:r1)
      expect(meta[:required_scopes]).to include('mcp:analyze')
      expect(meta[:hitl_required]).to be(false)
    end

    it 'classifies internal low write tools as R2' do
      meta = described_class.classify('create_review_request')
      expect(meta[:risk_tier]).to eq(:r2)
      expect(meta[:required_scopes]).to include('mcp:write')
      expect(meta[:hitl_required]).to be(false)
    end

    it 'classifies outbound campaigns and mass exports as R3 with HITL required' do
      campaign_meta = described_class.classify('send_outbound_campaign')
      expect(campaign_meta[:risk_tier]).to eq(:r3)
      expect(campaign_meta[:required_scopes]).to include('mcp:external_mutate')
      expect(campaign_meta[:hitl_required]).to be(true)

      export_meta = described_class.classify('bulk_lead_export')
      expect(export_meta[:risk_tier]).to eq(:r3)
      expect(export_meta[:hitl_required]).to be(true)
    end

    it 'classifies destructive financial/admin tools as R4 with mandatory HITL' do
      charge_meta = described_class.classify('charge_subscription')
      expect(charge_meta[:risk_tier]).to eq(:r4)
      expect(charge_meta[:required_scopes]).to include('mcp:admin:critical')
      expect(charge_meta[:hitl_required]).to be(true)
    end

    it 'flags arbitrary SQL and shell execution as prohibited' do
      %w[execute_sql raw_sql_query dbhub_query exec_shell bash_command system_exec drop_database].each do |bad_tool|
        expect(described_class.prohibited?(bad_tool)).to be(true)
        meta = described_class.classify(bad_tool)
        expect(meta[:prohibited]).to be(true)
      end
    end
  end

  describe '.hitl_required?' do
    it 'returns false for R0, R1, R2 without explicit flag' do
      expect(described_class.hitl_required?('search_companies')).to be(false)
      expect(described_class.hitl_required?('recommend_next_actions')).to be(false)
      expect(described_class.hitl_required?('create_review_request')).to be(false)
    end

    it 'returns true for R3 and R4 tools' do
      expect(described_class.hitl_required?('send_outbound_campaign')).to be(true)
      expect(described_class.hitl_required?('bulk_lead_export')).to be(true)
      expect(described_class.hitl_required?('charge_subscription')).to be(true)
    end

    it 'returns true when force_hitl argument is present' do
      expect(described_class.hitl_required?('create_review_request', { force_hitl: true })).to be(true)
    end
  end

  describe '.risk_within_limit?' do
    it 'accurately verifies risk hierarchy' do
      expect(described_class.risk_within_limit?(:r0, :r0)).to be(true)
      expect(described_class.risk_within_limit?(:r0, :r2)).to be(true)
      expect(described_class.risk_within_limit?(:r2, :r1)).to be(false)
      expect(described_class.risk_within_limit?(:r3, :r2)).to be(false)
      expect(described_class.risk_within_limit?(:r3, :r3)).to be(true)
      expect(described_class.risk_within_limit?(:r4, :r3)).to be(false)
    end
  end
end
