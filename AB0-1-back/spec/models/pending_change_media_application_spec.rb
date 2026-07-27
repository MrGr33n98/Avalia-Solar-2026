require 'rails_helper'

RSpec.describe PendingChange, type: :model do
  include ActiveJob::TestHelper

  let(:company) { create(:company) }

  before do
    clear_enqueued_jobs
    clear_performed_jobs
  end

  after do
    clear_enqueued_jobs
    clear_performed_jobs
  end

  describe '#apply_changes!' do
    it 'attaches approved media exactly once and invalidates the public profile after commit' do
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new('image bytes'),
        filename: 'installation.jpg',
        content_type: 'image/jpeg'
      )
      pending_change = described_class.create!(
        company: company,
        change_type: 'media',
        status: 'approved',
        data: { signed_ids: [blob.signed_id] }
      )

      expect do
        pending_change.apply_changes!
      end.to have_enqueued_job(PublicProfileRevalidationJob).with(company.id)

      expect(company.reload.media_assets.blobs.pluck(:id)).to eq([blob.id])
      expect(pending_change.reload.applied_at).to be_present

      expect { pending_change.apply_changes! }.not_to change { company.reload.media_assets.count }
    end

    it 'does not mark a media change as applied if its attachment cannot be restored' do
      pending_change = described_class.create!(
        company: company,
        change_type: 'media',
        status: 'approved',
        data: { signed_ids: ['invalid-signed-blob'] }
      )

      expect { pending_change.apply_changes! }.to raise_error(StandardError)
      expect(pending_change.reload.applied_at).to be_nil
      expect(company.reload.media_assets).not_to be_attached
    end

    it 'schedules cleanup for an image rejected before attachment' do
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new('rejected image bytes'),
        filename: 'rejected.jpg',
        content_type: 'image/jpeg'
      )
      pending_change = described_class.create!(
        company: company,
        change_type: 'media',
        status: 'pending',
        data: { signed_ids: [blob.signed_id] }
      )

      expect do
        pending_change.update!(status: 'rejected')
      end.to have_enqueued_job(PendingMediaBlobCleanupJob).with(pending_change.id)
    end

    it 'upserts an approved video instead of duplicating it' do
      existing = create(
        :company_video,
        company: company,
        video_id: 'same-video',
        url: 'https://www.youtube.com/watch?v=same-video',
        title: 'Versão anterior'
      )
      pending_change = described_class.create!(
        company: company,
        change_type: 'video',
        status: 'approved',
        data: {
          action: 'add',
          provider: 'youtube',
          video_id: 'same-video',
          url: 'https://www.youtube.com/watch?v=same-video',
          title: 'Versão aprovada',
          thumbnail_url: 'https://img.youtube.com/vi/same-video/hqdefault.jpg'
        }
      )

      expect { pending_change.apply_changes! }.not_to change { company.company_videos.count }
      expect(existing.reload.title).to eq('Versão aprovada')
      expect(existing.status).to eq('published')
    end
  end
end
