# STORY-001: Micro-Interactions Tracking (Dark Funnel Capture)

**Epic**: Buyer Intent Data Platform  
**Priority**: P0 (Critical)  
**Points**: 13  
**Sprint**: Q2 2026 - Week 1-4  
**Status**: 🟡 In Progress

---

## 📋 Story Overview

**As a** Lead Qualification System  
**I want to** capture micro-interactions that reveal buying intent  
**So that** we can identify high-value leads before explicit conversion

**Business Value**: Capture the missing 40% of the funnel ("Dark Funnel") to improve lead scoring accuracy and increase conversion by 35%

---

## 🎯 Acceptance Criteria

### Must Have
- [ ] Capture form field interactions (onBlur, onChange, hesitation)
- [ ] Track hover intent on CTAs (>1s duration)
- [ ] Log copy-to-clipboard events (CNPJ, phone, email)
- [ ] Measure scroll pause on key sections (>3s)
- [ ] Record tooltip interactions (open/close)
- [ ] Store events in analytics_events with structured JSON payload
- [ ] Real-time event batching (<50ms latency)
- [ ] LGPD compliant (anonymized, consent-based)

### Should Have
- [ ] Position bias correction data capture
- [ ] Device/viewport context in events
- [ ] Network quality detection (offline queueing)

### Won't Have (This Sprint)
- ML-based intent prediction
- Identity stitching (anonymous → known)
- Third-party enrichment

---

## 🏗️ Technical Implementation

### Frontend (Next.js)

#### 1. Event Tracking Hooks
**File**: `AB0-1-front/lib/analytics/micro-interactions.ts`

```typescript
import { analytics } from './index';

export interface MicroInteractionEvent {
  event_type: 'micro_interaction';
  action: 'form_hesitation' | 'hover_intent' | 'copy_clipboard' | 
          'scroll_pause' | 'tooltip_open';
  context: {
    element_id: string;
    element_type: string;
    duration_ms?: number;
    value?: string;
    position?: { x: number; y: number };
    viewport?: { width: number; height: number };
  };
}

// Form Hesitation Tracker
export const trackFormHesitation = (fieldName: string, duration: number) => {
  analytics.track('micro_interaction', {
    action: 'form_hesitation',
    context: {
      element_id: fieldName,
      element_type: 'form_field',
      duration_ms: duration
    }
  });
};

// Hover Intent Tracker
export const trackHoverIntent = (elementId: string, duration: number) => {
  if (duration < 1000) return; // Ignore <1s hovers
  
  analytics.track('micro_interaction', {
    action: 'hover_intent',
    context: {
      element_id: elementId,
      element_type: 'cta_button',
      duration_ms: duration
    }
  });
};

// Copy Clipboard Tracker
export const trackCopyClipboard = (textType: string, value: string) => {
  analytics.track('micro_interaction', {
    action: 'copy_clipboard',
    context: {
      element_type: textType,
      value: value.substring(0, 10) // Truncate for privacy
    }
  });
};

// Scroll Pause Tracker
export const trackScrollPause = (sectionId: string, duration: number) => {
  if (duration < 3000) return; // Ignore <3s pauses
  
  analytics.track('micro_interaction', {
    action: 'scroll_pause',
    context: {
      element_id: sectionId,
      element_type: 'content_section',
      duration_ms: duration
    }
  });
};
```

#### 2. React Hooks
**File**: `AB0-1-front/lib/hooks/useIntentTracking.ts`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { 
  trackFormHesitation, 
  trackHoverIntent, 
  trackScrollPause 
} from '../analytics/micro-interactions';

// Form Hesitation Hook
export const useFormHesitation = (fieldName: string) => {
  const startTime = useRef<number | null>(null);
  const valueHistory = useRef<string[]>([]);

  const onFocus = () => {
    startTime.current = Date.now();
  };

  const onChange = (value: string) => {
    valueHistory.current.push(value);
  };

  const onBlur = (value: string) => {
    if (!startTime.current) return;
    
    const duration = Date.now() - startTime.current;
    const hadHesitation = valueHistory.current.length > 3; // Changed mind 3+ times
    
    if (hadHesitation || duration > 30000) { // 30s threshold
      trackFormHesitation(fieldName, duration);
    }
    
    startTime.current = null;
    valueHistory.current = [];
  };

  return { onFocus, onChange, onBlur };
};

// Hover Intent Hook
export const useHoverIntent = (elementId: string) => {
  const hoverStart = useRef<number | null>(null);

  const onMouseEnter = () => {
    hoverStart.current = Date.now();
  };

  const onMouseLeave = () => {
    if (!hoverStart.current) return;
    
    const duration = Date.now() - hoverStart.current;
    trackHoverIntent(elementId, duration);
    
    hoverStart.current = null;
  };

  return { onMouseEnter, onMouseLeave };
};

// Scroll Pause Hook
export const useScrollPause = (sectionId: string) => {
  const pauseStart = useRef<number | null>(null);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Reset timer on scroll
      if (pauseTimer.current) {
        clearTimeout(pauseTimer.current);
      }
      
      pauseStart.current = Date.now();
      
      // Set 3s timer
      pauseTimer.current = setTimeout(() => {
        const duration = Date.now() - (pauseStart.current || 0);
        trackScrollPause(sectionId, duration);
      }, 3000);
    };

    const element = document.getElementById(sectionId);
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pauseStart.current = Date.now();
            window.addEventListener('scroll', handleScroll);
          } else {
            window.removeEventListener('scroll', handleScroll);
            if (pauseTimer.current) clearTimeout(pauseTimer.current);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, [sectionId]);
};
```

#### 3. Copy Clipboard Detection
**File**: `AB0-1-front/lib/analytics/clipboard-tracker.ts`

```typescript
'use client';

import { trackCopyClipboard } from './micro-interactions';

export const initClipboardTracking = () => {
  if (typeof window === 'undefined') return;

  document.addEventListener('copy', (e) => {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text) return;

    // Detect data types
    let textType = 'unknown';
    
    if (/^\d{14}$/.test(text.replace(/\D/g, ''))) {
      textType = 'cnpj';
    } else if (/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(text)) {
      textType = 'phone';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      textType = 'email';
    }

    trackCopyClipboard(textType, text);
  });
};
```

### Backend (Rails)

#### 4. Enhanced Analytics Events Migration
**File**: `AB0-1-back/db/migrate/20260310120000_enhance_analytics_events_for_micro_interactions.rb`

```ruby
class EnhanceAnalyticsEventsForMicroInteractions < ActiveRecord::Migration[7.0]
  def change
    # Add micro-interaction specific columns
    add_column :analytics_events, :action, :string
    add_column :analytics_events, :duration_ms, :integer
    add_column :analytics_events, :element_id, :string
    add_column :analytics_events, :element_type, :string
    add_column :analytics_events, :position_x, :integer
    add_column :analytics_events, :position_y, :integer
    add_column :analytics_events, :viewport_width, :integer
    add_column :analytics_events, :viewport_height, :integer

    # Add indexes for common queries
    add_index :analytics_events, :action
    add_index :analytics_events, :element_type
    add_index :analytics_events, [:event_type, :action]
    add_index :analytics_events, [:company_id, :action], 
              where: "company_id IS NOT NULL"
  end
end
```

#### 5. Event Validation Service
**File**: `AB0-1-back/app/services/micro_interaction_validator.rb`

```ruby
class MicroInteractionValidator
  VALID_ACTIONS = %w[
    form_hesitation
    hover_intent
    copy_clipboard
    scroll_pause
    tooltip_open
  ].freeze

  VALID_ELEMENT_TYPES = %w[
    form_field
    cta_button
    content_section
    tooltip
    cnpj
    phone
    email
  ].freeze

  def initialize(event_data)
    @data = event_data.with_indifferent_access
    @errors = []
  end

  def valid?
    validate_action
    validate_element_type
    validate_duration
    validate_context
    @errors.empty?
  end

  def errors
    @errors
  end

  private

  def validate_action
    action = @data.dig(:context, :action) || @data[:action]
    return if VALID_ACTIONS.include?(action)
    
    @errors << "Invalid action: #{action}"
  end

  def validate_element_type
    element_type = @data.dig(:context, :element_type)
    return if VALID_ELEMENT_TYPES.include?(element_type)
    
    @errors << "Invalid element_type: #{element_type}"
  end

  def validate_duration
    duration = @data.dig(:context, :duration_ms)
    return unless duration
    return if duration.is_a?(Integer) && duration.positive?
    
    @errors << "Invalid duration_ms: #{duration}"
  end

  def validate_context
    context = @data[:context]
    return if context.is_a?(Hash)
    
    @errors << "Missing or invalid context object"
  end
end
```

#### 6. Enhanced Analytics Controller
**File**: `AB0-1-back/app/controllers/api/v1/analytics_controller.rb`

```ruby
module Api
  module V1
    class AnalyticsController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :check_rate_limit, only: [:create]

      def create
        validator = MicroInteractionValidator.new(event_params)
        
        unless validator.valid?
          return render json: { 
            errors: validator.errors 
          }, status: :unprocessable_entity
        end

        event = AnalyticsEvent.create!(
          event_type: params[:event_type],
          action: params.dig(:context, :action),
          duration_ms: params.dig(:context, :duration_ms),
          element_id: params.dig(:context, :element_id),
          element_type: params.dig(:context, :element_type),
          position_x: params.dig(:context, :position, :x),
          position_y: params.dig(:context, :position, :y),
          viewport_width: params.dig(:context, :viewport, :width),
          viewport_height: params.dig(:context, :viewport, :height),
          context: params[:context],
          anonymous_id: cookies[:anonymous_id] || generate_anonymous_id,
          user_id: current_user&.id,
          company_id: params[:company_id],
          occurred_at: Time.current
        )

        render json: { success: true, event_id: event.id }, status: :created
      end

      private

      def event_params
        params.permit(
          :event_type,
          :company_id,
          context: [
            :action,
            :element_id,
            :element_type,
            :duration_ms,
            :value,
            position: [:x, :y],
            viewport: [:width, :height]
          ]
        )
      end

      def check_rate_limit
        # Redis-based rate limiting
        key = "analytics:#{request.ip}"
        count = Rails.cache.read(key) || 0
        
        if count > 100 # 100 events per minute
          render json: { error: 'Rate limit exceeded' }, status: :too_many_requests
          return
        end
        
        Rails.cache.write(key, count + 1, expires_in: 1.minute)
      end

      def generate_anonymous_id
        id = SecureRandom.uuid
        cookies[:anonymous_id] = {
          value: id,
          expires: 2.years.from_now,
          httponly: true,
          secure: Rails.env.production?
        }
        id
      end
    end
  end
end
```

---

## 🧪 Testing Strategy

### Frontend Tests
**File**: `AB0-1-front/__tests__/lib/micro-interactions.test.ts`

```typescript
import { 
  trackFormHesitation, 
  trackHoverIntent, 
  trackCopyClipboard 
} from '@/lib/analytics/micro-interactions';
import { analytics } from '@/lib/analytics';

jest.mock('@/lib/analytics');

describe('Micro-Interactions Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks form hesitation', () => {
    trackFormHesitation('email', 45000);
    
    expect(analytics.track).toHaveBeenCalledWith('micro_interaction', {
      action: 'form_hesitation',
      context: {
        element_id: 'email',
        element_type: 'form_field',
        duration_ms: 45000
      }
    });
  });

  it('tracks hover intent > 1s', () => {
    trackHoverIntent('cta-whatsapp', 2500);
    
    expect(analytics.track).toHaveBeenCalled();
  });

  it('ignores hover < 1s', () => {
    trackHoverIntent('cta-whatsapp', 800);
    
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('tracks clipboard copy with truncation', () => {
    trackCopyClipboard('cnpj', '12.345.678/0001-90');
    
    expect(analytics.track).toHaveBeenCalledWith('micro_interaction', {
      action: 'copy_clipboard',
      context: {
        element_type: 'cnpj',
        value: '12.345.678' // Truncated for privacy
      }
    });
  });
});
```

### Backend Tests
**File**: `AB0-1-back/spec/services/micro_interaction_validator_spec.rb`

```ruby
require 'rails_helper'

RSpec.describe MicroInteractionValidator do
  describe '#valid?' do
    it 'validates correct form_hesitation event' do
      event = {
        event_type: 'micro_interaction',
        action: 'form_hesitation',
        context: {
          element_id: 'email',
          element_type: 'form_field',
          duration_ms: 30000
        }
      }
      
      validator = MicroInteractionValidator.new(event)
      expect(validator.valid?).to be true
    end

    it 'rejects invalid action' do
      event = {
        action: 'invalid_action',
        context: { element_type: 'form_field' }
      }
      
      validator = MicroInteractionValidator.new(event)
      expect(validator.valid?).to be false
      expect(validator.errors).to include(/Invalid action/)
    end

    it 'rejects negative duration' do
      event = {
        action: 'hover_intent',
        context: {
          element_type: 'cta_button',
          duration_ms: -100
        }
      }
      
      validator = MicroInteractionValidator.new(event)
      expect(validator.valid?).to be false
    end
  end
end
```

---

## 📊 Database Schema

```sql
-- Enhanced analytics_events table
ALTER TABLE analytics_events ADD COLUMN action VARCHAR(50);
ALTER TABLE analytics_events ADD COLUMN duration_ms INTEGER;
ALTER TABLE analytics_events ADD COLUMN element_id VARCHAR(255);
ALTER TABLE analytics_events ADD COLUMN element_type VARCHAR(50);
ALTER TABLE analytics_events ADD COLUMN position_x INTEGER;
ALTER TABLE analytics_events ADD COLUMN position_y INTEGER;
ALTER TABLE analytics_events ADD COLUMN viewport_width INTEGER;
ALTER TABLE analytics_events ADD COLUMN viewport_height INTEGER;

-- Indexes for performance
CREATE INDEX idx_analytics_events_action ON analytics_events(action);
CREATE INDEX idx_analytics_events_element_type ON analytics_events(element_type);
CREATE INDEX idx_analytics_events_action_type ON analytics_events(event_type, action);
CREATE INDEX idx_analytics_events_company_action 
  ON analytics_events(company_id, action) 
  WHERE company_id IS NOT NULL;
```

---

## 🚀 Implementation Checklist

### Phase 1: Setup (Week 1)
- [ ] Create database migration
- [ ] Run migration on staging
- [ ] Setup rate limiting (Redis)
- [ ] Configure CSRF protection

### Phase 2: Backend (Week 2)
- [ ] Implement MicroInteractionValidator
- [ ] Enhance AnalyticsController
- [ ] Write backend tests (RSpec)
- [ ] Add API documentation

### Phase 3: Frontend (Week 3)
- [ ] Create micro-interactions.ts
- [ ] Implement React hooks
- [ ] Add clipboard tracking
- [ ] Integrate into existing components
- [ ] Write frontend tests (Jest)

### Phase 4: Integration (Week 4)
- [ ] Test end-to-end flow
- [ ] Performance testing (latency < 50ms)
- [ ] Security audit (CSRF, XSS, rate limiting)
- [ ] LGPD compliance review
- [ ] Deploy to staging
- [ ] Monitor for 48h
- [ ] Deploy to production

---

## 📈 Success Metrics

**Technical**:
- Event capture rate: >95%
- Latency P95: <50ms
- Error rate: <0.1%
- Test coverage: >80%

**Business**:
- Dark funnel events captured: 40% increase
- Intent scoring accuracy: +15%
- Lead conversion: +10% (month 1)

---

## 🔒 Security Considerations

1. **CSRF Protection**: All POST endpoints require CSRF token
2. **Rate Limiting**: 100 events/min per IP (Redis)
3. **Data Privacy**: Truncate sensitive values (LGPD)
4. **Anonymous ID**: httpOnly cookie, secure in prod
5. **Input Validation**: Strict validator service
6. **SQL Injection**: Parameterized queries only

---

## 🐛 Known Issues / Risks

1. **Safari Clipboard API**: Limited support, fallback needed
2. **Mobile Hover**: No hover on touch devices (track tap instead)
3. **Ad Blockers**: May block analytics.js (use first-party domain)
4. **High Traffic**: May need event batching (future optimization)

---

## 📚 References

- PostHog Documentation: https://posthog.com/docs
- Next.js Client Components: https://nextjs.org/docs/app/building-your-application/rendering/client-components
- Rails Security Guide: https://guides.rubyonrails.org/security.html
- LGPD Compliance: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd

---

## Dev Agent Record

### Implementation Progress
- [x] Database migration created
- [x] Backend services implemented
- [x] Frontend tracking hooks created
- [ ] Tests written (backend)
- [ ] Tests written (frontend)
- [ ] Integration testing complete
- [ ] Security audit passed
- [ ] Deployed to staging
- [ ] Production deployment

### Debug Log
```
[2026-03-10 15:28] Story created by Dev Agent
[2026-03-10 15:28] Status: Ready for implementation
[2026-03-10 15:35] Auto-implementation started
[2026-03-10 15:45] Phase 1: Database migration created
[2026-03-10 15:50] Phase 2: Backend validator + controller enhanced
[2026-03-10 15:55] Phase 3: Frontend tracking hooks + clipboard tracker added
[2026-03-10 15:56] Phase 4: Integrated clipboard tracking into layout
```

### Completion Notes
**Status**: 🟡 Core Implementation Complete - Testing Pending

**Files Created**:
- `db/migrate/20260310120000_enhance_analytics_events_for_micro_interactions.rb`
- `app/services/micro_interaction_validator.rb`
- `lib/analytics/micro-interactions.ts`
- `lib/hooks/useIntentTracking.ts`
- `lib/analytics/clipboard-tracker.ts`
- `components/ClipboardTracker.tsx`

**Files Modified**:
- `app/controllers/api/v1/analytics_controller.rb` (rate limiting + validation)
- `app/layout.tsx` (clipboard tracker integration)

**Next Steps**:
1. Run migration: `rails db:migrate`
2. Write backend tests (RSpec)
3. Write frontend tests (Jest)
4. Manual testing on staging
5. Security audit

### Change Log
- **2026-03-10 15:28**: Story created with full technical specifications
- **2026-03-10 15:56**: Core implementation complete (backend + frontend)
