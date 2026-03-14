# 🏛️ LegalTech Review Platform - Complete Stack Blueprint

> **Based on Avalia Solar Architecture + ActiveAdmin Foundation** - A comprehensive marketplace for legal software reviews and comparisons with claymorphism design style.

---

## 🎯 **PROJECT OVERVIEW**

**Platform Name:** LegalTech Review Platform  
**Design Style:** Enterprise ShadCN/UI + Claymorphism Details  
**Domain:** Legal software marketplace with reviews, comparisons, and vendor management  
**Target Users:** Lawyers, law firms, legal software vendors  
**Admin Foundation:** ActiveAdmin + ShadCN Dashboards  
**Architecture:** Rails API + Next.js Frontend + ActiveAdmin Backend  
**Infrastructure:** AWS EC2 + RDS + S3 + CloudFront  
**Analytics:** PostHog for comprehensive data collection  
**SEO:** Full sitemap optimization with schema.org markup

---

## 📋 **TECH STACK REPLICATION**

### **Backend Stack (Enhanced with ActiveAdmin)**
```ruby
# Gemfile (enhanced from AB0-1 + ActiveAdmin base)
source 'https://rubygems.org'
ruby '3.2.0'

gem 'rails', '~> 7.2.0'
gem 'pg', '~> 1.1'
gem 'puma', '~> 6.4'
gem 'redis', '>= 4.0.1'
gem 'sidekiq', '~> 7.3'

# ActiveAdmin Foundation (from giljr/admin_example)
gem 'activeadmin', '~> 3.2'
gem 'inherited_resources', '~> 1.13'
gem 'kaminari', '~> 1.2'
gem 'ransack', '~> 4.0'

# Authentication & Authorization
gem 'devise', '~> 4.9'
gem 'pundit', '~> 2.4'
gem 'omniauth', '~> 2.1'
gem 'omniauth-google-oauth2', '~> 1.1'
gem 'omniauth-rails_csrf_protection', '~> 1.0'

# API & Serialization
gem 'jsonapi-serializer', '~> 2.2'
gem 'rack-cors', '~> 2.0'
gem 'blueprinter', '~> 1.1'
gem 'fast_jsonapi', '~> 1.5'

# File Upload & Storage
gem 'image_processing', '~> 1.13'
gem 'aws-sdk-s3', '~> 1.168'
gem 'carrierwave', '~> 3.0'
gem 'mini_magick', '~> 4.12'

# Search & Analytics
gem 'elasticsearch-rails', '~> 7.3'
gem 'ahoy_matey', '~> 5.1'
gem 'pg_search', '~> 2.3'

# Background Jobs & Scheduling
gem 'sidekiq-web', '~> 7.3'
gem 'sidekiq-cron', '~> 1.12'
gem 'whenever', '~> 1.0'

# Business Logic & Utilities
gem 'state_machines-activerecord', '~> 0.9'
gem 'friendly_id', '~> 5.5'
gem 'acts_as_paranoid', '~> 0.10'
gem 'counter_culture', '~> 3.5'

# Monitoring & Logging
gem 'sentry-ruby', '~> 5.22'
gem 'sentry-rails', '~> 5.22'
gem 'newrelic_rpm', '~> 9.6'

# Development & Testing
group :development, :test do
  gem 'rspec-rails', '~> 7.0'
  gem 'factory_bot_rails', '~> 6.4'
  gem 'faker', '~> 3.4'
  gem 'pry-rails', '~> 0.3'
  gem 'rubocop', '~> 1.69'
  gem 'rubocop-rails', '~> 2.27'
  gem 'shoulda-matchers', '~> 6.0'
  gem 'database_cleaner-active_record', '~> 2.1'
end

group :development do
  gem 'listen', '~> 3.9'
  gem 'spring', '~> 4.2'
  gem 'annotate', '~> 3.2'
  gem 'letter_opener', '~> 1.9'
end
```

### **Frontend Stack (Enterprise ShadCN + Analytics)**
```javascript
// Package.json dependencies (Enterprise focused)
{
  "name": "legaltech-platform",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test",
    "analyze": "cross-env ANALYZE=true next build"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "@next/bundle-analyzer": "^15.0.0",
    
    // ShadCN/UI Enterprise Components
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-sheet": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-table": "^0.1.0",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.3",
    
    // ShadCN Support Libraries
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "tailwindcss-animate": "^1.0.7",
    
    // UI & Design Enhancement
    "tailwindcss": "^3.4.0",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/forms": "^0.5.9",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.454.0",
    "cmdk": "^1.0.0",
    "vaul": "^0.9.0",
    "embla-carousel-react": "^8.3.0",
    
    // Data & State Management
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-table": "^8.20.0",
    "swr": "^2.2.5",
    
    // Forms & Validation
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8",
    
    // Charts & Data Visualization
    "recharts": "^2.12.7",
    "@tremor/react": "^3.17.4",
    "react-chartjs-2": "^5.2.0",
    "chart.js": "^4.4.0",
    
    // Authentication
    "next-auth": "^4.24.8",
    "@auth/prisma-adapter": "^2.4.0",
    
    // Analytics & Tracking
    "posthog-js": "^1.157.2",
    "posthog-node": "^4.2.0",
    "@vercel/analytics": "^1.3.0",
    "react-gtm-module": "^2.0.11",
    
    // SEO & Meta
    "next-seo": "^6.6.0",
    "next-sitemap": "^4.2.3",
    "schema-dts": "^1.1.2",
    
    // File Upload & Media
    "react-dropzone": "^14.2.3",
    "react-image-crop": "^11.0.7",
    
    // Rich Text & Content
    "@tiptap/react": "^2.8.0",
    "@tiptap/pm": "^2.8.0",
    "@tiptap/starter-kit": "^2.8.0",
    
    // Date & Time
    "date-fns": "^4.1.0",
    "react-day-picker": "^8.10.0",
    
    // Utilities
    "nanoid": "^5.0.7",
    "@types/uuid": "^10.0.0",
    "react-intersection-observer": "^9.13.0"
  },
  "devDependencies": {
    "@types/node": "^22.7.9",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "eslint": "^9.13.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "jest": "^29.7.0",
    "@testing-library/react": "^16.0.1",
    "playwright": "^1.48.0",
    "@tailwindcss/eslint-plugin": "^0.1.0"
  }
}
```

### **Backend Stack**
```ruby
# Gemfile (replicate from AB0-1)
source 'https://rubygems.org'
ruby '3.2.0'

gem 'rails', '~> 7.2.0'
gem 'pg', '~> 1.1'
gem 'puma', '~> 6.4'
gem 'redis', '>= 4.0.1'
gem 'sidekiq', '~> 7.3'

# Authentication & Authorization
gem 'devise', '~> 4.9'
gem 'pundit', '~> 2.4'
gem 'omniauth', '~> 2.1'
gem 'omniauth-google-oauth2', '~> 1.1'
gem 'omniauth-rails_csrf_protection', '~> 1.0'

# API & Serialization
gem 'jsonapi-serializer', '~> 2.2'
gem 'rack-cors', '~> 2.0'
gem 'blueprinter', '~> 1.1'

# File Upload & Storage
gem 'image_processing', '~> 1.13'
gem 'aws-sdk-s3', '~> 1.168'

# Search & Analytics
gem 'elasticsearch-rails', '~> 7.3'
gem 'ahoy_matey', '~> 5.1'

# Background Jobs
gem 'sidekiq-web', '~> 7.3'
gem 'sidekiq-cron', '~> 1.12'

# Monitoring & Logging
gem 'sentry-ruby', '~> 5.22'
gem 'sentry-rails', '~> 5.22'

# Development & Testing
group :development, :test do
  gem 'rspec-rails', '~> 7.0'
  gem 'factory_bot_rails', '~> 6.4'
  gem 'faker', '~> 3.4'
  gem 'pry-rails', '~> 0.3'
  gem 'rubocop', '~> 1.69'
  gem 'rubocop-rails', '~> 2.27'
end

group :development do
  gem 'listen', '~> 3.9'
  gem 'spring', '~> 4.2'
  gem 'annotate', '~> 3.2'
end
```

---

## 🏗️ **PROJECT STRUCTURE (AWS EC2 Optimized + ShadCN Dashboards)**

```
legaltech-platform/
├── frontend/                    # Next.js Public App + Dashboards
│   ├── app/                     # App Router
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify/
│   │   ├── (dashboard)/        # Protected dashboards
│   │   │   ├── lawyer/         # Lawyer dashboard
│   │   │   │   ├── overview/
│   │   │   │   ├── reviews/
│   │   │   │   ├── favorites/
│   │   │   │   ├── comparisons/
│   │   │   │   └── profile/
│   │   │   ├── law-firm/       # Law firm dashboard
│   │   │   │   ├── overview/
│   │   │   │   ├── software-stack/
│   │   │   │   ├── team/
│   │   │   │   ├── analytics/
│   │   │   │   ├── billing/
│   │   │   │   └── settings/
│   │   │   └── vendor/         # Vendor dashboard
│   │   │       ├── overview/
│   │   │       ├── products/
│   │   │       ├── reviews/
│   │   │       ├── leads/
│   │   │       ├── analytics/
│   │   │       └── settings/
│   │   ├── (marketing)/        # Public pages
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── about/
│   │   │   ├── pricing/
│   │   │   ├── for-lawyers/
│   │   │   ├── for-law-firms/
│   │   │   └── for-vendors/
│   │   ├── products/           # Product catalog
│   │   │   ├── page.tsx        # Products listing
│   │   │   ├── [slug]/         # Individual product
│   │   │   └── category/[slug]/ # Category pages
│   │   ├── compare/            # Comparison tool
│   │   │   ├── page.tsx
│   │   │   └── [products]/
│   │   ├── reviews/            # Reviews pages
│   │   │   ├── page.tsx
│   │   │   ├── write/
│   │   │   └── [id]/
│   │   ├── vendors/            # Vendor profiles
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   ├── blog/               # Content/Blog
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/
│   │   │   └── category/[slug]/
│   │   ├── legal/              # Legal pages
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   └── cookies/
│   │   ├── sitemap.xml         # Dynamic sitemap
│   │   ├── robots.txt          # SEO robots
│   │   └── api/                # API routes
│   │       ├── auth/
│   │       ├── products/
│   │       ├── reviews/
│   │       ├── analytics/
│   │       └── sitemap/
│   ├── components/             # Reusable components
│   │   ├── ui/                 # ShadCN base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── toast.tsx
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── analytics-chart.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   ├── software-stack-table.tsx
│   │   │   └── team-management.tsx
│   │   ├── marketing/          # Marketing components
│   │   │   ├── hero-section.tsx
│   │   │   ├── feature-grid.tsx
│   │   │   ├── testimonials.tsx
│   │   │   ├── pricing-table.tsx
│   │   │   └── cta-section.tsx
│   │   ├── products/           # Product components
│   │   │   ├── product-card.tsx
│   │   │   ├── product-filters.tsx
│   │   │   ├── comparison-table.tsx
│   │   │   └── feature-matrix.tsx
│   │   ├── reviews/            # Review components
│   │   │   ├── review-card.tsx
│   │   │   ├── review-form.tsx
│   │   │   ├── rating-display.tsx
│   │   │   └── review-filters.tsx
│   │   ├── forms/              # Form components
│   │   │   ├── contact-form.tsx
│   │   │   ├── subscription-form.tsx
│   │   │   └── profile-form.tsx
│   │   ├── charts/             # Chart components
│   │   │   ├── area-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   ├── donut-chart.tsx
│   │   │   └── line-chart.tsx
│   │   ├── seo/                # SEO components
│   │   │   ├── meta-tags.tsx
│   │   │   ├── structured-data.tsx
│   │   │   └── breadcrumbs.tsx
│   │   └── layouts/            # Layout components
│   │       ├── marketing-layout.tsx
│   │       ├── dashboard-layout.tsx
│   │       ├── auth-layout.tsx
│   │       └── admin-layout.tsx
│   ├── lib/                    # Utilities & config
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── validations.ts
│   │   ├── auth.ts
│   │   ├── posthog.ts
│   │   ├── seo.ts
│   │   └── aws.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-analytics.ts
│   │   ├── use-auth.ts
│   │   ├── use-products.ts
│   │   ├── use-reviews.ts
│   │   └── use-dashboard.ts
│   ├── store/                  # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── product-store.ts
│   │   ├── review-store.ts
│   │   └── dashboard-store.ts
│   ├── types/                  # TypeScript definitions
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── review.ts
│   │   ├── user.ts
│   │   ├── analytics.ts
│   │   └── api.ts
│   └── styles/                 # Global styles
│       ├── globals.css
│       └── components.css
│
├── backend/                     # Rails API + ActiveAdmin
│   ├── app/
│   │   ├── controllers/        # API & Admin controllers
│   │   │   ├── api/
│   │   │   │   └── v1/
│   │   │   │       ├── auth_controller.rb
│   │   │   │       ├── products_controller.rb
│   │   │   │       ├── reviews_controller.rb
│   │   │   │       ├── vendors_controller.rb
│   │   │   │       ├── lawyers_controller.rb
│   │   │   │       ├── law_firms_controller.rb
│   │   │   │       ├── analytics_controller.rb
│   │   │   │       └── sitemaps_controller.rb
│   │   │   └── application_controller.rb
│   │   ├── admin/              # ActiveAdmin Resources (detailed above)
│   │   ├── models/             # ActiveRecord models (detailed below)
│   │   ├── services/           # Business logic services
│   │   │   ├── analytics_service.rb
│   │   │   ├── review_service.rb
│   │   │   ├── product_service.rb
│   │   │   ├── seo_service.rb
│   │   │   ├── email_service.rb
│   │   │   └── posthog_service.rb
│   │   ├── jobs/               # Background jobs
│   │   │   ├── analytics_job.rb
│   │   │   ├── email_job.rb
│   │   │   ├── sitemap_job.rb
│   │   │   └── data_sync_job.rb
│   │   ├── serializers/        # JSON API serializers
│   │   ├── policies/           # Pundit authorization
│   │   └── uploaders/          # File upload handlers
│   ├── config/                 # Rails configuration
│   │   ├── environments/
│   │   │   ├── production.rb
│   │   │   ├── development.rb
│   │   │   └── test.rb
│   │   ├── initializers/
│   │   │   ├── active_admin.rb
│   │   │   ├── cors.rb
│   │   │   ├── sidekiq.rb
│   │   │   ├── posthog.rb
│   │   │   └── aws.rb
│   │   ├── routes.rb
│   │   └── database.yml
│   ├── db/                     # Database
│   │   ├── migrate/           # Migrations
│   │   ├── seeds/             # Seed data
│   │   │   ├── development/
│   │   │   └── production/
│   │   └── schema.rb
│   └── spec/                   # RSpec tests
│
└── infrastructure/              # AWS EC2 Infrastructure
    ├── docker/                 # Docker configs
    │   ├── Dockerfile.frontend
    │   ├── Dockerfile.backend
    │   └── docker-compose.yml
    ├── aws/                    # AWS configurations
    │   ├── cloudformation/
    │   ├── terraform/
    │   └── scripts/
    ├── nginx/                  # Nginx configs
    │   ├── sites-available/
    │   └── ssl/
    └── scripts/                # Deployment scripts
        ├── deploy.sh
        ├── backup.sh
        └── monitoring.sh
```

---

## 🛠️ **SETUP MASTER PROMPT**

## 🛠️ **SETUP MASTER PROMPT (Enhanced with ActiveAdmin)**

### **Initial Project Setup**

### **📊 Dashboard (app/admin/dashboard.rb)**
```ruby
# Core metrics and quick access widgets
ActiveAdmin.register_page "Dashboard" do
  menu priority: 1
  
  content title: proc { "LegalTech Admin Dashboard" } do
    div class: "blank_slate_container" do
      # KPI Cards
      div class: "dashboard-stats" do
        # Users Stats
        div class: "stat-card" do
          h3 "Total Users"
          h2 User.count
          small "#{User.where('created_at > ?', 30.days.ago).count} this month"
        end
        
        # Products Stats
        div class: "stat-card" do
          h3 "Products"
          h2 Product.published.count
          small "#{Product.where(status: :pending).count} pending approval"
        end
        
        # Reviews Stats
        div class: "stat-card" do
          h3 "Reviews"
          h2 Review.approved.count
          small "#{Review.where(status: :pending).count} pending moderation"
        end
        
        # Revenue Stats
        div class: "stat-card" do
          h3 "Monthly Revenue"
          h2 number_to_currency(calculate_monthly_revenue)
          small "#{calculate_growth_percentage}% growth"
        end
      end
      
      # Quick Actions
      div class: "quick-actions" do
        h3 "Quick Actions"
        ul do
          li link_to("Approve Reviews", admin_reviews_path(q: { status_eq: 'pending' }))
          li link_to("Moderate Products", admin_products_path(q: { status_eq: 'pending' }))
          li link_to("User Verification", admin_users_path(q: { verification_status_eq: 'pending' }))
          li link_to("View Reports", admin_reports_path)
        end
      end
      
      # Recent Activity Feed
      div class: "recent-activity" do
        h3 "Recent Activity"
        # Activity timeline component
      end
    end
  end
end
```

### **👥 Users Management**

#### **Advogados (app/admin/lawyers.rb)**
```ruby
ActiveAdmin.register User, as: "Lawyer" do
  menu parent: "Users", label: "Advogados"
  
  scope :lawyers, default: true
  scope :verified
  scope :pending_verification
  
  filter :email
  filter :first_name
  filter :last_name
  filter :oab_number
  filter :oab_state, as: :select, collection: BRAZILIAN_STATES
  filter :verification_status
  filter :created_at
  
  index do
    selectable_column
    id_column
    column :avatar do |user|
      image_tag(user.avatar.url, size: "40x40", class: "avatar-thumb") if user.avatar.present?
    end
    column :full_name
    column :email
    column :oab_number
    column :oab_state
    column "Law Firm" do |user|
      link_to(user.law_firm&.name, admin_law_firm_path(user.law_firm)) if user.law_firm
    end
    column :verification_status do |user|
      status_tag(user.verification_status, class: verification_status_class(user))
    end
    column :reviews_count
    column :created_at
    actions
  end
  
  show do
    attributes_table do
      row :id
      row :avatar do |user|
        image_tag(user.avatar.url, size: "200x200") if user.avatar.present?
      end
      row :full_name
      row :email
      row :oab_number
      row :oab_state
      row :law_firm
      row :specialization_areas
      row :bio
      row :verification_status
      row :verification_documents do |user|
        # Display uploaded verification documents
      end
      row :linkedin_url
      row :lattes_url
      row :website
      row :created_at
      row :updated_at
    end
    
    panel "Reviews Statistics" do
      attributes_table_for user do
        row "Total Reviews" do
          user.reviews.count
        end
        row "Average Rating Given" do
          user.reviews.average(:rating)&.round(2)
        end
        row "Helpful Votes Received" do
          user.reviews.sum(:helpful_votes_count)
        end
      end
    end
    
    panel "Recent Reviews" do
      table_for user.reviews.recent.limit(5) do
        column :product
        column :rating do |review|
          star_rating(review.rating)
        end
        column :title
        column :status
        column :created_at
        column :actions do |review|
          link_to "View", admin_review_path(review)
        end
      end
    end
  end
  
  form do |f|
    f.inputs "Personal Information" do
      f.input :first_name
      f.input :last_name
      f.input :email
      f.input :oab_number
      f.input :oab_state, as: :select, collection: BRAZILIAN_STATES
      f.input :bio
    end
    
    f.inputs "Professional Information" do
      f.input :law_firm
      f.input :specialization_areas, as: :check_boxes, collection: LEGAL_AREAS
      f.input :linkedin_url
      f.input :lattes_url
      f.input :website
    end
    
    f.inputs "Verification" do
      f.input :verification_status
      f.input :verification_notes
    end
    
    f.actions
  end
end
```

#### **Escritórios (app/admin/law_firms.rb)**
```ruby
ActiveAdmin.register LawFirm do
  menu parent: "Users", label: "Escritórios"
  
  scope :all, default: true
  scope :verified
  scope :with_active_subscription
  
  filter :name
  filter :cnpj
  filter :city
  filter :state
  filter :size_category
  filter :subscription_plan
  filter :created_at
  
  index do
    selectable_column
    id_column
    column :logo do |firm|
      image_tag(firm.logo.url, size: "50x50") if firm.logo.present?
    end
    column :name
    column :cnpj
    column :location do |firm|
      "#{firm.city}, #{firm.state}"
    end
    column :size_category
    column "Members" do |firm|
      firm.lawyers.count
    end
    column :subscription_plan
    column :monthly_spend do |firm|
      number_to_currency(firm.calculate_monthly_spend)
    end
    column :created_at
    actions
  end
  
  show do
    attributes_table do
      row :id
      row :logo do |firm|
        image_tag(firm.logo.url, size: "200x100") if firm.logo.present?
      end
      row :name
      row :cnpj
      row :description
      row :website
      row :phone
      row :address
      row :city
      row :state
      row :postal_code
      row :size_category
      row :specialization_areas
      row :subscription_plan
      row :created_at
    end
    
    panel "Software Stack" do
      table_for firm.software_subscriptions do
        column :product
        column :seats
        column :monthly_cost do |sub|
          number_to_currency(sub.monthly_cost)
        end
        column :renewal_date
        column :status
      end
    end
    
    panel "Team Members" do
      table_for firm.lawyers.limit(10) do
        column :full_name
        column :oab_number
        column :email
        column :specialization
        column :reviews_count
        column :actions do |lawyer|
          link_to "View", admin_lawyer_path(lawyer)
        end
      end
    end
  end
end
```

#### **Vendors (app/admin/vendors.rb)**
```ruby
ActiveAdmin.register User, as: "Vendor" do
  menu parent: "Users", label: "Vendors"
  
  scope :vendors, default: true
  scope :verified_vendors
  scope :with_published_products
  
  filter :company_name
  filter :email
  filter :cnpj
  filter :verification_status
  filter :created_at
  
  index do
    selectable_column
    id_column
    column :logo do |vendor|
      image_tag(vendor.company_logo.url, size: "50x50") if vendor.company_logo.present?
    end
    column :company_name
    column :email
    column :cnpj
    column "Products" do |vendor|
      vendor.products.published.count
    end
    column "Avg Rating" do |vendor|
      vendor.products.average(:average_rating)&.round(2)
    end
    column "Monthly Leads" do |vendor|
      vendor.monthly_leads_count
    end
    column :verification_status
    column :created_at
    actions
  end
  
  show do
    attributes_table do
      row :company_name
      row :company_logo do |vendor|
        image_tag(vendor.company_logo.url, size: "200x100") if vendor.company_logo.present?
      end
      row :description
      row :website
      row :email
      row :phone
      row :cnpj
      row :founded_year
      row :employee_count
      row :verification_status
    end
    
    panel "Products Portfolio" do
      table_for vendor.products do
        column :name
        column :category
        column :status
        column :average_rating do |product|
          star_rating(product.average_rating)
        end
        column :reviews_count
        column :monthly_views
        column :actions do |product|
          link_to "View", admin_product_path(product)
        end
      end
    end
    
    panel "Analytics" do
      # Vendor performance metrics
    end
  end
end
```

### **📱 Products Management**

#### **Todos os Softwares (app/admin/products.rb)**
```ruby
ActiveAdmin.register Product do
  menu label: "Todos os Produtos"
  
  scope :all, default: true
  scope :published
  scope :pending
  scope :approved
  scope :rejected
  scope :featured
  
  filter :name
  filter :vendor
  filter :categories
  filter :status
  filter :featured
  filter :average_rating
  filter :created_at
  
  batch_action :approve do |ids|
    Product.where(id: ids).update_all(status: :approved)
    redirect_to collection_path, notice: "Products approved!"
  end
  
  batch_action :feature do |ids|
    Product.where(id: ids).update_all(featured: true)
    redirect_to collection_path, notice: "Products featured!"
  end
  
  index do
    selectable_column
    id_column
    column :logo do |product|
      image_tag(product.logo.url, size: "50x50") if product.logo.present?
    end
    column :name
    column :vendor do |product|
      link_to(product.vendor.company_name, admin_vendor_path(product.vendor))
    end
    column :primary_category
    column :status do |product|
      status_tag(product.status)
    end
    column :featured do |product|
      status_tag(product.featured? ? "Yes" : "No", 
                 class: product.featured? ? "yes" : "no")
    end
    column :average_rating do |product|
      star_rating(product.average_rating)
    end
    column :reviews_count
    column :monthly_views
    column :created_at
    actions
  end
  
  show do
    attributes_table do
      row :id
      row :logo do |product|
        image_tag(product.logo.url, size: "200x200") if product.logo.present?
      end
      row :name
      row :vendor
      row :description
      row :short_description
      row :website_url
      row :primary_category
      row :categories do |product|
        product.categories.map(&:name).join(", ")
      end
      row :status
      row :featured
      row :average_rating
      row :reviews_count
      row :pricing_model
      row :starting_price
      row :target_audience
      row :deployment_type
      row :created_at
    end
    
    panel "Features" do
      table_for product.product_features do
        column :feature_group
        column :feature_name
        column :included do |pf|
          status_tag(pf.included? ? "Yes" : "No")
        end
      end
    end
    
    panel "Integrations" do
      ul do
        product.integrations.each do |integration|
          li integration
        end
      end
    end
    
    panel "Media Gallery" do
      div class: "media-grid" do
        product.screenshots.each do |screenshot|
          div class: "media-item" do
            image_tag(screenshot.url, size: "150x150")
          end
        end
      end
    end
    
    panel "Recent Reviews" do
      table_for product.reviews.recent.limit(5) do
        column :user
        column :rating do |review|
          star_rating(review.rating)
        end
        column :title
        column :status
        column :created_at
        column :actions do |review|
          link_to "View", admin_review_path(review)
        end
      end
    end
  end
  
  form do |f|
    f.inputs "Basic Information" do
      f.input :name
      f.input :vendor
      f.input :short_description
      f.input :description
      f.input :website_url
      f.input :logo, as: :file
    end
    
    f.inputs "Categorization" do
      f.input :primary_category
      f.input :categories, as: :check_boxes
      f.input :target_audience, as: :select, collection: TARGET_AUDIENCES
      f.input :deployment_type, as: :select, collection: DEPLOYMENT_TYPES
    end
    
    f.inputs "Pricing" do
      f.input :pricing_model
      f.input :starting_price
      f.input :has_free_trial
      f.input :free_trial_days
    end
    
    f.inputs "Status" do
      f.input :status
      f.input :featured
      f.input :admin_notes
    end
    
    f.actions
  end
end
```

### **⭐ Reviews Management**

#### **Todas as Reviews (app/admin/reviews.rb)**
```ruby
ActiveAdmin.register Review do
  menu label: "Todas as Reviews"
  
  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected
  scope :reported
  scope :with_photos
  scope :verified_users
  
  filter :product
  filter :user
  filter :rating
  filter :status
  filter :has_photos
  filter :helpful_votes_count
  filter :created_at
  
  batch_action :approve do |ids|
    Review.where(id: ids).update_all(status: :approved)
    redirect_to collection_path, notice: "Reviews approved!"
  end
  
  batch_action :reject do |ids|
    Review.where(id: ids).update_all(status: :rejected)
    redirect_to collection_path, notice: "Reviews rejected!"
  end
  
  index do
    selectable_column
    id_column
    column :product do |review|
      link_to(review.product.name, admin_product_path(review.product))
    end
    column :user do |review|
      div do
        link_to(review.user.full_name, admin_user_path(review.user))
        br
        small review.user.oab_number if review.user.oab_number
      end
    end
    column :rating do |review|
      star_rating(review.rating)
    end
    column :title
    column :status do |review|
      status_tag(review.status)
    end
    column :has_photos do |review|
      status_tag(review.photos.any? ? "Yes" : "No")
    end
    column :helpful_votes do |review|
      review.helpful_votes_count
    end
    column :created_at
    actions do |review|
      item "Quick Approve", approve_admin_review_path(review), method: :patch if review.pending?
      item "Quick Reject", reject_admin_review_path(review), method: :patch if review.pending?
    end
  end
  
  show do
    attributes_table do
      row :id
      row :product
      row :user
      row :title
      row :content do |review|
        simple_format(review.content)
      end
      row :rating do |review|
        star_rating(review.rating)
      end
      row :ease_of_use_rating do |review|
        star_rating(review.ease_of_use_rating)
      end
      row :support_rating do |review|
        star_rating(review.support_rating)
      end
      row :value_rating do |review|
        star_rating(review.value_rating)
      end
      row :features_rating do |review|
        star_rating(review.features_rating)
      end
      row :usage_time
      row :would_recommend
      row :status
      row :helpful_votes_count
      row :reported_count
      row :created_at
    end
    
    panel "Pros & Cons" do
      div class: "pros-cons" do
        div class: "pros" do
          h4 "Pros"
          ul do
            review.pros.each do |pro|
              li pro
            end
          end
        end
        
        div class: "cons" do
          h4 "Cons"
          ul do
            review.cons.each do |con|
              li con
            end
          end
        end
      end
    end
    
    panel "Photos" do
      div class: "review-photos" do
        review.photos.each do |photo|
          image_tag(photo.url, size: "200x150", class: "review-photo")
        end
      end
    end if review.photos.any?
    
    panel "Vendor Response" do
      if review.vendor_response
        attributes_table_for review.vendor_response do
          row :content
          row :created_at
        end
      else
        para "No vendor response yet"
      end
    end
    
    panel "Moderation Actions" do
      if review.pending?
        div do
          link_to "Approve", approve_admin_review_path(review), 
                  method: :patch, class: "button approve"
          link_to "Reject", reject_admin_review_path(review), 
                  method: :patch, class: "button reject"
        end
      end
    end
  end
  
  member_action :approve, method: :patch do
    resource.update(status: :approved)
    redirect_to admin_review_path(resource), notice: "Review approved!"
  end
  
  member_action :reject, method: :patch do
    resource.update(status: :rejected)
    redirect_to admin_review_path(resource), notice: "Review rejected!"
  end
end
```

### **🏷️ Categories Management**

#### **Categorias (app/admin/categories.rb)**
```ruby
ActiveAdmin.register Category do
  menu label: "Categorias"
  
  scope :root_categories, default: true
  scope :subcategories
  scope :with_products
  
  filter :name
  filter :parent
  filter :products_count
  filter :created_at
  
  index do
    selectable_column
    id_column
    column :icon do |category|
      image_tag(category.icon.url, size: "30x30") if category.icon.present?
    end
    column :name
    column :parent do |category|
      category.parent&.name
    end
    column :slug
    column "Products Count" do |category|
      category.products.count
    end
    column :sort_order
    column :featured
    column :created_at
    actions
  end
  
  show do
    attributes_table do
      row :name
      row :description
      row :slug
      row :parent
      row :icon do |category|
        image_tag(category.icon.url, size: "100x100") if category.icon.present?
      end
      row :featured
      row :sort_order
      row :meta_title
      row :meta_description
      row :created_at
    end
    
    panel "Subcategories" do
      table_for category.children do
        column :name
        column :slug
        column :products_count
        column :actions do |subcategory|
          link_to "View", admin_category_path(subcategory)
        end
      end
    end if category.children.any?
    
    panel "Products in Category" do
      table_for category.products.limit(10) do
        column :name
        column :vendor
        column :status
        column :average_rating
        column :actions do |product|
          link_to "View", admin_product_path(product)
        end
      end
    end
  end
  
  form do |f|
    f.inputs "Category Information" do
      f.input :name
      f.input :description
      f.input :slug
      f.input :parent, as: :select, collection: Category.roots
      f.input :icon, as: :file
    end
    
    f.inputs "Display Settings" do
      f.input :featured
      f.input :sort_order
      f.input :color_code
    end
    
    f.inputs "SEO" do
      f.input :meta_title
      f.input :meta_description
    end
    
    f.actions
  end
end
```

### **💰 Subscription Plans (app/admin/subscription_plans.rb)**
```ruby
ActiveAdmin.register SubscriptionPlan do
  menu parent: "Billing", label: "Planos"
  
  scope :active, default: true
  scope :for_lawyers
  scope :for_law_firms
  scope :for_vendors
  
  index do
    selectable_column
    id_column
    column :name
    column :target_audience
    column :price_monthly do |plan|
      number_to_currency(plan.price_monthly)
    end
    column :price_annually do |plan|
      number_to_currency(plan.price_annually)
    end
    column :features_count
    column :active_subscribers
    column :active
    actions
  end
  
  show do
    attributes_table do
      row :name
      row :description
      row :target_audience
      row :price_monthly
      row :price_annually
      row :features do |plan|
        ul do
          plan.features.each do |feature|
            li feature
          end
        end
      end
      row :limitations do |plan|
        ul do
          plan.limitations.each do |limitation|
            li limitation
          end
        end
      end
    end
    
    panel "Active Subscribers" do
      table_for plan.subscriptions.active do
        column :user
        column :started_at
        column :billing_cycle
        column :next_billing_date
        column :status
      end
    end
  end
end
```

### **📊 Analytics & Reports (app/admin/reports.rb)**
```ruby
ActiveAdmin.register_page "Reports" do
  menu priority: 8
  
  content title: "Analytics & Reports" do
    tabs do
      tab "User Analytics" do
        # User growth charts
        # User engagement metrics
        # Geographic distribution
      end
      
      tab "Product Performance" do
        # Most viewed products
        # Best rated products
        # Category performance
      end
      
      tab "Review Analytics" do
        # Review sentiment analysis
        # Review volume trends
        # Top reviewers
      end
      
      tab "Revenue Analytics" do
        # Subscription revenue
        # Vendor revenue
        # Growth metrics
      end
      
      tab "Content Analytics" do
        # Blog performance
        # Download metrics
        # Search analytics
      end
    end
  end
end
```

---

## 📋 **USER STORIES & DELIVERABLES**

### **Epic 1: Admin Dashboard Foundation**
**Story 1.1:** As an admin, I want a comprehensive dashboard to monitor key platform metrics
- **Tasks:**
  - [ ] Setup ActiveAdmin gem and configuration
  - [ ] Create dashboard with KPI widgets
  - [ ] Implement real-time metrics calculation
  - [ ] Add quick action shortcuts
  - [ ] Create activity feed component
- **Deliverables:**
  - Dashboard page with live metrics
  - Quick actions panel
  - Activity timeline
  - Mobile-responsive admin interface

### **Epic 2: User Management System**
**Story 2.1:** As an admin, I want to manage all lawyer profiles and verification
- **Tasks:**
  - [ ] Create Lawyer admin resource
  - [ ] Implement OAB verification workflow
  - [ ] Add bulk actions for user management
  - [ ] Create user statistics panels
  - [ ] Implement user communication tools
- **Deliverables:**
  - Complete lawyer management interface
  - OAB verification system
  - User analytics dashboard
  - Bulk operation capabilities

**Story 2.2:** As an admin, I want to manage law firm accounts and subscriptions
- **Tasks:**
  - [ ] Create LawFirm admin resource
  - [ ] Implement software stack tracking
  - [ ] Add subscription management
  - [ ] Create team member association
  - [ ] Implement billing integration
- **Deliverables:**
  - Law firm management interface
  - Software stack visualization
  - Subscription tracking system
  - Team management tools

### **Epic 3: Product Catalog Management**
**Story 3.1:** As an admin, I want to manage all legal software products
- **Tasks:**
  - [ ] Create Product admin resource
  - [ ] Implement approval workflow
  - [ ] Add feature matrix management
  - [ ] Create media gallery system
  - [ ] Implement SEO optimization tools
- **Deliverables:**
  - Complete product management system
  - Approval/rejection workflow
  - Feature comparison matrix
  - Media management interface

### **Epic 4: Review Moderation System**
**Story 4.1:** As an admin, I want to moderate and manage all user reviews
- **Tasks:**
  - [ ] Create Review admin resource
  - [ ] Implement moderation workflow
  - [ ] Add sentiment analysis
  - [ ] Create spam detection
  - [ ] Implement vendor response system
- **Deliverables:**
  - Review moderation interface
  - Automated spam detection
  - Sentiment analysis dashboard
  - Vendor response management

### **Epic 5: Content Management**
**Story 5.1:** As an admin, I want to manage blog content and educational materials
- **Tasks:**
  - [ ] Create Content admin resource
  - [ ] Implement rich text editor
  - [ ] Add SEO optimization
  - [ ] Create content scheduling
  - [ ] Implement analytics tracking
- **Deliverables:**
  - Content management system
  - Editorial workflow
  - SEO optimization tools
  - Performance analytics

### **Epic 6: Analytics & Reporting**
**Story 6.1:** As an admin, I want comprehensive analytics and reporting
- **Tasks:**
  - [ ] Create analytics dashboard
  - [ ] Implement data visualization
  - [ ] Add export capabilities
  - [ ] Create automated reports
  - [ ] Implement real-time monitoring
- **Deliverables:**
  - Analytics dashboard
  - Custom report builder
  - Data export functionality
  - Automated reporting system

---

## 🎯 **DEVELOPMENT PHASES**

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Setup ActiveAdmin with authentication
- [ ] Create basic admin layout and navigation
- [ ] Implement dashboard with core metrics
- [ ] Setup user management for lawyers
- [ ] Create basic product management

### **Phase 2: Core Features (Weeks 3-5)**
- [ ] Complete user management (all types)
- [ ] Implement review moderation system
- [ ] Create category management
- [ ] Add subscription plan management
- [ ] Implement basic analytics

### **Phase 3: Advanced Features (Weeks 6-8)**
- [ ] Add content management system
- [ ] Implement advanced analytics
- [ ] Create automated workflows
- [ ] Add reporting capabilities
- [ ] Implement API endpoints for frontend

### **Phase 4: Integration & Polish (Weeks 9-10)**
- [ ] Integrate with frontend application
- [ ] Add real-time notifications
- [ ] Implement advanced search
- [ ] Performance optimization
- [ ] Security hardening
```bash
# 1. Create project structure
mkdir legaltech-platform && cd legaltech-platform
mkdir frontend backend infrastructure

# 2. Initialize Backend with ActiveAdmin (Rails)
cd backend
rails new . --api --database=postgresql --skip-git
echo "gem 'activeadmin'" >> Gemfile
echo "gem 'inherited_resources'" >> Gemfile
echo "gem 'kaminari'" >> Gemfile
echo "gem 'ransack'" >> Gemfile
bundle install
rails generate active_admin:install
rails generate active_admin:resource User
rails generate active_admin:resource Product
rails generate active_admin:resource Review
rails db:create db:migrate db:seed

# 3. Initialize Frontend (Next.js)
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# 4. Setup Docker environment
cd ../infrastructure
# Create docker-compose.yml (see Docker section below)
```

### **ActiveAdmin Configuration**
```ruby
# config/initializers/active_admin.rb
ActiveAdmin.setup do |config|
  config.site_title = "LegalTech Admin"
  config.site_title_link = "/"
  config.default_namespace = :admin
  config.authentication_method = :authenticate_admin_user!
  config.current_user_method = :current_admin_user
  config.logout_link_path = :destroy_admin_user_session_path
  config.batch_actions = true
  config.filter_attributes = [:encrypted_password, :password, :password_confirmation]
  config.localize_format = :long
  
  # Pagination
  config.default_per_page = 25
  config.max_per_page = 100
  
  # CSV options
  config.csv_options = { force_quotes: true }
  
  # Custom authentication
  config.authentication_method = :authenticate_admin_user!
  config.current_user_method = :current_admin_user
  config.logout_link_path = :destroy_admin_user_session_path
  
  # Authorization
  config.authorization_adapter = ActiveAdmin::PunditAdapter
  config.pundit_default_policy = "AdminPolicy"
  
  # Menu customization
  config.namespace :admin do |admin|
    admin.build_menu :utility_navigation do |menu|
      menu.add label: "Profile", url: "/admin/profile"
      menu.add label: "Logout", url: destroy_admin_user_session_path, html_options: { method: :delete }
    end
  end
end
```

---

## 🎛️ **ACTIVEADMIN PANEL - DETAILED PAGES BREAKDOWN**

### **Environment Variables Template (Enhanced)**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001/admin
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_MIXPANEL_TOKEN=
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Backend (.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/legaltech_development
REDIS_URL=redis://localhost:6379/0
SECRET_KEY_BASE=your-secret-key
RAILS_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ActiveAdmin Configuration
ADMIN_EMAIL=admin@legaltech.com
ADMIN_PASSWORD=admin123

# File Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# Search & Analytics
ELASTICSEARCH_URL=http://localhost:9200
MIXPANEL_TOKEN=
GOOGLE_ANALYTICS_ID=

# Email Configuration
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# Background Jobs
SIDEKIQ_REDIS_URL=redis://localhost:6379/1
```

---

## 🐳 **DOCKER CONFIGURATION**

### **docker-compose.yml**
```yaml
version: '3.8'

networks:
  legaltech-network:
    driver: bridge

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: legaltech-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-legaltech_development}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - legaltech-network

  # Redis Cache & Sessions
  redis:
    image: redis:7.2-alpine
    container_name: legaltech-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - legaltech-network

  # Elasticsearch for Search
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: legaltech-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - legaltech-network

  # Rails Backend API
  backend:
    build:
      context: ./backend
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    container_name: legaltech-backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/legaltech_development
      REDIS_URL: redis://redis:6379/0
      ELASTICSEARCH_URL: http://elasticsearch:9200
      RAILS_ENV: development
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - rails_bundle:/usr/local/bundle
    depends_on:
      - postgres
      - redis
      - elasticsearch
    networks:
      - legaltech-network
    command: bash -c "bundle install && rails db:create db:migrate db:seed && rails server -b 0.0.0.0 -p 3001"

  # Sidekiq Background Jobs
  worker:
    build:
      context: ./backend
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    container_name: legaltech-worker
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/legaltech_development
      REDIS_URL: redis://redis:6379/0
    volumes:
      - ./backend:/app
      - rails_bundle:/usr/local/bundle
    depends_on:
      - postgres
      - redis
      - backend
    networks:
      - legaltech-network
    command: bundle exec sidekiq

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: ../infrastructure/docker/Dockerfile.frontend
    container_name: legaltech-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - node_modules:/app/node_modules
    depends_on:
      - backend
    networks:
      - legaltech-network

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  rails_bundle:
  node_modules:
```

### **Dockerfile.frontend**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### **Dockerfile.backend**
```dockerfile
FROM ruby:3.2-alpine

# Install system dependencies
RUN apk add --no-cache \
  build-base \
  postgresql-dev \
  git \
  curl

WORKDIR /app

# Copy Gemfile
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle install

# Copy application
COPY . .

# Expose port
EXPOSE 3001

# Start server
CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3001"]
```

---

## 🎨 **DESIGN SYSTEM - CLAYMORPHISM**

### **Tailwind Config**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Claymorphism color palette
        clay: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        legal: {
          gold: '#d4af37',
          navy: '#1e3a8a',
          emerald: '#10b981',
        }
      },
      boxShadow: {
        // Claymorphism shadows
        'clay-inset': 'inset 2px 2px 4px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
        'clay-raised': '4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8)',
        'clay-pressed': 'inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
        'clay-floating': '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.8)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

### **Base Clay Components**
```tsx
// components/ui/clay-card.tsx
import { cn } from '@/lib/utils'

interface ClayCardProps {
  children: React.ReactNode
  variant?: 'flat' | 'raised' | 'pressed' | 'floating'
  className?: string
  interactive?: boolean
}

export function ClayCard({ 
  children, 
  variant = 'raised', 
  className,
  interactive = false 
}: ClayCardProps) {
  const variants = {
    flat: 'bg-clay-100',
    raised: 'bg-clay-100 shadow-clay-raised',
    pressed: 'bg-clay-200 shadow-clay-pressed',
    floating: 'bg-clay-50 shadow-clay-floating',
  }

  return (
    <div 
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        interactive && 'hover:shadow-clay-floating hover:-translate-y-1 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
```

---

## 📊 **DATABASE SCHEMA**

### **Core Models (Rails)**
```ruby
# app/models/user.rb
class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :validatable
  
  enum user_type: { lawyer: 0, law_firm: 1, vendor: 2, admin: 3 }
  enum verification_status: { pending: 0, verified: 1, rejected: 2 }
  
  has_many :reviews, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :comparisons, dependent: :destroy
  
  validates :oab_number, presence: true, if: :lawyer?
  validates :cnpj, presence: true, if: -> { law_firm? || vendor? }
end

# app/models/product.rb
class Product < ApplicationRecord
  belongs_to :vendor, class_name: 'User'
  has_many :reviews, dependent: :destroy
  has_many :product_categories, dependent: :destroy
  has_many :categories, through: :product_categories
  has_many :product_features, dependent: :destroy
  has_many :features, through: :product_features
  
  enum status: { draft: 0, published: 1, archived: 2 }
  
  validates :name, :description, :vendor, presence: true
  
  scope :published, -> { where(status: :published) }
  scope :featured, -> { where(featured: true) }
end

# app/models/review.rb
class Review < ApplicationRecord
  belongs_to :user
  belongs_to :product
  has_many :review_votes, dependent: :destroy
  
  enum status: { pending: 0, approved: 1, rejected: 2 }
  
  validates :rating, inclusion: { in: 1..5 }
  validates :title, :content, presence: true
  validates :user_id, uniqueness: { scope: :product_id }
  
  scope :approved, -> { where(status: :approved) }
  scope :recent, -> { order(created_at: :desc) }
end
```

### **Database Migrations**
```ruby
# db/migrate/001_create_users.rb
class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: :uuid do |t|
      t.string :email,              null: false, default: ""
      t.string :first_name,         null: false
      t.string :last_name,          null: false
      t.string :oab_number
      t.string :oab_state
      t.string :cnpj
      t.string :company_name
      t.text :bio
      t.integer :user_type,         null: false, default: 0
      t.integer :verification_status, null: false, default: 0
      t.json :metadata,             default: {}
      
      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :oab_number
    add_index :users, :cnpj
    add_index :users, :user_type
  end
end

# db/migrate/002_create_products.rb
class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products, id: :uuid do |t|
      t.string :name,               null: false
      t.text :description,          null: false
      t.text :short_description
      t.references :vendor,         null: false, foreign_key: { to_table: :users }, type: :uuid
      t.string :website_url
      t.string :logo_url
      t.json :pricing,              default: {}
      t.json :integrations,         default: []
      t.json :features,             default: []
      t.integer :status,            null: false, default: 0
      t.boolean :featured,          default: false
      t.decimal :average_rating,    precision: 3, scale: 2, default: 0
      t.integer :reviews_count,     default: 0
      t.json :metadata,             default: {}
      
      t.timestamps null: false
    end

    add_index :products, :vendor_id
    add_index :products, :status
    add_index :products, :featured
    add_index :products, :average_rating
  end
end
```

---

## 🔧 **CORE FEATURES IMPLEMENTATION**

### **Product Search & Filtering**
```tsx
// hooks/use-product-search.ts
import { useQuery } from '@tanstack/react-query'
import { searchProducts, SearchFilters } from '@/lib/api/products'

export function useProductSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['products', 'search', filters],
    queryFn: () => searchProducts(filters),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// components/product-filters.tsx
export function ProductFilters({ onFiltersChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    priceRange: [0, 10000],
    rating: 0,
    features: [],
    integrations: [],
  })

  return (
    <ClayCard className="sticky top-4">
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar produtos
          </label>
          <SearchInput 
            value={filters.query}
            onChange={(value) => updateFilters({ query: value })}
            placeholder="Digite o nome do produto ou categoria..."
          />
        </div>

        {/* Categories Tree */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorias
          </label>
          <CategoryTree
            selected={filters.categories}
            onChange={(categories) => updateFilters({ categories })}
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Faixa de preço
          </label>
          <DualRangeSlider
            min={0}
            max={10000}
            value={filters.priceRange}
            onChange={(priceRange) => updateFilters({ priceRange })}
            formatValue={(value) => `R$ ${value}`}
          />
        </div>
      </div>
    </ClayCard>
  )
}
```

### **Product Card Component**
```tsx
// components/product-card.tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <ClayCard 
      variant="raised" 
      interactive
      className="group hover:shadow-clay-floating transition-all duration-300"
    >
      {/* Badges */}
      <div className="flex gap-2 mb-4">
        {product.featured && (
          <Badge variant="warning">Destaque</Badge>
        )}
        {product.averageRating >= 4.5 && (
          <Badge variant="success">Top Rated</Badge>
        )}
        {product.vendor.verified && (
          <Badge variant="primary">Verificado</Badge>
        )}
      </div>

      {/* Product Logo & Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-white shadow-clay-inset flex items-center justify-center overflow-hidden">
          <img 
            src={product.logoUrl} 
            alt={product.name}
            className="w-12 h-12 object-contain"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            by {product.vendor.companyName}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <StarRating rating={product.averageRating} size="sm" />
            <span className="text-sm text-gray-600">
              ({product.reviewsCount} avaliações)
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
        {product.shortDescription}
      </p>

      {/* Features Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.features.slice(0, 3).map((feature) => (
          <span 
            key={feature}
            className="px-2 py-1 text-xs bg-clay-200 text-gray-600 rounded-lg"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Pricing */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">A partir de</p>
        <p className="text-lg font-semibold text-gray-900">
          R$ {product.pricing.startingPrice}/mês
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Plus className="w-4 h-4 mr-1" />
          Comparar
        </Button>
        <Button size="sm" className="flex-1">
          Ver mais
        </Button>
        <Button variant="ghost" size="sm">
          <Heart className="w-4 h-4" />
        </Button>
      </div>
    </ClayCard>
  )
}
```

### **Review System**
```tsx
// components/review-form.tsx
export function ReviewForm({ productId }: { productId: string }) {
  const [step, setStep] = useState(1)
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      title: '',
      content: '',
      rating: 5,
      usageTime: '',
      wouldRecommend: true,
      pros: [],
      cons: [],
    }
  })

  const steps = [
    { title: 'Informações Básicas', component: BasicInfoStep },
    { title: 'Avaliação', component: RatingStep },
    { title: 'Prós e Contras', component: ProsConsStep },
    { title: 'Verificação', component: VerificationStep },
  ]

  return (
    <ClayCard className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div 
              key={index}
              className={cn(
                'flex items-center',
                index < step - 1 && 'text-primary-600',
                index === step - 1 && 'text-primary-600',
                index > step - 1 && 'text-gray-400'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                index < step - 1 && 'bg-primary-100 text-primary-600',
                index === step - 1 && 'bg-primary-600 text-white',
                index > step - 1 && 'bg-gray-200 text-gray-400'
              )}>
                {index < step - 1 ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {React.createElement(steps[step - 1].component, { form })}
          
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Anterior
              </Button>
            )}
            
            {step < steps.length ? (
              <Button 
                type="button"
                onClick={() => setStep(step + 1)}
                className="ml-auto"
              >
                Próximo
              </Button>
            ) : (
              <Button type="submit" className="ml-auto">
                Enviar Review
              </Button>
            )}
          </div>
        </form>
      </Form>
    </ClayCard>
  )
}
```

---

## 🚀 **DEPLOYMENT SCRIPTS**

### **Production Deploy Script**
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying LegalTech Platform..."

# Pull latest changes
git pull origin main

# Build and deploy with Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run database migrations
docker-compose exec backend rails db:migrate

# Clear application cache
docker-compose exec backend rails cache:clear

# Restart services
docker-compose restart frontend backend worker

echo "✅ Deployment completed successfully!"
echo "Frontend: https://legaltech.com.br"
echo "Backend: https://api.legaltech.com.br"
```

---

## 📝 **QUICK START CHECKLIST**

### **Phase 1: Foundation (Week 1)**
- [ ] Setup project structure
- [ ] Configure Docker environment
- [ ] Implement authentication system
- [ ] Create basic UI components with claymorphism style
- [ ] Setup database with core models

### **Phase 2: Core Features (Week 2-3)**
- [ ] Product listing and search
- [ ] Review system (write/read reviews)
- [ ] Basic vendor profiles
- [ ] Product comparison tool
- [ ] Admin panel for content management

### **Phase 3: Advanced Features (Week 4-5)**
- [ ] Advanced filtering and search
- [ ] Dashboard for vendors and law firms
- [ ] Analytics and reporting
- [ ] Email notifications
- [ ] API documentation

### **Phase 4: Enhancement (Week 6+)**
- [ ] Blog/content management
- [ ] Community forum
- [ ] Mobile app considerations
- [ ] Performance optimization
- [ ] SEO implementation

---

## 🎯 **CUSTOMIZATION POINTS**

When adapting this blueprint:

1. **Replace** "LegalTech" branding with your domain
2. **Adapt** the product categories to your market
3. **Customize** the claymorphism color palette
4. **Modify** the user roles and permissions
5. **Extend** the review criteria for your domain
6. **Add** domain-specific features (e.g., compliance tracking)

---

**This blueprint provides a complete foundation for building a sophisticated review platform with the same architecture and quality as the Avalia Solar platform, adapted for the legal software market with claymorphism design principles.**