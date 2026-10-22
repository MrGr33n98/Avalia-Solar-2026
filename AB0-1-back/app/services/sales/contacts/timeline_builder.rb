module Sales
  module Contacts
    class TimelineBuilder
      def self.build(contact, scope: nil)
        events = []

        activities = scope ? scope.activities.where(sales_contact_id: contact.id) : contact.activities
        tasks = scope ? scope.tasks.where(sales_contact_id: contact.id) : contact.tasks
        opportunity_contacts = contact.opportunity_contacts
        if scope
          allowed_opportunity_ids = scope.opportunities.select(:id)
          opportunity_contacts = opportunity_contacts.where(sales_opportunity_id: allowed_opportunity_ids)
        end

        activities.includes(:actor).order(occurred_at: :desc).each do |act|
          act_kind = act.activity_type == 'call' ? 'call' : 'activity'
          events << {
            id: "act-#{act.id}",
            type: act_kind,
            kind: act_kind,
            activity_type: act.activity_type,
            title: act.activity_type == 'call' ? 'Chamada Registrada' : 'Atividade Comercial',
            description: act.description || act.body,
            occurred_at: act.occurred_at || act.created_at,
            actor: act.actor ? { id: act.actor.id, name: act.actor.name } : nil
          }
        end

        tasks.includes(:owner).each do |t|
          events << {
            id: "task-#{t.id}",
            type: 'task',
            kind: 'task',
            title: "Tarefa: #{t.title}",
            description: "Status: #{t.status || (t.completed_at ? 'Concluída' : 'Pendente')}",
            occurred_at: t.completed_at || t.due_at || t.created_at,
            actor: t.owner ? { id: t.owner.id, name: t.owner.name } : nil
          }
        end

        opportunity_contacts.includes(:opportunity).each do |oc|
          if oc.opportunity
            events << {
              id: "opp-#{oc.id}",
              type: 'stage_changed',
              kind: 'stage_changed',
              title: "Vínculo a Oportunidade #{oc.opportunity.name}",
              description: "Papel no Comitê: #{oc.role || 'Membro'}",
              occurred_at: oc.created_at
            }
          end
        end

        emails_query = scope ? scope.email_messages.where(sales_contact_id: contact.id) : contact.email_messages

        emails_query.includes(:events, :sender_user).order(created_at: :desc).each do |email|
          opens = email.respond_to?(:open_count) ? email.open_count.to_i : email.events.count { |ev| ev.event_type == 'open' }
          clicks = email.respond_to?(:click_count) ? email.click_count.to_i : email.events.count { |ev| ev.event_type == 'click' }

          events << {
            id: "email-#{email.id}",
            type: 'email',
            kind: 'email',
            title: email.subject.presence || 'E-mail Comercial Enviado',
            subject: email.subject,
            description: email.body_text.presence || "#{email.status} - #{email.to_email}",
            body_snippet: email.body_text&.truncate(220),
            body_text: email.body_text,
            body_html: email.body_html,
            from_email: email.from_email,
            to_email: email.to_email,
            status: email.status,
            delivered_at: email.delivered_at,
            first_opened_at: email.first_opened_at,
            last_opened_at: email.last_opened_at,
            opens_count: opens,
            clicks_count: clicks,
            occurred_at: email.sent_at || email.created_at,
            actor: email.sender_user ? { id: email.sender_user.id, name: email.sender_user.name } : nil
          }
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
