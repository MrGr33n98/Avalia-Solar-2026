# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ranking::Ias::ValidationHarness do
  describe '.validate_schema' do
    it 'rejects schema with double-counting of the same underlying field' do
      schema = {
        formula_approved: true,
        input_signals: [
          { name: 'review_volume', underlying_field: 'reviews_count' },
          { name: 'customer_engagement', underlying_field: 'reviews_count' }
        ]
      }

      result = described_class.validate_schema(schema)

      expect(result.approved).to be false
      expect(result.double_counting_violations).not_to be_empty
      expect(result.double_counting_violations.first).to include('Double-counting')
    end

    it 'rejects schema with commercial bias requiring paid plans or sponsorship' do
      schema = {
        formula_approved: true,
        requires_paid_plan: true,
        weights: { sponsorship_boost: 0.15 }
      }

      result = described_class.validate_schema(schema)

      expect(result.approved).to be false
      expect(result.bias_violations.size).to eq(2)
      expect(result.bias_violations.first).to include('Viés comercial')
    end

    it 'rejects schema when formal approval is missing' do
      schema = {
        formula_approved: false,
        input_signals: [
          { name: 'review_score', underlying_field: 'rating_avg' },
          { name: 'projects_delivered', underlying_field: 'projects_count' }
        ]
      }

      result = described_class.validate_schema(schema)

      expect(result.approved).to be false
      expect(result.reasons).to include('Metodologia não possui aprovação formal do comitê de produto')
    end

    it 'approves a compliant schema with no violations and approved status' do
      schema = {
        formula_approved: true,
        requires_paid_plan: false,
        stability_constraints: { max_single_event_shift_pct: 10.0 },
        input_signals: [
          { name: 'verified_projects', underlying_field: 'delivered_projects_score' },
          { name: 'sla_adherence', underlying_field: 'response_sla_minutes' }
        ]
      }

      result = described_class.validate_schema(schema)

      expect(result.approved).to be true
      expect(result.reasons).to be_empty
    end
  end
end
