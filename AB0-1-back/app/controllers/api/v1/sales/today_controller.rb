module Api
  module V1
    module Sales
      class TodayController < BaseController
        def index
          now = Time.current
          beginning_of_day = now.beginning_of_day
          end_of_day = now.end_of_day

          tasks_scope = ::Sales::Task.includes(:account, :contact, :opportunity)

          overdue_tasks = tasks_scope.where('due_at < ? AND completed_at IS NULL', beginning_of_day).order(:due_at)
          today_tasks = tasks_scope.where(due_at: beginning_of_day..end_of_day, completed_at: nil).order(:due_at)
          upcoming_tasks = tasks_scope.where('due_at > ? AND completed_at IS NULL', end_of_day).order(:due_at).limit(20)

          # Open opportunities with no future task
          opps_no_action = ::Sales::Opportunity.open.includes(:account, :primary_contact).where(next_activity_at: nil).limit(20)

          # Stale deals (>5 days without activity)
          stale_opps = ::Sales::Opportunity.open.includes(:account, :primary_contact)
                                           .where('last_activity_at IS NULL OR last_activity_at < ?', 5.days.ago)
                                           .order(:last_activity_at).limit(20)

          render json: {
            overdue: overdue_tasks.map { |t| serialize_task(t) },
            today: today_tasks.map { |t| serialize_task(t) },
            no_next_action: opps_no_action.map { |o| serialize_opportunity(o) },
            stale: stale_opps.map { |o| serialize_opportunity(o) },
            upcoming: upcoming_tasks.map { |t| serialize_task(t) }
          }
        end

        private

        def serialize_task(t)
          {
            id: t.id,
            title: t.title,
            description: t.description,
            due_at: t.due_at,
            priority: t.priority,
            task_type: t.task_type,
            account_id: t.sales_account_id,
            account_name: t.account&.name,
            contact_id: t.sales_contact_id,
            contact_name: t.contact ? [t.contact.first_name, t.contact.last_name].compact.join(' ') : nil,
            opportunity_id: t.sales_opportunity_id
          }
        end

        def serialize_opportunity(o)
          {
            id: o.id,
            name: o.name,
            account_id: o.sales_account_id,
            account_name: o.account&.name,
            value_cents: o.value_cents,
            probability: o.probability,
            last_activity_at: o.last_activity_at,
            primary_contact_name: o.primary_contact ? [o.primary_contact.first_name, o.primary_contact.last_name].compact.join(' ') : nil
          }
        end
      end
    end
  end
end
