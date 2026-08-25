# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Groups::RecommendationService do
  let!(:user) { create(:user) }
  let!(:category) { create(:category) }
  let!(:category2) { create(:category) }

  let!(:group_public_1) { create(:group, status: 'active', visibility: 'public', category: category, members_count: 10) }
  let!(:group_public_2) { create(:group, status: 'active', visibility: 'public', category: category2, members_count: 20) }
  let!(:group_private) { create(:group, status: 'active', visibility: 'private_visible', category: category, members_count: 5) }
  let!(:group_draft) { create(:group, status: 'draft', visibility: 'public', category: category, members_count: 15) }

  describe '.call' do
    context 'when user is not authenticated' do
      it 'returns popular discoverable groups' do
        recommendations = described_class.call(user: nil, limit: 5)
        # Should include only public active groups (group_public_1, group_public_2)
        # Draft and private visible groups are not discoverable
        expect(recommendations).to include(group_public_1, group_public_2)
        expect(recommendations).not_to include(group_private)
        expect(recommendations).not_to include(group_draft)
      end
    end

    context 'when user is authenticated' do
      before do
        # User joins group_public_1
        create(:group_membership, group: group_public_1, user: user, status: 'active')
      end

      it 'recommends discoverable groups matching user interest and excludes joined ones' do
        recommendations = described_class.call(user: user, limit: 5)
        # user has joined group_public_1 (category: category)
        # should recommend group_public_2 (fallback/category match) but exclude group_public_1
        expect(recommendations).to include(group_public_2)
        expect(recommendations).not_to include(group_public_1)
      end
    end
  end
end
