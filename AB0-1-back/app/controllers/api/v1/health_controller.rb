# app/controllers/api/v1/health_controller.rb

module Api
  module V1
    class HealthController < BaseController
      skip_before_action :authenticate_user!, only: [:live, :ready], raise: false

      # GET /api/v1/health/live (Liveness probe)
      def live
        render json: { status: 'alive' }, status: :ok
      end

      # GET /api/v1/health/ready (Readiness probe)
      def ready
        checks = {
          database: check_database,
          redis: check_redis,
          sidekiq: check_sidekiq
        }

        all_ready = checks.values.all? { |c| c[:status] == 'ready' }

        render json: checks, status: all_ready ? :ok : :service_unavailable
      end

      private

      def check_database
        begin
          ActiveRecord::Base.connection.execute("SELECT 1")
          { status: 'ready' }
        rescue => e
          { status: 'not_ready', error: e.message }
        end
      end

      def check_redis
        begin
          Sidekiq.redis { |c| c.ping }
          { status: 'ready' }
        rescue => e
          { status: 'not_ready', error: e.message }
        end
      end

      def check_sidekiq
        begin
          processes = Sidekiq::ProcessSet.new
          processes.any? ? { status: 'ready' } : { status: 'not_ready', reason: 'no_workers' }
        rescue => e
          { status: 'not_ready', error: e.message }
        end
      end
    end
  end
end
