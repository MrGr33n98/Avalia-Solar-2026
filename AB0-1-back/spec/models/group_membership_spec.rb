require 'rails_helper'

RSpec.describe GroupMembership, type: :model do
  subject(:membership) { build(:group_membership) }

  it { is_expected.to be_valid }
  it { is_expected.to validate_uniqueness_of(:user_id).scoped_to(:group_id) }
  it { is_expected.to belong_to(:group) }
  it { is_expected.to belong_to(:user) }

  it 'rejeita role, status e notificações inválidos' do
    membership.role = 'ownerless'
    membership.status = 'unknown'
    membership.notifications_level = 'digest'

    expect(membership).not_to be_valid
  end
end