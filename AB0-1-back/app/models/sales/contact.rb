module Sales
  class Contact < ApplicationRecord
    self.table_name = 'sales_contacts'

    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    alias_attribute :account_id, :sales_account_id

    belongs_to :user, optional: true
    alias_attribute :owner_id, :user_id
    belongs_to :owner, class_name: 'User', foreign_key: :user_id, optional: true

    has_many :taggings, as: :taggable, class_name: 'Sales::Tagging', dependent: :destroy
    has_many :tags, through: :taggings, source: :tag
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :primary_contact_id, dependent: :nullify

    has_many :contact_employments, class_name: 'Sales::ContactEmployment', foreign_key: :sales_contact_id, dependent: :destroy
    has_many :employments, class_name: 'Sales::ContactEmployment', foreign_key: :sales_contact_id, dependent: :destroy
    has_many :related_accounts, through: :contact_employments, source: :account

    has_many :opportunity_contacts, class_name: 'Sales::OpportunityContact', foreign_key: :sales_contact_id, dependent: :destroy
    has_many :buying_opportunities, through: :opportunity_contacts, source: :opportunity

    has_many :activities, class_name: 'Sales::Activity', foreign_key: :sales_contact_id, dependent: :nullify
    has_many :tasks, class_name: 'Sales::Task', foreign_key: :sales_contact_id, dependent: :nullify
    has_many :email_messages, class_name: "Sales::EmailMessage", foreign_key: :sales_contact_id, dependent: :nullify

    validates :first_name, presence: true

    after_create :ensure_initial_employment

    private

    def ensure_initial_employment
      return if sales_account_id.blank?

      contact_employments.find_or_create_by!(sales_account_id: sales_account_id) do |e|
        e.job_title = job_title
        e.relationship_type = 'employee'
        e.is_current = true
        e.is_primary = true
      end
    end
  end
end
