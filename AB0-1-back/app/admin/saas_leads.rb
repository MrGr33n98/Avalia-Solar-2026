# frozen_string_literal: true

ActiveAdmin.register Lead, as: 'SaaS Lead' do
  menu label: 'SAAS - Leads', priority: 25

  actions :index, :show
  config.sort_order = 'created_at_desc'

  scope :all, default: true, show_count: false
  scope :b2b, show_count: false do |scope|
    b2b_ids = SaasLeads::CategoryAudienceRegistry.b2b_category_ids
    b2b_ids.any? ? scope.where(category_id: b2b_ids) : scope.none
  end
  scope :b2c_or_outros, show_count: false do |scope|
    b2b_ids = SaasLeads::CategoryAudienceRegistry.b2b_category_ids
    b2b_ids.any? ? scope.where(category_id: nil).or(scope.where.not(category_id: b2b_ids)) : scope
  end
  scope :distribuidos, show_count: false do |scope|
    scope.joins(:lead_distributions).distinct
  end
  scope :nao_distribuidos, show_count: false do |scope|
    scope.where.missing(:lead_distributions)
  end
  scope :score_hot, show_count: false do |scope|
    SaasLeads::LeadInsights.filter_by_score(
      scope,
      min: 70,
      b2b_category_ids: SaasLeads::CategoryAudienceRegistry.b2b_category_ids
    )
  end
  scope :score_warm, show_count: false do |scope|
    SaasLeads::LeadInsights.filter_by_score(
      scope,
      min: 40,
      max: 69,
      b2b_category_ids: SaasLeads::CategoryAudienceRegistry.b2b_category_ids
    )
  end
  scope :score_cold, show_count: false do |scope|
    SaasLeads::LeadInsights.filter_by_score(
      scope,
      max: 39,
      b2b_category_ids: SaasLeads::CategoryAudienceRegistry.b2b_category_ids
    )
  end

  filter :id
  filter :name
  filter :email
  filter :phone
  filter :category_id,
         as: :select,
         label: 'Categoria',
         collection: proc { Category.order(:name).pluck(:name, :id) }
  filter :project_type
  filter :product_vertical
  filter :project_profile
  filter :wizard_status, as: :select, collection: proc { Lead.wizard_statuses.keys }
  filter :otp_verified_at
  filter :created_at
  filter :utm_source
  filter :utm_medium
  filter :utm_campaign

  index title: 'SaaS Leads' do
    selectable_column
    id_column

    column('Score', sortable: false) do |lead|
      metrics = saas_metrics_for(lead)
      css_class =
        case metrics.score_band
        when :hot
          'ok'
        when :warm
          'warning'
        else
          'error'
        end
      status_tag(metrics.score, class: css_class)
    end

    column('Usuario B2B', sortable: false) do |lead|
      metrics = saas_metrics_for(lead)
      status_tag(metrics.b2b? ? 'sim' : 'nao', class: metrics.b2b? ? 'ok' : 'warning')
    end

    column('Produto', sortable: false) { |lead| saas_metrics_for(lead).product_label }
    column :name
    column :email
    column :phone
    column('Cargo', sortable: false) { |lead| saas_metrics_for(lead).job_title }
    column('Porte da empresa', sortable: false) { |lead| saas_metrics_for(lead).company_size_band }
    column('Categoria desejada', sortable: false) { |lead| saas_metrics_for(lead).desired_category_label }
    column('Funil', sortable: false) { |lead| saas_metrics_for(lead).funnel_stage }
    column('Distribuido', sortable: false) do |lead|
      count = saas_metrics_for(lead).distributed_count
      count.positive? ? count : 'NAO'
    end
    column('Conversao em', :otp_verified_at)
    column('Enviado em', sortable: false) do |lead|
      timestamp = saas_metrics_for(lead).last_sent_at
      timestamp.present? ? l(timestamp, format: :short) : '-'
    end
    column :created_at
    column('Timeline', sortable: false) do |lead|
      # Avoid scanning analytics tables for every row in the index.
      link_to(
        'Ver',
        admin_saas_lead_path(lead),
        title: 'Abrir timeline completa do lead',
        class: 'member_link'
      )
    end

    actions defaults: true do |lead|
      item 'Distribuicoes', admin_lead_distributions_path(q: { lead_id_eq: lead.id }), class: 'member_link'
    end
  end

  show title: proc { |lead| "SaaS Lead ##{lead.id}" } do
    metrics = saas_metrics_for(resource)

    attributes_table do
      row :id
      row :name
      row :email
      row :phone
      row('Score') { metrics.score }
      row('Usuario B2B') { metrics.b2b? ? 'sim' : 'nao' }
      row('Produto') { metrics.product_label }
      row('Categoria desejada') { metrics.desired_category_label }
      row('Cargo') { metrics.job_title }
      row('Porte da empresa') { metrics.company_size_band }
      row('Funil') { metrics.funnel_stage }
      row('Distribuido') { metrics.distributed_count }
      row('Conversao em') { metrics.converted_at }
      row('Enviado em') { metrics.last_sent_at }
      row :wizard_status
      row :project_type
      row :estimated_budget
      row :decision_timeline
      row :company
      row :category
      row :created_at
      row :updated_at
    end

    panel 'Distribuicoes' do
      table_for resource.lead_distributions.order(created_at: :desc) do
        column :id
        column :company
        column :status
        column :assigned_at
        column :created_at
      end
    end

    panel 'Timeline real do lead' do
      timeline = saas_timeline_for(resource)
      stats = timeline.summary

      attributes_table do
        row('Eventos totais') { stats[:total_events] }
        row('Antes de virar lead') { stats[:pre_lead_events] }
        row('Depois de virar lead') { stats[:post_lead_events] }
        row('Sessoes unicas') { stats[:unique_sessions_count] }
        row('Primeiro evento') { stats[:first_event_at].present? ? l(stats[:first_event_at], format: :short) : '-' }
        row('Ultimo evento') { stats[:last_event_at].present? ? l(stats[:last_event_at], format: :short) : '-' }
        row('Top acoes') { stats[:top_actions].presence&.join(', ') || '-' }
      end

      if timeline.events.any?
        table_for timeline.events.reverse do
          column('Quando') { |event| l(event.occurred_at, format: :short) }
          column('Fase') { |event| status_tag(event.phase == 'pre_lead' ? 'antes' : 'depois', class: event.phase == 'pre_lead' ? 'warning' : 'ok') }
          column('Fonte') { |event| event.source }
          column('Evento') { |event| event.event_type }
          column('Acao') { |event| event.action }
          column('Detalhes', sortable: false) { |event| timeline_pretty_details(event.details) }
        end
      else
        para 'Sem eventos rastreados para este lead no periodo analisado.'
      end
    end
  end

  controller do
    def scoped_collection
      super.includes(:category, :company, :lead_distributions)
    end

    def saas_metrics_for(lead)
      @saas_metrics ||= {}
      @saas_metrics[lead.id] ||= build_saas_metrics(lead)
    rescue StandardError => e
      Rails.logger.warn("[Admin::SaasLeads] Failed to build metrics for lead=#{lead.id}: #{e.class}: #{e.message}")
      fallback_saas_metrics
    end
    helper_method :saas_metrics_for

    def saas_timeline_for(lead)
      @saas_timeline ||= {}
      @saas_timeline[lead.id] ||= SaasLeads::LeadTimeline.new(lead)
    rescue StandardError => e
      Rails.logger.warn("[Admin::SaasLeads] Failed to build timeline for lead=#{lead.id}: #{e.class}: #{e.message}")
      fallback_saas_timeline
    end
    helper_method :saas_timeline_for

    def timeline_pretty_details(details)
      return '-' if details.blank?

      compact = details.compact
      compact.map { |key, value| "#{key}=#{value}" }.join(' | ')[0, 500]
    end
    helper_method :timeline_pretty_details

    private

    def build_saas_metrics(lead)
      SaasLeads::LeadInsights.new(
        lead,
        b2b_category_ids: saas_b2b_category_ids
      )
    end

    def saas_b2b_category_ids
      @saas_b2b_category_ids ||= SaasLeads::CategoryAudienceRegistry.b2b_category_ids
    end

    def fallback_saas_metrics
      @fallback_saas_metrics ||= Struct.new(
        :score,
        :score_band,
        :product_label,
        :job_title,
        :company_size_band,
        :desired_category_label,
        :funnel_stage,
        :distributed_count,
        :last_sent_at,
        :converted_at,
        keyword_init: true
      ) do
        def b2b?
          false
        end
      end.new(
        score: 0,
        score_band: :cold,
        product_label: '-',
        job_title: '-',
        company_size_band: '-',
        desired_category_label: '-',
        funnel_stage: '-',
        distributed_count: 0,
        last_sent_at: nil,
        converted_at: nil
      )
    end

    def fallback_saas_timeline
      @fallback_saas_timeline ||= Struct.new(:events, :summary, keyword_init: true).new(
        events: [],
        summary: {
          total_events: 0,
          pre_lead_events: 0,
          post_lead_events: 0,
          unique_sessions_count: 0,
          first_event_at: nil,
          last_event_at: nil,
          top_actions: []
        }
      )
    end
  end
end
