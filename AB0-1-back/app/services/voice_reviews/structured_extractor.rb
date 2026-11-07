module VoiceReviews
  class StructuredExtractor
    BRANDS = %w[WEG GoodWe Growatt Deye Fronius Sungrow Canadian Jinko Trina BYD Intelbras Solis Huawei Enphase].freeze

    def self.call(raw_text:, company_name:, review_form: nil, initial_rating: nil)
      new(raw_text:, company_name:, review_form:, initial_rating:).call
    end

    def initialize(raw_text:, company_name:, review_form: nil, initial_rating: nil)
      @raw_text = raw_text.to_s.strip
      @company_name = company_name.to_s.strip
      @review_form = review_form
      @initial_rating = initial_rating.to_i.between?(1, 5) ? initial_rating.to_i : nil
    end

    def call
      return heuristic_payload if Rails.env.test? || api_key.blank?

      ai_payload || heuristic_payload
    rescue StandardError => e
      Rails.logger.warn("[VoiceReviews][StructuredExtractor] fallback: #{e.class}: #{e.message}")
      heuristic_payload
    end

    private

    attr_reader :raw_text, :company_name, :review_form, :initial_rating

    def api_key
      ENV['OPENROUTER_API_KEY'].presence || ENV['AI_API_KEY'].presence
    end

    def ai_payload
      client = Sales::Ai::OpenRouterClient.new(api_key: api_key, timeout_seconds: 15)
      result = client.chat!(
        model_id: 'openai/gpt-4o-mini', messages: prompt_messages, temperature: 0.15, max_tokens: 700
      )
      parsed = JSON.parse(result[:content])
      normalize_payload(parsed)
    end

    def prompt_messages
      user_msg = "Empresa: #{company_name}\nNota: #{initial_rating || 'auto'}\n" \
                 "Critérios: #{criteria_catalog.to_json}\nRelato: #{raw_text}"
      [
        { role: 'system', content: system_prompt },
        { role: 'user', content: user_msg }
      ]
    end

    def system_prompt
      'Você estrutura transcrições de áudio de clientes de energia solar no Brasil para auditoria do Avalia Solar. ' \
        'REGRAS: 1) Limpe vícios de fala ("ééé", "tipo assim") mantendo 1a pessoa e fidelidade a elogios/críticas. ' \
        '2) Gere JSON: headline (até 70 chars), clean_comment (até 480 chars), inferred_rating (1..5), ' \
        'inferred_criteria (array de {criterion_id, criterion_slug, title, score: 1..5 ou null}), ' \
        'mentioned_equipment (array de strings), project_type (string|null), ' \
        'contains_offensive_language (boolean).'
    end

    def normalize_payload(parsed)
      base = heuristic_payload
      rating = initial_rating || parsed['inferred_rating'].to_i
      equip = Array(parsed['mentioned_equipment']).map(&:to_s).presence
      {
        'headline' => parsed['headline'].to_s.strip.truncate(70).presence || base['headline'],
        'clean_comment' => parsed['clean_comment'].to_s.strip.truncate(480).presence || base['clean_comment'],
        'inferred_rating' => rating.between?(1, 5) ? rating : base['inferred_rating'],
        'inferred_criteria' => normalize_criteria(parsed['inferred_criteria'], base['inferred_criteria']),
        'mentioned_equipment' => equip || base['mentioned_equipment'],
        'project_type' => parsed['project_type'].presence || base['project_type'],
        'contains_offensive_language' => ActiveModel::Type::Boolean.new.cast(parsed['contains_offensive_language'])
      }
    end

    def normalize_criteria(raw_list, fallback)
      return fallback unless raw_list.is_a?(Array) && raw_list.any?

      criteria_catalog.map do |item|
        match = raw_list.find { |r| criterion_matches?(r, item) }
        score = match && match['score'].to_i.between?(1, 5) ? match['score'].to_i : nil
        { 'criterion_id' => item[:id], 'criterion_slug' => item[:slug], 'title' => item[:title], 'score' => score }
      end
    end

    def criterion_matches?(entry, item)
      entry.is_a?(Hash) && (entry['criterion_slug'] == item[:slug] || entry['title'].to_s.casecmp?(item[:title]))
    end

    def heuristic_payload
      cleaned = raw_text.gsub(/\b(é+|hm+|tipo assim)\b/i, '').squeeze(' ').strip
      clean = cleaned.presence || 'Experiência registrada por áudio.'
      rating = initial_rating || infer_overall_rating(clean)
      {
        'headline' => build_headline(clean, rating),
        'clean_comment' => clean.truncate(480),
        'inferred_rating' => rating,
        'inferred_criteria' => infer_criteria_scores(clean, rating),
        'mentioned_equipment' => extract_equipment(clean),
        'project_type' => review_form&.form_type,
        'contains_offensive_language' => false
      }
    end

    def infer_overall_rating(text)
      neg = text.scan(/atras|ruim|péssim|demor|problem|melhorar|reclama/i).size
      pos = text.scan(/bom|boa|ótim|excelent|rápid|recomendo|perfeit|educad/i).size
      return 4 if pos.positive? && neg.positive?
      return 2 if neg > pos

      5
    end

    def build_headline(text, rating)
      if text.match?(/atendimento/i) && text.match?(/prazo|demor|atras/i)
        return 'Bom atendimento, mas prazo pode melhorar'
      end
      return "Excelente experiência com #{company_name}" if rating >= 4

      "Avaliação sobre #{company_name}"
    end

    def criteria_catalog
      resolved = review_form ? ReviewForms::CriteriaResolver.call(review_form: review_form) : []
      return resolved.map { |c| { id: c.id, slug: c.slug, title: c.title } } if resolved.any?

      titles = Array(review_form&.normalized_settings&.dig('criteria')).presence || %w[Atendimento Prazo Qualidade]
      titles.map { |title| { id: nil, slug: title.to_s.parameterize(separator: '_'), title: title.to_s } }
    end

    def infer_criteria_scores(text, overall)
      criteria_catalog.map do |item|
        score = score_for_criterion(item[:title], text, overall)
        { 'criterion_id' => item[:id], 'criterion_slug' => item[:slug], 'title' => item[:title], 'score' => score }
      end
    end

    def score_for_criterion(title, text, overall)
      down = title.to_s.downcase
      if down.include?('prazo') && text.match?(/prazo|atras|demor|rápid|entrega/i)
        return text.match?(/atras|demor|melhorar/i) ? 3 : 5
      end
      if down.include?('atendimento') && text.match?(/atendimento|equipe|vendedor|comercial/i)
        return text.match?(/ruim|péssim/i) ? 2 : 5
      end
      overall
    end

    def extract_equipment(text)
      BRANDS.select { |brand| text.match?(/\b#{Regexp.escape(brand)}\b/i) }
    end
  end
end
