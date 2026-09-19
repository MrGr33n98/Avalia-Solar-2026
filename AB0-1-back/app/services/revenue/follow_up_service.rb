# frozen_string_literal: true

module Revenue
  class FollowUpService < BaseService
    def self.prepare(user:, arguments: {})
      new(user: user, arguments: arguments).prepare
    end

    def self.create_internal_task(user:, arguments: {})
      new(user: user, arguments: arguments).create_internal_task
    end

    def self.list_due(user:, arguments: {})
      new(user: user, arguments: arguments).list_due
    end

    def prepare
      opportunity = find_opportunity!
      account = opportunity.account
      next_action = Sales::NextBestActionResolver.resolve(account)

      {
        opportunity_id: opportunity.id,
        account_id: account.id,
        suggested_action: next_action,
        external_communication: 'not_requested',
        approval_required: false
      }
    end

    def create_internal_task
      opportunity = find_opportunity!
      idempotency_key = required!(:idempotency_key).to_s
      title = required!(:title).to_s
      due_at = Time.zone.parse(arguments[:due_at].to_s) if arguments[:due_at].present?

      task = Sales::Task.find_or_initialize_by(sales_account_id: opportunity.sales_account_id,
                                               idempotency_key: idempotency_key)
      created = task.new_record?
      if created
        task.opportunity = opportunity
        task.owner = user
        task.task_type = arguments[:task_type].presence || 'follow_up'
        task.title = title
        task.status = 'pending'
        task.due_at = due_at
        task.save!
      end

      { task_id: task.id, opportunity_id: opportunity.id, idempotent: !created }
    end

    def list_due
      scope = tenant_scope.tasks.pending.where.not(due_at: nil).where('due_at <= ?', Time.current).order(due_at: :asc)
      {
        records: scope.limit(bounded_limit).map do |task|
          {
            id: task.id,
            account_id: task.sales_account_id,
            opportunity_id: task.sales_opportunity_id,
            title: task.title,
            task_type: task.task_type,
            due_at: task.due_at.iso8601,
            status: task.status
          }
        end,
        total_count: scope.count
      }
    end
  end
end
