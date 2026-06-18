require 'rails_helper'

RSpec.describe Conversation, type: :model do
  subject(:conversation) { build(:conversation) }

  it { is_expected.to belong_to(:user) }
  it { is_expected.to belong_to(:company) }
  it { is_expected.to have_many(:direct_messages).dependent(:destroy) }

  it 'prevents duplicate conversations for the same buyer and company' do
    existing = create(:conversation)
    duplicate = build(:conversation, user: existing.user, company: existing.company)

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:user_id]).to be_present
  end
end
