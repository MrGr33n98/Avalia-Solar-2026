module Sales
  module Contacts
    class LastContactResolver
      def self.resolve(contact, scope: nil)
        activities = scope ? scope.activities.where(sales_contact_id: contact.id) : contact.activities
        tasks = scope ? scope.tasks.where(sales_contact_id: contact.id) : contact.tasks
        latest_act = activities.order(occurred_at: :desc).first
        latest_task = tasks.where.not(completed_at: nil).order(completed_at: :desc).first

        candidates = []

        if latest_act
          candidates << {
            at: latest_act.occurred_at || latest_act.created_at,
            type: latest_act.activity_type || 'activity',
            title: latest_act.subject || 'Atividade Comercial'
          }
        end

        if latest_task
          candidates << {
            at: latest_task.completed_at,
            type: 'task',
            title: latest_task.title
          }
        end

        latest = candidates.max_by { |c| c[:at] }
        return { last_contact_at: nil, last_contact_type: nil, last_contact_title: nil } unless latest

        {
          last_contact_at: latest[:at],
          last_contact_type: latest[:type],
          last_contact_title: latest[:title]
        }
      end
    end
  end
end
