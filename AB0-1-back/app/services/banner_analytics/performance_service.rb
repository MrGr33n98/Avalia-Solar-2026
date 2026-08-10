module BannerAnalytics
  class PerformanceService
    def self.call(banner_id, start_date: 30.days.ago.to_date, end_date: Date.today)
      banner = Banner.find(banner_id)
      
      # Carregar as estatísticas agregadas do período
      stats = BannerDailyStat.where(banner_id: banner_id, day: start_date..end_date)
      
      total_views = stats.sum(:views_count)
      total_clicks = stats.sum(:clicks_count)
      total_leads = stats.sum(:leads_count)
      
      # O investimento real vem das assinaturas (Add-ons) de CPM, CPL ou Duração Ativos no período
      # O modelo de dados comercial suporta `banner.banner_addon_subscriptions`
      # Vamos somar o valor pago em subscriptions que se sobrepõem ao período.
      
      total_investment_cents = 0
      if banner.respond_to?(:banner_addon_subscriptions)
        # Aproximação: assinaturas que foram ativadas no período (ou antes) e não expiraram antes do início.
        subs = banner.banner_addon_subscriptions
                     .where.not(status: %w[draft cancelled refunded])
                     .where('starts_at <= ? AND ends_at >= ?', end_date.end_of_day, start_date.beginning_of_day)
        
        # Rateio do custo pro-rata para simplificar, ou pegar o valor total da assinatura
        # Para ser conservador, se a subscription tocou no período, incluímos o custo ou uma proporção
        subs.each do |sub|
          overlap_start = [sub.starts_at.to_date, start_date].max
          overlap_end = [sub.ends_at.to_date, end_date].min
          days_in_overlap = (overlap_end - overlap_start).to_i + 1
          total_days = (sub.ends_at.to_date - sub.starts_at.to_date).to_i + 1
          
          # Se total_days <= 0 (ex. expirou no mesmo dia), assumimos 1.
          total_days = 1 if total_days <= 0
          
          proportion = days_in_overlap.to_f / total_days
          total_investment_cents += (sub.price_paid_cents * proportion).round
        end
      end
      
      # Adicionamos custo legado se aplicável (legado hardcoded em BannersSponsorship.tsx usava 150BRL, etc, 
      # mas o banco de dados tem investment? O modelo não tem 'investment_cents', mas se o model de 
      # BannerDailyStat tivesse cost_cents preenchido poderiamos usar. Como adicionamos leads_count e cost_cents,
      # caso cost_cents estivesse preenchido poderíamos somar)
      total_investment_cents += stats.sum(:cost_cents)

      total_investment = total_investment_cents / 100.0

      ctr = total_views.positive? ? ((total_clicks.to_f / total_views) * 100).round(2) : 0.0
      cpc = total_clicks.positive? ? (total_investment / total_clicks).round(2) : 0.0
      cpl = total_leads.positive? ? (total_investment / total_leads).round(2) : 0.0
      conversion_rate = total_clicks.positive? ? ((total_leads.to_f / total_clicks) * 100).round(2) : 0.0
      breakdown = build_breakdown(banner_id, start_date, end_date)
      quality = build_quality_summary(banner_id, start_date, end_date)
      context_breakdown = build_context_breakdown(banner_id, start_date, end_date)

      {
        banner_id: banner_id,
        period: {
          start_date: start_date,
          end_date: end_date
        },
        metrics: {
          impressions: total_views,
          clicks: total_clicks,
          leads: total_leads,
          investment: total_investment,
          ctr: ctr,
          cpc: cpc,
          cpl: cpl,
          conversion_rate: conversion_rate
        },
        breakdown: breakdown,
        quality: quality,
        context_breakdown: context_breakdown,
        time_series: stats.order(:day).map do |s|
          {
            day: s.day,
            impressions: s.views_count,
            clicks: s.clicks_count,
            leads: s.leads_count,
            ctr: s.ctr.to_f,
            # Se houvesse custo no dia a dia, poderia ir aqui.
          }
        end
      }
    def self.build_breakdown(banner_id, start_date, end_date)
      grouped = BannerEvent.reportable
                           .where(banner_id: banner_id, tracked_at: start_date.beginning_of_day..end_date.end_of_day)
                           .group(:placement, :event_type)
                           .count
      placements = Hash.new { |hash, key| hash[key] = { impressions: 0, clicks: 0, leads: 0 } }

      grouped.each do |(placement, event_type), count|
        key = placement.presence || 'unknown'
        case event_type
        when 'view', 'impression' then placements[key][:impressions] += count
        when 'click' then placements[key][:clicks] += count
        when 'lead' then placements[key][:leads] += count
        end
      end

      placements.map do |placement, values|
        impressions = values[:impressions]
        clicks = values[:clicks]
        { placement: placement, **values, ctr: impressions.positive? ? (clicks.to_f / impressions * 100).round(2) : 0.0 }
      end.sort_by { |row| [-row[:impressions], row[:placement]] }
    end

    private_class_method :build_breakdown

    def self.build_quality_summary(banner_id, start_date, end_date)
      events = BannerEvent.where(banner_id: banner_id, tracked_at: start_date.beginning_of_day..end_date.end_of_day)
      discarded = events.where(valid_for_reporting: false)
      {
        total_events: events.count,
        reportable_events: events.where(valid_for_reporting: true).count,
        discarded_events: discarded.count,
        discard_reasons: discarded.group(:discard_reason).count
      }
    end

    private_class_method :build_quality_summary

    def self.build_context_breakdown(banner_id, start_date, end_date)
      grouped = BannerEvent.reportable
                           .where(banner_id: banner_id, tracked_at: start_date.beginning_of_day..end_date.end_of_day)
                           .group(:page_path, :placement, :event_type)
                           .count
      contexts = Hash.new { |hash, key| hash[key] = { impressions: 0, clicks: 0, leads: 0 } }

      grouped.each do |(page_path, placement, event_type), count|
        key = [page_path.presence || 'unknown', placement.presence || 'unknown']
        case event_type
        when 'view', 'impression' then contexts[key][:impressions] += count
        when 'click' then contexts[key][:clicks] += count
        when 'lead' then contexts[key][:leads] += count
        end
      end

      contexts.map do |(page_path, placement), values|
        impressions = values[:impressions]
        clicks = values[:clicks]
        { page_path: page_path, placement: placement, **values, ctr: impressions.positive? ? (clicks.to_f / impressions * 100).round(2) : 0.0 }
      end.sort_by { |row| [-row[:impressions], row[:page_path], row[:placement]] }
    end

    private_class_method :build_context_breakdown
  end
end
