require 'rails_helper'

RSpec.describe Favorite, type: :model do
  subject(:favorite) { build(:favorite) }

  it { is_expected.to belong_to(:user) }
  it { is_expected.to belong_to(:favoritable) }
  it { is_expected.to validate_inclusion_of(:favoritable_type).in_array(%w[Company Product]) }

  it 'aceita Company e Product' do
    expect(build(:favorite, favoritable: build(:company))).to be_valid
    expect(build(:favorite, favoritable: build(:product))).to be_valid
  end

  it 'rejeita tipos fora da allowlist' do
    favorite = build(:favorite, favoritable_type: 'User', favoritable_id: create(:user).id)
    expect(favorite).not_to be_valid
  end

  it 'não permite duplicar o mesmo item para o usuário' do
    first = create(:favorite)
    duplicate = build(:favorite, user: first.user, favoritable: first.favoritable)
    expect(duplicate).not_to be_valid
  end

  it 'permite o mesmo item para usuários diferentes' do
    company = create(:company)
    expect(create(:favorite, favoritable: company)).to be_persisted
    expect(create(:favorite, favoritable: company)).to be_persisted
  end
end
