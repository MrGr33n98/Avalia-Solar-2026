# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Pipeline::BoardQuery do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company, roles: ['sales_rep']) }
  let(:pipeline) { create(:sales_pipeline, name: 'Main Pipeline', active: true) }
  let!(:stage_prospect) { create(:sales_stage, pipeline: pipeline, name: 'Prospect', key: 'prospect', position: 1, probability: 10) }
  let!(:stage_closed) { create(:sales_stage, pipeline: pipeline, name: 'Won', key: 'won', position: 2, probability: 100, terminal_type: 'won') }

  let(:account) { create(:sales_account, company: company, name: 'Solar Corp') }
  let(:contact) { create(:sales_contact, account: account, first_name: 'John', last_name: 'Doe') }

  let!(:opportunity1) do
    create(:sales_opportunity,
           pipeline: pipeline,
           stage: stage_prospect,
           account: account,
           primary_contact: contact,
           owner: user,
           name: 'Project 100kWp',
           value_cents: 500_000,
           temperature: 'hot',
           status: 'open')
  end

  let!(:opportunity2) do
    create(:sales_opportunity,
           pipeline: pipeline,
           stage: stage_closed,
           account: account,
           primary_contact: contact,
           owner: user,
           name: 'Project 50kWp',
           value_cents: 250_000,
           temperature: 'warm',
           status: 'open')
  end

  describe '.call' do
    it 'returns pipeline, stages, and opportunities with batch loaded activities and tasks' do
      result = described_class.call(pipeline_id: pipeline.id, current_user: user)

      expect(result).not_to be_nil
      expect(result[:pipeline]).to eq(pipeline)
      expect(result[:stages]).to include(stage_prospect, stage_closed)
      expect(result[:opportunities].size).to eq(2)

      opp_ids = result[:opportunities].map { |o| o[:record].id }
      expect(opp_ids).to contain_exactly(opportunity1.id, opportunity2.id)
    end

    it 'enforces tenant isolation for non-admin users' do
      other_company = create(:company)
      other_user = create(:user, company: other_company)

      result = described_class.call(pipeline_id: pipeline.id, current_user: other_user)
      expect(result[:opportunities]).to be_empty
    end

    it 'allows admin users to view all company opportunities' do
      admin_user = create(:user, admin: true)

      result = described_class.call(pipeline_id: pipeline.id, current_user: admin_user)
      expect(result[:opportunities].size).to eq(2)
    end

    it 'filters by search term across opportunity name and account name' do
      result = described_class.call(pipeline_id: pipeline.id, current_user: user, params: { search: '100kWp' })
      expect(result[:opportunities].map { |o| o[:record].id }).to eq([opportunity1.id])
    end

    it 'filters by temperature' do
      result = described_class.call(pipeline_id: pipeline.id, current_user: user, params: { temperature: 'hot' })
      expect(result[:opportunities].map { |o| o[:record].id }).to eq([opportunity1.id])
    end
  end
end
