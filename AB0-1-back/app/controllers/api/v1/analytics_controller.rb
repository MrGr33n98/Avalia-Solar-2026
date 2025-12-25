require 'digest'

class Api::V1::AnalyticsController < Api::V1::BaseController
  def track
    event = params[:event].presence || params[:event_type].presence
    payload = params[:data].is_a?(Hash) ? params[:data] : {}

    case event.to_s
    when 'banner_view', 'banner_click'
      track_banner_event(event.to_s == 'banner_view' ? 'view' : 'click')
      render json: { status: 'success' }
    when 'view', 'click', 'whatsapp_click', 'lead'
      Rails.logger.info("Analytics event=#{event} data=#{payload}")
      render json: { status: 'success' }
    else
      Rails.logger.info("Analytics event=#{event} data=#{payload}")
      return render json: { status: 'success' } if event.present?

      render json: { status: 'error', message: 'Evento não especificado' }, status: :bad_request
    end
  end

  private

  def track_banner_event(event_type)
    banner = Banner.find_by(id: params[:banner_id])
    return unless banner

    ip = request.remote_ip.to_s
    ua = request.user_agent.to_s

    utm = params[:utm].is_a?(Hash) ? params[:utm] : {}
    metadata = params[:metadata].is_a?(Hash) ? params[:metadata] : {}

    BannerEvent.create!(
      banner: banner,
      company: banner.company,
      event_type: event_type,
      ip_hash: Digest::SHA256.hexdigest(ip),
      user_agent_hash: Digest::SHA256.hexdigest(ua),
      referrer: request.referer.to_s,
      utm_json: utm,
      metadata_json: metadata,
      tracked_at: Time.current
    )

    day = Time.current.to_date
    stat = BannerDailyStat.find_or_initialize_by(banner_id: banner.id, day: day)
    stat.views_count = stat.views_count.to_i + (event_type == 'view' ? 1 : 0)
    stat.clicks_count = stat.clicks_count.to_i + (event_type == 'click' ? 1 : 0)
    stat.ctr = stat.views_count.positive? ? (stat.clicks_count.to_f / stat.views_count.to_f) : 0
    stat.save!
  rescue => e
    Rails.logger.error("Banner tracking error: #{e.message}")
  end
end