require 'rails_helper'

RSpec.describe Category, type: :model do
  describe 'hierarchy' do
    it 'allows setting a parent category' do
      parent = create(:category)
      child = create(:category, parent: parent)

      expect(child.parent).to eq(parent)
      expect(parent.children).to include(child)
    end

    it 'rejects self-parenting' do
      category = create(:category)
      category.parent = category

      expect(category).not_to be_valid
      expect(category.errors[:parent_id]).to be_present
    end

    it 'rejects cycles' do
      a = create(:category)
      b = create(:category, parent: a)

      a.parent = b
      expect(a).not_to be_valid
      expect(a.errors[:parent_id]).to be_present
    end
  end
end

