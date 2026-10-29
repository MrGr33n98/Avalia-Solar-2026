# frozen_string_literal: true

module Sales
  module EmailSync
    class ThreadMatcher
      def self.resolve_or_create_thread(email_account:, provider_thread_id:, subject:, occurred_at:)
        clean_subject = (subject || '').sub(/\A(Re|Fwd|Enc|Res):\s*/i, '').strip
        normalized = clean_subject.downcase.gsub(/\s+/, ' ')

        # 1. Match by provider thread ID in same company (respects unique index idx_email_threads_company_provider_id)
        if provider_thread_id.present?
          thread = Sales::EmailThread.find_by(
            company_id: email_account.company_id,
            provider_thread_id: provider_thread_id.to_s
          )
          if thread
            updates = { last_message_at: [thread.last_message_at, occurred_at].compact.max }
            updates[:sales_email_account_id] = email_account.id if thread.sales_email_account_id.nil?
            updates[:assigned_user_id] = email_account.user_id if thread.assigned_user_id.nil?
            thread.update!(updates)
            return thread
          end
        end

        # 2. Match by normalized subject within 14 days in same account (when subject is non-trivial)
        if normalized.present?
          thread = Sales::EmailThread.where(company_id: email_account.company_id, sales_email_account_id: email_account.id)
                                     .where(subject_normalized: normalized)
                                     .where('last_message_at >= ?', occurred_at - 14.days)
                                     .order(last_message_at: :desc)
                                     .first

          if thread
            thread.update!(last_message_at: [thread.last_message_at, occurred_at].compact.max)
            return thread
          end
        end

        # 3. Create new thread (rescue RecordNotUnique in case of concurrent workers)
        Sales::EmailThread.create!(
          company_id: email_account.company_id,
          sales_email_account_id: email_account.id,
          assigned_user_id: email_account.user_id,
          provider_thread_id: provider_thread_id.presence || SecureRandom.uuid,
          subject_normalized: normalized.presence || '(sem assunto)',
          status: 'open',
          first_message_at: occurred_at,
          last_message_at: occurred_at,
          message_count: 0
        )
      rescue ActiveRecord::RecordNotUnique
        Sales::EmailThread.find_by!(
          company_id: email_account.company_id,
          provider_thread_id: provider_thread_id.to_s
        )
      end
    end
  end
end
