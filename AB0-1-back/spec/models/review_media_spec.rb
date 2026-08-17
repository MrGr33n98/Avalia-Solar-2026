require 'rails_helper'

RSpec.describe ReviewMedia, type: :model do
  let(:review) { create(:review) }
  let(:user) { review.user }

  describe 'associations' do
    it { is_expected.to belong_to(:review) }
    it { is_expected.to belong_to(:user).optional }
    it { is_expected.to have_one_attached(:file) }
  end

  describe 'states' do
    it 'starts pending' do
      media = described_class.new(review: review, upload_session: create(:review_upload_session, user: user), user: user)

      expect(media).to be_pending
      expect(media).to be_moderation_pending
    end

    it 'exposes only ready media through publicly_ready' do
      create(:review_media, review: review, user: user, status: :ready)
      create(:review_media, review: review, user: user, status: :processing)
      create(:review_media, review: review, user: user, status: :ready, moderation_status: :rejected)

      expect(review.review_media.publicly_ready.count).to eq(1)
    end
  end

  describe 'review limit' do
    it 'allows at most six media records per review' do
      6.times do |index|
        create(:review_media, review: review, user: user, sort_order: index)
      end

      extra = build(:review_media, review: review, user: user, sort_order: 6)

      expect(extra).not_to be_valid
      expect(extra.errors.full_messages).to include('uma avaliação pode ter no máximo 6 fotos')
    end
  end
end