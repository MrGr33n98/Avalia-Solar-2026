module Sales
  module Contacts
    class TimelineBuilder
      def self.build(contact)
        events = []

        contact.activities.order(occurred_at: :desc).each do |act|
          events << {
            id: "act-#{act.id}",
            type: act.activity_type == 'call' ? 'call' : 'activity',
            title: act.activity_type == 'call' ? 'Chamada Registrada' : 'Atividade Comercial',
            description: act.description || act.body,
            occurred_at: act.occurred_at || act.created_at,
            actor: act.user ? { id: act.user.id, name: act.user.name } : nil
          }
        end

        contact.tasks.each do |t|
          events << {
            id: "task-#{t.id}",
            type: 'task',
            title: "Tarefa: #{t.title}",
            description: "Status: #{t.status || (t.completed_at ? 'Concluída' : 'Pendente')}",
            occurred_at: t.completed_at || t.due_at || t.created_at,
            actor: t.user ? { id: t.user.id, name: t.user.name } : nil
          }
        end

        contact.opportunity_contacts.includes(:opportunity).each do |oc|
          if oc.opportunity
            events << {
              id: "opp-#{oc.id}",
              type: 'stage_changed',
              title: "Vínculo a Oportunidade #{oc.opportunity.name}",
              description: "Papel no Comitê: #{oc.role || 'Membro'}",
              occurred_at: oc.created_at
            }
          end
        end

        events << {
          id: "contact-created-#{contact.id}",
          type: 'website',
          title: 'Contato Cadastrado no CRM',
          description: "Contato #{contact.first_name} #{contact.last_name} registrado.",
          occurred_at: contact.created_at
        }

        events.sort_by! { |e| e[:occurred_at] || Time.current }.reverse!
        events
      end
    end
  end
end
