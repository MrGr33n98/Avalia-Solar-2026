module Api
  module V1
    module Sales
      class EmailsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
          page = [params.fetch(:page, 1).to_i, 1].max
          scope = scoped_emails.includes(:account, :contact).order(created_at: :desc)
          total = scope.count
          emails = scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            emails: emails.map { |e| serialize_email(e) },
            meta: { page: page, per_page: per_page, total: total, total_pages: (total.to_f / per_page).ceil }
          }
        end

        def show
          email = scoped_emails.find(params[:id])
          render json: { email: serialize_email(email, detailed: true) }
        end

        def create
          account = scoped_accounts.find(email_params[:sales_account_id])
          contact = account.contacts.find(email_params[:sales_contact_id])

          email = nil
          ::Sales::EmailMessage.transaction do
            thread = find_or_create_thread(account, contact)
            thread.update!(last_message_at: Time.current, message_count: thread.message_count + 1)

          email = ::Sales::EmailMessage.create!(
            company_id: account.company_id,
            sales_email_thread_id: thread.id,
            sales_account_id: account.id,
            sales_contact_id: contact.id,
            sales_opportunity_id: email_params[:sales_opportunity_id],
            message_id: email_params[:message_id].presence || "<#{SecureRandom.uuid}@avaliasolar.com.br>",
            in_reply_to: email_params[:in_reply_to],
            references_header: email_params[:references_header],
            sender_user_id: current_user.id,
            from_email: current_user.email || 'comercial@avaliasolar.com.br',
            to_email: contact.email || email_params[:to_email],
            subject: email_params[:subject],
            body_json: parsed_body_json,
            body_text: email_params[:body_text] || email_params[:body],
            body_html: email_params[:body_html],
            open_tracking_enabled: email_params[:open_tracking_enabled].nil? ? true : email_params[:open_tracking_enabled],
            click_tracking_enabled: email_params[:click_tracking_enabled].nil? ? true : email_params[:click_tracking_enabled],
            status: 'queued'
          )


            participants = {
            'from' => [email.from_email],
            'to' => [email.to_email],
            'cc' => email_params[:cc],
            'bcc' => email_params[:bcc]
          }
            participants.each do |kind, addresses|
            Array(addresses).flat_map { |value| value.to_s.split(',') }.map(&:strip).reject(&:blank?).each do |address|
              email.participants.create!(company_id: email.company_id, email: address, participant_type: kind)
              end
            end

            Array(email_params[:attachments]).first(10).each do |uploaded_file|
              next unless uploaded_file.respond_to?(:content_type) && uploaded_file.respond_to?(:size)

              attachment = email.attachments.create!(
                company_id: email.company_id,
                file_name: uploaded_file.original_filename.to_s,
                content_type: uploaded_file.content_type.to_s,
                file_size: uploaded_file.size,
                inline: false
              )
              attachment.file.attach(uploaded_file)
              attachment.save!
            end
          end

          # Launch background delivery job
          ::Sales::SendEmailJob.perform_later(email.id)

          render json: {
            message: 'E-mail enfileirado para envio com sucesso.',
            email: serialize_email(email)
          }, status: :created
        end

        private

        def parsed_body_json
          value = email_params[:body_json]
          return value || {} unless value.is_a?(String)

          JSON.parse(value)
        rescue JSON::ParserError
          raise ActionController::BadRequest, 'body_json inválido.'
        end

        def find_or_create_thread(account, contact)
          parent_ids = [email_params[:in_reply_to], email_params[:references_header]].compact_blank.flat_map { |value| value.to_s.split(/\s+/) }
          existing = ::Sales::EmailThread.joins(:messages).where(sales_account_id: account.id, company_id: account.company_id, sales_email_messages: { message_id: parent_ids }).first if parent_ids.any?
          existing || ::Sales::EmailThread.create!(company_id: account.company_id, sales_account_id: account.id, sales_contact_id: contact.id, subject_normalized: email_params[:subject].to_s.downcase.strip, first_message_at: Time.current, last_message_at: Time.current, message_count: 0)
        end

        def scoped_accounts
          return ::Sales::Account.all if current_user.admin?
          ::Sales::Account.where(company_id: current_user.company_id)
        end

        def scoped_emails
          return ::Sales::EmailMessage.all if current_user.admin?
          ::Sales::EmailMessage.joins(:account).where(sales_accounts: { company_id: current_user.company_id })
        end

        def email_params
          params.require(:email).permit(
            :sales_account_id, :sales_contact_id, :sales_opportunity_id,
            :to_email, :subject, :body, :body_text, :body_html, :open_tracking_enabled, :click_tracking_enabled, :message_id, :in_reply_to, :references_header, cc: [], bcc: [], attachments: [], body_json: {}
          )
        end

        def serialize_email(e, detailed: false)
          data = {
            id: e.id,
            subject: e.subject,
            from_email: e.from_email,
            to_email: e.to_email,
            status: e.status,
            sent_at: e.sent_at,
            delivered_at: e.delivered_at,
            open_count: e.open_count,
            click_count: e.click_count,
            account_id: e.sales_account_id,
            account_name: e.account&.name,
            contact_id: e.sales_contact_id,
            contact_name: e.contact ? [e.contact.first_name, e.contact.last_name].compact.join(' ') : nil,
            created_at: e.created_at
          }

          if detailed
            data[:body_text] = e.body_text
            data[:body_html] = e.body_html
            data[:events] = e.events.map { |ev| { event_type: ev.event_type, occurred_at: ev.occurred_at } }
          end

          data
        end
      end
    end
  end
end
