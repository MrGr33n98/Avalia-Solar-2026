# frozen_string_literal: true

module Sales
  module PipelineBoard
    class BoardPresenter
      def self.call(board_data)
        new(board_data).as_json
      end

      def initialize(board_data)
        @pipeline = board_data[:pipeline]
        @stages = board_data[:stages]
        @opportunities = board_data[:opportunities]
      end

      def as_json
        stage_totals = calculate_stage_totals

        {
          pipeline: {
            id: @pipeline.id,
            name: @pipeline.name,
            key: @pipeline.key
          },
          stages: @stages.map do |stage|
            totals = stage_totals[stage.id] || { count: 0, value_cents: 0 }
            {
              id: stage.id,
              key: stage.key,
              name: stage.name,
              position: stage.position,
              probability: stage.probability,
              total_cards: totals[:count],
              total_value_cents: totals[:value_cents]
            }
          end,
          cards: @opportunities.map { |item| present_card(item[:record], item[:latest_activity], item[:next_task]) },
          totals: calculate_global_totals
        }
      end

      private

      def present_card(record, latest_activity, next_task)
        probability = record.probability || record.stage&.probability || 0
        value_cents = record.value_cents.to_i
        weighted_cents = (value_cents * probability / 100.0).round

        stage_entered = record.stage_entered_at || record.created_at
        days_in_stage = ((Time.current - stage_entered) / 1.day).to_i

        last_act_date = latest_activity&.occurred_at || latest_activity&.created_at
        stale = last_act_date ? ((Time.current - last_act_date) / 1.day > 7) : (days_in_stage > 7)

        next_due = next_task&.due_at
        is_overdue = next_due ? next_due < Time.current : false
        is_due_today = next_due ? next_due.to_date == Date.current : false

        contact = record.primary_contact
        owner = record.owner
        qual = record.qualification

        {
          id: record.id,
          name: record.name,
          status: record.status,
          account: record.account ? { id: record.account.id, name: record.account.name } : nil,
          primary_contact: contact ? {
            id: contact.id,
            name: [contact.first_name, contact.last_name].compact.join(' '),
            email: contact.email,
            phone: contact.phone
          } : nil,
          owner: owner ? {
            id: owner.id,
            name: owner.name,
            email: owner.email
          } : nil,
          stage: record.stage ? {
            id: record.stage.id,
            key: record.stage.key,
            name: record.stage.name,
            position: record.stage.position,
            probability: record.stage.probability
          } : nil,
          value_cents: value_cents,
          currency: record.currency || 'BRL',
          probability: probability,
          weighted_value_cents: weighted_cents,
          priority: record.priority || 'medium',
          temperature: record.temperature || 'warm',
          source: record.source ? record.source.name : nil,
          qualification: qual ? {
            score: qual.score || 0,
            bant_summary: qual.bant_status || "BANT #{qual.score_bant}/4",
            spin_summary: qual.spin_status || 'SPIN ok'
          } : nil,
          last_activity: latest_activity ? {
            id: latest_activity.id,
            type: latest_activity.activity_type || 'activity',
            description: latest_activity.description || 'Atividade registrada',
            occurred_at: latest_activity.occurred_at || latest_activity.created_at
          } : nil,
          next_action: next_task ? {
            id: next_task.id,
            type: next_task.task_type || 'task',
            title: next_task.title,
            due_at: next_task.due_at,
            overdue: is_overdue
          } : nil,
          aging: {
            days_in_stage: days_in_stage,
            stage_entered_at: stage_entered,
            stale: stale
          },
          flags: {
            overdue: is_overdue,
            due_today: is_due_today,
            stale: stale,
            hot: record.temperature == 'hot',
            no_contact: record.primary_contact_id.nil?,
            no_owner: record.owner_id.nil?
          },
          tags: record.tags.map { |t| { id: t.id, name: t.name, color: t.color || '#3b82f6' } }
        }
      end

      def calculate_stage_totals
        totals = {}
        @opportunities.each do |item|
          stage_id = item[:record].sales_stage_id
          totals[stage_id] ||= { count: 0, value_cents: 0 }
          totals[stage_id][:count] += 1
          totals[stage_id][:value_cents] += item[:record].value_cents.to_i
        end
        totals
      end

      def calculate_global_totals
        total_cards = @opportunities.size
        total_value_cents = @opportunities.sum { |i| i[:record].value_cents.to_i }
        total_weighted = @opportunities.sum do |i|
          prob = i[:record].probability || i[:record].stage&.probability || 0
          (i[:record].value_cents.to_i * prob / 100.0).round
        end

        {
          total_cards: total_cards,
          total_value_cents: total_value_cents,
          total_weighted_value_cents: total_weighted
        }
      end
    end
  end
end
