module Sales
  module Contacts
    class NextActionResolver
      def self.resolve(contact)
        next_task = contact.tasks.where(completed_at: nil).order(due_at: :asc, created_at: :asc).first

        unless next_task
          return { next_action_at: nil, next_action_type: nil, next_action_title: nil }
        end

        {
          next_action_at: next_task.due_at || next_task.created_at,
          next_action_type: 'task',
          next_action_title: next_task.title
        }
      end
    end
  end
end
