require 'rails_helper'

RSpec.describe CreatorTreeBlock, type: :model do
  let(:user) { create(:user, role: :review, status: :active, company: nil, confirmed_at: Time.current) }
  let(:profile) { create(:reviewer_profile, user: user, creator_enabled: true) }

  it 'uses reviewer_id for reviewer profile association' do
    association = ReviewerProfile.reflect_on_association(:creator_tree_blocks)

    expect(association.foreign_key).to eq('reviewer_id')
    expect(build(:creator_tree_block, reviewer: profile)).to be_valid
  end

  it 'blocks unsafe URLs' do
    block = build(:creator_tree_block, reviewer: profile, url: 'javascript:alert(1)')

    expect(block).not_to be_valid
  end

  it 'allows only eight active blocks' do
    8.times { |index| create(:creator_tree_block, reviewer: profile, position: index) }
    extra = build(:creator_tree_block, reviewer: profile, position: 8)

    expect(extra).not_to be_valid
  end
end