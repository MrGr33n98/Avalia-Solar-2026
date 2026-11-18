'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getCompanyProfileTabs } from './companyProfileTabsConfig';
import { trackCompanyProfileCategoryDropdownOpened, trackCompanyProfileCategorySelected } from '@/lib/analytics/company-category';
import { CategoryMotionIcon } from '@/components/categories/CategoryMotionIcon';
import { CompanyCompactChip } from './CompanyCompactChip';

interface CompanyProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  categories?: Array<{ id: number; name: string; seo_url?: string }>;
  companyPath: string;
  companyName: string;
  companyId: number;
  showFinancing: boolean;
  showGallery: boolean;
  showFaq: boolean;
}

export default function CompanyProfileTabs({
  activeTab,
  onTabChange,
  categories = [],
  companyPath,
  companyName,
  companyId,
  showFinancing,
  showGallery,
  showFaq,
}: CompanyProfileTabsProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const tabs = useMemo(
    () => getCompanyProfileTabs({ showFinancing, showGallery, showFaq }),
    [showFaq, showFinancing, showGallery]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Map(categories.map((category) => [category.id, category])).values()),
    [categories]
  );

  const hasProductMenu = uniqueCategories.length > 0;

  const handleTabClick = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  const handleCategoryClick = useCallback(
    (category: { id: number; name: string }) => {
      trackCompanyProfileCategorySelected({
        company_id: companyId,
        company_name: companyName,
        category_id: category.id,
        category_name: category.name,
      });
    },
    [companyId, companyName]
  );

  // Prioritize the four reference tabs when entitled; other optional tabs remain scroll-accessible.
  const mobileTabs = useMemo(() => {
    const primaryIds = ['overview', 'products', 'reviews', 'projects', 'faq'];
    const primary = primaryIds
      .map((id) => tabs.find((tab) => tab.id === id))
      .filter((tab): tab is (typeof tabs)[number] => Boolean(tab));
    // Contact stays available in the profile content/sidebar; omit only its mobile tab.
    const extra = tabs.filter((tab) => tab.id !== 'contact' && !primaryIds.includes(tab.id));

    return [...primary, ...extra];
  }, [tabs]);

  const mobileRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the selected tab in view without scrolling the document horizontally.
    const rail = mobileRailRef.current;
    const scroller = rail?.parentElement;
    const selected = rail?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
    if (!scroller || !selected) return;

    const left = selected.offsetLeft;
    const right = left + selected.offsetWidth;
    if (left < scroller.scrollLeft) {
      scroller.scrollLeft = left;
    } else if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = right - scroller.clientWidth;
    }
  }, [activeTab, mobileTabs]);

  const renderMobileTab = (tab: (typeof mobileTabs)[number]) => {
    const isActive = activeTab === tab.id;
    const tabHasMenu = tab.id === 'products' && hasProductMenu;
    const shortLabel = tab.id === 'products' ? 'Produtos' : tab.id === 'faq' ? 'FAQ' : tab.label;

    return (
      <CompanyCompactChip
        key={tab.id}
        selected={isActive}
        density="tab"
        role="tab"
        aria-label={tab.label}
        aria-selected={isActive}
        aria-controls={`company-tab-panel-${tab.id}`}
        aria-haspopup={tabHasMenu ? 'dialog' : undefined}
        aria-expanded={tabHasMenu ? mobileSheetOpen : undefined}
        onClick={() => {
          handleTabClick(tab.id);
          if (tabHasMenu) {
            setMobileSheetOpen(true);
            trackCompanyProfileCategoryDropdownOpened({ company_id: companyId, company_name: companyName });
          }
        }}
      >
        <tab.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span data-testid="company-mobile-tab-label" className="whitespace-nowrap [overflow-wrap:normal] [hyphens:none]">
          {shortLabel}
        </span>
        {tabHasMenu && <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />}
      </CompanyCompactChip>
    );
  };

  return (
    <>
      {/* Mobile/PWA: one unbroken horizontal rail, preserving every entitled destination. */}
      <div id="company-profile-tabs" className="relative z-30 mt-2 w-full min-w-0 max-w-full md:hidden">
        <div className="rounded-xl border border-slate-200/90 bg-white px-1.5 py-1 shadow-xs">
          <nav
            aria-label="Seções do perfil da empresa"
            tabIndex={0}
            className="w-full max-w-full snap-x snap-proximity overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none]"
          >
            <div
              ref={mobileRailRef}
              role="tablist"
              aria-orientation="horizontal"
              aria-label="Seções da empresa"
              data-testid="company-mobile-tablist"
              className="relative flex w-max min-w-full flex-nowrap items-center gap-1"
            >
              {mobileTabs.map((tab) => renderMobileTab(tab))}
            </div>
          </nav>
        </div>

        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader className="text-left">
              <SheetTitle className="text-base font-bold text-[#0B1F4B]">
                Categorias da empresa
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="Categorias de produtos e serviços da empresa" className="mt-4">
              <ul className="grid gap-1">
                {uniqueCategories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`${companyPath}/categories/${category.seo_url || category.id}`}
                      onClick={() => {
                        handleCategoryClick(category);
                        setMobileSheetOpen(false);
                      }}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B1F4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                    >
                      <CategoryMotionIcon
                        slug={category.seo_url}
                        name={category.name}
                        size={20}
                        motionMode="interactive"
                        className="h-5 w-5 shrink-0"
                      />
                      <span>{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop tabs */}
      <div className="relative z-30 mt-2 md:mt-3 hidden w-full border-b border-slate-200 bg-transparent md:block">
        <div className="w-full overflow-x-auto md:overflow-visible">
          <nav aria-label="Seções do perfil da empresa">
            <div className="flex h-auto min-w-full justify-start gap-6 lg:gap-8 text-slate-500">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isProductsTab = tab.id === 'products';
                const tabHasMenu = isProductsTab && hasProductMenu;

                if (!tabHasMenu) {
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`company-tab-panel-${tab.id}`}
                      onClick={() => handleTabClick(tab.id)}
                      className={cn(
                        'inline-flex h-11 md:h-12 items-center whitespace-nowrap rounded-none border-b-2 border-transparent px-0 pb-0 pt-0.5 text-xs sm:text-sm font-semibold shadow-none transition-all duration-200',
                        'text-slate-600 hover:bg-transparent hover:text-slate-950',
                        isActive && 'border-blue-700 bg-transparent text-blue-700 shadow-none font-bold'
                      )}
                    >
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                }

                return (
                  <DropdownMenu.Root
                    key={tab.id}
                    onOpenChange={(open) => {
                      if (open) {
                        trackCompanyProfileCategoryDropdownOpened({
                          company_id: companyId,
                          company_name: companyName,
                        });
                      }
                    }}
                  >
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`company-tab-panel-${tab.id}`}
                        className={cn(
                          'inline-flex h-11 md:h-12 items-center whitespace-nowrap rounded-none border-b-2 border-transparent px-0 pb-0 pt-0.5 text-xs sm:text-sm font-semibold shadow-none transition-all duration-200',
                          'text-slate-600 hover:bg-transparent hover:text-slate-950',
                          isActive && 'border-blue-700 bg-transparent text-blue-700 shadow-none font-bold'
                        )}
                      >
                        <span className="whitespace-nowrap">{tab.label}</span>
                        <ChevronDown
                          className="ml-1 h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180 text-slate-400"
                          aria-hidden="true"
                        />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="start"
                        sideOffset={8}
                        className="z-50 w-[340px] rounded-md border border-slate-300 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                      >
                        <p className="border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
                          Categorias da empresa
                        </p>
                        <ul className="py-1" aria-label="Categorias de produtos e serviços da empresa">
                          {uniqueCategories.map((category) => (
                            <li key={category.id}>
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`${companyPath}/categories/${category.seo_url || category.id}`}
                                  onClick={() => handleCategoryClick(category)}
                                  className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 hover:text-[#0B1F4B] focus-visible:bg-slate-50 focus-visible:text-[#0B1F4B]"
                                >
                                  <CategoryMotionIcon
                                    slug={category.seo_url}
                                    name={category.name}
                                    size={20}
                                    motionMode="interactive"
                                    className="h-5 w-5 shrink-0"
                                  />
                                  <span>{category.name}</span>
                                </Link>
                              </DropdownMenu.Item>
                            </li>
                          ))}
                        </ul>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
