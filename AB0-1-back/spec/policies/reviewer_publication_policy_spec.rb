# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewerPublicationPolicy, type: :policy do
  let(:publication) { create(:reviewer_publication) }

  it 'autoriza o administrador em todas as ações de gestão' do
    policy = described_class.new(create(:admin_user), publication)

    %i[show? update? destroy? publish? archive?].each do |action|
      expect(policy.public_send(action)).to be(true)
    end
  end

  it 'mostra todas as publicações ao administrador' do
    publication
    scope = described_class::Scope.new(create(:admin_user), ReviewerPublication.all).resolve

    expect(scope).to include(publication)
  end

  it 'mantém as publicações restritas ao autor para usuários comuns' do
    owner = publication.user
    other = create(:user)

    expect(described_class.new(owner, publication).show?).to be(true)
    expect(described_class.new(other, publication).show?).to be(false)
    expect(described_class::Scope.new(other, ReviewerPublication.all).resolve).not_to include(publication)
  end
end
