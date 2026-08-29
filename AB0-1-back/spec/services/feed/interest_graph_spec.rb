require 'rails_helper'

RSpec.describe Feed::InterestGraph, type: :service do
  it 'acumula interesse e aplica decay temporal por entidade' do
    user = create(:user)
    now = Time.current

    described_class.record(user: user, event_type: 'topic_click', metadata: { 'topic_id' => 7 }, occurred_at: now)
    described_class.record(user: user, event_type: 'feed_item_saved', metadata: { 'topic_id' => 7 },
                          occurred_at: 1.day.from_now(now))

    interest = UserInterest.find_by!(user: user, entity_type: 'Topic', entity_id: 7)
    expect(interest.score).to be > 6.3
    expect(interest.score).to be < 6.4
    expect(interest.last_interaction_at).to be_within(0.01).of(1.day.from_now(now))
  end

  it 'ignora evento sem usuário ou entidade' do
    expect { described_class.record(user: nil, event_type: 'topic_click', metadata: { 'topic_id' => 7 }) }
      .not_to change(UserInterest, :count)
    expect { described_class.record(user: create(:user), event_type: 'topic_click', metadata: {}) }
      .not_to change(UserInterest, :count)
  end
end
