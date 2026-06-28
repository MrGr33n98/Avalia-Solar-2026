# == Schema Information
#
# Table name: anonymous_sessions
#
class AnonymousSession < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :user, optional: true
  belongs_to :company, optional: true

  # Validations
  validates :anonymous_id, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[anonymous identified stitched] }

  # Callbacks
  before_create :set_first_seen
  before_save :update_last_seen

  # Scopes
  scope :anonymous, -> { where(status: 'anonymous') }
  scope :identified, -> { where(status: 'identified') }
  scope :recent, -> { where('last_seen_at >= ?', 1.hour.ago) }
  scope :stale, -> { where('last_seen_at < ?', 1.hour.ago) }
  scope :by_company, ->(company_id) { where('? = ANY(visited_company_ids)', company_id) }

  # Status Checkers
  def anonymous? = status == 'anonymous'
  def identified? = status == 'identified'
  def stitched? = status == 'stitched'

  # Identify
  def identify!(user)
    update!(
      user_id: user.id,
      status: 'identified',
      identified_at: Time.current,
      stitch_metadata: stitch_metadata.merge(
        identified_by: 'user_login',
        identified_at: Time.current.iso8601
      )
    )
  end

  # Add Visit
  def track_visit(company_id, page_url)
    self.visited_company_ids ||= []
    self.visited_pages ||= []

    self.visited_company_ids << company_id unless visited_company_ids.include?(company_id)
    self.visited_pages << { url: page_url, at: Time.current.iso8601 }
    self.pageviews_count += 1
    self.last_seen_at = Time.current

    save!
  end

  # Duration
  def session_duration
    return 0 unless first_seen_at && last_seen_at

    (last_seen_at - first_seen_at).to_i
  end

  def enriched?
    firmographic_enrichment.present?
  end

  def firmographic_enrichment
    stitch_metadata.fetch('firmographic_enrichment', {})
  end

  def apply_firmographic_enrichment!(attributes)
    update!(
      stitch_metadata: stitch_metadata.merge(
        'firmographic_enrichment' => attributes,
        'enrichment_status' => 'enriched',
        'enriched_at' => Time.current.iso8601
      )
    )
  end

  private

  def set_first_seen
    self.first_seen_at ||= Time.current
  end

  def update_last_seen
    self.last_seen_at = Time.current if changed?
  end
end
