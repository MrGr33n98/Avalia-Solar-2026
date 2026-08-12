# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyHealthService, type: :service do
  describe '.call' do
    let(:company) { create(:company, name: 'Empresa Solar Ltda', status: 'active') }

    context 'when company is nil' do
      it 'returns default zero health with full structure' do
        health = described_class.call(nil)
        expect(health[:score]).to eq(0)
        expect(health[:status]).to eq('poor')
        expect(health[:max_score]).to eq(100)
        expect(health[:algorithm_version]).to eq('v1.0')
        expect(health[:calculated_at]).to be_present
        expect(health[:dimensions][:profile]).to eq(0)
        expect(health[:positive_items]).to eq([])
        expect(health[:missing_items]).to eq([])
        expect(health[:explainability][:profile][:score]).to eq(0)
        expect(health[:explainability][:profile][:positive_items]).to eq([])
      end
    end

    context 'when company is active and new' do
      it 'calculates health scores and explains details' do
        health = described_class.call(company)

        # Structure checks
        expect(health[:score]).to be_between(0, 100)
        expect(health[:max_score]).to eq(100)
        expect(health[:algorithm_version]).to eq('v1.0')
        expect(health[:calculated_at]).to be_present

        expect(health[:dimensions][:profile]).to be_between(0, 100)
        expect(health[:dimensions][:reputation]).to eq(100) # Defaults to 100 if no reviews

        # Explainability lists
        expect(health[:positive_items]).to include('profile_name_present')
        expect(health[:positive_items]).to include('discoverability_active_status_present')
        expect(health[:missing_items]).to include('profile_logo_missing')
        expect(health[:missing_items]).to include('content_videos_missing')

        # Explainability structure
        expect(health[:explainability][:profile][:score]).to eq(health[:dimensions][:profile])
        expect(health[:explainability][:profile][:max_score]).to eq(100)
        expect(health[:explainability][:profile][:positive_items]).to include('profile_name_present')
        expect(health[:explainability][:profile][:missing_items]).to include('profile_logo_missing')

        expect(health[:explainability][:discoverability][:positive_items]).to include('discoverability_active_status_present')
      end
    end
  end
end
