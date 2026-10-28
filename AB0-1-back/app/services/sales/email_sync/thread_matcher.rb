# frozen_string_literal: true

module Sales
  module EmailSync
    class ThreadMatcher
      def self.resolve_or_create_thread(email_account:, provider_thread_id:, subject:, occurred_at:)
        clean_subject = (subject || '').sub(/\A(Re|Fwd|Enc|Res):\s*/i, '').strip
        normalized = clean_subject.downcase.gsub(/\s+/, ' ')

        # 1. Match by provider thread ID in same account
        if provider_thread_id.present?
          thread = Sales::EmailThread.find_by(
            sales_email_account_id: email_account.id,
            provider_thread_id: provider_thread_id
          )
          if thread
            thread.update!(last_message_at: [thread.last_message_at, occurred_at].compact.max)
            return thread
          end
        end

        # 2. Match by normalized subject within 14 days in same account
        thread = Sales::EmailThread.where(sales_email_account_id: email_account.id)
                                  .where(subject_normalized: normalized)
                                  .where('last_message_at >= ?', occurred_at - 14.days)
                                  .order(last_message_at: :desc)
                                  .first

        if thread
          thread.update!(last_message_at: [thread.last_message_at, occurred_at].compact.max)
          return thread
        end

        # 3. Create new thread
        Sales::EmailThread.create!(
          company_id: email_account.company_id,
          sales_email_account_id: email_account.id,
          assigned_user_id: email_account.user_id,
          provider_thread_id: provider_thread_id.presence || SecureRandom.uuid,
          subject_normalized: normalized,
          status: 'open',
          first_message_at: occurred_at,
          last_message_at: occurred_at,
          message_count: 0
        )
      end
    end
  end
end
