# frozen_string_literal: true
# Service responsável por montar um feed híbrido (orgânico + patrocinado)
# Estratégia simples inicial: intercalar 1 patrocinado a cada N orgânicos
# com prioridade para artigos e campanhas mais recentes.

class ContentFeedService
  DEFAULT_SPONSORED_INTERVAL = 4

  def initialize(company_id: nil, category_id: nil, limit: 20, sponsored_interval: DEFAULT_SPONSORED_INTERVAL)
    @company_id = company_id
    @category_id = category_id
    @limit = limit.to_i.clamp(1, 100)
    @sponsored_interval = sponsored_interval.to_i.positive? ? sponsored_interval : DEFAULT_SPONSORED_INTERVAL
  end

  def build
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    organic_articles = base_articles.where(sponsored: false).limit(@limit * 2) # buffer
    sponsored_articles = base_articles.where(sponsored: true).limit(@limit)

    organic_campaigns = base_campaigns.where(sponsored: false).limit(@limit)
    sponsored_campaigns = base_campaigns.where(sponsored: true).limit(@limit / 2)

    organic_pool = merge_and_sort(organic_articles, organic_campaigns)
    sponsored_pool = merge_and_sort(sponsored_articles, sponsored_campaigns)

    feed = assemble_feed(organic_pool, sponsored_pool).first(@limit)

    log_metrics(feed, organic_pool.size, sponsored_pool.size, started_at)

    feed
  end

  private

  def base_articles
    scope = Article.includes(:company, :category).order(created_at: :desc)
    scope = scope.where(company_id: @company_id) if @company_id.present?
    scope = scope.where(category_id: @category_id) if @category_id.present?
    scope
  end

  def base_campaigns
    scope = CampaignReview.includes(:company, :campaign).order(created_at: :desc)
    scope = scope.where(company_id: @company_id) if @company_id.present?
    scope
  end

  def merge_and_sort(a_rel, b_rel)
    (a_rel.to_a + b_rel.to_a).sort_by { |r| -r.created_at.to_i }
  end

  def assemble_feed(organic, sponsored)
    return organic if sponsored.empty?

    feed = []
    sponsor_idx = 0

    organic.each_with_index do |item, idx|
      feed << item
      # Inserir patrocinado a cada intervalo definido
      if ((idx + 1) % @sponsored_interval).zero? && sponsor_idx < sponsored.length
        feed << sponsored[sponsor_idx]
        sponsor_idx += 1
      end
    end

    # Se sobraram patrocinados e ainda há espaço
    while sponsor_idx < sponsored.length && feed.length < @limit
      feed << sponsored[sponsor_idx]
      sponsor_idx += 1
    end

    feed
  end

  def log_metrics(feed, organic_size, sponsored_size, started_at)
    duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(2)
    sponsored_count = feed.count { |i| i.respond_to?(:sponsored) && i.sponsored }
    Rails.logger.info(
      '[ContentFeedService] duration_ms=' + duration.to_s +
      ' total=' + feed.size.to_s +
      ' sponsored_in_feed=' + sponsored_count.to_s +
      ' organic_pool=' + organic_size.to_s +
      ' sponsored_pool=' + sponsored_size.to_s +
      ' company_filter=' + (@company_id || 'nil').to_s +
      ' category_filter=' + (@category_id || 'nil').to_s
    )
  rescue StandardError => e
    Rails.logger.error("[ContentFeedService] metrics_log_failed=#{e.message}")
  end
end
