module Sales
  class Account < ApplicationRecord
    self.table_name = 'sales_accounts'

    belongs_to :company, optional: true
    belongs_to :owner, class_name: 'User'

    has_many :taggings, as: :taggable, class_name: 'Sales::Tagging', dependent: :destroy
    has_many :tags, through: :taggings, source: :tag
    has_many :contacts, class_name: 'Sales::Contact', foreign_key: :sales_account_id, dependent: :destroy
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :sales_account_id, dependent: :destroy
    has_many :activities, class_name: 'Sales::Activity', foreign_key: :sales_account_id, dependent: :destroy
    has_many :tasks, class_name: 'Sales::Task', foreign_key: :sales_account_id, dependent: :destroy
    has_many :solar_projects, class_name: 'Sales::SolarProject', foreign_key: :account_id, dependent: :destroy

    has_many :contact_employments, class_name: 'Sales::ContactEmployment', foreign_key: :sales_account_id, dependent: :destroy
    has_many :employed_contacts, through: :contact_employments, source: :contact

    validates :name, presence: true

    after_commit :invalidate_account_cache

    def last_contact_at
      activities.maximum(:occurred_at) || activities.maximum(:created_at) || created_at
    end

    private

    def invalidate_account_cache
      tenant_key = company_id || owner_id
      return unless tenant_key
      Rails.cache.increment("crm:v2:tenant:#{tenant_key}:accounts_ver", 1, initial: 1)
    rescue => e
      Rails.logger.warn("[CacheInvalidation] #{e.message}")
    end
  end
end
