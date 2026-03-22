# Directory Structure

## Repository Root
```
AB0-1-main/
├── AB0-1-front/   # Next.js Application
├── AB0-1-back/    # Ruby on Rails Backend
└── squads/        # AI Agents definitions and Rules
```

## Backend (AB0-1-back)
```
AB0-1-back/
├── app/
│   ├── admin/           # Active Admin dashboards and resources
│   ├── controllers/
│   │   ├── api/v1/      # Main API endpoints used by Frontend
│   │   └── ...
│   ├── models/          # ActiveRecord schemas and relations
│   ├── services/        # TrustScore processing, analytics handlers
│   └── workers/         # Background Sidekiq workers
├── config/              # Rails routes, environments, initializers
├── db/                  # Migrations and database schema
├── docs/                # API and Architecture docs
├── lib/                 # Custom logic classes
├── public/              # Static assets
└── spec/                # RSpec tests
```

## Frontend (AB0-1-front)
```
AB0-1-front/
├── app/                 # App Router files
├── components/          # Reusable Next components (home, landing, ui)
├── lib/                 # Shared utilities, fetch apis
├── contexts/            # React context providers
├── hooks/               # Custom hooks
└── public/              # Static frontend images
```
