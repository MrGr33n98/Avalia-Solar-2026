# frozen_string_literal: true

module Sales
  module Reporting
    class TaskPerformanceQuery
      def self.call(user:, date_range: nil)
        tasks = ::Sales::TenantScope.for(user).tasks
        tasks = tasks.where(created_at: date_range) if date_range

        total = tasks.count
        return default_metrics if total.zero?

        completed = tasks.where(status: 'completed')
        completed_on_time = completed.where('completed_at IS NOT NULL AND due_at IS NOT NULL AND completed_at <= due_at').count
        completed_late = completed.where('completed_at IS NOT NULL AND due_at IS NOT NULL AND completed_at > due_at').count
        completed_no_due = completed.where(due_at: nil).count

        pending = tasks.where(status: %w[pending in_progress])
        now = Time.current
        pending_on_time = pending.where('due_at IS NULL OR due_at >= ?', now).count
        pending_overdue = pending.where('due_at IS NOT NULL AND due_at < ?', now).count

        on_time_rate = completed.count.positive? ? ((completed_on_time.to_f / completed.count) * 100).round(1) : 0.0

        {
          total: total,
          completed: completed.count,
          completed_on_time: completed_on_time,
          completed_late: completed_late,
          completed_without_due_date: completed_no_due,
          pending: pending.count,
          pending_on_time: pending_on_time,
          pending_overdue: pending_overdue,
          on_time_rate: on_time_rate
        }
      end

      def self.default_metrics
        {
          total: 0,
          completed: 0,
          completed_on_time: 0,
          completed_late: 0,
          completed_without_due_date: 0,
          pending: 0,
          pending_on_time: 0,
          pending_overdue: 0,
          on_time_rate: 0.0
        }
      end
    end
  end
end
