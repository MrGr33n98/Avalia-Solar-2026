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

// Tooltip Interaction Tracker
export const trackTooltipOpen = (tooltipId: string) => {
  analytics.track('micro_interaction', {
    action: 'tooltip_open',
    context: {
      element_id: tooltipId,
      element_type: 'tooltip'
    }
  });
};
