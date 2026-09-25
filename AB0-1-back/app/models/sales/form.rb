module Sales
  class Form < ApplicationRecord
    self.table_name = 'sales_forms'
    belongs_to :company, optional: true
    belongs_to :campaign, class_name: 'Sales::Campaign', optional: true
    has_many :submissions, class_name: 'Sales::FormSubmission', dependent: :destroy
    validates :name, :slug, presence: true
    validates :public_key, presence: true, uniqueness: true

    before_validation :assign_public_key, on: :create

    private

    def assign_public_key
      self.public_key ||= SecureRandom.urlsafe_base64(32)
    end
  end
end
