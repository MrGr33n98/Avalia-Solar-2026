# frozen_string_literal: true

require 'csv'

module CompanyDashboard
  class ProspectsExportService
    EVIDENCE_LABELS = {
      'click_only' => 'Apenas clique',
      'landing_verified' => 'Chegada verificada',
      'form_event_observed' => 'Formulário observado',
      'lead_confirmed' => 'Lead confirmado'
    }.freeze

    SOURCE_LABELS = {
      'profile' => 'Perfil no Marketplace',
      'compare' => 'Comparador Solar',
      'calculator' => 'Calculadora Solar',
      'directory' => 'Catálogo de Empresas',
      'quote_modal' => 'Solicitação de Proposta',
      'ad_rail' => 'Destaque Patrocinado',
      'banner' => 'Banner Institucional',
      'search' => 'Busca Direta',
      'other' => 'Outros Canais'
    }.freeze

    def self.call(company:, from_time:, to_time:, params: {})
      new(company:, from_time:, to_time:, params:).call
    end

    def initialize(company:, from_time:, to_time:, params: {})
      @company = company
      @from_time = from_time
      @to_time = to_time
      @params = params
    end

    def call
      scope = ::OutboundClick.where(company_id: @company.id, clicked_at: @from_time..@to_time)

      search_term = @params[:search].to_s.strip
      if search_term.present?
        sanitized = "%#{search_term.downcase}%"
        scope = scope.where('LOWER(target_url) LIKE ? OR LOWER(source_context) LIKE ?', sanitized, sanitized)
      end

      evidence_filter = @params[:evidence_status].to_s.strip
      case evidence_filter
      when 'click_only'
        scope = scope.where.not(id: ::Sales::TrackingSession.where(company_id: @company.id).select(:outbound_click_id))
      when 'landing_verified'
        scope = scope.where(id: ::Sales::TrackingSession.where(company_id: @company.id).select(:outbound_click_id))
      end

      clicks = scope.order(clicked_at: :desc).limit(10_000)
      click_ids = clicks.map(&:id)

      sessions_by_click = ::Sales::TrackingSession.where(company_id: @company.id, outbound_click_id: click_ids)
                                                  .includes(:account, :events)
                                                  .index_by(&:outbound_click_id)

      # UTF-8 BOM (\uFEFF) para garantir abertura correta de acentuação no Excel
      bom = "\uFEFF"
      csv_string = CSV.generate(headers: true, col_sep: ',') do |csv|
        csv << [
          'ID do Clique',
          'Data/Hora (ISO8601)',
          'Origem no Marketplace',
          'Tipo de Destino',
          'URL de Destino',
          'Status de Evidência',
          'ID da Sessão',
          'Chegada Verificada em',
          'Host de Referência',
          'Duração (s)',
          'Eventos Observados',
          'Conta / Empresa',
          'País'
        ]

        clicks.each do |click|
          session = sessions_by_click[click.id]
          evidence_code = determine_evidence(session)
          evidence_label = EVIDENCE_LABELS[evidence_code] || evidence_code

          duration = calculate_duration(session)

          csv << [
            sanitize(click.id),
            sanitize(click.clicked_at.iso8601),
            sanitize(SOURCE_LABELS[click.source_context] || click.source_context),
            sanitize(click.destination_type),
            sanitize(click.target_url),
            sanitize(evidence_label),
            sanitize(session&.session_id),
            sanitize(session&.started_at&.iso8601),
            sanitize(session&.referrer_host),
            sanitize(duration),
            sanitize(session&.events&.length || 0),
            sanitize(session&.account&.name || 'Não identificado'),
            sanitize('Brasil')
          ]
        end
      end

      bom + csv_string
    end

    private

    def determine_evidence(session)
      return 'click_only' unless session

      events = session.events
      if events.any? { |e| %w[lead_confirmed quote_request_submitted].include?(e.event_name) }
        'lead_confirmed'
      elsif events.any? { |e| e.event_name == 'form_submitted' }
        'form_event_observed'
      else
        'landing_verified'
      end
    end

    def calculate_duration(session)
      return nil unless session&.started_at

      last_event_time = session.events.map(&:occurred_at).max || session.ended_at
      return nil unless last_event_time && last_event_time > session.started_at

      (last_event_time - session.started_at).round
    end

    # Prevenção contra CSV Formula Injection (Excel / LibreOffice / Google Sheets)
    # Impede execução de fórmulas iniciadas por =, +, -, @ ou tabs/retornos
    def sanitize(value)
      str = value.to_s
      return '' if str.blank?

      str =~ /\A[=+\-@\t\r]/ ? "'#{str}" : str
    end
  end
end
