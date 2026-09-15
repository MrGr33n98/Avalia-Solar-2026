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

        emails_query = if contact.email.present?
                         Sales::EmailMessage.where('sales_contact_id = ? OR LOWER(to_email) = ?', contact.id, contact.email.downcase.strip)
                       else
                         contact.email_messages
                       end

        emails_query.includes(:events, :sender_user).order(created_at: :desc).each do |email|
          opens = email.respond_to?(:open_count) ? email.open_count.to_i : email.events.count { |ev| ev.event_type == 'open' }
          clicks = email.respond_to?(:click_count) ? email.click_count.to_i : email.events.count { |ev| ev.event_type == 'click' }

          events << {
            id: "email-#{email.id}",
            type: 'email',
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
