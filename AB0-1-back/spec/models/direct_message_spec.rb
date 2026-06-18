require 'rails_helper'

RSpec.describe DirectMessage, type: :model do
  subject(:direct_message) { build(:direct_message) }

  it { is_expected.to belong_to(:conversation) }
  it { is_expected.to validate_presence_of(:body) }
  it { is_expected.to validate_inclusion_of(:sender_type).in_array(%w[User Company]) }
end
