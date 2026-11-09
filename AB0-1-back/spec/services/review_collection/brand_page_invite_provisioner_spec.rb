require 'rails_helper'

RSpec.describe ReviewCollection::BrandPageInviteProvisioner, type: :service do
  let(:company) { create(:company, status: 'active') }

  before do
    allow(VoiceReviews::Config).to receive(:contact_pepper).and_return('review-invite-test-pepper')
  end

  it 'provisions one reusable review invite after admin opt-in' do
    expect {
      company.update!(voice_review_cta_enabled: true)
    }.to change { VoiceReviewInvite.where(company: company, source: 'brand_page').count }.by(1)

    invite = VoiceReviewInvite.find_by!(company: company, source: 'brand_page')
    expect(invite.kind).to eq('reusable_qr')
    expect(invite.review_form).to be_active
    expect(invite.claimable?).to eq(true)

    expect {
      described_class.call(company: company)
    }.not_to change { VoiceReviewInvite.where(company: company, source: 'brand_page').count }
  end

  it 'does not provision for a disabled company and makes old link ineligible' do
    company.update!(voice_review_cta_enabled: true)
    invite = VoiceReviewInvite.find_by!(company: company, source: 'brand_page')

    company.update!(voice_review_cta_enabled: false)

    expect(invite.reload).not_to be_active_now
    expect(described_class.call(company: company)).to be_nil
  end
end
