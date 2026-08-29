# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::EngagementLoader, type: :service do
  let(:user) { create(:user) }
  let(:publication) { create(:reviewer_publication, user: user) }
  let(:review) { create(:review) }

  it 'carrega contadores e estado do viewer em lote' do
    other_user = create(:user)
    Reaction.create!(reactable: publication, user: other_user, reaction_type: 'useful')
    Reaction.create!(reactable: review, user: user, reaction_type: 'helpful')
    Comment.create!(commentable: publication, user: other_user, body: 'Conteúdo útil.', status: 'active')
    SavedItem.create!(saveable: publication, user: user)

    engagement = described_class.new(subjects: [publication, review], current_user: user).call

    expect(engagement.reactions_counts[engagement.key(publication)]).to eq(1)
    expect(engagement.reactions_counts[engagement.key(review)]).to eq(1)
    expect(engagement.comments_counts[engagement.key(publication)]).to eq(1)
    expect(engagement.viewer_reactions[engagement.key(review)]).to eq('helpful')
    expect(engagement.saved_items[engagement.key(publication)]).to be(true)
  end
end
