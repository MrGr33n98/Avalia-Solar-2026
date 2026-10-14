class CompanyMember < ApplicationRecord
  has_paper_trail

  belongs_to :company, counter_cache: true
  belongs_to :user
  enum role: { owner: 0, manager: 1, editor: 2 }, _default: :editor
  enum status: { pending: 'pending', active: 'active', rejected: 'rejected', revoked: 'revoked' }, _default: :active
  validates :company_id, :user_id, presence: true
  validates :role, inclusion: { in: roles.keys }
  validates :status, inclusion: { in: statuses.keys }
  validates :user_id, uniqueness: { scope: :company_id }

  scope :active, -> { where(status: 'active') }
  scope :owners, -> { active.where(role: :owner) }
  scope :managers, -> { active.where(role: :manager) }
  scope :editors, -> { active.where(role: :editor) }

  before_destroy :prevent_last_active_owner_removal
  validate :prevent_last_active_owner_demotion, on: :update

  after_create :track_member_assignment
  after_commit :notify_slack, on: :create

  private

  def prevent_last_active_owner_removal
    return unless owner? && active?
    return unless company

    if company.company_members.active.where(role: :owner).where.not(id: id).empty?
      errors.add(:base, 'A empresa não pode ficar sem nenhum proprietário (owner) ativo.')
      throw(:abort)
    end
  end

  def prevent_last_active_owner_demotion
    return unless role_was == 'owner' && status_was == 'active'
    return unless (role_changed? && role != 'owner') || (status_changed? && status != 'active')
    return unless company

    if company.company_members.active.where(role: :owner).where.not(id: id).empty?
      errors.add(:base, 'A empresa não pode ficar sem nenhum proprietário (owner) ativo.')
    end
  end

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
