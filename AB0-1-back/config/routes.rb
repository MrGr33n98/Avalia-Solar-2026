Rails.application.routes.draw do
  mount ActiveStorage::Engine => "/rails/active_storage"
  # ActiveAdmin routes
  ActiveAdmin.routes(self)
  devise_for :admin_users, ActiveAdmin::Devise.config.merge(
    controllers: {
      sessions: 'admin/sessions'
    }
  )

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
      # Companies routes
      resources :companies do
        collection do
          get :states
          get :cities
          get :locations
        end
        member do
          get 'analytics/historical', to: 'companies#analytics_historical'
          get 'analytics/reviews', to: 'companies#analytics_reviews'
          get 'analytics/competitors', to: 'companies#analytics_competitors'
          get 'analytics/traffic', to: 'companies#analytics_traffic'
          post 'request_admin_access', to: 'companies#request_admin_access'
          get :categories
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
      resources :categories, only: [:index, :show] do
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
      resources :leads, only: [:create, :index, :show]

      # Users routes
      resources :users, only: [:show, :update]

      # Search routes
      get 'search', to: 'search#index'
      get 'search/all', to: 'search#all'
      get 'search/suggest', to: 'search#suggest'

      # Authentication routes
      namespace :auth do
        post :login
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
  end

  # Root route
  root 'rails/welcome#index'
end
