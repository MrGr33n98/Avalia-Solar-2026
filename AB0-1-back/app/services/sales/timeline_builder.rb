# frozen_string_literal: true

module Sales
  class TimelineBuilder
    def self.for_account(account)
      new(account: account).build
    end

    def self.for_contact(contact)
      new(contact: contact).build
    end

    def self.for_opportunity(opportunity)
      new(opportunity: opportunity).build
    end

    def initialize(account: nil, contact: nil, opportunity: nil)
      @account = account
      @contact = contact
      @opportunity = opportunity
    end

    def build
      events = []

      # Activities (Calls, Meetings, Notes, In-person)
      activities.each do |act|
        events << {
          id: "act-#{act.id}",
          type: act.activity_type == 'call' ? 'call' : (act.activity_type || 'activity'),
          title: act.subject.presence || (act.activity_type == 'call' ? 'Chamada Registrada' : 'Atividade Comercial'),
          description: act.description || act.body,
          occurred_at: act.occurred_at || act.created_at,
          actor_name: act.user&.name || 'Vendedor'
        }
      end

      # Tasks
      tasks.each do |t|
        events << {
          id: "task-#{t.id}",
          type: 'task',
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
          title: "Oportunidade #{o.name}",
          description: "Estágio: #{o.stage&.name || 'Prospect'} | Valor: R$ #{((o.value_cents || 0) / 100.0).round(2)}",
          occurred_at: o.created_at
        }
      end

      # Account / Contact creation event
      if @account
        events << {
          id: "acc-created-#{@account.id}",
          type: 'website',
          title: 'Empresa Cadastrada no CRM',
          description: "Empresa #{@account.name} registrada no CRM.",
          occurred_at: @account.created_at
        }
      elsif @contact
        events << {
          id: "contact-created-#{@contact.id}",
          type: 'contact',
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
        @account.activities.includes(:user)
      elsif @contact
        Sales::Activity.where(sales_contact_id: @contact.id).includes(:user)
      elsif @opportunity
        Sales::Activity.where(sales_opportunity_id: @opportunity.id).includes(:user)
      else
        []
      end
    end

    def tasks
      if @account
        @account.tasks.includes(:owner)
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
        @account.opportunities.includes(:stage)
      elsif @contact
        Sales::Opportunity.where(primary_contact_id: @contact.id).includes(:stage)
      elsif @opportunity
        [@opportunity]
      else
        []
      end
    end
  end
end
