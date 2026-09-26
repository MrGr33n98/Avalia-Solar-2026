# frozen_string_literal: true

module Sales
  module Timeline
    class Query
      PREVIEW_LIMIT = 200
      HIDDEN_EMAIL_EVENTS = %w[provider_open_signal provider_click_signal].freeze

      def initialize(opportunity:, user:, after: nil)
        @opportunity = opportunity
        @user = user
        @scope = ::Sales::TenantScope.for(user)
        @after = after
      end

      def call
        { timeline: timeline_items, meta: { cursor: @opportunity.sales_timeline_sequence.to_i.to_s } }
      end

      private

      def timeline_items
        items = if @after
                  changed_email_items
                else
                  stage_items + activity_items + task_items + note_items + quote_items + email_items + opportunity_item
                end
        items.compact.sort_by { |item| item[:occurred_at] || Time.current }.reverse
      end

      def stage_items
        @opportunity.stage_histories.includes(:to_stage, :actor).map do |history|
          item(id: "stage:#{history.id}", kind: 'stage_changed',
               title: "Estágio alterado para #{history.to_stage&.name || 'Novo Estágio'}",
               occurred_at: history.entered_at || history.created_at, actor: actor_for(history.actor))
        end
      end

      def activity_items
        account_only = if account_only_allowed?
                         @scope.activities.where(sales_account_id: @opportunity.sales_account_id,
                                                 sales_opportunity_id: nil)
                       else
                         @scope.activities.none
                       end
        activities = @scope.activities.where(sales_opportunity_id: @opportunity.id).or(account_only)
        activities = activities.where.not('activity_type LIKE ?', 'email_%')
        activities.includes(:actor).map do |activity|
          item(id: "activity:#{activity.id}", kind: activity.activity_type == 'call' ? 'call' : 'activity',
               activity_type: activity.activity_type,
               title: activity.subject.presence || 'Atividade comercial', preview: activity.body,
               occurred_at: activity.occurred_at || activity.created_at, actor: actor_for(activity.actor))
        end
      end

      def task_items
        account_only = if account_only_allowed?
                         @scope.tasks.where(sales_account_id: @opportunity.sales_account_id,
                                            sales_opportunity_id: nil)
                       else
                         @scope.tasks.none
                       end
        @scope.tasks.where(sales_opportunity_id: @opportunity.id).or(account_only).includes(:owner).map do |task|
          item(id: "task:#{task.id}", kind: 'task', title: task.title,
               preview: "Status: #{task.status} | Prioridade: #{task.priority}", occurred_at: task.created_at,
               actor: actor_for(task.owner))
        end
      end

      def note_items
        @scope.notes.where(opportunity_id: @opportunity.id).map do |note|
          item(id: "note:#{note.id}", kind: 'note', title: 'Anotação interna', preview: note.body,
               occurred_at: note.created_at, actor: actor_for(note.author))
        end
      end

      def quote_items
        @scope.quotes.where(opportunity_id: @opportunity.id).map do |quote|
          item(id: "quote:#{quote.id}", kind: 'quote', title: "Proposta comercial ##{quote.number}",
               preview: "Status: #{quote.status} | Potência: #{quote.system_size_kwp || '—'} kWp",
               occurred_at: quote.created_at)
        end
      end

      def email_items
        direct = @scope.email_messages.where(sales_opportunity_id: @opportunity.id)
        if account_only_allowed?
          direct = direct.or(@scope.email_messages.where(sales_opportunity_id: nil,
                                                         sales_account_id: @opportunity.sales_account_id))
        end
        direct.includes(:sender_user, :contact, :participants, :events)
              .map { |email| email_item(email) }
      end

      def changed_email_items
        changed_events = ::Sales::EmailEvent.where(timeline_sequence: (@after.to_i + 1)..)
                                            .joins(:email_message)
                                            .where(sales_email_messages: {
                                                     company_id: @opportunity.account.company_id
                                                   })
        direct = changed_events.where(sales_email_messages: { sales_opportunity_id: @opportunity.id })
        account_only = if account_only_allowed?
                         changed_events.where(sales_email_messages: { sales_opportunity_id: nil,
                                                                      sales_account_id: @opportunity.sales_account_id })
                       else
                         changed_events.none
                       end
        changed_ids = direct.or(account_only).select(:sales_email_message_id)
        @scope.email_messages.where(id: changed_ids).includes(:sender_user, :contact, :participants, :events)
              .distinct.map { |email| email_item(email) }
      end

      def email_item(email)
        direction = email.direction.presence || 'outbound'
        actor = direction == 'inbound' ? actor_for(email.contact) : actor_for(email.sender_user)
        events = email.events.reject { |event| HIDDEN_EMAIL_EVENTS.include?(event.event_type) }
        {
          id: "email:#{email.id}", kind: 'email', occurred_at: latest_email_activity(email, events), actor: actor,
          email: email_details(email, direction), engagement: engagement_metrics(email),
          lifecycle: lifecycle_events(events)
        }
      end

      def email_details(email, direction)
        recipients = email.participants.select { |participant| participant.participant_type == 'to' }.map(&:email)
        {
          id: email.id, direction: direction, subject: email.subject, preview: safe_preview(email),
          from: email.from_email, to: recipients.presence || [email.to_email],
          delivery_status: email.delivery_status.presence || email.status,
          engagement_status: email.engagement_status.presence || 'none'
        }
      end

      def engagement_metrics(email)
        {
          raw_open_signals: email.raw_open_signals.to_i, unique_open_signals: email.unique_open_signals.to_i,
          human_likely_open_signals: email.human_likely_open_signals.to_i,
          proxy_open_signals: email.proxy_open_signals.to_i, bot_open_signals: email.bot_open_signals.to_i,
          scanner_open_signals: email.scanner_open_signals.to_i, raw_clicks: email.raw_clicks.to_i,
          unique_clicks: email.unique_clicks.to_i, replies: email.replied_at.present? ? 1 : 0
        }
      end

      def latest_email_activity(email, events)
        [email.sent_at, email.created_at, *events.map(&:occurred_at)].compact.max
      end

      def lifecycle_events(events)
        events.sort_by { |event| [event.occurred_at || Time.current, event.id] }
              .map { |event| lifecycle_event(event) }
      end

      def lifecycle_event(event)
        {
          type: event_type(event), occurred_at: event.occurred_at, source: event.source,
          signal_class: event.signal_class, classification_reasons: event.classification_reasons
        }.compact
      end

      def event_type(event)
        return 'open_signal' if event.event_type == 'open' && event.source == 'legacy'
        return 'reply' if event.event_type == 'replied'

        event.event_type
      end

      def safe_preview(email)
        content = email.body_text.presence || ActionController::Base.helpers.strip_tags(email.body_html.to_s)
        text = CGI.unescapeHTML(content.to_s).gsub(/[[:space:]]+/, ' ').strip
        text.truncate(PREVIEW_LIMIT, omission: '…')
      end

      def account_only_allowed?
        return false unless @opportunity.sales_account_id.present?

        other_opportunity = @scope.opportunities
                                  .where(sales_account_id: @opportunity.sales_account_id)
                                  .where.not(id: @opportunity.id)
        !other_opportunity.exists?
      end

      def opportunity_item
        [item(id: "opportunity:#{@opportunity.id}", kind: 'website', title: 'Oportunidade criada no CRM',
              preview: "Oportunidade #{@opportunity.name} iniciada.", occurred_at: @opportunity.created_at)]
      end

      def item(id:, kind:, title:, occurred_at:, **details)
        details[:preview] = safe_text(details[:preview])
        { id: id, kind: kind, title: title, occurred_at: occurred_at }.merge(details).compact
      end

      def actor_for(record)
        return nil unless record

        first_name = record.try(:first_name)
        last_name = record.try(:last_name)
        name = record.try(:name).presence || [first_name, last_name].compact.join(' ').presence
        { id: record.id, name: name,
          avatar_url: nil }.compact
      end

      def safe_text(value)
        plain_text = ActionController::Base.helpers.strip_tags(value.to_s)
        normalized = CGI.unescapeHTML(plain_text).gsub(/[[:space:]]+/, ' ').strip
        normalized.truncate(PREVIEW_LIMIT, omission: '…')
      end
    end
  end
end
