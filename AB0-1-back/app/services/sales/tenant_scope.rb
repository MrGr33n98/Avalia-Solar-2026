# frozen_string_literal: true

module Sales
  class TenantScope
    attr_reader :user

    def initialize(target_user = nil, user: nil)
      @user = target_user || user
      @user = @user[:user] if @user.is_a?(Hash) && @user.key?(:user)
    end

    def self.for(user = nil, **kwargs)
      new(user, **kwargs)
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

      # company_id is the canonical tenant anchor when present. A mismatched
      # owner is treated as legacy corruption and must not grant access.
      tenant_accounts = ::Sales::Account.where(company_id: user_company_id)
                                        .where('owner_id IS NULL OR owner_id IN (?)', tenant_user_ids)
      legacy_accounts = ::Sales::Account.where(company_id: nil, owner_id: tenant_user_ids)
      tenant_accounts.or(legacy_accounts)
    end

    def contacts
      return ::Sales::Contact.all if admin?

      acc_ids = accounts.select(:id)
      ::Sales::Contact.where(sales_account_id: acc_ids)
    end

    def opportunities
      return ::Sales::Opportunity.all if admin?

      acc_ids = accounts.select(:id)
      ::Sales::Opportunity.where(sales_account_id: acc_ids, owner_id: tenant_user_ids)
    end

    def tasks
      return ::Sales::Task.all if admin?

      acc_ids = accounts.select(:id)
      ::Sales::Task.where(sales_account_id: acc_ids, owner_id: tenant_user_ids)
                   .where(<<~SQL.squish)
                     (sales_contact_id IS NULL OR EXISTS (
                       SELECT 1 FROM sales_contacts c
                       WHERE c.id = sales_tasks.sales_contact_id
                         AND (c.sales_account_id = sales_tasks.sales_account_id OR EXISTS (
                           SELECT 1 FROM sales_contact_employments ce
                           WHERE ce.sales_contact_id = c.id
                             AND ce.sales_account_id = sales_tasks.sales_account_id
                             AND ce.is_current = TRUE
                         ))
                     ))
                     AND (sales_opportunity_id IS NULL OR EXISTS (
                       SELECT 1 FROM sales_opportunities o
                       WHERE o.id = sales_tasks.sales_opportunity_id
                         AND o.sales_account_id = sales_tasks.sales_account_id
                     ))
                   SQL
    end

    def activities
      return ::Sales::Activity.all if admin?

      acc_ids = accounts.select(:id)
      ::Sales::Activity.where(sales_account_id: acc_ids, actor_id: tenant_user_ids)
                       .where(<<~SQL.squish)
                         (sales_contact_id IS NULL OR EXISTS (
                           SELECT 1 FROM sales_contacts c
                           WHERE c.id = sales_activities.sales_contact_id
                             AND (c.sales_account_id = sales_activities.sales_account_id OR EXISTS (
                               SELECT 1 FROM sales_contact_employments ce
                               WHERE ce.sales_contact_id = c.id
                                 AND ce.sales_account_id = sales_activities.sales_account_id
                                 AND ce.is_current = TRUE
                             ))
                         ))
                         AND (sales_opportunity_id IS NULL OR EXISTS (
                           SELECT 1 FROM sales_opportunities o
                           WHERE o.id = sales_activities.sales_opportunity_id
                             AND o.sales_account_id = sales_activities.sales_account_id
                         ))
                       SQL
    end

    def email_messages
      scope = ::Sales::EmailMessage.all
      unless admin?
        return ::Sales::EmailMessage.none if user_company_id.blank?

        scope = scope.where(company_id: user_company_id, sender_user_id: tenant_user_ids)
                     .where('sales_account_id IS NULL OR sales_account_id IN (?)', accounts.select(:id))
                     .where('sales_contact_id IS NULL OR sales_contact_id IN (?)', contacts.select(:id))
                     .where('sales_opportunity_id IS NULL OR sales_opportunity_id IN (?)', opportunities.select(:id))
      end

      scope.where(<<~SQL.squish)
        (sales_contact_id IS NULL OR EXISTS (
          SELECT 1 FROM sales_contacts c
          WHERE c.id = sales_email_messages.sales_contact_id
            AND (sales_email_messages.sales_account_id IS NULL OR c.sales_account_id = sales_email_messages.sales_account_id OR EXISTS (
              SELECT 1 FROM sales_contact_employments ce
              WHERE ce.sales_contact_id = c.id
                AND ce.sales_account_id = sales_email_messages.sales_account_id
                AND ce.is_current = TRUE
            ))
        ))
        AND (sales_opportunity_id IS NULL OR EXISTS (
          SELECT 1 FROM sales_opportunities o
          WHERE o.id = sales_email_messages.sales_opportunity_id
            AND (sales_email_messages.sales_account_id IS NULL OR o.sales_account_id = sales_email_messages.sales_account_id)
        ))
        AND (sales_contact_id IS NULL OR sales_opportunity_id IS NULL OR EXISTS (
          SELECT 1 FROM sales_contacts c
          JOIN sales_opportunities o ON o.id = sales_email_messages.sales_opportunity_id
          WHERE c.id = sales_email_messages.sales_contact_id
            AND (c.sales_account_id = o.sales_account_id OR EXISTS (
              SELECT 1 FROM sales_contact_employments ce
              WHERE ce.sales_contact_id = c.id
                AND ce.sales_account_id = o.sales_account_id
                AND ce.is_current = TRUE
            ))
        ))
      SQL
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

    def notes
      return ::Sales::Note.all if admin? && defined?(::Sales::Note)

      acc_ids = accounts.select(:id)
      contact_ids = contacts.select(:id)
      opportunity_ids = opportunities.select(:id)
      candidates = ::Sales::Note.where(account_id: acc_ids)
                                .or(::Sales::Note.where(contact_id: contact_ids))
                                .or(::Sales::Note.where(opportunity_id: opportunity_ids))
      candidates = candidates.or(::Sales::Note.where(author_id: tenant_user_ids))
      candidates.includes(:account, :contact, :opportunity, :company, :author)
                .select { |note| valid_note_relations?(note) }
                .then { |safe| ::Sales::Note.where(id: safe.map(&:id)) }
    end

    def email_events
      return ::Sales::EmailEvent.all if admin?

      msg_ids = email_messages.select(:id)
      ::Sales::EmailEvent.where(sales_email_message_id: msg_ids)
    end

    def quotes
      return ::Sales::Quote.all if admin?

      opp_ids = opportunities.select(:id)
      ::Sales::Quote.where(opportunity_id: opp_ids)
    end

    def quote_items
      return ::Sales::QuoteItem.all if admin?

      quote_ids = quotes.select(:id)
      ::Sales::QuoteItem.where(sales_quote_id: quote_ids)
    end

    def sequences
      return ::Sales::Sequence.all if admin? && defined?(::Sales::Sequence)
      return ::Sales::Sequence.where(company_id: user_company_id) if user_company_id.present? && defined?(::Sales::Sequence)

      defined?(::Sales::Sequence) ? ::Sales::Sequence.where(created_by_id: user.id) : ::Sales::Opportunity.none
    end

    def campaigns
      return ::Sales::Campaign.all if admin? && defined?(::Sales::Campaign)
      return ::Sales::Campaign.where(company_id: user_company_id) if user_company_id.present? && defined?(::Sales::Campaign)

      defined?(::Sales::Campaign) ? ::Sales::Campaign.where(created_by_id: user.id) : ::Sales::Opportunity.none
    end

    def custom_field_definitions
      return ::Sales::CustomFieldDefinition.all if admin? && defined?(::Sales::CustomFieldDefinition)
      return ::Sales::CustomFieldDefinition.where(company_id: user_company_id) if user_company_id.present? && defined?(::Sales::CustomFieldDefinition)

      defined?(::Sales::CustomFieldDefinition) ? ::Sales::CustomFieldDefinition.all : ::Sales::Opportunity.none
    end

    # ── Referencing & Multi-Entity Referential Integrity Helpers (T003) ──

    def valid_relation?(account:, contact: nil, opportunity: nil)
      return false if account.nil?
      return false unless accounts.exists?(id: account.id)

      if contact.present?
        return false unless contacts.exists?(id: contact.id)
        return false unless contact_linked_to_account?(contact, account)
      end

      if opportunity.present?
        return false unless opportunities.exists?(id: opportunity.id)
        return false unless opportunity.sales_account_id == account.id
      end

      true
    end

    def valid_employment?(contact:, account:)
      return false if contact.nil? || account.nil?
      return false unless contacts.exists?(id: contact.id)
      return false unless accounts.exists?(id: account.id)

      tenant_key_for(contact.account) == tenant_key_for(account) && tenant_key_for(account).present?
    end

    def contact_linked_to_account?(contact, account)
      return true if contact.sales_account_id == account.id

      defined?(::Sales::ContactEmployment) &&
        ::Sales::ContactEmployment.where(sales_contact_id: contact.id, sales_account_id: account.id, is_current: true).exists?
    end

    def valid_owner?(owner, account:)
      return false if owner.nil? || account.nil?
      return false if account.company_id.present? && account.owner&.company_id.present? && account.owner.company_id != account.company_id

      tenant_id = account.company_id || account.owner&.company_id
      return owner.id == account.owner_id if tenant_id.blank?

      owner.company_id == tenant_id
    end

    def tenant_key_for(account)
      return nil unless account

      if account.company_id.present?
        return nil if account.owner&.company_id.present? && account.owner.company_id != account.company_id

        [:company, account.company_id]
      else
        [:owner, account.owner_id]
      end
    end

    def valid_note_relations?(note, account: note.account, contact: note.contact, opportunity: note.opportunity)
      anchor_account = account || opportunity&.account || contact&.account
      unless anchor_account
        return note.company_id.present? && note.company_id == user_company_id if user_company_id.present?

        return note.author_id == user&.id
      end
      return false if contact && !contact_linked_to_account?(contact, anchor_account)
      return false if opportunity && opportunity.sales_account_id != anchor_account.id

      relations = [anchor_account, contact&.account, opportunity&.account].compact
      return false if note.account_id.present? && !accounts.exists?(id: note.account_id)
      return false if note.contact_id.present? && !contacts.exists?(id: note.contact_id)
      return false if note.opportunity_id.present? && !opportunities.exists?(id: note.opportunity_id)

      tenant_keys = relations.map { |related_account| tenant_key_for(related_account) }.uniq
      return false unless tenant_keys.one? && tenant_keys.first.present?
      return false if note.company_id.present? && tenant_keys.first != [:company, note.company_id]
      return false if user_company_id.present? && tenant_keys.first != [:company, user_company_id]
      return false if note.author&.company_id.present? && tenant_keys.first != [:company, note.author.company_id]

      true
    end

  end
end
