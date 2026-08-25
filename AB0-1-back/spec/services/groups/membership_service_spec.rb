require 'rails_helper'

RSpec.describe Groups::MembershipService do
  let(:owner) { create(:user, role: 'review') }
  let(:user) { create(:user, role: 'review') }
  let(:group) { create(:group, owner: owner) }

  around do |example|
    original = ENV['GROUPS_ENABLED']
    ENV['GROUPS_ENABLED'] = 'true'
    example.run
    ENV['GROUPS_ENABLED'] = original
  end

  it 'entra de forma idempotente e incrementa membros uma vez' do
    expect { described_class.join(group: group, user: user) }.to change(GroupMembership, :count).by(1)
    expect { described_class.join(group: group, user: user) }.not_to change(GroupMembership, :count)
    expect(group.reload.members_count).to eq(1)
  end

  it 'cria pending para grupo com aprovação' do
    group.update!(membership_mode: 'approval')

    membership = described_class.join(group: group, user: user)

    expect(membership).to be_pending
    expect(group.reload.members_count).to eq(0)
  end

  it 'bloqueia invite_only' do
    group.update!(membership_mode: 'invite_only')

    expect { described_class.join(group: group, user: user) }.to raise_error(described_class::Forbidden)
  end

  it 'preserva membership como left ao sair' do
    described_class.join(group: group, user: user)

    membership = described_class.leave(group: group, user: user)

    expect(membership.status).to eq('left')
    expect(group.reload.members_count).to eq(0)
  end

  it 'cria owner membership junto com o grupo' do
    created = Groups::GroupCreationService.call(
      attributes: { name: 'Grupo novo', slug: 'grupo-novo' }, owner: user
    )

    expect(created.group_memberships.find_by(user: user)).to have_attributes(role: 'owner', status: 'active')
    expect(created.reload.members_count).to eq(1)
  end
end