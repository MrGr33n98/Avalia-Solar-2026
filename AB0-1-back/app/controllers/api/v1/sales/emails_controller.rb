module Api
  module V1
    module Sales
      class EmailsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          emails = ::Sales::EmailMessage.includes(:account, :contact)
                                        .order(created_at: :desc)
                                        .limit(50)

          render json: {
            emails: emails.map { |e| serialize_email(e) }
          }
        end

        def show
          email = ::Sales::EmailMessage.find(params[:id])
          render json: { email: serialize_email(email, detailed: true) }
        end

        def create
          account = ::Sales::Account.find(email_params[:sales_account_id])
          contact = ::Sales::Contact.find(email_params[:sales_contact_id])

          email = ::Sales::EmailMessage.create!(
            sales_account_id: account.id,
            sales_contact_id: contact.id,
            sales_opportunity_id: email_params[:sales_opportunity_id],
            sender_user_id: current_user.id,
            from_email: current_user.email || 'comercial@avaliasolar.com.br',
            to_email: contact.email || email_params[:to_email],
            subject: email_params[:subject],
            body_text: email_params[:body_text] || email_params[:body],
            body_html: email_params[:body_html],
            status: 'queued'
          )

          # Launch background delivery job
          ::Sales::SendEmailJob.perform_later(email.id)

          render json: {
            message: 'E-mail enfileirado para envio com sucesso.',
            email: serialize_email(email)
          }, status: :created
        end

        private



        def email_params
          params.require(:email).permit(
            :sales_account_id, :sales_contact_id, :sales_opportunity_id,
            :to_email, :subject, :body, :body_text, :body_html
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
