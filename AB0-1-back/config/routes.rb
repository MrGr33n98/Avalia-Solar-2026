Rails.application.routes.draw do
  mount Rswag::Ui::Engine => '/api-docs' if defined?(Rswag::Ui::Engine)

  mount Rswag::Api::Engine => '/api-docs' if defined?(Rswag::Api::Engine)

  mount ActiveStorage::Engine => '/rails/active_storage'
  mount ActionCable.server => '/cable'

  ActiveAdmin.routes(self)

  devise_for :admin_users, ActiveAdmin::Devise.config.merge(
    controllers: {
      sessions: 'admin/sessions'
    }
  )

  namespace :admin do
    resource :two_factor, only: %i[show manage] do
      post :enable
      post :disable
      get :backup_codes
      post :regenerate_backup_codes
    end
  end

  devise_for :users
  # devise_for :users, controllers: {
  #   omniauth_callbacks: 'users/omniauth_callbacks'
  # }

  get '/health', to: 'health#show'
  get '/health/readiness', to: 'health#readiness'
  get '/health/liveness', to: 'health#liveness'
  get '/health/details', to: 'health#details'
  get '/health/test_error', to: 'health#test_error'
  get '/health/test_scout', to: 'health#test_scout'

  mount Yabeda::Prometheus::Exporter, at: '/metrics'

  namespace :api do
    namespace :v1 do
      get 'states', to: 'companies#states'

      resources :articles do
        collection do
          get :featured
        end
        member do
          get :related
        end
      end

      resources :companies do
        collection do
          get :states
          get :cities
          get :locations
          get :featured
          get :mine
          get 'by_slug/:slug', to: 'companies#show_by_slug'
        end

        member do
          get 'sector_ratings/summary', to: 'sector_ratings#summary'
          get 'sector_ratings/questions', to: 'sector_ratings#questions'
          get 'analytics/historical', to: 'companies#analytics_historical'
          get 'analytics/reviews', to: 'companies#analytics_reviews'
          get 'analytics/competitors', to: 'companies#analytics_competitors'
          get 'analytics/traffic', to: 'companies#analytics_traffic'
          get :widget_data, to: 'widget_data#show'
          get :badges, to: 'badges#index'
          post 'request_admin_access', to: 'companies#request_admin_access'
          get :categories
          get :social_proof
        end

        resources :sector_ratings, only: [:create]

        resources :financing_options, only: %i[index create update destroy] do
          collection do
            get :compare
            get :simulate
          end
        end

        resources :financing_proposals, only: %i[create show] do
          member do
            get :status
          end
        end
      end

      post 'analytics/track', to: 'analytics#track'
      post 'events/track', to: 'analytics#events_track'
      get 'analytics/conversions', to: 'analytics#conversions'
      get 'analytics/overview', to: 'analytics#overview'
      get 'analytics/funnel', to: 'analytics#funnel'

      # Intent Scores API
      resources :intent_scores, only: [:index, :show] do
        collection do
          get :summary
          post :recalculate
        end
      end
      resources :intent_signals, only: [:create]

      # Identity Stitching API
      scope 'identity', as: :identity do
        post 'stitch', to: 'identity_stitch#create'
        post 'track_session', to: 'identity_stitch#track_session'
      end

      # Gated Downloads API
      resources :gated_downloads, only: [:create]
      resources :company_webhooks, only: %i[index create update destroy]

      # Consent endpoints
      namespace :consent do
        post 'log'
        post 'revoke'
        get 'status'
      end

      get 'lead_wizards/resolve', to: 'lead_wizards#resolve'

      resources :banner_offers, only: [:index]
      resources :banner_events, only: [:create]
      post 'payments/webhooks/:provider', to: 'payments_webhooks#create'

      resources :categories do
        member do
          get :companies
          get :products
          get :banners
          get :evaluation_context
        end

        collection do
          get :tree
          get :featured
          get 'by_slug/:slug', to: 'categories#show_by_slug'
        end
      end

      get 'dashboard/stats', to: 'dashboard#stats'
      get 'dashboard/charts/:metric', to: 'dashboard#charts'
      get 'dashboard/activity', to: 'dashboard#activity'
      get 'dashboard/export', to: 'dashboard_exports#export'

      scope :company_dashboard do
        # New derived-only analytics endpoints
        get 'analytics/overview', to: 'company_dashboard#analytics_overview'
        get 'analytics/timeseries', to: 'company_dashboard#analytics_timeseries'
        get 'analytics/top_campaigns', to: 'company_dashboard#analytics_top_campaigns'
        get 'analytics/reputation', to: 'company_dashboard#analytics_reputation'
        get 'analytics/ranking', to: 'company_dashboard#analytics_ranking'
        
        # Trust & Certification endpoints (TaaS)
        get 'trust_health', to: 'company_dashboard#trust_health'
        get 'intent_summary', to: 'company_dashboard#intent_summary'
        get 'certification_progress', to: 'company_dashboard#certification_progress'
        
        get 'assets', to: 'company_dashboard#assets'

        get 'stats', to: 'company_dashboard#stats'
        get 'banner_subscriptions', to: 'company_dashboard#banner_subscriptions'
        post 'banner_checkout', to: 'company_dashboard#banner_checkout'
        get 'notifications', to: 'company_dashboard#notifications'
        get 'pending_changes', to: 'company_dashboard#pending_changes'
        get 'media', to: 'company_dashboard#media'
        get 'videos', to: 'company_dashboard#videos'
        post 'update_info', to: 'company_dashboard#update_info'
        post 'update_logo', to: 'company_dashboard#update_logo'
        post 'update_banner', to: 'company_dashboard#update_banner'
        post 'add_categories', to: 'company_dashboard#add_categories'
        post 'remove_category', to: 'company_dashboard#remove_category'
        post 'update_ctas', to: 'company_dashboard#update_ctas'
        post 'upload_media', to: 'company_dashboard#upload_media'
        post 'add_video', to: 'company_dashboard#add_video'
        delete 'remove_video', to: 'company_dashboard#remove_video'
        get 'social_proof_reviews', to: 'company_dashboard#social_proof_reviews'
        patch 'social_proof_reviews/:id', to: 'company_dashboard#update_social_proof_review'
        get 'social_proof_stats', to: 'company_dashboard#social_proof_stats'
        get 'market_insights', to: 'company_dashboard/market_insights#index'

        resources :sector_questions, controller: 'company_sector_questions', only: %i[index create update destroy]

        resources :banners, only: %i[index create update destroy], controller: 'company_dashboard_banners' do
          member do
            patch :submit
          end
        end
      end

      get 'review_dashboard/summary', to: 'review_dashboard#summary'

      resources :banners, only: [:index]
      resources :banner_globals, only: [:index]
      resources :badges, param: :slug, only: [:show]

      resources :products, only: %i[index show] do
        member do
          get :reviews
        end

        collection do
          get :filters
          get :compare
        end
      end

      resources :campaign_reviews, only: %i[index show]

      resources :reviews, only: %i[index show create update destroy] do
        collection do
          get :mine
        end
      end

      # Notifications API
      resources :notifications, only: [:index] do
        collection do
          get :unread_count
          post :mark_all_as_read
        end
        member do
          post :mark_as_read
        end
      end

      namespace :admin do
        resources :reviews, only: %i[index show] do
          member do
            patch :approve
            patch :reject
          end
        end
      end

      resources :leads, only: %i[create index show] do
        collection do
          post :wizard_create
          get :mine
        end

        member do
          post :send_otp
          post :resend_otp
          post :verify_otp
          get :wizard_result
        end
      end

      resources :users, only: %i[show update create] do
        collection do
          get :me_companies
          post :switch_company
        end
      end

      namespace :trust do
        get :profile
        get 'widgets/config', to: 'trust#widgets_config'
      end

      get 'company_access/context', to: 'company_access#context'
      post 'company_access/select_active_company', to: 'company_access#select_active_company'
      resources :company_access_requests, only: %i[create destroy]

      get 'search', to: 'search#index'
      get 'search/all', to: 'search#all'
      get 'search/suggest', to: 'search#suggest'

      scope :auth, controller: 'auth' do
        post :login
        post :signup
        post :register
        post :logout
        post :logout_all
        post :refresh
        get :me
        post :forgot_password
        post :reset_password
        post :resend_confirmation
        post :confirm_email
      end

      get 'content_feed', to: 'content_feed#index'

      namespace :dashboard do
        get 'me', to: 'me#show'
        get 'analytics', to: 'analytics#index'
        resources :leads, only: [:index]
        resources :products, only: [:index]
        resource :company, only: [:update]
      end

      namespace :company do
        resources :members do
          collection do
            post :invite
          end
        end
        resources :pending_changes, only: %i[index show]
      end

      namespace :company_admin do
        resources :faqs, only: %i[index create update destroy] do
          collection do
            post :reorder
          end
        end

        resource :financing_profile, only: %i[show update]

        resources :financing_partners, only: %i[index create update destroy] do
          collection do
            post :reorder
          end
        end

        resources :financing_offers, only: %i[index create update destroy] do
          collection do
            post :reorder
          end
        end
      end

      resources :faqs do
        member do
          post :vote
        end
      end

      resources :seo_pages, param: :slug, only: [:show]
    end
  end

  # Legacy fallback for clients that still call API routes without /api/v1.
  scope module: 'api/v1' do
    get '/companies/:company_id/sector_ratings/questions', to: 'sector_ratings#questions'
    get '/companies/:company_id/sector_ratings/summary', to: 'sector_ratings#summary'
    post '/companies/:company_id/sector_ratings', to: 'sector_ratings#create'
  end

  namespace :dashboard do
    root to: 'home#index'
    get 'analytics', to: 'analytics#index'
    resource :company, only: %i[edit update]
    resources :categories, only: [:index] do
      collection do
        post :request_category
      end
    end
  end

  get 'waiting_approval', to: 'dashboard/access#waiting_approval', as: :waiting_approval

  # ============================================================
  # app.avaliasolar.com.br — Ecossistema B2B Solar
  # Mesmo banco, namespace separado, layout próprio Hotwire
  # ============================================================
  constraints subdomain: 'app' do
    scope module: :app, as: :app do

      # Landing pública — Expo de parceiros (tipo OpenSolar Expo)
      root to: 'expo#index', as: :root

      resources :suppliers,   only: %i[index show]
      resources :integrators, only: %i[index show]
      resources :distributors, only: %i[index show]

      # Autenticação (reusa Devise existente)
      get  'entrar',  to: 'sessions#new',    as: :login
      post 'entrar',  to: 'sessions#create'
      delete 'sair',  to: 'sessions#destroy', as: :logout

      # Painel autenticado da empresa
      namespace :painel do
        root to: 'dashboard#index'

        resources :projects do
          member do
            patch :advance_stage
          end
          resources :proposals, only: %i[show create update]
        end

        resources :leads,    only: %i[index show]
        resources :reviews,  only: %i[index show]
        resources :catalog,  only: %i[index show new create edit update destroy]
        resource  :settings, only: %i[show update]
        resource  :company,  only: %i[show edit update]
      end

      # Admin interno Avalia Solar (gestão do ecossistema app.)
      namespace :admin do
        root to: 'dashboard#index'
        resources :companies,     only: %i[index show edit update]
        resources :expo_sections, only: %i[index new create edit update destroy]
        resources :plans,         only: %i[index new create edit update destroy]
      end

    end
  end

  root 'rails/welcome#index'
end
