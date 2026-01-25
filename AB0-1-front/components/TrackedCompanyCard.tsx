/**
 * Tracked Company Card Component
 * 
 * Exemplo de componente com GTM tracking integrado
 * Rastreia views e clicks automaticamente
 */

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { trackCompanyClick, pushToDataLayer } from '@/lib/dataLayer';

interface Company {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  state?: string;
  rating?: number;
  logo_url?: string;
}

interface TrackedCompanyCardProps {
  company: Company;
  index: number; // Posição na listagem (0-based)
  listType?: string; // 'featured', 'category', 'search'
}

export function TrackedCompanyCard({ 
  company, 
  index,
  listType = 'default'
}: TrackedCompanyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  // Track impression quando card fica 50% visível
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            // Track company impression
            pushToDataLayer({
              event: 'company_impression',
              companyId: company.id,
              companyName: company.name,
              listPosition: index + 1, // 1-based para analytics
              listType,
            });

            impressionTracked.current = true;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 } // 50% visível
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [company.id, company.name, index, listType]);

  // Handle click
  const handleClick = () => {
    trackCompanyClick(
      company.id,
      company.name,
      index + 1, // 1-based
      {
        listType,
        city: company.city,
        state: company.state,
        rating: company.rating,
      }
    );
  };

  return (
    <div ref={cardRef}>
      <Link
        href={`/companies/${company.slug}`}
        onClick={handleClick}
        className="block hover:shadow-lg transition-shadow"
      >
        <div className="border rounded-lg p-4">
          {company.logo_url && (
            <img 
              src={company.logo_url} 
              alt={company.name}
              className="w-full h-32 object-cover rounded"
            />
          )}
          
          <h3 className="text-lg font-semibold mt-2">
            {company.name}
          </h3>
          
          {company.description && (
            <p className="text-sm text-gray-600 mt-1">
              {company.description}
            </p>
          )}
          
          {(company.city || company.state) && (
            <p className="text-sm text-gray-500 mt-2">
              {company.city && company.state 
                ? `${company.city} - ${company.state}`
                : company.city || company.state
              }
            </p>
          )}
          
          {company.rating && (
            <div className="flex items-center mt-2">
              <span className="text-yellow-500">⭐</span>
              <span className="ml-1 text-sm font-medium">
                {company.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export default TrackedCompanyCard;
