Rails.application.routes.draw do
  mount Rswag::Ui::Engine => '/api-docs' if defined?(Rswag::Ui::Engine)

  mount Rswag::Api::Engine => '/api-docs' if defined?(Rswag::Api::Engine)

  mount ActiveStorage::Engine => '/rails/active_storage'
  mount ActionCable.server => '/cable'

  get '/admin/publicidade_campanhas', to: 'api/v1/publicidade_campanhas#index', constraints: ->(req) { req.format.json? || req.headers['Accept'] =~ /json/ }
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

  devise_for :users, controllers: {
    omniauth_callbacks: 'users/omniauth_callbacks'
  }

  get '/health', to: 'health#show'
  get '/health/readiness', to: 'health#readiness'
  get '/health/liveness', to: 'health#liveness'
  get '/health/details', to: 'health#details'
  get '/health/test_error', to: 'health#test_error'
  get '/health/test_scout', to: 'health#test_scout'

  # GraphQL — nova camada paralela ao REST, não substitui /api/v1
  # Fase 1: consulta PostgreSQL diretamente
  # Fase 3+: será integrado com OpenSearch via Search::CompanySearchService
  post '/graphql', to: 'graphql#execute'

  mount Yabeda::Prometheus::Exporter, at: '/metrics'

  namespace :api do
    namespace :v1 do
      namespace :mcp do
        post 'tools/:tool_name', to: 'tools#create'
      end

      scope :sales do
        get 'today', to: 'sales/today#index'
        get 'search', to: 'sales/search#index'
        get 'analytics', to: 'sales/analytics#index'
        get 'opportunities', to: 'sales/opportunities#index'
        get 'summary', to: 'sales#summary'
        get 'attribution', to: 'sales/attribution#index'
        get 'forecast', to: 'sales/forecast#index'
        post 'companies/:company_id/account', to: 'sales/account_links#create'
        resources :taxonomies, only: %i[index create update destroy], controller: 'sales/taxonomies'
        resources :custom_field_definitions, controller: 'sales/custom_field_definitions'
        resources :notes, controller: 'sales/notes'
        resources :api_keys, only: %i[index create destroy], controller: 'sales/api_keys'
        resources :integrations, controller: 'sales/integrations'
        resources :webhooks, controller: 'sales/webhooks'
        resources :products, controller: 'sales/products'
        resources :quotes, controller: 'sales/quotes' do
          resources :items, controller: 'sales/quote_items'
          get :document, to: 'sales/quote_documents#show'
        end
        resources :site_surveys, controller: 'sales/site_surveys'
        resources :forms, controller: 'sales/forms'
        resources :tracking_sessions, controller: 'sales/tracking_sessions'
        resources :tracking_events, controller: 'sales/tracking_events'
        post 'tracking_identity', to: 'sales/tracking_identity#create'
        get 'rbac/roles', to: 'sales/rbac#roles'
        get 'rbac/permissions', to: 'sales/rbac#permissions'
        resources :user_roles, only: %i[index create destroy], controller: 'sales/user_roles'
        resources :consents, only: %i[index create], controller: 'sales/consents'
        post 'consent_revocations', to: 'sales/consent_revocations#create'
        resources :saved_views, only: %i[index create update destroy], controller: 'sales/saved_views' do
          post :pin, on: :member
        end
        resources :tags, only: %i[index create update destroy], controller: 'sales/tags' do
          post :apply, on: :member
          delete :remove, on: :member
        end
        resources :campaigns, controller: 'sales/campaigns' do
          member do
            post :snapshot
            post :preflight
            post :dispatch, action: :launch
            post :launch, action: :launch
            post :pause
            post :resume
            post :cancel
            post :retry_failed
            get :analytics
          end
        end
        post 'audiences/preview', to: 'sales/audiences#preview'
        get 'audiences/segments', to: 'sales/audiences#segments'
        resources :emails, only: %i[index create show], controller: 'sales/emails'
        resources :email_templates, only: %i[index show create update destroy], controller: 'sales/email_templates' do
          post :preview, on: :member
        end
        resources :email_sequences, only: %i[index show create update destroy], controller: 'sales/email_sequences'
        resources :email_suppressions, only: %i[index create destroy], controller: 'sales/email_suppressions'
        resources :email_signatures, only: %i[index create update destroy], controller: 'sales/email_signatures'
        post 'email_events/provider', to: 'sales/email_events#create'
        resources :pipelines, only: %i[index show], controller: 'sales/pipelines' do
          get :board, to: 'sales/pipelines/boards#show', on: :member
        end
        get 'pipelines/board', to: 'sales/pipelines/boards#show'
        resources :accounts, only: %i[index create show update], controller: 'sales/accounts' do
          collection do
            post :export
            get :export
            post :bulk
            get :filter_options
            get :duplicates
          end
          member do
            post :merge
          end
        end
        resources :contacts, only: %i[index show create update], controller: 'sales/contacts' do
          get :timeline, on: :member
          get :engagement, on: :member
          resources :employments, only: %i[index create update destroy], controller: 'sales/contact_employments'
        end
        post 'opportunities/bulk', to: 'sales/opportunities#bulk'
        resources :opportunities, only: %i[index create show update], controller: 'sales/opportunities' do
          resources :contacts, only: %i[index create update destroy], controller: 'sales/opportunity_contacts'
          member do
            get :timeline
          end
        end
        post 'leads/bulk', to: 'sales/leads#bulk'
        resources :leads, only: %i[index create show update], controller: 'sales/leads' do
          post :convert, on: :member
        end
        resources :sources, only: %i[index], controller: 'sales/sources'
        resources :competitors, only: %i[index create], controller: 'sales/competitors'
        resources :accounts, only: [] do
          resources :contacts, only: %i[index create], controller: 'sales/contacts'
          resources :tasks, only: %i[index create], controller: 'sales/tasks'
          resources :activities, only: %i[index create], controller: 'sales/activities'
        end
        resources :tasks, only: %i[index create update], controller: 'sales/tasks'
        resources :opportunities, only: [] do
          resource :qualification, only: %i[show], controller: 'sales/qualifications'
          put :qualification, to: 'sales/qualifications#upsert'
          post :won, to: 'sales/closures#won'
          post :lost, to: 'sales/closures#lost'
          get :timeline, to: 'sales/opportunities#timeline'
        end
      end

      resources :push_subscriptions, only: [:create] do
        collection do
          delete :destroy
        end
      end

      # Social Core API routes
      get 'feed', to: 'feed#index'
      resources :groups, param: :slug, only: %i[index show create update], controller: 'groups' do
        collection do
          get :recommendations
        end
        resource :join, only: %i[create destroy], controller: 'groups/memberships'
        resource :membership, only: :show, controller: 'groups/memberships'
        resources :members, only: %i[index update], controller: 'groups/members' do
          member do
            post :suspend
            post :restore
          end
        end
        resources :requests, only: :index, controller: 'groups/membership_requests' do
          member do
            post :approve
            post :reject
          end
        end
        resources :topics, only: %i[index create update destroy], controller: 'groups/topics'
        resources :rules, only: %i[index create update destroy], controller: 'groups/rules'
        resources :posts, only: %i[index create show update destroy], controller: 'groups/posts' do
          member do
            post :hide
            post :restore
            post :pin
            delete :pin, action: :unpin
            post :close_comments
            post :open_comments
          end
        end
        member do
          get :analytics
        end
      end
      resources :content_reports, only: %i[index create update]
      resources :social_follows, path: 'follows', only: %i[index create] do
        collection do
          delete '/', to: 'social_follows#destroy'
        end
      end
      resources :reactions, only: %i[create] do
        collection do
          delete '/', to: 'reactions#destroy'
        end
      end
      resources :comments, only: %i[index create destroy]
      resources :saved_items, only: %i[index create] do
        collection do
          delete '/', to: 'saved_items#destroy'
        end
      end
      resources :polls, only: [] do
        member { post :vote }
      end

      # Growth analytics — PostHog webhook
      post 'posthog_webhook', to: 'posthog_webhooks#create'
      get 'posthog_webhook/health', to: 'posthog_webhooks#health'

      get 'states', to: 'companies#states'
      get 'local_solar_pages/:state/:city', to: 'local_solar_pages#show'
      get 'local_solar_pages/:state', to: 'local_solar_pages#show'
      get 'sitemaps/local_rankings', to: 'sitemaps#local_rankings'
      get 'sitemaps/group_posts', to: 'sitemaps#group_posts'

      resources :articles do
        collection do
          get :featured
        end
        member do
          get :related
        end
      end

      resources :recommendations, only: %i[index]

      resources :favorites, only: %i[index create destroy] do
        collection do
          delete :by_item
          get :status
        end
      end

      resources :financial_institutions, only: %i[index show]

      resources :companies do
        collection do
          get :states
          get :cities
          get :locations
          get :featured
          get :mine
          get 'by_slug/:slug', to: 'companies#show_by_slug'
        end

        resources :projects, only: %i[index show], controller: 'company_projects'
        resources :materials, only: %i[index show], controller: 'company_materials'

        member do
          get 'sector_ratings/summary', to: 'sector_ratings#summary'
          get 'sector_ratings/questions', to: 'sector_ratings#questions'
          get 'analytics/historical', to: 'companies#analytics_historical'
          get 'analytics/reviews', to: 'companies#analytics_reviews'
          get 'analytics/competitors', to: 'companies#analytics_competitors'
          get 'analytics/traffic', to: 'companies#analytics_traffic'
          get :widget_data, to: 'widget_data#show'
          get :badges, to: 'badges#index'
          get :feature_access
          post 'request_admin_access', to: 'companies#request_admin_access'
          get :categories
          get :catalog
          get :social_proof
          get  :views_count
          post :track_view
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
      resources :material_downloads, only: %i[create] do
        member { get :file }
      end
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
      get 'banner_clicks/:id', to: 'banner_clicks#show'
      post 'payments_webhooks', to: 'payments_webhooks#create', defaults: { provider: 'stripe' }
      post 'payments/webhooks/:provider', to: 'payments_webhooks#create'
      post 'payments/create_intent', to: 'payments#create_intent'
      post 'payments/release_milestone', to: 'payments#release_milestone'

      resources :categories do
        member do
          get :companies
          get :products
          get :banners
          get :evaluation_context
          get :solution_types
          get 'solution_types/compare', to: 'categories#compare_solution_types'
          post :company_matches
        end

        collection do
          get :tree
          get :featured
          get 'by_slug/:slug', to: 'categories#show_by_slug'
        end
      end

      get 'companies/:company_id/quote_form', to: 'company_quote_form#show'
      patch 'companies/:company_id/quote_form', to: 'company_quote_form#update_draft'
      post 'companies/:company_id/quote_form/draft', to: 'company_quote_form#create_draft'
      patch 'companies/:company_id/quote_form/draft', to: 'company_quote_form#update_draft'
      post 'companies/:company_id/quote_form/publish', to: 'company_quote_form#publish'

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

        get 'subscription', to: 'company_dashboard#subscription'
        get 'stats', to: 'company_dashboard#stats'
        get 'banner_subscriptions', to: 'company_dashboard#banner_subscriptions'
        post 'banner_checkout', to: 'company_dashboard#banner_checkout'
        post 'banner_addon_checkout', to: 'company_dashboard#banner_addon_checkout'
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
        get 'social_proof_reviews/:id', to: 'company_dashboard#social_proof_review'
        patch 'social_proof_reviews/:id', to: 'company_dashboard#update_social_proof_review'
        post 'social_proof_reviews/:id/reply', to: 'company_dashboard#create_review_reply'
        patch 'social_proof_reviews/:id/reply', to: 'company_dashboard#update_review_reply'
        delete 'social_proof_reviews/:id/reply', to: 'company_dashboard#delete_review_reply'
        patch 'social_proof_reviews/:id/moderation', to: 'company_dashboard#update_review_moderation'
        patch 'social_proof_reviews/:id/verification', to: 'company_dashboard#update_review_verification'
        get 'social_proof_stats', to: 'company_dashboard#social_proof_stats'
        get 'market_insights', to: 'company_dashboard/market_insights#index'

        resources :sector_questions, controller: 'company_sector_questions', only: %i[index create update destroy]

        resources :banners, only: %i[index create update destroy], controller: 'company_dashboard_banners' do
          collection do
            post :export_audit
            get :export_audits
            get :export_alerts
          end
          member do
            patch :submit
            patch :pause
            patch :resume
            patch :acknowledge_export_alert
            get :performance
            get :export
          end
        end
      end

      resources :banner_addons, only: %i[index]

      get 'review_dashboard/summary', to: 'review_dashboard#summary'
      get 'gamification/summary', to: 'gamification#summary'
      resources :reviewer_solutions, only: %i[index create destroy]
      namespace :reviewer do
        resources :tree_blocks, path: 'tree/blocks', controller: 'tree_blocks', only: %i[index create update destroy] do
          collection { patch :reorder, path: 'reorder' }
        end
        resource :tree_settings, path: 'tree/settings', controller: 'tree_settings', only: %i[show update] do
          post :background_image, action: :upload_background_image
        end
        resources :creator_leads, only: %i[index update], controller: 'creator_leads'
        get 'analytics', to: 'dashboard#analytics'
        resources :publications, only: %i[index show create update destroy]
        post 'publications/:id/publish', to: 'publications#publish'
        post 'publications/:id/archive', to: 'publications#archive'
      end
      get 'creators/:creator_slug/publications/:publication_slug/comments', to: 'creator_comments#index'
      post 'creators/:creator_slug/publications/:publication_slug/comments', to: 'creator_comments#create'
      post 'creators/:creator_slug/publications/:publication_slug/share', to: 'creator_comments#share'
      get 'creators/:creator_slug/publications/:publication_slug/like', to: 'creator_publication_likes#show'
      post 'creators/:creator_slug/publications/:publication_slug/like', to: 'creator_publication_likes#create'
      delete 'creators/:creator_slug/publications/:publication_slug/like', to: 'creator_publication_likes#destroy'
      post 'creators/:creator_slug/leads', to: 'creator_leads#create'
      get 'creators', to: 'creators#index'
      get 'creators/:slug', to: 'creators#show'
      get 'creators/:slug/publications', to: 'creators#publications'
      get 'creators/:slug/publications/:publication_slug', to: 'creators#publication'
      get 'creators/:slug/followers', to: 'creators#followers'
      get 'creators/:slug/following', to: 'creators#following'
      get 'creator_tree/:slug', to: 'creator_tree#show'
      post 'creator_tree/:slug/view', to: 'creator_tree#view'
      post 'creator_tree/:slug/blocks/:block_id/click', to: 'creator_tree#click'


      namespace :reviewer do
        resource :dashboard, only: [:show], controller: 'dashboard'
        resource :profile, only: [:show], controller: 'profile'
        patch :profile, to: 'profile#update'
        put :profile, to: 'profile#update'
        post 'profile/avatar', to: 'profile#avatar'
        post 'profile/public_banner', to: 'profile#public_banner'
        delete 'profile/avatar', to: 'profile#remove_avatar'
      end

      # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      # Chat IA endpoints
      # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      namespace :chat do
        resources :sessions, only: [:create, :show] do
          resources :messages, only: [:create]
        end
        resources :leads, only: [:create]
        resources :attachments, only: [:create]
        post 'company_recommendations', to: 'company_recommendations#create'
        post 'messages/:id/feedback', to: 'messages#feedback', as: :message_feedback
      end

      namespace :inbox do
        resources :sessions, only: [:index] do
          member do
            get :messages
            get :activities
            post :messages, action: :create_message
            patch :mode, action: :update_mode
            post :read, action: :mark_read
            post :archive
            post :handoff_whatsapp
          end
        end
      end

      namespace :dashboard do
        resource :icp_profile, only: %i[show update]
      end

      # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      # P2P Chat endpoints
      # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      resources :conversations, only: %i[index create] do
        collection do
          get :unread_count
        end
        member do
          post :read
          post :resolve
          post :reopen
          post :block
          post :report
          get :events
        end
        resources :direct_messages, only: %i[index create]
      end
      resources :push_tokens, only: %i[create]

      # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      # Messaging Platform 1.0 Unified Inbox
      # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      namespace :messaging do
        resources :inbox, only: %i[index] do
          collection do
            get :unread_count
          end
        end
      end

      resources :banners, only: [:index]
      get 'publicidade_campanhas', to: 'publicidade_campanhas#index'
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
        member do
          post :vote
        end
      end

      resources :review_uploads, param: :uuid, only: %i[create show] do
        member do
          post :media
          delete 'media/:media_id', action: :destroy_media
        end
      end

      resources :faqs, only: %i[index create show update destroy] do
        member do
          post :vote
          post :view
        end
      end

      # Notifications API
      resources :notifications, only: [:index] do
        collection do
          get :unread_count
          get :counts_by_filter
          post :mark_all_as_read
        end
        member do
          post :mark_as_read
          post :archive
          post :unarchive
        end
      end

      resource :notification_preferences, only: [:show, :update]

      namespace :admin do
        resources :reviews, only: %i[index show] do
          collection do
            get :pending
          end
          member do
            patch :approve
            patch :reject
            patch :flag
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

      resources :lead_distributions, only: [:show] do
        member do
          post :viewed
          post :accept
          post :reject
          post :convert
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
        # Catálogo privado da empresa. As rotas públicas de produtos continuam
        # estritamente de leitura; criação e edição exigem autenticação do painel.
        resources :products, only: %i[index create update destroy]
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
        get 'content_analytics/overview', to: 'content_analytics#overview'
        get 'content_analytics/funnel', to: 'content_analytics#funnel'
        get 'content_analytics/timeseries', to: 'content_analytics#timeseries'
        get 'content_analytics/sources', to: 'content_analytics#sources'
        resources :content_leads, only: :index do
          collection { get :export }
        end
        resources :projects, only: %i[index show create update destroy] do
          member { post :submit }
        end
        resources :materials, only: %i[index show create update destroy] do
          member { post :submit; post :publish; post :restore }
        end
        resources :content_lead_forms, only: %i[index show create update destroy]
        resources :assets, only: %i[create update destroy]

        resources :review_forms, only: %i[index show create update destroy] do
          collection { get :templates }
          member do
            post :duplicate
            post :event
          end
        end

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

      get 'review_forms/:token/public', to: 'public_review_forms#show'
      post 'review_forms/:token/submit', to: 'public_review_forms#submit'
      post 'review_forms/:token/event', to: 'public_review_forms#event'
      get 'review_forms/:token/qr_code', to: 'public_review_forms#qr_code'

      resources :faqs do
        member do
          post :vote
        end
      end

      resources :seo_pages, param: :slug, only: [:show]

      namespace :billing do
        get 'plans', to: 'plans#index'
        get 'subscription', to: 'subscriptions#show'
        post 'checkout', to: 'checkout#create'
        post 'portal', to: 'portal#create'
        post 'enterprise_leads', to: 'enterprise_leads#create'
        post 'webhooks/stripe', to: 'webhooks#stripe'
      end
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
  # legacy-app.avaliasolar.com.br — Legado Hotwire B2B (Next.js é o dono exclusivo de app.avaliasolar.com.br)
  # ============================================================
  constraints subdomain: 'legacy-app' do
    scope module: :app, as: :app do

      # Landing pública — Expo de parceiros (tipo OpenSolar Expo)
      root to: 'expo#index', as: :root

      resources :suppliers,   only: %i[index show]
      resources :integrators, only: %i[index show]
      resources :distributors, only: %i[index show]

      # Autenticação (reusa Devise existente)
      get  'entrar',  to: 'sessions#new',    as: :login
      get  'entre',   to: 'sessions#new'     # Alias para evitar 404
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

      namespace :control do
        root to: 'dashboard#index'

        resource :company, only: :show

        resource :pricing, only: :show do
          get :payments
          get :contracts
        end

        resource :hardware, only: :show do
          get :supplier_preferences
          get :modules
          get :inverters
          get :batteries
          get :design_settings
        end

        resource :purchase, only: :show
        resource :customers, only: :show
        resource :other, only: :show
        resource :staff, only: :show
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

  # Tracking de Engajamento de E-mail (Abertura Pixel + Clique Link)
  get '/t/email/open/:token.gif', to: 't/email_tracking#open'
  get '/t/email/unsubscribe/:token', to: 't/email_tracking#unsubscribe'
  get '/t/email/click/:token', to: 't/email_tracking#click'
  post '/api/v1/sales/ses_webhooks', to: 'api/v1/sales/ses_webhooks#create'

  root 'api_root#show'
end
