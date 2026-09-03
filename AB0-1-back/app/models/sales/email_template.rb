# frozen_string_literal: true

module Sales
  class EmailTemplate < ApplicationRecord
    self.table_name = 'sales_email_templates'

    belongs_to :company

    belongs_to :user, optional: true

    validates :name, :subject_template, presence: true
  end
end
