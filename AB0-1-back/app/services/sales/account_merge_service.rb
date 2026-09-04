# frozen_string_literal: true

module Sales
  class AccountMergeService
    attr_reader :tenant_scope, :master_account_id, :duplicate_account_id, :current_user

    def initialize(tenant_scope:, master_account_id:, duplicate_account_id:, current_user:)
      @tenant_scope = tenant_scope
      @master_account_id = master_account_id.to_i
      @duplicate_account_id = duplicate_account_id.to_i
      @current_user = current_user
    end

    def self.call(tenant_scope:, master_account_id:, duplicate_account_id:, current_user:)
      new(
        tenant_scope: tenant_scope,
        master_account_id: master_account_id,
        duplicate_account_id: duplicate_account_id,
        current_user: current_user
      ).call
    end

    def call
      raise ArgumentError, 'Master e duplicado não podem ser a mesma empresa.' if master_account_id == duplicate_account_id

      master = tenant_scope.find(master_account_id)
      duplicate = tenant_scope.find(duplicate_account_id)

      ActiveRecord::Base.transaction do
        # 1. Reassign contacts
        duplicate.contacts.update_all(sales_account_id: master.id)

        # 2. Reassign opportunities
        duplicate.opportunities.update_all(sales_account_id: master.id)

        # 3. Reassign activities
        duplicate.activities.update_all(sales_account_id: master.id)

        # 4. Reassign tasks
        duplicate.tasks.update_all(sales_account_id: master.id)

        # 5. Reassign solar projects
        duplicate.solar_projects.update_all(sales_account_id: master.id)

        # 6. Fill missing attributes on master if blank
        master.phone ||= duplicate.phone
        master.email ||= duplicate.email
        master.domain ||= duplicate.domain
        master.website ||= duplicate.website
        master.city ||= duplicate.city
        master.state ||= duplicate.state
        master.segment ||= duplicate.segment
        master.save!

        # 7. Destroy duplicate account
        duplicate.destroy!

        # 8. Emit domain event
        begin
          DomainEvent.create!(
            event_type: 'sales.account.merged',
            aggregate_type: 'Sales::Account',
            aggregate_id: master.id,
            occurred_at: Time.current,
            status: 'pending',
            payload: {
              master_account_id: master.id,
              duplicate_account_id: duplicate_account_id,
              actor_id: current_user.id
            }
          )
        rescue => e
          Rails.logger.warn("[DomainEvent] Failed to emit sales.account.merged event: #{e.message}")
        end
      end

      { success: true, message: 'Empresas mescladas com sucesso.', master_account_id: master.id }
    end
  end
end
