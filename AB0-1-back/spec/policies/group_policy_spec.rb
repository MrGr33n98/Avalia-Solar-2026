require 'rails_helper'

RSpec.describe GroupPolicy, type: :policy do
  let(:owner) { create(:user, role: 'review') }
  let(:member) { create(:user, role: 'review') }
  let(:outsider) { create(:user, role: 'review') }
  let(:group) { create(:group, owner: owner) }

  around do |example|
    original = ENV['GROUPS_ENABLED']
    ENV['GROUPS_ENABLED'] = 'true'
    example.run
    ENV['GROUPS_ENABLED'] = original
  end

  before { create(:group_membership, group: group, user: owner, role: 'owner') }

  it 'permite visitante ver grupo público ativo, mas não grupo privado' do
    expect(described_class.new(nil, group).show?).to be(true)

    group.update!(visibility: 'private_hidden')
    expect(described_class.new(outsider, group).show?).to be(false)
  end

  it 'permite membro ativo ver grupo privado' do
    group.update!(visibility: 'private_visible')
    create(:group_membership, group: group, user: member, role: 'member')

    expect(described_class.new(member, group).show?).to be(true)
  end

  it 'não inclui grupo privado no escopo de visitante' do
    private_group = create(:group, owner: owner, visibility: 'private_hidden')

    visible = described_class::Scope.new(nil, Group).resolve

    expect(visible).to include(group)
    expect(visible).not_to include(private_group)
  end

  it 'bloqueia owner de sair e permite membro sair' do
    member_membership = create(:group_membership, group: group, user: member)

    expect(described_class.new(owner, group).leave?).to be(false)
    expect(described_class.new(member, group).leave?).to be(true)
    expect(member_membership).to be_persisted
  end
end