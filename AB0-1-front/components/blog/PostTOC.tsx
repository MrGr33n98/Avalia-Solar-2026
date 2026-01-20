'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

export function PostTOC() {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Finds all h2 and h3 elements inside the article content
    const articleContent = document.querySelector('article');
    if (!articleContent) return;

    const elements = articleContent.querySelectorAll('h2, h3');
    const items = Array.from(elements).map((elem, index) => {
      if (!elem.id) {
        elem.id = `heading-${index}`;
      }
      return {
        id: elem.id,
        text: elem.textContent || '',
        level: Number(elem.tagName.substring(1)),
      };
    });

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -40% 0px' }
    );

    elements.forEach((elem) => observer.observe(elem));

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="hidden lg:block mb-8">
      <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
        <List className="w-4 h-4" />
        Neste artigo
      </div>
      <nav className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
        <ul className="space-y-3">
          {headings.map((heading) => (
            <li key={heading.id} className={cn("pl-4 relative", heading.level === 3 && "pl-8")}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={cn(
                  "block text-sm transition-colors duration-200 line-clamp-2 hover:text-primary",
                  activeId === heading.id
                    ? "text-primary font-medium"
                    : "text-slate-600"
                )}
              >
                {heading.text}
              </a>
              {activeId === heading.id && (
                <div className="absolute left-0 top-1.5 w-0.5 h-4 bg-primary rounded-r-full" />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
