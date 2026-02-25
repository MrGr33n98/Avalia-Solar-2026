class CompanyMember < ApplicationRecord
  has_paper_trail

  belongs_to :company
  belongs_to :user
  enum role: { owner: 0, manager: 1, editor: 2 }, _default: :editor
  enum status: { pending: 'pending', active: 'active', rejected: 'rejected', revoked: 'revoked' }, _default: :active
  validates :company_id, :user_id, presence: true
  validates :role, inclusion: { in: roles.keys }
  validates :status, inclusion: { in: statuses.keys }
  validates :user_id, uniqueness: { scope: :company_id }

  after_create :track_member_assignment
  after_commit :notify_slack, on: :create

  private

  def track_member_assignment
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'member_assigned',
      user: user,
      metadata: {
        role: role,
        assigned_by: PaperTrail.request.whodunnit
      }
    )
  end

  def notify_slack
    SlackNotificationService.notify_member_assigned(self)
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company user versions]
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[company_id created_at id role status updated_at user_id]
  end
end
