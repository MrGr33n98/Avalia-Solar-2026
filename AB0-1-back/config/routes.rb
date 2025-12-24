Rails.application.routes.draw do
  if defined?(Rswag::Ui::Engine)
    mount Rswag::Ui::Engine => '/api-docs'
  end

  if defined?(Rswag::Api::Engine)
    mount Rswag::Api::Engine => '/api-docs'
  end

  mount ActiveStorage::Engine => "/rails/active_storage"

  # ActiveAdmin routes
  ActiveAdmin.routes(self)

  devise_for :admin_users, ActiveAdmin::Devise.config.merge(
    controllers: {
      sessions: 'admin/sessions'
    }
  )
  devise_for :users, controllers: {
    omniauth_callbacks: 'users/omniauth_callbacks'
  }

  # Health check endpoints
  get '/health', to: 'health#show'
  get '/health/readiness', to: 'health#readiness'
  get '/health/liveness', to: 'health#liveness'
  get '/health/details', to: 'health#details'

  # TASK-009: Metrics endpoint
  mount Yabeda::Prometheus::Exporter, at: '/metrics'

  # API routes
  namespace :api do
    namespace :v1 do
      # Global states endpoint for frontend compatibility
      get 'states', to: 'companies#states'

      # Articles routes
      resources :articles do
        member do
          get :related
        end
      end

      # Companies routes
      resources :companies do
        collection do
          get :states
          get :cities
          get :locations
          get :featured
        end

        member do
          get 'analytics/historical', to: 'companies#analytics_historical'
          get 'analytics/reviews', to: 'companies#analytics_reviews'
          get 'analytics/competitors', to: 'companies#analytics_competitors'
          get 'analytics/traffic', to: 'companies#analytics_traffic'
          post 'request_admin_access', to: 'companies#request_admin_access'
          get :categories
        end

        resources :financing_options, only: [:index, :create, :update, :destroy] do
          collection do
            get :compare
          end
        end
      end

      # Analytics routes
      post 'analytics/track', to: 'analytics#track'

      # Dashboard routes
      get 'dashboard/stats', to: 'dashboard#stats'

      # Company Dashboard routes
      scope :company_dashboard do
        get 'stats', to: 'company_dashboard#stats'
        get 'notifications', to: 'company_dashboard#notifications'
        get 'pending_changes', to: 'company_dashboard#pending_changes'
        get 'media', to: 'company_dashboard#media'
        post 'update_info', to: 'company_dashboard#update_info'
        post 'add_categories', to: 'company_dashboard#add_categories'
        post 'remove_category', to: 'company_dashboard#remove_category'
        post 'update_ctas', to: 'company_dashboard#update_ctas'
        post 'upload_media', to: 'company_dashboard#upload_media'
      end

      # Categories routes
      # Refatorado: sem 'only' para permitir create/update/destroy
      resources :categories do
        member do
          get :companies
          get :products
          get :banners
        end

        collection do
          get :featured
          get 'by_slug/:slug', to: 'categories#show_by_slug'
        end
      end

      # Banners routes
      resources :banners, only: [:index]

      # BannerGlobals routes
      resources :banner_globals, only: [:index]

      # Products routes
      resources :products, only: [:index, :show] do
        member do
          get :reviews
        end
      end

      # Reviews routes
      resources :reviews, only: [:index, :show, :create, :update, :destroy]

      # Leads routes
      resources :leads, only: [:create, :index, :show] do
        collection do
          post :wizard_create
        end

        member do
          post :send_otp
          post :resend_otp
          post :verify_otp
          get :wizard_result
        end
      end

      # Users routes
      resources :users, only: [:show, :update]

      # Search routes
      get 'search', to: 'search#index'
      get 'search/all', to: 'search#all'
      get 'search/suggest', to: 'search#suggest'

      # Authentication routes
      namespace :auth do
        post :login
        post :signup
        post :register
        post :logout
        get :me
        post :forgot_password
        post :reset_password
        post :confirm_email
      end

      # Content Feed
      get 'content_feed', to: 'content_feed#index'
    end

    namespace :dashboard do
      get 'me', to: 'me#show'
      get 'analytics', to: 'analytics#index'
      resources :leads, only: [:index]
      resources :products, only: [:index]
      resource :company, only: [:update]
    end
  end

  namespace :dashboard do
    root to: "home#index"
    get "analytics", to: "analytics#index"
    resource :company, only: [:edit, :update]
    resources :categories, only: [:index] do
      collection do
        post :request_category
      end
    end
  end

  get "waiting_approval", to: "dashboard/access#waiting_approval", as: :waiting_approval

  # Root route
  root 'rails/welcome#index'
end
