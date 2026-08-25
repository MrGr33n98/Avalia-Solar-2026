# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Groups::DiscoveryQuery, type: :query do
  let!(:user) { create(:user) }
  let!(:other_user) { create(:user) }

  let!(:public_group) { create(:group, status: 'active', visibility: 'public', name: 'Grupo Publico A') }
  let!(:private_group) { create(:group, status: 'active', visibility: 'private_visible', name: 'Grupo Privado B') }
  let!(:inactive_group) { create(:group, status: 'draft', visibility: 'public', name: 'Grupo Inativo C') }

  describe '#call with view=mine' do
    it 'returns empty if current_user is nil' do
      query = described_index_query(view: 'mine', current_user: nil)
      expect(query.call).to be_empty
    end

    it 'returns only active groups where user is an active member' do
      # User joins public group (active membership)
      create(:group_membership, group: public_group, user: user, status: 'active', joined_at: 2.days.ago)
      # User joins private group (active membership)
      create(:group_membership, group: private_group, user: user, status: 'active', joined_at: 1.day.ago)
      # User joins inactive group (active membership)
      create(:group_membership, group: inactive_group, user: user, status: 'active')
      # Other user joins public group
      create(:group_membership, group: public_group, user: other_user, status: 'active')

      query = described_index_query(view: 'mine', current_user: user)
      results = query.call.to_a

      # Should return public_group and private_group, but not inactive_group
      expect(results).to contain_exactly(public_group, private_group)
    end

    it 'excludes pending/rejected/left memberships' do
      pending_group = create(:group, status: 'active', visibility: 'public')
      rejected_group = create(:group, status: 'active', visibility: 'public')
      
      create(:group_membership, group: public_group, user: user, status: 'active')
      create(:group_membership, group: pending_group, user: user, status: 'pending')
      create(:group_membership, group: rejected_group, user: user, status: 'rejected')

      query = described_index_query(view: 'mine', current_user: user)
      expect(query.call).to contain_exactly(public_group)
    end

    it 'orders by joined_at desc' do
      create(:group_membership, group: public_group, user: user, status: 'active', joined_at: 2.days.ago)
      create(:group_membership, group: private_group, user: user, status: 'active', joined_at: 1.day.ago)

      query = described_index_query(view: 'mine', current_user: user)
      expect(query.call.to_a).to eq([private_group, public_group])
    end
  end

  private

  def described_index_query(view: nil, current_user: nil)
    described_class.new(view: view, current_user: current_user)
  end
end
