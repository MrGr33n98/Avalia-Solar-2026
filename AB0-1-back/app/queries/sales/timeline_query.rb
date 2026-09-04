# frozen_string_literal: true

module Sales
  class TimelineQuery
    def self.call(entity:, type: nil, page: 1, per_page: 50)
      events = []

      # 1. Activities
      if entity.respond_to?(:activities)
        entity.activities.each do |act|
          events << {
            id: "act-#{act.id}",
            type: act.activity_type || 'activity',
            title: act.subject || 'Atividade registrada',
            description: act.body || act.notes,
            occurred_at: act.occurred_at || act.created_at,
            actor: act.actor ? { id: act.actor.id, name: act.actor.name } : nil,
            entity: { type: entity.class.name, id: entity.id },
            metadata: { activity_id: act.id }
          }
        end
      end

      # 2. Tasks
      if entity.respond_to?(:tasks)
        entity.tasks.each do |t|
          events << {
            id: "task-#{t.id}",
            type: 'task',
            title: t.title || 'Tarefa',
            description: t.description,
            occurred_at: t.completed_at || t.due_at || t.created_at,
            actor: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : nil,
            entity: { type: entity.class.name, id: entity.id },
            metadata: { task_id: t.id, status: t.completed_at ? 'completed' : 'pending' }
          }
        end
      end

      # 3. Stage Histories (for Opportunity)
      if entity.is_a?(::Sales::Opportunity) && entity.respond_to?(:stage_histories)
        entity.stage_histories.includes(:to_stage, :actor).each do |sh|
          events << {
            id: "sh-#{sh.id}",
            type: 'stage_change',
            title: "Estágio alterado para #{sh.to_stage&.name}",
            description: "Oportunidade movida para o estágio #{sh.to_stage&.name}",
            occurred_at: sh.entered_at || sh.created_at,
            actor: sh.actor ? { id: sh.actor.id, name: sh.actor.name } : nil,
            entity: { type: 'Sales::Opportunity', id: entity.id },
            metadata: { stage_id: sh.sales_stage_id, stage_name: sh.to_stage&.name }
          }
        end
      end

      # 4. Email Messages
      if entity.respond_to?(:email_messages)
        entity.email_messages.each do |em|
          events << {
            id: "email-#{em.id}",
            type: 'email',
            title: em.subject || 'E-mail enviado',
            description: em.snippet || em.body_text,
            occurred_at: em.sent_at || em.created_at,
            actor: em.sender ? { id: em.sender.id, name: em.sender.name } : nil,
            entity: { type: entity.class.name, id: entity.id },
            metadata: { email_id: em.id, status: em.status }
          }
        end
      end

      # Filter by type if provided
      events = events.select { |e| e[:type].to_s == type.to_s } if type.present?

      # Sort descending by occurred_at
      events.sort_by! { |e| e[:occurred_at] || Time.at(0) }.reverse!

      total_count = events.length
      page_num = [page.to_i, 1].max
      per_page_num = [[per_page.to_i, 1].max, 100].min
      paged_events = events.slice((page_num - 1) * per_page_num, per_page_num) || []

      {
        timeline: paged_events,
        meta: {
          page: page_num,
          per_page: per_page_num,
          total: total_count,
          pages: (total_count.to_f / per_page_num).ceil
        }
      }
    end
  end
end
