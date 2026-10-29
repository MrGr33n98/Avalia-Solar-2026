# frozen_string_literal: true

module Sales
  module EmailInbound
    class ReplyMatcher
      attr_reader :company_id, :email_account, :headers, :from_email, :to_email, :subject, :occurred_at, :provider_thread_id

      def initialize(company_id:, email_account:, headers: {}, from_email:, to_email:, subject:, occurred_at: nil, provider_thread_id: nil)
        @company_id = company_id
        @email_account = email_account
        @headers = headers || {}
        @from_email = from_email.to_s.downcase.strip
        @to_email = to_email.to_s.downcase.strip
        @subject = subject.to_s.strip
        @occurred_at = occurred_at || Time.current
        @provider_thread_id = provider_thread_id.to_s.strip.presence
      end

      def match
        # 1. Matching Forte por RFC Headers (In-Reply-To ou References)
        rfc_match = match_by_rfc_headers
        return rfc_match if rfc_match

        # 2. Matching por Provider Thread ID (Zoho thread)
        thread_match = match_by_provider_thread_id
        return thread_match if thread_match

        # 3. Matching Moderado por Assunto Normalizado e Participantes (Janela de 14 dias)
        subject_match = match_by_normalized_subject
        return subject_match if subject_match

        # 4. Sem correspondência inequívoca -> Unmatched para triagem
        { status: :unmatched, parent_message: nil, match_type: nil }
      end

      private

      def match_by_rfc_headers
        in_reply_to = headers[:in_reply_to].to_s.strip.gsub(/[<>]/, '').presence
        references = headers[:references].to_s.strip.presence

        tokens = []
        tokens << in_reply_to if in_reply_to
        if references
          tokens.concat(references.scan(/<([^>]+)>/).flatten)
          tokens.concat(references.split(/\s+/).map { |t| t.gsub(/[<>]/, '') })
        end
        tokens = tokens.map(&:strip).reject(&:blank?).uniq

        return nil if tokens.empty?

        # Busca outbound existente com esses IDs no mesmo tenant
        scope = Sales::EmailMessage.where(company_id: company_id)
        matched = scope.where(rfc_message_id: tokens)
                       .or(scope.where(provider_message_id: tokens))
                       .or(scope.where(message_id: tokens))
                       .order(created_at: :desc)
                       .first

        return nil unless matched

        {
          status: :matched,
          parent_message: matched,
          match_type: :rfc_header,
          sales_opportunity_id: matched.sales_opportunity_id,
          sales_contact_id: matched.sales_contact_id,
          sales_account_id: matched.sales_account_id,
          sales_email_thread_id: matched.sales_email_thread_id
        }
      end

      def match_by_provider_thread_id
        return nil unless provider_thread_id && email_account

        # Verifica se já temos mensagens na mesma thread e conta
        thread = Sales::EmailThread.find_by(
          company_id: company_id,
          sales_email_account_id: email_account.id,
          provider_thread_id: provider_thread_id
        )

        return nil unless thread

        last_outbound = thread.messages.where(direction: 'outbound').order(created_at: :desc).first
        return nil unless last_outbound

        {
          status: :matched,
          parent_message: last_outbound,
          match_type: :provider_thread_id,
          sales_opportunity_id: thread.sales_opportunity_id || last_outbound.sales_opportunity_id,
          sales_contact_id: thread.sales_contact_id || last_outbound.sales_contact_id,
          sales_account_id: thread.sales_account_id || last_outbound.sales_account_id,
          sales_email_thread_id: thread.id
        }
      end

      def match_by_normalized_subject
        clean_subject = subject.gsub(/^(Re|Fwd|Res|Enc):\s*/i, '').strip
        return nil if clean_subject.length < 4

        # Busca outbound recente enviado para este remetente
        window_start = occurred_at - 14.days
        candidates = Sales::EmailMessage.where(company_id: company_id)
                                        .where(direction: 'outbound')
                                        .where('created_at >= ?', window_start)
                                        .where('LOWER(to_email) = ?', from_email)
                                        .where('subject ILIKE ?', "%#{clean_subject}%")
                                        .order(created_at: :desc)
                                        .limit(2)
                                        .to_a

        # Só aceita se houver exatamente um único candidato claro
        return nil unless candidates.one?

        matched = candidates.first

        {
          status: :matched,
          parent_message: matched,
          match_type: :normalized_subject,
          sales_opportunity_id: matched.sales_opportunity_id,
          sales_contact_id: matched.sales_contact_id,
          sales_account_id: matched.sales_account_id,
          sales_email_thread_id: matched.sales_email_thread_id
        }
      end
    end
  end
end
