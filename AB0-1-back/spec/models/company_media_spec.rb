require 'rails_helper'

RSpec.describe Company, type: :model do
  describe '#media_upload_allowed?' do
    let(:plan) { create(:plan, features: { media_upload: true }) }

    it 'allows when plan explicitly enables media uploads' do
      company = create(:company, featured: false, verified: false, plan:, plan_status: 'active')
      expect(company.media_upload_allowed?).to eq(true)
    end

    it 'denies when plan disables and no fallback is present' do
      disabled_plan = create(:plan, features: { media_upload: false })
      company = create(:company, featured: false, verified: false, plan: disabled_plan, plan_status: 'inactive')
      expect(company.media_upload_allowed?).to eq(false)
    end

    it 'falls back to featured/verified when plan flag is missing' do
      company = create(:company, featured: true, verified: false, plan: nil)
      expect(company.media_upload_allowed?).to eq(true)
    end
  end
end
