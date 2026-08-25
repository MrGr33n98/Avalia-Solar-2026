require 'rails_helper'

RSpec.describe Group, type: :model do
  subject(:group) { build(:group) }

  it { is_expected.to be_valid }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:slug) }
  it { is_expected.to validate_uniqueness_of(:slug) }
  it { is_expected.to belong_to(:owner).class_name('User') }
  it { is_expected.to belong_to(:category).optional }
  it { is_expected.to have_many(:group_memberships).dependent(:destroy) }

  it 'rejeita estados fora do contrato' do
    group.visibility = 'secret'
    group.status = 'unknown'

    expect(group).not_to be_valid
    expect(group.errors).to include(:visibility, :status)
  end
end