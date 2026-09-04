# frozen_string_literal: true

module Sales
  class TenantScope
    attr_reader :user

    def initialize(user)
      @user = user
    end

    def self.for(user)
      new(user)
    end

    def admin?
      user&.admin? || false
    end

    def user_company_id
      user&.company_id
    end

    def tenant_user_ids
      return [] if user.nil?
      return [user.id] if user_company_id.blank?

      User.where(company_id: user_company_id).pluck(:id)
    end

    def accounts
      return ::Sales::Account.all if admin?
      return ::Sales::Account.where(owner_id: user.id) if user_company_id.blank?

      ::Sales::Account.where(owner_id: tenant_user_ids).or(::Sales::Account.where(company_id: user_company_id))
    end

    def contacts
      return ::Sales::Contact.all if admin?

      acc_ids = accounts.select(:id)
      ::Sales::Contact.where(sales_account_id: acc_ids).or(::Sales::Contact.where(user_id: tenant_user_ids))
    end

    def opportunities
      return ::Sales::Opportunity.all if admin?

      acc_ids = accounts.select(:id)
      ::Sales::Opportunity.where(sales_account_id: acc_ids).or(::Sales::Opportunity.where(owner_id: tenant_user_ids))
    end

    def tasks
      return ::Sales::Task.all if admin?

      acc_ids = accounts.select(:id)
      opp_ids = opportunities.select(:id)
      cnt_ids = contacts.select(:id)

      ::Sales::Task.where(assignee_id: tenant_user_ids)
                   .or(::Sales::Task.where(sales_account_id: acc_ids))
                   .or(::Sales::Task.where(sales_opportunity_id: opp_ids))
                   .or(::Sales::Task.where(sales_contact_id: cnt_ids))
    end

    def activities
      return ::Sales::Activity.all if admin?

      acc_ids = accounts.select(:id)
      opp_ids = opportunities.select(:id)
      cnt_ids = contacts.select(:id)

      ::Sales::Activity.where(actor_id: tenant_user_ids)
                       .or(::Sales::Activity.where(sales_account_id: acc_ids))
                       .or(::Sales::Activity.where(sales_opportunity_id: opp_ids))
                       .or(::Sales::Activity.where(sales_contact_id: cnt_ids))
    end

    def email_messages
      return ::Sales::EmailMessage.all if admin?
      return ::Sales::EmailMessage.where(company_id: user_company_id) if user_company_id.present?

      acc_ids = accounts.select(:id)
      cnt_ids = contacts.select(:id)
      ::Sales::EmailMessage.where(sales_account_id: acc_ids).or(::Sales::EmailMessage.where(sales_contact_id: cnt_ids))
    end

    def tags
      return ::Sales::Tag.all if admin?
      return ::Sales::Tag.where(company_id: user_company_id) if user_company_id.present?

      ::Sales::Tag.where(created_by_id: user.id)
    end

    def saved_views
      return ::Sales::SavedView.all if admin?
      return ::Sales::SavedView.where(company_id: user_company_id) if user_company_id.present?

      ::Sales::SavedView.where(user_id: user.id)
    end
  end
end
