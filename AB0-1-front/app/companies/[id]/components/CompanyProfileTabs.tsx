'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyProfileTabs } from './companyProfileTabsConfig';

interface CompanyProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  categories?: Array<{ id: number; name: string; seo_url?: string }>;
  companyPath: string;
  showFinancing: boolean;
  showGallery: boolean;
  showFaq: boolean;
}

export default function CompanyProfileTabs({
  activeTab,
  onTabChange,
  categories = [],
  companyPath,
  showFinancing,
  showGallery,
  showFaq,
}: CompanyProfileTabsProps) {
  const tabs = useMemo(
    () => getCompanyProfileTabs({ showFinancing, showGallery, showFaq }),
    [showFaq, showFinancing, showGallery]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Map(categories.map((category) => [category.id, category])).values()),
    [categories]
  );

  // Mobile begins with the same four actions shown in the product reference.
  // Extra entitlements remain reachable by swiping the tab rail horizontally.
  const mobileTabs = useMemo(() => {
    const primaryIds = ['overview', 'products', 'reviews', 'contact'];
    const primary = primaryIds
      .map((id) => tabs.find((tab) => tab.id === id))
      .filter((tab): tab is (typeof tabs)[number] => Boolean(tab));
    const extra = tabs.filter((tab) => !primaryIds.includes(tab.id));

    return [...primary, ...extra];
  }, [tabs]);

  return (
    <>
      <div
        id="company-profile-tabs"
        className="relative z-30 mt-5 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:hidden"
      >
        <nav aria-label="Seções do perfil da empresa">
          <div className="flex min-w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mobileTabs.map((tab, index) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative flex h-[100px] basis-1/4 shrink-0 snap-start flex-col items-center justify-center gap-2 px-1 text-center transition-colors',
                    index > 0 && 'border-l border-slate-100',
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <tab.icon className="h-6 w-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  <span className="max-w-[82px] text-[11px] font-semibold leading-[1.2]">
                    {tab.label}
                  </span>
                  {isActive ? (
                    <span
                      className="absolute bottom-0 h-[3px] w-[62%] rounded-t-full bg-blue-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="relative z-30 mt-5 hidden w-full border-b border-slate-200 bg-transparent md:block">
        <div className="w-full overflow-x-auto md:overflow-visible">
        <nav aria-label="Seções do perfil da empresa">
          <div className="flex h-auto min-w-full justify-start gap-6 text-slate-500">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const trigger = (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'h-14 rounded-none border-b-2 border-transparent px-0 pb-0 pt-1 text-[13px] font-medium shadow-none transition-all duration-200',
                    'text-slate-500 hover:bg-transparent hover:text-slate-900',
                    isActive && 'border-blue-700 bg-transparent text-slate-950 shadow-none font-bold'
                  )}
                >
                  <tab.icon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.id === 'products' && uniqueCategories.length > 0 && (
                    <ChevronDown
                      className="ml-1 h-4 w-4 shrink-0 transition-transform group-hover:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );

              if (tab.id !== 'products' || uniqueCategories.length === 0) return trigger;

              return (
                <div key={tab.id} className="group relative" role="presentation">
                  {trigger}
                  <div className="invisible absolute left-0 top-[calc(100%-1px)] z-50 hidden w-[340px] border border-slate-300 bg-white p-2 opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 md:block">
                    <p className="border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
                      Categorias da empresa
                    </p>
                    <ul className="py-1" aria-label="Categorias de produtos e serviços da empresa">
                      {uniqueCategories.map((category) => (
                        <li key={category.id}>
                          <Link
                            href={`${companyPath}/categories/${category.seo_url || category.id}`}
                            className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B1F4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                          >
                            <Image
                              src={getCategoryIcon(category)}
                              alt=""
                              width={20}
                              height={20}
                              aria-hidden="true"
                              className="h-5 w-5 shrink-0"
                            />
                            <span>{category.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
      </div>
    </>
  );
}

const ICON_BASE = '/assets/avalia-solar-icon-pack';

function getCategoryIcon(category: { name: string; seo_url?: string }) {
  const value = `${category.seo_url || ''} ${category.name}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (value.includes('utility') || value.includes('usina')) return `${ICON_BASE}/utility-scale.svg`;
  if (value.includes('software') || value.includes('acessor'))
    return `${ICON_BASE}/software-acessorios.svg`;
  if (value.includes('carregador') || value.includes('veicular'))
    return `${ICON_BASE}/carregador-veicular.svg`;
  if (value.includes('bateria')) return `${ICON_BASE}/baterias.svg`;
  if (
    value.includes('armazenamento') &&
    (value.includes('comercial') || value.includes('industrial'))
  ) {
    return `${ICON_BASE}/armazenamento-comercial-industrial.svg`;
  }
  if (value.includes('armazenamento')) return `${ICON_BASE}/armazenamento-residencial.svg`;
  if (value.includes('comercial') || value.includes('industrial')) {
    return `${ICON_BASE}/solucoes-comerciais-industriais.svg`;
  }
  return `${ICON_BASE}/solucoes-residenciais.svg`;
}
