class BannerAuditLog < ApplicationRecord
  belongs_to :auditable, polymorphic: true
  belongs_to :actor, polymorphic: true, optional: true

  validates :action, presence: true
end
