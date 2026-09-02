module Sales
  class Form < ApplicationRecord
    self.table_name = 'sales_forms'
    belongs_to :company, optional: true
    belongs_to :campaign, class_name: 'Sales::Campaign', optional: true
    has_many :submissions, class_name: 'Sales::FormSubmission', dependent: :destroy
    validates :name, :slug, presence: true
  end
end
