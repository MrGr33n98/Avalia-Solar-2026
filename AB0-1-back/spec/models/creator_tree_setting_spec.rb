require 'rails_helper'

RSpec.describe CreatorTreeSetting, type: :model do
  let(:reviewer) { create(:reviewer_profile) }

  describe 'associations' do
    it { should belong_to(:reviewer_profile) }
  end

  describe 'validations' do
    it 'is valid with valid attributes' do
      setting = build(:creator_tree_setting, reviewer_profile: reviewer)
      expect(setting).to be_valid
    end
  end

  describe 'defaults' do
    it 'sets default theme_key to solar' do
      setting = create(:creator_tree_setting, reviewer_profile: reviewer, theme_key: nil)
      expect(setting.theme_key).to eq('solar')
    end

    it 'sets default appearance to empty hash' do
      setting = create(:creator_tree_setting, reviewer_profile: reviewer, appearance: nil)
      expect(setting.appearance).to eq({})
    end
  end
end
