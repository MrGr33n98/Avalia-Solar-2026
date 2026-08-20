require 'rails_helper'

RSpec.describe ReviewerPublication, type: :model do
  it 'persists owner and lifecycle after reload' do
    publication = create(:reviewer_publication, status: 'published', published_at: Time.current)
    persisted = described_class.find(publication.id)

    expect(persisted.user_id).to eq(publication.user_id)
    expect(persisted.status).to eq('published')
    expect(persisted.reload.title).to eq(publication.title)
  end

  it 'publishes and archives through lifecycle methods' do
    publication = create(:reviewer_publication, status: 'draft')
    expect(publication.draft?).to be true
    expect(publication.published?).to be false
    expect(publication.archived?).to be false

    publication.publish!
    expect(publication.reload).to have_attributes(status: 'published')
    expect(publication.draft?).to be false
    expect(publication.published?).to be true
    expect(publication.archived?).to be false
    expect(publication.published_at).to be_present

    publication.archive!
    expect(publication.reload.status).to eq('archived')
    expect(publication.draft?).to be false
    expect(publication.published?).to be false
    expect(publication.archived?).to be true
  end
end
