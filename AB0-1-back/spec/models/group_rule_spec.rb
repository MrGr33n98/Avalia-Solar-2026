require 'rails_helper'

RSpec.describe GroupRule, type: :model do
  subject(:rule) { build(:group_rule) }

  it { is_expected.to be_valid }
  it { is_expected.to belong_to(:group) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:description) }

  it 'rejeita posição negativa' do
    rule.position = -1

    expect(rule).not_to be_valid
  end
end