# app/services/company_cta_builder.rb
class CompanyCtaBuilder
  # Contextos possíveis para os CTAs
  CONTEXTS = %w[card detail].freeze

  # Tipos de CTAs suportados
  CTA_TYPES = %w[whatsapp phone email website custom].freeze

  # Inicializa o builder com a empresa e contexto
  # @param company [Company] A empresa para a qual construir os CTAs
  # @param context [String] O contexto onde os CTAs serão exibidos ('card' ou 'detail')
  # @param utm [Hash] Parâmetros UTM para anexar às URLs
  # @param vars [Hash] Variáveis para substituição no template
  def initialize(company, context = 'detail', utm = {}, vars = {})
    @company = company
    @context = CONTEXTS.include?(context.to_s) ? context.to_s : 'detail'
    @utm = utm || {}
    @vars = vars || {}
    @vars.merge!(
      company_name: @company.name,
      city: @company.city,
      state: @company.state
    )
  end

  # Constrói todos os CTAs disponíveis para a empresa
  # @return [Array<Hash>] Lista de CTAs formatados
  def build_all_ctas
    ctas = []

    # Adiciona CTAs do JSON se disponível
    if @company.ctas_json.present? && @company.ctas_json['buttons'].is_a?(Array)
      @company.ctas_json['buttons'].each do |button|
        next unless button['enabled']
        next if button['conditions'] && !meets_conditions?(button['conditions'])

        ctas << build_cta_from_json(button)
      end
    end

    # Adiciona CTAs primário e secundário legados se não houver CTAs do JSON
    if ctas.empty?
      ctas << build_primary_cta if @company.cta_primary_label.present?
      ctas << build_secondary_cta if @company.cta_secondary_label.present?
    end

    # Ordena por prioridade
    ctas.sort_by { |cta| cta[:priority] || 999 }
  rescue StandardError => e
    Rails.logger.error("Error building CTAs: #{e.message}")
    []
  end

  # Constrói o CTA primário
  # @return [Hash] CTA formatado
  def build_primary_cta
    build_cta(
      key: 'cta_primary',
      label: @company.cta_primary_label,
      type: @company.cta_primary_type,
      url: @company.cta_primary_url,
      style: 'primary',
      priority: 1
    )
  end

  # Constrói o CTA secundário
  # @return [Hash] CTA formatado
  def build_secondary_cta
    build_cta(
      key: 'cta_secondary',
      label: @company.cta_secondary_label,
      type: @company.cta_secondary_type,
      url: @company.cta_secondary_url,
      style: 'outline',
      priority: 2
    )
  end

  private

  # Verifica se as condições são atendidas
  # @param conditions [Hash] Condições a verificar
  # @return [Boolean] True se as condições são atendidas
  def meets_conditions?(conditions)
    return true unless conditions.is_a?(Hash)

    # Verifica condição de página
    return false if conditions['page'].is_a?(Array) && !conditions['page'].include?(@context)

    # Outras condições podem ser implementadas aqui

    true
  end

  # Constrói um CTA a partir de um botão do JSON
  # @param button [Hash] Configuração do botão
  # @return [Hash] CTA formatado
  def build_cta_from_json(button)
    build_cta(
      key: button['key'],
      label: button['label'],
      type: button['type'],
      url: button['url'],
      icon: button['icon'],
      style: button['style'] || 'primary',
      priority: button['priority'] || 999,
      message_template: button['message_template'],
      use_utm: button['use_utm'],
      analytics_event: button['analytics_event'],
      ab_test: button['ab_test']
    )
  end

  # Constrói um CTA genérico
  # @param params [Hash] Parâmetros do CTA
  # @return [Hash] CTA formatado
  def build_cta(params)
    type = params[:type].to_s.downcase
    url = params[:url]
    message_template = params[:message_template] || @company.cta_whatsapp_template
    use_utm = params[:use_utm].nil? ? true : params[:use_utm]

    # Gera a URL final com base no tipo
    final_url = case type
                when 'whatsapp'
                  build_whatsapp_url(message_template)
                when 'phone'
                  build_phone_url
                when 'email'
                  build_email_url(message_template)
                when 'website', 'custom'
                  build_custom_url(url, use_utm)
                end

    # Retorna nil se não for possível gerar uma URL
    return nil unless final_url

    {
      key: params[:key],
      label: params[:label],
      type: type,
      url: final_url,
      icon: params[:icon],
      style: params[:style] || 'primary',
      priority: params[:priority] || 999,
      analytics_event: params[:analytics_event],
      ab_test: params[:ab_test]
    }
  end

  # Constrói uma URL para WhatsApp
  # @param template [String] Template da mensagem
  # @return [String] URL formatada
  def build_whatsapp_url(template)
    return nil unless @company.whatsapp.present?

    # Normaliza o número de telefone (remove caracteres não numéricos)
    phone = @company.whatsapp.gsub(/\D/, '')
    return nil if phone.blank?

    # Aplica o template e codifica para URL
    message = template.present? ? apply_template(template) : ''
    encoded_message = URI.encode_www_form_component(message)

    "https://wa.me/#{phone}?text=#{encoded_message}"
  end

  # Constrói uma URL para telefone
  # @return [String] URL formatada
  def build_phone_url
    phone = @company.phone_alt.presence || @company.phone.presence
    return nil unless phone.present?

    # Normaliza o número de telefone (remove caracteres não numéricos)
    normalized_phone = phone.gsub(/\D/, '')
    return nil if normalized_phone.blank?

    "tel:#{normalized_phone}"
  end

  # Constrói uma URL para email
  # @param template [String] Template da mensagem
  # @return [String] URL formatada
  def build_email_url(template)
    return nil unless @company.email_public.present?

    subject = "Contato via Compare Solar - #{@company.name}"
    body = template.present? ? apply_template(template) : ''

    encoded_subject = URI.encode_www_form_component(subject)
    encoded_body = URI.encode_www_form_component(body)

    "mailto:#{@company.email_public}?subject=#{encoded_subject}&body=#{encoded_body}"
  end

  # Constrói uma URL personalizada
  # @param url [String] URL base
  # @param use_utm [Boolean] Se deve adicionar parâmetros UTM
  # @return [String] URL formatada
  def build_custom_url(url, use_utm)
    return nil unless url.present?

    final_url = url

    # Adiciona parâmetros UTM se necessário
    if use_utm && @utm.present?
      uri = URI.parse(url)
      params = URI.decode_www_form(uri.query || '').to_h

      # Adiciona parâmetros UTM
      if @utm[:source].present? || @company.cta_utm_source.present?
        params['utm_source'] =
          @utm[:source] || @company.cta_utm_source
      end
      if @utm[:medium].present? || @company.cta_utm_medium.present?
        params['utm_medium'] =
          @utm[:medium] || @company.cta_utm_medium
      end
      if @utm[:campaign].present? || @company.cta_utm_campaign.present?
        params['utm_campaign'] =
          @utm[:campaign] || @company.cta_utm_campaign
      end

      # Reconstrói a URL com os parâmetros
      uri.query = URI.encode_www_form(params) if params.any?
      final_url = uri.to_s
    end

    final_url
  end

  # Aplica o template substituindo as variáveis
  # @param template [String] Template com placeholders
  # @return [String] Texto com variáveis substituídas
  def apply_template(template)
    result = template.dup

    @vars.each do |key, value|
      result.gsub!(/{#{key}}/, value.to_s) if value.present?
    end

    result
  end
end
