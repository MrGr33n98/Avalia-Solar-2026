# frozen_string_literal: true

module Sales
  class TimelineBuilder
    def self.for_account(account, scope: nil)
      new(account: account, scope: scope).build
    end

    def self.for_contact(contact)
      new(contact: contact).build
    end

    def self.for_opportunity(opportunity)
      new(opportunity: opportunity).build
    end

    def initialize(account: nil, contact: nil, opportunity: nil, scope: nil)
      @account = account
      @contact = contact
      @opportunity = opportunity
      @scope = scope
    end

    def build
      events = []

      # Activities (Calls, Meetings, Notes, In-person)
      activities.each do |act|
        act_kind = act.activity_type == 'call' ? 'call' : (act.activity_type || 'activity')
        events << {
          id: "act-#{act.id}",
          type: act_kind,
          kind: act_kind,
          activity_type: act.activity_type,
          title: act.subject.presence || (act.activity_type == 'call' ? 'Chamada Registrada' : 'Atividade Comercial'),
          description: act.description || act.body,
          occurred_at: act.occurred_at || act.created_at,
          actor_name: act.actor&.name || 'Vendedor'
        }
      end

      # Tasks
      tasks.each do |t|
        events << {
          id: "task-#{t.id}",
          type: 'task',
          kind: 'task',
          title: "Tarefa: #{t.title}",
          description: "Status: #{t.status} | Prioridade: #{t.priority}",
          occurred_at: t.completed_at || t.created_at,
          actor_name: t.owner&.name
        }
      end

      # Opportunities / Stage changes
      opportunities.each do |o|
        events << {
          id: "opp-#{o.id}",
          type: 'stage_changed',
          kind: 'stage_changed',
          title: "Oportunidade #{o.name}",
          description: "Estágio: #{o.stage&.name || 'Prospect'} | Valor: R$ #{((o.value_cents || 0) / 100.0).round(2)}",
          occurred_at: o.created_at
        }
      end

      # Emails
      emails.each do |email|
        opens = if email.respond_to?(:open_count) && email.open_count.to_i.positive?
                  email.open_count.to_i
                else
                  email.events.count { |ev| ev.event_type.in?(%w[open open_signal]) }
                end

        clicks = if email.respond_to?(:click_count) && email.click_count.to_i.positive?
                   email.click_count.to_i
                 else
                   email.events.count { |ev| ev.event_type == 'click' }
                 end

        unique_opens = if email.respond_to?(:unique_open_signals) && email.unique_open_signals.to_i.positive?
                         email.unique_open_signals.to_i
                       else
                         (opens.positive? || email.first_opened_at.present?) ? 1 : 0
                       end

        unique_clicks = if email.respond_to?(:unique_clicks) && email.unique_clicks.to_i.positive?
                          email.unique_clicks.to_i
                        else
                          clicks.positive? ? 1 : 0
                        end

        events << {
          id: "email-#{email.id}",
          type: 'email',
          kind: 'email',
          title: email.subject.presence || 'E-mail Comercial Enviado',
          subject: email.subject,
          description: email.body_text.presence || "#{email.status} - #{email.to_email}",
          preview: email.body_text&.truncate(220),
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
          email: {
            id: email.id,
            subject: email.subject.presence || 'E-mail Comercial Enviado',
            to: [email.to_email].compact_blank,
            from: email.from_email,
            delivery_status: email.delivery_status || email.status,
            body_text: email.body_text,
            body_html: email.body_html,
            direction: (email.respond_to?(:direction) && email.direction.presence) || 'outbound',
            preview: email.body_text&.truncate(220)
          },
          engagement: {
            unique_open_signals: unique_opens,
            raw_open_signals: opens,
            unique_clicks: unique_clicks,
            raw_clicks: clicks,
            first_opened_at: email.first_opened_at,
            last_opened_at: email.last_opened_at
          },
          lifecycle: email.events.map do |ev|
            {
              event_type: ev.event_type,
              occurred_at: ev.occurred_at || ev.created_at,
              signal_class: ev.signal_class,
              source: ev.source
            }
          end,
          occurred_at: email.sent_at || email.created_at,
          actor_name: email.sender_user&.name
        }
      end

      # Account / Contact creation event
      if @account
        events << {
          id: "acc-created-#{@account.id}",
          type: 'website',
          kind: 'website',
          title: 'Empresa Cadastrada no CRM',
          description: "Empresa #{@account.name} registrada no CRM.",
          occurred_at: @account.created_at
        }
      elsif @contact
        events << {
          id: "contact-created-#{@contact.id}",
          type: 'contact',
          kind: 'contact',
          title: 'Contato Cadastrado no CRM',
          description: "Contato #{@contact.first_name} #{@contact.last_name || ''} registrado.",
          occurred_at: @contact.created_at
        }
      end

      events.sort_by { |e| e[:occurred_at] || Time.current }.reverse
    end

    private

    def activities
      if @account
        (@scope ? @scope.activities.where(sales_account_id: @account.id) : @account.activities).includes(:actor)
      elsif @contact
        Sales::Activity.where(sales_contact_id: @contact.id).includes(:actor)
      elsif @opportunity
        Sales::Activity.where(sales_opportunity_id: @opportunity.id).includes(:actor)
      else
        []
      end
    end

    def tasks
      if @account
        (@scope ? @scope.tasks.where(sales_account_id: @account.id) : @account.tasks).includes(:owner)
      elsif @contact
        Sales::Task.where(sales_contact_id: @contact.id).includes(:owner)
      elsif @opportunity
        Sales::Task.where(sales_opportunity_id: @opportunity.id).includes(:owner)
      else
        []
      end
    end

    def opportunities
      if @account
        (@scope ? @scope.opportunities.where(sales_account_id: @account.id) : @account.opportunities).includes(:stage)
      elsif @contact
        Sales::Opportunity.where(primary_contact_id: @contact.id).includes(:stage)
      elsif @opportunity
        [@opportunity]
      else
        []
      end
    end

    def emails
      if @account
        (@scope ? @scope.email_messages : Sales::EmailMessage.all).where(sales_account_id: @account.id).includes(:events, :sender_user)
      elsif @contact
        if @contact.email.present?
          Sales::EmailMessage.where('sales_contact_id = ? OR LOWER(to_email) = ?', @contact.id, @contact.email.to_s.downcase.strip).includes(:events, :sender_user)
        else
          Sales::EmailMessage.where(sales_contact_id: @contact.id).includes(:events, :sender_user)
        end
      elsif @opportunity
        Sales::EmailMessage.where(sales_opportunity_id: @opportunity.id).includes(:events, :sender_user)
      else
        []
      end
    end
  end
end
