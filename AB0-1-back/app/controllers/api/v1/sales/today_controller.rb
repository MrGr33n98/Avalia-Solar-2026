module Api
  module V1
    module Sales
      class TodayController < BaseController
        def index
          now = Time.current
          beginning_of_day = now.beginning_of_day
          end_of_day = now.end_of_day

          tasks_scope = current_tenant_scope.tasks
          tasks_scope = tasks_scope.where(owner_id: current_user.id) unless team_queue_access?
          tasks_scope = tasks_scope.includes(:account, :contact, :opportunity)

          overdue_tasks = tasks_scope.where('due_at < ? AND completed_at IS NULL', beginning_of_day).order(:due_at)
          today_tasks = tasks_scope.where(due_at: beginning_of_day..end_of_day, completed_at: nil).order(:due_at)
          upcoming_tasks = tasks_scope.where('due_at > ? AND completed_at IS NULL', end_of_day).order(:due_at).limit(20)

          opps_scope = opportunities_for_today.open.includes(:account, :primary_contact)

          # Open opportunities with no future task
          opps_no_action = opps_scope.where(next_activity_at: nil).limit(20)

          # Stale deals (>5 days without activity)
          stale_opps = opps_scope.where('last_activity_at IS NULL OR last_activity_at < ?', 5.days.ago)
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

        def team_queue_access?
          ::Sales::AuthorizationService.can?(user: current_user, resource: 'tasks', action: 'read_team') ||
            ::Sales::AuthorizationService.can?(user: current_user, resource: 'tasks', action: 'manage')
        end

        def opportunities_for_today
          scope = current_tenant_scope
          opportunities = scope.opportunities
          return opportunities if team_queue_access?

          opportunities.where(owner_id: current_user.id)
        end

        def serialize_task(t)
          scope = current_tenant_scope
          contact = t.contact if t.contact && scope.valid_relation?(account: t.account, contact: t.contact)
          opportunity = t.opportunity if t.opportunity && scope.valid_relation?(account: t.account, opportunity: t.opportunity)
          relations_valid = scope.valid_relation?(account: t.account, contact: contact, opportunity: opportunity)
          contact = nil unless relations_valid
          opportunity = nil unless relations_valid
          {
            id: t.id,
            title: t.title,
            description: t.description,
            due_at: t.due_at,
            priority: t.priority,
            task_type: t.task_type,
            account_id: t.sales_account_id,
            account_name: t.account&.name,
            contact_id: contact&.id,
            contact_name: contact ? [contact.first_name, contact.last_name].compact.join(' ') : nil,
            opportunity_id: opportunity&.id
          }
        end

        def serialize_opportunity(o)
          contact = o.primary_contact
          contact = nil unless contact && current_tenant_scope.valid_relation?(account: o.account, contact: contact, opportunity: o)
          {
            id: o.id,
            name: o.name,
            account_id: o.sales_account_id,
            account_name: o.account&.name,
            value_cents: o.value_cents,
            probability: o.probability,
            last_activity_at: o.last_activity_at,
            primary_contact_name: contact ? [contact.first_name, contact.last_name].compact.join(' ') : nil
          }
        end
      end
    end
  end
end
