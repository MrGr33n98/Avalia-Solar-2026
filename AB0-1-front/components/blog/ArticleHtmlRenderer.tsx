'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { fixArticleContent } from '@/lib/content-fixer';

interface ArticleHtmlRendererProps {
  content: string | null | undefined;
  className?: string;
  articleSlug?: string;
}

/**
 * Defense-in-depth frontend sanitizer.
 * Ensures that even if unescaped or malicious HTML reaches the client,
 * executable scripts, event handlers, and rogue frames are neutralized.
 */
function sanitizeFrontendHtml(html: string): string {
  if (!html) return '';

  return html
    // 1. Remove dangerous executable tags and frames
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    // 2. Remove all inline JS event handlers (onload, onerror, onclick, etc.)
    .replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // 3. Neutralize dangerous URL schemes (javascript:, data:text/html, vbscript:)
    .replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*(?:"data:text\/html[^"]*"|'data:text\/html[^']*')/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*(?:"vbscript:[^"]*"|'vbscript:[^']*')/gi, '$1="#"');
}

/**
 * ArticleHtmlRenderer
 * Renders rich editorial HTML safely within the .as-article scoped container.
 * Features:
 * - SSR-compatible defense-in-depth sanitization
 * - Term corrections & responsive table wrapping
 * - PostHog CTA click & impression tracking (TASK-041)
 */
export function ArticleHtmlRenderer({
  content,
  className = '',
  articleSlug = '',
}: ArticleHtmlRendererProps) {
  const containerRef = useRef<HTMLElement>(null);

  const safeContent = useMemo(() => {
    if (!content) return '';
    const normalized = fixArticleContent(content);
    return sanitizeFrontendHtml(normalized);
  }, [content]);

  // Track CTA clicks and impressions in components
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    // 1. Delegated Click Tracker
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[data-as-track="cta_click"], a.as-btn');
      if (!target) return;

      const anchor = target as HTMLAnchorElement;
      const componentParent = anchor.closest('[data-as-component]');
      const componentId = componentParent?.getAttribute('data-as-component-id') || 'unknown';
      const componentType = componentParent?.getAttribute('data-as-component') || 'cta';
      const destinationUrl = anchor.getAttribute('href') || '';
      const buttonText = anchor.textContent?.trim() || '';

      const eventPayload = {
        component_id: componentId,
        component_type: componentType,
        destination_url: destinationUrl,
        button_text: buttonText,
        article_slug: articleSlug,
      };

      if (window.__analyticsPosthog && typeof window.__analyticsPosthog.capture === 'function') {
        window.__analyticsPosthog.capture('article_cta_click', eventPayload);
      }
    };

    container.addEventListener('click', handleClick);

    // 2. Component Impression Tracker (IntersectionObserver)
    const trackedComponents = new Set<string>();
    let observer: IntersectionObserver | null = null;

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const el = entry.target as HTMLElement;
              const componentId = el.getAttribute('data-as-component-id') || el.id;
              if (componentId && !trackedComponents.has(componentId)) {
                trackedComponents.add(componentId);

                const componentType = el.getAttribute('data-as-component') || 'component';
                if (window.__analyticsPosthog && typeof window.__analyticsPosthog.capture === 'function') {
                  window.__analyticsPosthog.capture('article_component_impression', {
                    component_id: componentId,
                    component_type: componentType,
                    article_slug: articleSlug,
                  });
                }
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      const componentElements = container.querySelectorAll('[data-as-component]');
      componentElements.forEach((el) => observer?.observe(el));
    }

    return () => {
      container.removeEventListener('click', handleClick);
      observer?.disconnect();
    };
  }, [safeContent, articleSlug]);

  if (!safeContent) {
    return null;
  }

  return (
    <article
      ref={containerRef}
      className={`as-article ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safeContent }}
    />
  );
}

export default ArticleHtmlRenderer;
