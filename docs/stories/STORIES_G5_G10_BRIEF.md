# Stories G5-G10: Brief Implementation Guides

This document provides condensed implementation guides for stories G5-G10, complementing the detailed stories for G1-G4.

---

## G5: Refactor SQL Raw to Service Objects

**ID:** AS-DASH-P1-G5 | **Story Points:** 13 | **Priority:** P1

### Problem
```ruby
# company_dashboard_controller.rb:62
sql_trust = 'SELECT score, components FROM company_trust_score WHERE company_id = $1'
trust = ActiveRecord::Base.connection.exec_query(sql_trust, 'Trust', [[nil, @company.id]])
```
Raw SQL coupled to PostgreSQL reduces maintainability and testability.

### Solution Architecture
```
app/services/company_dashboard/
├── reputation_service.rb     # Reviews, trust score, ratings
├── ranking_service.rb         # Magic quadrant, position
├── analytics_service.rb       # Metrics, conversions
└── base_service.rb           # Shared utilities
```

### Implementation Checklist
- [ ] Create `CompanyDashboard::ReputationService`
  - Replace trust_score SQL with `CompanyTrustScore.find_by(company_id:)`
  - Replace reviews aggregation with AR `.count` / `.average`
- [ ] Create `CompanyDashboard::RankingService`
  - Replace magic quadrant SQL with AR `.joins` + `.select`
  - Add scopes to `Company` model
- [ ] Update controller to call services
- [ ] Write RSpec tests (>80% coverage)
- [ ] Benchmark performance (should match or improve)

**Estimated Effort:** 16h (2 days)

---

## G6: Unify Dashboard Navigation Config

**ID:** AS-DASH-P1-G6 | **Story Points:** 5 | **Priority:** P1

### Problem
- **EnterpriseSidebar:** 19 navigation items
- **CommandMenu:** 14 navigation items
- **Issue:** Divergências não documentadas, manutenção duplicada

### Solution
```typescript
// config/navigation.ts
export const DASHBOARD_NAVIGATION = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: Home,
    href: '/dashboard/company',
    context: ['sidebar', 'command', 'mobile']
  },
  {
    id: 'analytics',
    label: 'Analytics Avançado',
    icon: BarChart,
    href: '/dashboard/company?tab=analytics',
    context: ['sidebar', 'command'],
    requiresFeature: 'advanced_analytics'
  },
  // ... 29 items total
];

export const filterNavigation = (context: string, company?: Company) => {
  return DASHBOARD_NAVIGATION.filter(item => {
    if (!item.context.includes(context)) return false;
    if (item.requiresFeature && !company?.hasFeature(item.requiresFeature)) return false;
    return true;
  });
};
```

### Implementation Checklist
- [ ] Create `lib/config/navigation.ts` with 29 items
- [ ] Add context flags (sidebar, command, mobile, admin)
- [ ] Add feature flags (requiresFeature)
- [ ] Update `EnterpriseSidebar` to consume config
- [ ] Update `CommandMenu` to consume config
- [ ] Add unit tests for filtering logic
- [ ] Document navigation contexts in README

**Estimated Effort:** 8h (1 day)

---

## G7: Implement Companies Listing Cache

**ID:** AS-DASH-P1-G7 | **Story Points:** 5 | **Priority:** P1

### Problem
Every request to `/api/v1/companies` hits database with heavy eager loading:
```ruby
@companies = ::Company.includes(
  :categories, :badges, :review_aggregates,
  :company_faqs, :company_financing_profile,
  :company_financing_partners, :company_financing_offers
)
```
Response time: 1.2s (p95)

### Solution
```ruby
# companies_controller.rb
def index
  cache_key = "companies:#{cache_key_suffix}"
  
  @companies = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
    build_companies_query.to_a
  end
  
  render json: @companies
end

private

def cache_key_suffix
  # Include filters in key to cache per unique query
  Digest::MD5.hexdigest([
    params[:category_ids],
    params[:state],
    params[:city],
    params[:min_rating],
    params[:sort],
    params[:page]
  ].compact.to_s)
end

# After callbacks for cache invalidation
class Company < ApplicationRecord
  after_save :expire_companies_cache
  
  def expire_companies_cache
    Rails.cache.delete_matched("companies:*")
  end
end
```

### Implementation Checklist
- [ ] Add `Rails.cache.fetch` in `CompaniesController#index`
- [ ] Generate cache keys with filter hash
- [ ] Add callbacks for cache invalidation (after_save, after_destroy)
- [ ] Configure Redis cache store (production)
- [ ] Add cache monitoring (Yabeda metrics)
- [ ] Test cache hit rate (target >70%)

**Estimated Effort:** 6h

---

## G8: Implement Rate Limiting

**ID:** AS-DASH-P1-G8 | **Story Points:** 3 | **Priority:** P1

### Problem
No rate limiting on sensitive endpoints:
- `/api/v1/analytics/track` - can be spammed
- `/api/v1/*` - no protection against DoS

### Solution
```ruby
# config/initializers/rack_attack.rb
class Rack::Attack
  # Allow unlimited from localhost (dev)
  safelist('allow-localhost') do |req|
    req.ip == '127.0.0.1' || req.ip == '::1'
  end

  # Throttle analytics tracking
  throttle('analytics/track', limit: 100, period: 1.minute) do |req|
    if req.path == '/api/v1/analytics/track' && req.post?
      req.ip
    end
  end

  # Throttle authenticated API
  throttle('api/authenticated', limit: 300, period: 5.minutes) do |req|
    if req.path.start_with?('/api/v1/')
      req.headers['Authorization']
    end
  end

  # Block repeated failed auth
  blocklist('block-failed-auth') do |req|
    Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 5, findtime: 10.minutes, bantime: 1.hour) do
      req.path == '/api/v1/auth/login' && req.post? && req.env['rack.attack.matched'] == 'auth-failures'
    end
  end
end

# Custom throttled response
Rack::Attack.throttled_responder = lambda do |env|
  [429, {'Content-Type' => 'application/json'}, [{
    error: 'Rate limit exceeded',
    retry_after: env['rack.attack.match_data'][:period]
  }.to_json]]
end
```

### Implementation Checklist
- [ ] Install `rack-attack` gem
- [ ] Create `config/initializers/rack_attack.rb`
- [ ] Configure Redis store for counters
- [ ] Add monitoring (StatsD/Datadog)
- [ ] Test rate limits (manual + automated)
- [ ] Document limits in API docs

**Estimated Effort:** 4h

---

## G9: Implement Real Notification System

**ID:** AS-DASH-P2-G9 | **Story Points:** 8 | **Priority:** P2

### Problem
```typescript
// page.tsx:172-174
<span className="relative inline-flex rounded-full h-4 w-4 bg-red-600">3</span>
// ❌ Hardcoded badge, no real notifications
```

### Solution
```ruby
# app/models/notification.rb
class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :notifiable, polymorphic: true
  
  scope :unread, -> { where(read_at: nil) }
  
  enum notification_type: {
    new_review: 'new_review',
    new_lead: 'new_lead',
    status_update: 'status_update',
    reply_received: 'reply_received'
  }
  
  def self.create_for_review(review)
    review.company.active_members.each do |user|
      create!(
        user: user,
        notifiable: review,
        notification_type: :new_review,
        title: 'Nova Avaliação',
        message: "#{review.rating} estrelas de #{review.user.name}"
      )
    end
  end
end

# API endpoint
class Api::V1::NotificationsController < ApplicationController
  def index
    @notifications = current_user.notifications
      .includes(:notifiable)
      .order(created_at: :desc)
      .page(params[:page])
      .per(20)
    
    render json: {
      notifications: @notifications,
      unread_count: current_user.notifications.unread.count
    }
  end
  
  def mark_as_read
    notification = current_user.notifications.find(params[:id])
    notification.update(read_at: Time.current)
    head :no_content
  end
end
```

### Implementation Checklist
- [ ] Create `notifications` table migration
- [ ] Create `Notification` model
- [ ] Add API endpoints (index, mark_as_read, mark_all_as_read)
- [ ] Trigger notifications on events (Review, Lead)
- [ ] Update badge to show real count
- [ ] Add frontend hook `useNotifications`
- [ ] Implement notification drawer UI

**Estimated Effort:** 12h

---

## G10: Create Company Dashboard Onboarding Tour

**ID:** AS-DASH-P2-G10 | **Story Points:** 13 | **Priority:** P2

### Problem
New users confused by 29 tabs, no guidance, high support ticket volume.

### Solution
```typescript
// components/onboarding/OnboardingTour.tsx
import Joyride, { Step } from 'react-joyride';

const TOUR_STEPS: Step[] = [
  {
    target: '#overview-metrics',
    content: 'Acompanhe suas métricas principais: views, clicks e leads em tempo real.',
    disableBeacon: true,
  },
  {
    target: '#company-info-tab',
    content: 'Complete seu perfil para receber 3x mais leads.',
  },
  {
    target: '#reviews-tab',
    content: 'Responda avaliações para melhorar sua reputação.',
  },
  {
    target: '#leads-tab',
    content: 'Gerencie orçamentos solicitados por clientes.',
  },
  {
    target: '#settings-tab',
    content: 'Configure notificações, integrações e preferências.',
  },
  // ... 8 steps total
];

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);
  const [tourCompleted, setTourCompleted] = useLocalStorage('tour_completed', false);

  useEffect(() => {
    if (!tourCompleted) {
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      setTourCompleted(true);
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#10b981',
          zIndex: 10000,
        },
      }}
    />
  );
};
```

### Implementation Checklist
- [ ] Install `react-joyride` library
- [ ] Create 8-step tour with clear messaging
- [ ] Add localStorage tracking
- [ ] Add "Reset Tour" option in settings
- [ ] Make mobile-responsive (modal on small screens)
- [ ] Track tour completion (analytics event)
- [ ] User test with 5+ new users
- [ ] Measure completion rate (target >80%)

**Estimated Effort:** 20h (including UX design + user testing)

---

## Summary Table

| Gap | Story Points | Effort (h) | Priority | Complexity | Risk |
|-----|--------------|------------|----------|------------|------|
| G5  | 13 | 16 | P1 | High | Medium |
| G6  | 5  | 8  | P1 | Low | Low |
| G7  | 5  | 6  | P1 | Medium | Medium |
| G8  | 3  | 4  | P1 | Low | Low |
| G9  | 8  | 12 | P2 | Medium | Low |
| G10 | 13 | 20 | P2 | Medium | Low |

**Total:** 47 story points, 66 hours (~1.6 weeks with 2 devs)

---

## Dependencies Graph

```
G5 (Service Refactor) ──► G7 (Cache)
                           │
G6 (Navigation) ──────────┴──► G10 (Onboarding)
                                
G8 (Rate Limit) ──► G4 (Activity Charts)
                    │
                    └──► G9 (Notifications)
```

---

**Document Status:** ✅ Ready for Implementation  
**Created:** 2026-03-06  
**Author:** PO Agent (@po)
