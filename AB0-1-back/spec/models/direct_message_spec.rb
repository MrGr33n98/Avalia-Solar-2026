require 'rails_helper'

RSpec.describe DirectMessage, type: :model do
  subject(:direct_message) { build(:direct_message) }

  it { is_expected.to belong_to(:conversation) }
  it { is_expected.to validate_inclusion_of(:sender_type).in_array(%w[User Company]) }

  it 'requires a body or an attachment' do
    direct_message.body = nil

    expect(direct_message).not_to be_valid
    expect(direct_message.errors[:base]).to be_present
  end

  it 'stores delivered_at when created' do
    message = create(:direct_message, delivered_at: nil)

    expect(message.delivered_at).to be_present
  end
end
