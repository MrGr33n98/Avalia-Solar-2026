module Api
  module V1
    class PaymentsController < ApplicationController
      # Ignorar CSRF e token para testar mais rapido ou no caso de Webhooks
      skip_before_action :verify_authenticity_token, only: [:create_intent, :webhook]

      def create_intent
        amount = params[:amount].to_i
        company_id = params[:company_id]
        user = current_user || User.first # mock de user

        begin
          # Em um ambiente real com Stripe Connect, usaríamos destination charges
          # Stripe.api_key = ENV['STRIPE_SECRET_KEY']
          
          # Simulando a resposta do Stripe para evitar falhas se a API Key não existir
          payment_intent_id = "pi_mock_#{SecureRandom.hex(10)}"
          client_secret = "seti_mock_#{SecureRandom.hex(10)}_secret_#{SecureRandom.hex(10)}"

          transaction = Transaction.create!(
            user: user,
            company_id: company_id,
            amount: amount,
            status: 'in_escrow',
            stripe_payment_intent_id: payment_intent_id,
            description: "Pagamento Retido (Escrow) - Avalia Solar Pay"
          )

          # Criando os Milestones (ex: 50% equipamentos, 50% ativação)
          transaction.milestones.create!(
            title: "Compra de Equipamentos (50%)",
            percentage: 50,
            amount: amount * 0.5,
            status: 'ready_to_release'
          )
          transaction.milestones.create!(
            title: "Instalação e Homologação (50%)",
            percentage: 50,
            amount: amount * 0.5,
            status: 'locked'
          )

          render json: {
            success: true,
            transaction_id: transaction.id,
            client_secret: client_secret,
            payment_intent_id: payment_intent_id
          }
        rescue => e
          render json: { success: false, error: e.message }, status: :unprocessable_entity
        end
      end

      def release_milestone
        milestone = Milestone.find(params[:milestone_id])
        
        # Aqui o backend chama a API do Stripe Connect para fazer o payout/transfer
        milestone.update!(status: 'released')
        
        payment_transaction = milestone.payment_transaction
        
        if payment_transaction.milestones.where.not(status: 'released').empty?
          payment_transaction.update!(status: 'released')
        end

        render json: { success: true, milestone: milestone }
      end
    end
  end
end
