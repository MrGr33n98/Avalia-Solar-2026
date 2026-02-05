# DiagnÃ³stico Completo - AB0-1 Project
**Gerado em:** 2026-02-04 20:27:49

---

## (Resumo) Resumo Executivo

### Frontend (AB0-1-front)
- **Status:** [OK] Pasta encontrada
- **Arquivos JavaScript/TypeScript:** 546 arquivos (67370 linhas)
- **Arquivos CSS/SCSS:** 6 arquivos (8128 linhas)
- **Arquivos HTML/Vue:** 1 arquivos (85 linhas)
- **Package.json:** [OK] Presente
**Framework/Biblioteca Principal:** @heroicons/react, @hookform/resolvers, @radix-ui/react-accordion, @radix-ui/react-alert-dialog, @radix-ui/react-aspect-ratio, @radix-ui/react-avatar, @radix-ui/react-checkbox, @radix-ui/react-collapsible, @radix-ui/react-context-menu, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-hover-card, @radix-ui/react-label, @radix-ui/react-menubar, @radix-ui/react-navigation-menu, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slider, @radix-ui/react-slot, @radix-ui/react-switch, @radix-ui/react-tabs, @radix-ui/react-toast, @radix-ui/react-toggle, @radix-ui/react-toggle-group, @radix-ui/react-tooltip, @rails/actioncable, @sentry/nextjs, @tanstack/react-query, @tanstack/react-table, @types/node, @types/react, @types/react-dom, autoprefixer, axios, better-auth, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-autoplay, embla-carousel-react, framer-motion, html-to-image, input-otp, lucide-react, mixpanel-browser, next, next-themes, postcss, prop-types, react, react-day-picker, react-dom, react-hook-form, react-resizable-panels, recharts, sonner, tailwind-merge, tailwindcss, tailwindcss-animate, typescript, vaul, zod


### Backend (AB0-1-back)
- **Status:** [OK] Pasta encontrada
- **Arquivos Python:** 0 arquivos (0 linhas)
- **Arquivos JavaScript/TypeScript:** 10 arquivos (655 linhas)
- **Arquivos Ruby:** 3505 arquivos (94469 linhas)
- **Package.json:** [X] Ausente
- **requirements.txt:** [X] Ausente
- **Gemfile:** [OK] Presente

---

## ðŸ“ Estrutura de DiretÃ³rios

### Frontend (AB0-1-front)
```
AB0-1-front/
|--- .bolt
|   |--- config.json
|   |--- ignore
|   +--- prompt
|--- .github
|   +--- workflows
|       |--- deploy-to-sever.yml
|       |--- frontend.yml
|       +--- test.yml
|--- .swc
|   +--- plugins
|       +--- v7_windows_x86_64_0.106.15
|--- app
|   |--- (auth)
|   |   +--- components
|   |       |--- AuthBenefits.tsx
|   |       |--- AuthModal.tsx
|   |       |--- LoginTab.tsx
|   |       |--- RegisterCompanyTab.tsx
|   |       +--- RegisterUserTab.tsx
|   |--- about
|   |   +--- page.tsx
|   |--- admin
|   |   |--- categories
|   |   |   +--- page.tsx
|   |   +--- categories.rb
|   |--- api
|   |   |--- auth
|   |   |   +--- [...betterauth]
|   |   +--- health
|   |       +--- route.ts
|   |--- api-docs
|   |   +--- page.tsx
|   |--- banner-studio
|   |   +--- page.tsx
|   |--- blog
|   |   |--- [slug]
|   |   +--- page.tsx
|   |--- careers
|   |   +--- page.tsx
|   |--- categories
|   |   |--- [slug]
|   |   |--- CategoriesClient.tsx
|   |   |--- CategoriesList.tsx
|   |   |--- CategoryContext.tsx
|   |   |--- error.tsx
|   |   |--- layout.tsx
|   |   +--- page.tsx
|   |--- companies
|   |   |--- [id]
|   |   +--- page.tsx
|   |--- company-dashboard
|   |   +--- page.tsx
|   |--- compare
|   |   +--- page.tsx
|   |--- confirm-email
|   |   |--- [token]
|   |   +--- page.tsx
|   |--- contact
|   |   +--- page.tsx
|   |--- context7
|   |   +--- provider.tsx
|   |--- cookies
|   |   +--- page.tsx
|   |--- dashboard
|   |   |--- company
|   |   |   +--- page.tsx
|   |   |--- components
|   |   |   |--- AdvancedAnalytics.tsx
|   |   |   |--- AdvancedAnalyticsIntegrated.tsx
|   |   |   |--- AnalyticsSettings.tsx
|   |   |   |--- ApprovalsPanel.tsx
|   |   |   |--- AzureOverview.tsx
|   |   |   |--- BacklinksButtonManager.tsx
|   |   |   |--- BannersSponsorship.tsx
|   |   |   |--- CampaignsMarketing.tsx
|   |   |   |--- CategoriesManagement.tsx
|   |   |   |--- CommandMenu.tsx
|   |   |   |--- CompanyDashboardRefactored.tsx
|   |   |   |--- CompanyInfo.tsx
|   |   |   |--- CompanyInfoRefactored.tsx
|   |   |   |--- CompanySettings.tsx
|   |   |   |--- CompetitorBenchmark.tsx
|   |   |   |--- DashboardHeader.tsx
|   |   |   |--- DashboardSidebar.tsx
|   |   |   |--- EnterpriseDashboard.tsx
|   |   |   |--- EnterpriseHeader.tsx
|   |   |   |--- EnterpriseMetricCard.tsx
|   |   |   |--- EnterpriseSidebar.tsx
|   |   |   |--- LeadsOpportunities.tsx
|   |   |   |--- LeadsOpportunitiesRefactored.tsx
|   |   |   |--- MediaGallery.tsx
|   |   |   |--- MetricCard.tsx
|   |   |   |--- OverviewTab.tsx
|   |   |   |--- PerformanceMetrics.tsx
|   |   |   |--- PremiumBannerManagement.tsx
|   |   |   |--- ProductsManagement.tsx
|   |   |   |--- RealtimeDashboard.tsx
|   |   |   |--- RealtimeKPICard.tsx
|   |   |   |--- ReviewsAnalytics.tsx
|   |   |   |--- ReviewsManagement.tsx
|   |   |   |--- ReviewsManagementRefactored.tsx
|   |   |   |--- StatsCard.tsx
|   |   |   |--- StyleAnalysis.tsx
|   |   |   +--- ThemeToggle.tsx
|   |   |--- hooks
|   |   |   |--- index.ts
|   |   |   |--- useCategories.ts
|   |   |   |--- useCompanyDashboard.ts
|   |   |   |--- useCompanyDashboardData.ts
|   |   |   +--- useProducts.ts
|   |   |--- reviewer
|   |   |   +--- page.tsx
|   |   |--- types
|   |   |   +--- index.ts
|   |   |--- utils
|   |   |   |--- index.ts
|   |   |   +--- validation.ts
|   |   |--- company-dashboard.tsx
|   |   |--- error.tsx
|   |   |--- page-new.tsx
|   |   |--- page.tsx
|   |   +--- README.md
|   |--- dmca
|   |   +--- page.tsx
|   |--- forgot-password
|   |   +--- page.tsx
|   |--- healthz
|   |   +--- route.ts
|   |--- help
|   |   +--- page.tsx
|   |--- lib
|   |   +--- cable.ts
|   |--- login
|   |   |--- LoginPageContent.tsx
|   |   |--- page-wrapper.tsx
|   |   +--- page.tsx
|   |--- logout
|   |   +--- page.tsx
|   |--- models
|   |   +--- category.rb
|   |--- plans
|   |   +--- page.tsx
|   |--- press
|   |   +--- page.tsx
|   |--- privacy
|   |   +--- page.tsx
|   |--- products
|   |   |--- compare
|   |   |   +--- page.tsx
|   |   |--- [slug]
|   |   |--- error.tsx
|   |   +--- page.tsx
|   |--- profile
|   |   +--- page.tsx
|   |--- rating-stars
|   |   +--- page.tsx
|   |--- register
|   |   |--- CompanyRegisterForm.tsx
|   |   |--- page.tsx
|   |   |--- RegisterBenefits.tsx
|   |   |--- RegisterModal.tsx
|   |   +--- RegisterSuccess.tsx
|   |--- register-company
|   |--- register-user
|   |   +--- page.tsx
|   |--- reset-password
|   |   |--- [token]
|   |   +--- page.tsx
|   |--- review-dashboard
|   |   |--- components
|   |   |   |--- ActivityChart.tsx
|   |   |   |--- KpiCards.tsx
|   |   |   |--- QuickActionsPanel.tsx
|   |   |   |--- QuotesPanel.tsx
|   |   |   +--- ReviewsList.tsx
|   |   +--- page.tsx
|   |--- reviews
|   |   +--- my
|   |       +--- page.tsx
|   |--- search
|   |   +--- page.tsx
|   |--- select-company
|   |   +--- page.tsx
|   |--- signup
|   |   +--- page.tsx
|   |--- status
|   |   +--- page.tsx
|   |--- terms
|   |   +--- page.tsx
|   |--- test-images
|   |   +--- page.tsx
|   |--- __tests__
|   |   +--- home-banner.test.tsx
|   |--- error.tsx
|   |--- global-error.tsx
|   |--- globals.css
|   |--- layout.tsx
|   |--- page.tsx
|   +--- robots.ts
|--- codebase
|   +--- shadcn-nextjs-boilerplate-main
|       |--- app
|       |   |--- api
|       |   |   |--- chatAPI
|       |   |   |   +--- route.ts
|       |   |   |--- essayAPI
|       |   |   |   +--- route.ts
|       |   |   +--- webhooks
|       |   |       +--- route.ts
|       |   |--- auth
|       |   |   |--- callback
|       |   |   |   +--- route.ts
|       |   |   +--- reset_password
|       |   |       +--- route.ts
|       |   |--- dashboard
|       |   |   |--- ai-chat
|       |   |   |   +--- page.tsx
|       |   |   |--- main
|       |   |   |   +--- page.tsx
|       |   |   |--- settings
|       |   |   |   +--- page.tsx
|       |   |   |--- signin
|       |   |   |   |--- [id]
|       |   |   |   +--- page.tsx
|       |   |   +--- page.tsx
|       |   |--- layout.tsx
|       |   |--- page.tsx
|       |   |--- supabase-provider.tsx
|       |   |--- supabase-server.ts
|       |   +--- theme-provider.tsx
|       |--- components
|       |   |--- auth
|       |   |   |--- AuthUI.tsx
|       |   |   +--- index.tsx
|       |   |--- auth-ui
|       |   |   |--- EmailSignIn.tsx
|       |   |   |--- ForgotPassword.tsx
|       |   |   |--- OauthSignIn.tsx
|       |   |   |--- PasswordSignIn.tsx
|       |   |   |--- Separator.tsx
|       |   |   |--- Signup.tsx
|       |   |   +--- UpdatePassword.tsx
|       |   |--- card
|       |   |   +--- CardMenu.tsx
|       |   |--- charts
|       |   |   +--- LineChart
|       |   |       +--- index.tsx
|       |   |--- dashboard
|       |   |   |--- ai-chat
|       |   |   |   +--- index.tsx
|       |   |   |--- main
|       |   |   |   |--- cards
|       |   |   |   |   |--- MainChart.tsx
|       |   |   |   |   +--- MainDashboardTable.tsx
|       |   |   |   +--- index.tsx
|       |   |   +--- settings
|       |   |       |--- components
|       |   |       |   +--- notification-settings.tsx
|       |   |       +--- index.tsx
|       |   |--- footer
|       |   |   |--- FooterAdmin.tsx
|       |   |   +--- FooterAuthDefault.tsx
|       |   |--- hooks
|       |   |   +--- use-toast.ts
|       |   |--- layout
|       |   |   |--- index.tsx
|       |   |   +--- innerContent.tsx
|       |   |--- link
|       |   |   +--- NavLink.tsx
|       |   |--- navbar
|       |   |   |--- NavbarAdmin.tsx
|       |   |   +--- NavbarLinksAdmin.tsx
|       |   |--- notification
|       |   |   +--- index.tsx
|       |   |--- scrollbar
|       |   |   +--- Scrollbar.tsx
|       |   |--- sidebar
|       |   |   |--- components
|       |   |   |   |--- Links.tsx
|       |   |   |   +--- SidebarCard.tsx
|       |   |   +--- Sidebar.tsx
|       |   |--- MessageBox.tsx
|       |   |--- MessageBoxChat.tsx
|       |   |--- routes.tsx
|       |   +--- TextBlock.tsx
|       |--- contexts
|       |   +--- layout.ts
|       |--- fixtures
|       |   +--- stripe-fixtures.json
|       |--- hooks
|       |   |--- use-mobile.tsx
|       |   +--- use-toast.ts
|       |--- lib
|       |   +--- utils.ts
|       |--- public
|       |   |--- img
|       |   |   |--- dark
|       |   |   |   +--- ai-chat
|       |   |   |       +--- bg-image.png
|       |   |   |--- light
|       |   |   |   +--- ai-chat
|       |   |   |       +--- bg-image.png
|       |   |   +--- favicon.ico
|       |   |--- Modal.png
|       |   |--- robots.txt
|       |   +--- SidebarBadge.png
|       |--- styles
|       |   |--- chrome-bug.css
|       |   |--- globals.css
|       |   +--- output.css
|       |--- supabase
|       |   |--- .gitignore
|       |   +--- config.toml.example
|       |--- types
|       |   |--- supabase.ts
|       |   |--- types.ts
|       |   +--- types_db.ts
|       |--- utils
|       |   |--- auth-helpers
|       |   |   |--- client.ts
|       |   |   |--- server.ts
|       |   |   +--- settings.ts
|       |   |--- streams
|       |   |   |--- chatStream.ts
|       |   |   +--- essayStream.ts
|       |   |--- stripe
|       |   |   |--- client.ts
|       |   |   +--- config.ts
|       |   |--- chatStream.ts
|       |   |--- cn.ts
|       |   |--- cookies.ts
|       |   |--- helpers.ts
|       |   |--- navigation.tsx
|       |   +--- supabase-admin.ts
|       |--- variables
|       |   |--- charts.ts
|       |   |--- tableDataInvoice.ts
|       |   +--- tableDataUserReports.ts
|       |--- .env.local.example
|       |--- .eslintrc
|       |--- .eslintrc.json
|       |--- .gitignore
|       |--- .npmignore
|       |--- .npmrc
|       |--- CHANGELOG.md
|       |--- components.json
|       |--- jsconfig.json
|       |--- LICENSE
|       |--- middleware.ts
|       |--- next.config.js
|       |--- package.json
|       |--- postcss.config.js
|       |--- prettier.config.js
|       |--- README.md
|       |--- schema.sql
|       |--- tailwind.config.ts
|       +--- tsconfig.json
|--- components
|   |--- admin
|   |   +--- CategoryImporter.tsx
|   |--- blog
|   |   |--- AuthorBio.tsx
|   |   |--- AuthorCardWithStats.tsx
|   |   |--- BlogFiltersBar.tsx
|   |   |--- BlogHero.tsx
|   |   |--- BlogPromoBanner.tsx
|   |   |--- BlogSidebar.tsx
|   |   |--- BlogTimeTracker.tsx
|   |   |--- CategoryFilter.tsx
|   |   |--- CategoryHighlights.tsx
|   |   |--- ChecklistCard.tsx
|   |   |--- EnergyCalculator.tsx
|   |   |--- FeaturedPostsSection.tsx
|   |   |--- PostAuthorCard.tsx
|   |   |--- PostCard.tsx
|   |   |--- PostHeader.tsx
|   |   |--- PostSidebar.tsx
|   |   |--- PostTOC.tsx
|   |   |--- ReadingProgress.tsx
|   |   |--- RelatedPosts.tsx
|   |   |--- RelatedPostsGrid.tsx
|   |   |--- ShareButtons.tsx
|   |   |--- StickyMobileCTA.tsx
|   |   +--- VerifiedCompaniesMiniList.tsx
|   |--- categories
|   |   |--- BannerCarousel.tsx
|   |   |--- CategoriesGrid.tsx
|   |   |--- CategoriesHero.tsx
|   |   |--- CategoriesMegaMenu.tsx
|   |   |--- CategoryColumn.tsx
|   |   +--- CategorySearch.tsx
|   |--- company
|   |   |--- CompanySelectorModal.tsx
|   |   +--- CompanySwitcher.tsx
|   |--- filters
|   |   |--- ActiveFiltersSummary.tsx
|   |   |--- CategoryFilter.tsx
|   |   |--- FilterSidebar.tsx
|   |   |--- hooks.ts
|   |   |--- LocationFilter.tsx
|   |   |--- QualityFilters.tsx
|   |   |--- query.ts
|   |   |--- RatingFilter.tsx
|   |   |--- SortFilter.tsx
|   |   +--- types.ts
|   |--- landing
|   |   |--- HowItWorks.tsx
|   |   |--- LandingCategoryCard.tsx
|   |   |--- LandingCategoryChips.tsx
|   |   |--- LandingHero.tsx
|   |   |--- LandingHeroBanner.tsx
|   |   |--- LandingTrustBanner.tsx
|   |   +--- SavingsCalculator.tsx
|   |--- navigation
|   |   |--- CategoryColumn.tsx
|   |   |--- MegaMenuCategories.tsx
|   |   +--- MobileCategoriesDrawer.tsx
|   |--- products
|   |   |--- FeaturedCompaniesStrip.tsx
|   |   |--- ProductQuickView.tsx
|   |   |--- ProductsFilters.tsx
|   |   +--- ProductsHeader.tsx
|   |--- ui
|   |   |--- accordion.tsx
|   |   |--- alert-dialog.tsx
|   |   |--- alert.tsx
|   |   |--- aspect-ratio.tsx
|   |   |--- avatar.tsx
|   |   |--- badge.tsx
|   |   |--- breadcrumb.tsx
|   |   |--- button.tsx
|   |   |--- calendar.tsx
|   |   |--- card.tsx
|   |   |--- carousel.tsx
|   |   |--- chart.tsx
|   |   |--- checkbox.tsx
|   |   |--- collapsible.tsx
|   |   |--- command.tsx
|   |   |--- context-menu.tsx
|   |   |--- CTAPrimaryButton.tsx
|   |   |--- data-table.tsx
|   |   |--- dialog.tsx
|   |   |--- drawer.tsx
|   |   |--- dropdown-menu.tsx
|   |   |--- form.tsx
|   |   |--- hover-card.tsx
|   |   |--- input-otp.tsx
|   |   |--- input.tsx
|   |   |--- label.tsx
|   |   |--- menubar.tsx
|   |   |--- navigation-menu.tsx
|   |   |--- NPSDetailedCard.tsx
|   |   |--- OnboardingIncentive.tsx
|   |   |--- OpportunitiesCard.tsx
|   |   |--- optimized-image.tsx
|   |   |--- pagination.tsx
|   |   |--- popover.tsx
|   |   |--- progress.tsx
|   |   |--- radio-group.tsx
|   |   |--- RankingTable.tsx
|   |   |--- resizable.tsx
|   |   |--- scroll-area.tsx
|   |   |--- select.tsx
|   |   |--- separator.tsx
|   |   |--- sheet.tsx
|   |   |--- skeleton.tsx
|   |   |--- slider.tsx
|   |   |--- sonner.tsx
|   |   |--- sponsorcarousel.tsx
|   |   |--- switch.tsx
|   |   |--- table.tsx
|   |   |--- tabs.tsx
|   |   +--- textarea.tsx
|   |--- __tests__
|   |   |--- CategoryCard.test.tsx
|   |   |--- CompanyCard.test.tsx
|   |   +--- CompanyCardCarousel.test.tsx
|   |--- AdvancedCarousel.tsx
|   |--- AppBreadcrumb.tsx
|   |--- ArticleBanner.tsx
|   |--- ArticleConversionSection.tsx
|   |--- AuthorAvatarFloating.tsx
|   |--- Banner.tsx
|   |--- BannerByLocation.tsx
|   |--- BannerCarousel.tsx
|   |--- BannerContainer.tsx
|   |--- BannerPlaceholder.tsx
|   |--- BlogCard.tsx
|   |--- BreadcrumbJsonLd.tsx
|   |--- CategoriesIndex.tsx
|   |--- CategoriesIndexV2.tsx
|   |--- CategoriesIndexWithSidebar.tsx
|   |--- CategoryBanner.tsx
|   |--- CategoryCard.module.css
|   |--- CategoryCard.tsx
|   |--- CategoryCardFeatured.tsx
|   |--- CategoryCardMinimal.tsx
|   |--- CategoryDropdown.tsx
|   |--- CategoryDropdownItem.tsx
|   |--- ClientBody.tsx
|   |--- ClientOnly.tsx
|   |--- CompaniesFiltersSheet.tsx
|   |--- CompaniesResultsBar.tsx
|   |--- CompaniesSidebarFilters.tsx
|   |--- CompanyCard.module.css
|   |--- CompanyCard.test.tsx
|   |--- CompanyCard.tsx
|   |--- CompanyCardCarousel.tsx
|   |--- ComparisonFloatingBar.tsx
|   |--- CookieConsent.tsx
|   |--- DashboardStats.tsx
|   |--- error-boundary.tsx
|   |--- error-test-button.tsx
|   |--- ErrorBoundary.tsx
|   |--- FloatingWhatsApp.tsx
|   |--- Footer.tsx
|   +--- GoogleTagManager.tsx
|--- config
|   +--- environments
|       |--- development.rb
|       +--- production.rb
|--- context
|   +--- CompanyContext.tsx
|--- contexts
|   |--- AnalyticsContext.tsx
|   +--- AuthContext.tsx
|--- cypress
|   +--- e2e
|       |--- company-card.spec.ts
|       +--- registration_spec.cy.ts
|--- docs
|   |--- financing_company_detail_docs.md
|   |--- RealtimeDashboard.md
|   +--- select-company-click-fix.md
|--- hooks
|   |--- index.ts
|   |--- use-error-handler.ts
|   |--- use-toast.ts
|   |--- useAuth.ts
|   |--- useAutoLocalization.ts
|   |--- useBannerGlobal.ts
|   |--- useBanners.ts
|   |--- useBannersQuery.ts
|   |--- useCategories.ts
|   |--- useCategoriesQuery.ts
|   |--- useCategoriesTree.ts
|   |--- useCategory.ts
|   |--- useCategoryByIdOrSlug.ts
|   |--- useCompanies.ts
|   |--- useCompaniesSafe.ts
|   |--- useComparison.ts
|   |--- useDashboard.ts
|   |--- useDebounce.ts
|   |--- useFavorites.ts
|   |--- useLocationData.ts
|   |--- usePageTracking.ts
|   |--- useProduct.ts
|   |--- useProducts.ts
|   |--- useReviews.ts
|   |--- useSearch.ts
|   +--- useUtm.ts
|--- lib
|   |--- analytics
|   |   |--- consent.ts
|   |   |--- cookies.ts
|   |   |--- dedupe.ts
|   |   |--- ga4.ts
|   |   |--- gtag.ts
|   |   |--- index.ts
|   |   |--- session.ts
|   |   |--- types.ts
|   |   +--- utm.ts
|   |--- api
|   |   +--- blog.ts
|   |--- __tests__
|   |   +--- utils.test.ts
|   |--- api-analytics.ts
|   |--- api-check.ts
|   |--- api-client.ts
|   |--- api-config.ts
|   |--- api-error.ts
|   |--- api-faq.ts
|   |--- api.ts
|   |--- authClient.ts
|   |--- betterAuthClient.ts
|   |--- cable.ts
|   |--- color-analyzer.ts
|   |--- content-fixer.ts
|   |--- dataLayer.ts
|   |--- error-handler.ts
|   |--- financing.ts
|   |--- index.ts
|   |--- lead-engine.ts
|   |--- QueryProvider.tsx
|   |--- quote-wizard.ts
|   |--- slug.ts
|   +--- utils.ts
|--- playwright-report
|   |--- data
|   |   |--- 976a96de64efae710ea26f41abeed77ad4d84761.md
|   |   +--- cdd2946a78183e97341b2c2f8f9eedbd993a9970.md
|   +--- index.html
|--- public
|   |--- images
|   |   |--- avalia-solar-place-holder.PNG
|   |   |--- banner-avalia-solar.png
|   |   |--- banner-landing-page-avalia-solar.jpg
|   |   |--- banner-placeholder.svg
|   |   |--- category-placeholder.jpg
|   |   |--- category-placeholder.svg
|   |   |--- compare-solar-v1.png
|   |   |--- default-banner.jpg
|   |   |--- default-banner.svg
|   |   |--- default-logo.svg
|   |   |--- favicon.ico
|   |   |--- felipe-ceo-avalia-solar.png
|   |   |--- herro-banner-avalia-solar.png
|   |   |--- image.png
|   |   |--- logo-placeholder.svg
|   |   |--- logo.png
|   |   |--- product-placeholder.jpg
|   |   +--- product-placeholder.svg
|   +--- favicon.ico
|--- script
|   |--- local-deploy.sh
|   +--- postbuild-copy-static.js
|--- test-results
|   |--- review-dashboard-Review-Da-4c01e-rized-access-by-redirecting-firefox
|   |   +--- error-context.md
|   |--- review-dashboard-Review-Da-4c01e-rized-access-by-redirecting-webkit
|   |   +--- error-context.md
|   +--- .last-run.json
|--- tests
|   |--- e2e
|   |   |--- auth-logout.spec.ts
|   |   +--- financing-wizard.spec.ts
|   |--- auth-flow.spec.ts
|   |--- category-images.spec.ts
|   |--- company-card-logos.spec.ts
|   |--- navbar-categories-menu.spec.ts
|   |--- quote-wizard-layering.spec.ts
|   |--- redirection-loop.spec.ts
|   |--- review-dashboard.spec.ts
|   |--- weg-employee-flow.spec.ts
|   +--- whatsapp-button.spec.ts
|--- types
|   |--- article.ts
|   |--- css-modules.d.ts
|   |--- index.ts
|   +--- rails__actioncable.d.ts
|--- utils
|   |--- address.ts
|   |--- categories.ts
|   +--- image.ts
|--- __tests__
|   |--- app
|   |   +--- companies
|   |       +--- page.test.tsx
|   |--- components
|   |   |--- blog
|   |   |   +--- BlogFiltersBar.test.tsx
|   |   |--- AnalyticsIntegration.test.tsx
|   |   |--- BlogAnalytics.test.tsx
|   |   |--- CategoryCard.test.tsx
|   |   |--- CompanyCard.test.tsx
|   |   |--- CompanyCardRating.test.tsx
|   |   |--- CompanyFinancing.test.tsx
|   |   |--- Footer.test.tsx
|   |   |--- Header.test.tsx
|   |   |--- Hero.test.tsx
|   |   |--- LocationFilter.test.tsx
|   |   |--- LocationSearch.test.tsx
|   |   |--- media-gallery.test.tsx
|   |   |--- Navbar.test.tsx
|   |   |--- optimized-image.test.tsx
|   |   |--- SearchBar.test.tsx
|   |   +--- StarRating.test.tsx
|   |--- contexts
|   |   +--- AuthContextSync.test.tsx
|   |--- hooks
|   |   |--- useCategories.test.tsx
|   |   |--- useCategoriesQuery.test.tsx
|   |   +--- useProducts.test.tsx
|   |--- lib
|   |   |--- analytics.test.ts
|   |   |--- api-client-leads.test.ts
|   |   |--- api.test.ts
|   |   +--- companiesApiSafeSlug.test.ts
|   |--- navigation
|   |   +--- CategoryNavigation.test.tsx
|   |--- pages
|   |   |--- login.test.tsx
|   |   |--- page.test.tsx
|   |   +--- register.test.tsx
|   |--- blog.test.tsx
|   |--- error-boundary.test.tsx
|   |--- error-handler.test.ts
|   |--- leadModal.test.ts
|   |--- RealtimeKPICard.test.tsx
|   +--- useCompanyDashboard.test.tsx
|--- .dockerignore
|--- .env.example
|--- .env.local
|--- .env.production
|--- .eslintrc.json
|--- .gitignore
|--- CATEGORIES_REFACTOR_DOCS.md
|--- CategoryClientComponent_restore.tsx
|--- components.json
|--- diagnostico-v1.md
|--- fix-null-errors.sh
|--- FIX_PLAYWRIGHT_TESTS.md
|--- gerar-diagnostico.ps1
|--- instrumentation.ts
|--- jest.config.js
|--- jest.setup.js
|--- lighthouse-developers-chrome.json
|--- lighthouse-login.json
|--- lighthouserc.json
|--- middleware.ts
|--- next-env.d.ts
|--- next.config.js
|--- OPTIMIZATION_CHANGES_SUMMARY.md
|--- package-lock.json
|--- package.json
|--- PERFORMANCE_OPTIMIZATION_REPORT.md
|--- playwright.config.ts
|--- PLAYWRIGHT_TESTS_FIXED.md
+--- postcss.config.js

```

### Backend (AB0-1-back)
```
AB0-1-back/
|--- .github
|   +--- workflows
|       |--- deploy-to-server.yml
|       +--- test.yml
|--- app
|   |--- admin
|   |   |--- financing
|   |   |   |--- dashboard.rb
|   |   |   |--- financing_configurations.rb
|   |   |   +--- financing_options.rb
|   |   |--- admin_users.rb
|   |   |--- articles.rb
|   |   |--- badges.rb
|   |   |--- banners.rb
|   |   |--- banner_globals.rb
|   |   |--- banner_offers.rb
|   |   |--- banner_subscriptions.rb
|   |   |--- campaigns.rb
|   |   |--- campaign_reviews.rb
|   |   |--- categories.rb
|   |   |--- companies.rb
|   |   |--- company_access_requests.rb
|   |   |--- company_faqs.rb
|   |   |--- company_financing_offers.rb
|   |   |--- company_financing_partners.rb
|   |   |--- company_financing_profiles.rb
|   |   |--- company_members.rb
|   |   |--- contents.rb
|   |   |--- dashboard.rb
|   |   |--- downloadables.rb
|   |   |--- faqs.rb
|   |   |--- feature_groups.rb
|   |   |--- forum_answers.rb
|   |   |--- forum_questions.rb
|   |   |--- leads.rb
|   |   |--- lead_distributions.rb
|   |   |--- pending_changes.rb
|   |   |--- plans.rb
|   |   |--- pricings.rb
|   |   |--- products.rb
|   |   |--- product_accesses.rb
|   |   |--- reviews.rb
|   |   |--- sponsored_plans.rb
|   |   |--- subscription_plans.rb
|   |   |--- users.rb
|   |   +--- versions.rb
|   |--- assets
|   |   |--- config
|   |   |   +--- manifest.js
|   |   |--- images
|   |   |   |--- .keep
|   |   |   |--- default-banner.jpg
|   |   |   |--- logo.png
|   |   |   +--- logo.svg
|   |   |--- javascripts
|   |   |   |--- admin
|   |   |   |   |--- company_reject_prompt.js
|   |   |   |   +--- location_selector.js
|   |   |   +--- active_admin.js
|   |   +--- stylesheets
|   |       |--- admin
|   |       |   +--- effects.scss
|   |       |--- actiontext.css
|   |       |--- active_admin.scss
|   |       |--- application.css
|   |       +--- corporate.css
|   |--- channels
|   |   |--- application_cable
|   |   |   |--- channel.rb
|   |   |   +--- connection.rb
|   |   +--- company_dashboard_channel.rb
|   |--- controllers
|   |   |--- active_admin
|   |   |   +--- devise
|   |   |--- admin
|   |   |   |--- application_controller.rb
|   |   |   |--- sessions_controller.rb
|   |   |   +--- two_factor_controller.rb
|   |   |--- api
|   |   |   +--- v1
|   |   |       |--- admin
|   |   |       |   |--- base_controller.rb
|   |   |       |   +--- categories_controller.rb
|   |   |       |--- company
|   |   |       |   |--- members_controller.rb
|   |   |       |   +--- pending_changes_controller.rb
|   |   |       |--- company_admin
|   |   |       |   |--- base_controller.rb
|   |   |       |   |--- faqs_controller.rb
|   |   |       |   |--- financing_offers_controller.rb
|   |   |       |   |--- financing_partners_controller.rb
|   |   |       |   +--- financing_profiles_controller.rb
|   |   |       |--- dashboard
|   |   |       |   |--- analytics_controller.rb
|   |   |       |   |--- base_controller.rb
|   |   |       |   |--- companies_controller.rb
|   |   |       |   |--- leads_controller.rb
|   |   |       |   |--- me_controller.rb
|   |   |       |   +--- products_controller.rb
|   |   |       |--- analytics_controller.rb
|   |   |       |--- articles_controller.rb
|   |   |       |--- auth_controller.rb
|   |   |       |--- badges_controller.rb
|   |   |       |--- banners_controller.rb
|   |   |       |--- banner_events_controller.rb
|   |   |       |--- banner_globals_controller.rb
|   |   |       |--- banner_offers_controller.rb
|   |   |       |--- base_controller.rb
|   |   |       |--- campaigns_controller.rb
|   |   |       |--- campaign_reviews_controller.rb
|   |   |       |--- categories_controller.rb
|   |   |       |--- companies_controller.rb
|   |   |       |--- company_access_controller.rb
|   |   |       |--- company_access_requests_controller.rb
|   |   |       |--- company_dashboard_banners_controller.rb
|   |   |       |--- company_dashboard_controller.rb
|   |   |       |--- contents_controller.rb
|   |   |       |--- content_feed_controller.rb
|   |   |       |--- dashboard_controller.rb
|   |   |       |--- dashboard_exports_controller.rb
|   |   |       |--- faqs_controller.rb
|   |   |       |--- feature_groups_controller.rb
|   |   |       |--- financing_options_controller.rb
|   |   |       |--- financing_proposals_controller.rb
|   |   |       |--- forum_answers_controller.rb
|   |   |       |--- forum_questions_controller.rb
|   |   |       |--- leads_controller.rb
|   |   |       |--- payments_webhooks_controller.rb
|   |   |       |--- plans_controller.rb
|   |   |       |--- pricings_controller.rb
|   |   |       |--- products_controller.rb
|   |   |       |--- product_accesss_controller.rb
|   |   |       |--- reviews_controller.rb
|   |   |       |--- review_dashboard_controller.rb
|   |   |       |--- search_controller.rb
|   |   |       |--- sponsored_plans_controller.rb
|   |   |       |--- subscription_plans_controller.rb
|   |   |       +--- users_controller.rb
|   |   |--- concerns
|   |   |   |--- .keep
|   |   |   |--- cacheable.rb
|   |   |   |--- cacheable_actions.rb
|   |   |   |--- jwt_authenticatable.rb
|   |   |   +--- paginatable.rb
|   |   |--- dashboard
|   |   |   |--- access_controller.rb
|   |   |   |--- analytics_controller.rb
|   |   |   |--- base_controller.rb
|   |   |   |--- categories_controller.rb
|   |   |   |--- companies_controller.rb
|   |   |   +--- home_controller.rb
|   |   |--- users
|   |   |   |--- confirmations_controller.rb
|   |   |   |--- omniauth_callbacks_controller.rb
|   |   |   |--- passwords_controller.rb
|   |   |   |--- registrations_controller.rb
|   |   |   |--- sessions_controller.rb
|   |   |   +--- unlocks_controller.rb
|   |   |--- application_controller.rb
|   |   |--- corporate_controller.rb
|   |   |--- health_controller.rb
|   |   |--- pages_controller.rb
|   |   +--- posts_controller.rb
|   |--- helpers
|   |   |--- api
|   |   |   +--- v1
|   |   |       |--- articles_helper.rb
|   |   |       |--- badges_helper.rb
|   |   |       |--- banners_helper.rb
|   |   |       |--- campaigns_helper.rb
|   |   |       |--- campaign_reviews_helper.rb
|   |   |       |--- categorys_helper.rb
|   |   |       |--- companys_helper.rb
|   |   |       |--- contents_helper.rb
|   |   |       |--- feature_groups_helper.rb
|   |   |       |--- forum_answers_helper.rb
|   |   |       |--- forum_questions_helper.rb
|   |   |       |--- leads_helper.rb
|   |   |       |--- plans_helper.rb
|   |   |       |--- pricings_helper.rb
|   |   |       |--- products_helper.rb
|   |   |       |--- product_accesss_helper.rb
|   |   |       |--- reviews_helper.rb
|   |   |       |--- sponsored_plans_helper.rb
|   |   |       |--- subscription_plans_helper.rb
|   |   |       +--- users_helper.rb
|   |   |--- application_helper.rb
|   |   |--- comments_helper.rb
|   |   |--- pages_helper.rb
|   |   |--- posts_helper.rb
|   |   +--- users_helper.rb
|   |--- javascript
|   |   |--- controllers
|   |   |   |--- application.js
|   |   |   |--- comments_controller.js
|   |   |   |--- effect_controller.js
|   |   |   |--- hello_controller.js
|   |   |   +--- index.js
|   |   +--- application.js
|   |--- jobs
|   |   |--- analytics
|   |   |   +--- mixpanel_job.rb
|   |   |--- account_updated_email_job.rb
|   |   |--- admin_alert_email_job.rb
|   |   |--- analytics_daily_aggregation_job.rb
|   |   |--- application_job.rb
|   |   |--- bulk_notification_job.rb
|   |   |--- cache_cleanup_job.rb
|   |   |--- company_monthly_digest_job.rb
|   |   |--- company_new_review_notification_job.rb
|   |   |--- create_notification_job.rb
|   |   |--- daily_digest_job.rb
|   |   |--- email_confirmation_job.rb
|   |   |--- monthly_digest_job.rb
|   |   |--- new_review_notification_job.rb
|   |   |--- notification_email_job.rb
|   |   |--- password_reset_email_job.rb
|   |   |--- session_cleanup_job.rb
|   |   |--- submit_financing_proposal_job.rb
|   |   |--- update_ratings_job.rb
|   |   +--- welcome_email_job.rb
|   |--- mailers
|   |   |--- application_mailer.rb
|   |   |--- company_access_mailer.rb
|   |   |--- company_mailer.rb
|   |   |--- notification_mailer.rb
|   |   |--- review_mailer.rb
|   |   +--- user_mailer.rb
|   |--- models
|   |   |--- concerns
|   |   |   |--- .keep
|   |   |   |--- cacheable.rb
|   |   |   |--- moderation.rb
|   |   |   |--- notifiable.rb
|   |   |   |--- query_cacheable.rb
|   |   |   +--- review_callbacks.rb
|   |   |--- admin_user.rb
|   |   |--- analytics_event.rb
|   |   |--- application_record.rb
|   |   |--- article.rb
|   |   |--- badge.rb
|   |   |--- banner.rb
|   |   |--- banner_daily_stat.rb
|   |   |--- banner_event.rb
|   |   |--- banner_global.rb
|   |   |--- banner_offer.rb
|   |   |--- banner_subscription.rb
|   |   |--- campaign.rb
|   |   |--- campaign_review.rb
|   |   |--- category.rb
|   |   |--- comment.rb
|   |   |--- company.rb
|   |   |--- company_access_request.rb
|   |   |--- company_button.rb
|   |   |--- company_daily_stat.rb
|   |   |--- company_faq.rb
|   |   |--- company_financing_offer.rb
|   |   |--- company_financing_partner.rb
|   |   |--- company_financing_profile.rb
|   |   |--- company_member.rb
|   |   |--- company_video.rb
|   |   |--- content.rb
|   |   |--- downloadable.rb
|   |   |--- faq.rb
|   |   |--- feature_group.rb
|   |   |--- financing_configuration.rb
|   |   |--- financing_option.rb
|   |   |--- forum_answer.rb
|   |   |--- forum_question.rb
|   |   |--- lead.rb
|   |   |--- lead_distribution.rb
|   |   |--- notification.rb
|   |   |--- pending_change.rb
|   |   |--- plan.rb
|   |   |--- post.rb
|   |   |--- pricing.rb
|   |   |--- product.rb
|   |   |--- product_access.rb
|   |   |--- product_price_history.rb
|   |   |--- product_specification.rb
|   |   |--- review.rb
|   |   |--- spec_template.rb
|   |   |--- sponsored_plan.rb
|   |   |--- subscription_plan.rb
|   |   +--- user.rb
|   |--- notifiers
|   |   |--- application_notifier.rb
|   |   |--- comment_notifier.rb
|   |   +--- review_notifier.rb
|   |--- policies
|   |   |--- active_admin
|   |   |   +--- page_policy.rb
|   |   |--- application_policy.rb
|   |   |--- company_faq_policy.rb
|   |   |--- company_financing_offer_policy.rb
|   |   |--- company_financing_partner_policy.rb
|   |   |--- company_financing_profile_policy.rb
|   |   |--- company_policy.rb
|   |   |--- dashboard_policy.rb
|   |   |--- financing_configuration_policy.rb
|   |   |--- financing_option_policy.rb
|   |   |--- pending_change_policy.rb
|   |   |--- review_policy.rb
|   |   +--- user_policy.rb
|   |--- queries
|   |   |--- company_queries.rb
|   |   +--- review_queries.rb
|   |--- serializers
|   |   |--- article_serializer.rb
|   |   |--- badge_serializer.rb
|   |   |--- campaign_review_serializer.rb
|   |   |--- campaign_serializer.rb
|   |   |--- category_serializer.rb
|   |   |--- company_serializer.rb
|   |   |--- content_serializer.rb
|   |   |--- feature_group_serializer.rb
|   |   |--- financing_option_serializer.rb
|   |   |--- forum_answer_serializer.rb
|   |   |--- forum_question_serializer.rb
|   |   |--- lead_serializer.rb
|   |   |--- plan_serializer.rb
|   |   |--- pricing_serializer.rb
|   |   |--- product_access_serializer.rb
|   |   |--- product_serializer.rb
|   |   |--- review_serializer.rb
|   |   |--- sponsored_plan_serializer.rb
|   |   |--- subscription_plan_serializer.rb
|   |   +--- user_serializer.rb
|   |--- services
|   |   |--- analytics
|   |   |   |--- export_service.rb
|   |   |   +--- track_event_service.rb
|   |   |--- avalia_solar
|   |   |   +--- notification
|   |   |       +--- sms_client.rb
|   |   |--- company_dashboard
|   |   |   +--- stats_service.rb
|   |   |--- locations
|   |   |   +--- br_locations.rb
|   |   |--- product_specifications
|   |   |   +--- upsert_service.rb
|   |   |--- spec_templates
|   |   |   +--- enterprise_seed_service.rb
|   |   |--- videos
|   |   |   +--- youtube_extractor.rb
|   |   |--- analytics_export_service.rb
|   |   |--- company_cta_builder.rb
|   |   |--- content_feed_service.rb
|   |   |--- email_service.rb
|   |   |--- financial_gateway_service.rb
|   |   |--- jwt_blacklist_service.rb
|   |   |--- lead_distribution_service.rb
|   |   |--- notification_service.rb
|   |   +--- search_service.rb
|   |--- validators
|   |   |--- phone_validator.rb
|   |   +--- url_validator.rb
|   +--- views
|       |--- active_storage
|       |   +--- blobs
|       |       +--- _blob.html.erb
|       |--- admin
|       |   |--- csv
|       |   |   |--- upload_csv.html.erb
|       |   |   +--- upload_leads_csv.html.erb
|       |   +--- two_factor
|       |       |--- backup_codes.html.erb
|       |       |--- manage.html.erb
|       |       +--- show.html.erb
|       |--- api
|       |   +--- v1
|       |       |--- articles
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- badges
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- campaigns
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- campaign_reviews
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- categorys
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- companys
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- contents
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- feature_groups
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- forum_answers
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- forum_questions
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- leads
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- plans
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- pricings
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- products
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- product_accesss
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- reviews
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- sponsored_plans
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       |--- subscription_plans
|       |       |   |--- create.html.erb
|       |       |   |--- destroy.html.erb
|       |       |   |--- index.html.erb
|       |       |   |--- show.html.erb
|       |       |   +--- update.html.erb
|       |       +--- users
|       |           |--- create.html.erb
|       |           |--- destroy.html.erb
|       |           |--- index.html.erb
|       |           |--- show.html.erb
|       |           +--- update.html.erb
|       |--- company_access_mailer
|       |   |--- access_granted.html.erb
|       |   |--- access_granted.text.erb
|       |   |--- access_rejected.html.erb
|       |   +--- access_rejected.text.erb
|       |--- company_mailer
|       |   +--- new_review.html.erb
|       |--- corporate
|       |   |--- index.html.erb
|       |   +--- login.html.erb
|       |--- dashboard
|       |   |--- access
|       |   |   +--- waiting_approval.html.erb
|       |   |--- analytics
|       |   |   +--- index.html.erb
|       |   |--- categories
|       |   |   +--- index.html.erb
|       |   |--- companies
|       |   |   +--- edit.html.erb
|       |   +--- home
|       |       +--- index.html.erb
|       |--- devise
|       |   |--- confirmations
|       |   |   +--- new.html.erb
|       |   |--- mailer
|       |   |   |--- confirmation_instructions.html.erb
|       |   |   |--- email_changed.html.erb
|       |   |   |--- password_change.html.erb
|       |   |   |--- reset_password_instructions.html.erb
|       |   |   +--- unlock_instructions.html.erb
|       |   |--- passwords
|       |   |   |--- edit.html.erb
|       |   |   +--- new.html.erb
|       |   |--- registrations
|       |   |   |--- edit.html.erb
|       |   |   +--- new.html.erb
|       |   |--- sessions
|       |   |   +--- new.html.erb
|       |   |--- shared
|       |   |   |--- _error_messages.html.erb
|       |   |   +--- _links.html.erb
|       |   +--- unlocks
|       |       +--- new.html.erb
|       |--- layouts
|       |   |--- action_text
|       |   |   +--- contents
|       |   |       +--- _content.html.erb
|       |   |--- application.html.erb
|       |   |--- dashboard.html.erb
|       |   |--- mailer.html.erb
|       |   |--- mailer.text.erb
|       |   |--- _messages.html.erb
|       |   |--- _navbar.html.erb
|       |   |--- _notification.html.erb
|       |   +--- _notifications.html.erb
|       |--- notification_mailer
|       |   |--- notify.html.erb
|       |   +--- system_notification.html.erb
|       |--- pages
|       |   |--- about.html.erb
|       |   +--- home.html.erb
|       |--- posts
|       |   |--- index.html.erb
|       |   |--- new.html.erb
|       |   +--- show.html.erb
|       |--- review_mailer
|       |   |--- new_reply.html.erb
|       |   +--- new_reply.text.erb
|       |--- user
|       |   +--- _session_manager.html.erb
|       +--- user_mailer
|           |--- approval_email.html.erb
|           |--- email_confirmation.html.erb
|           |--- password_reset.html.erb
|           |--- rejection_email.html.erb
|           |--- reset_password_instructions.html.erb
|           |--- reset_password_instructions.text.erb
|           |--- welcome.html.erb
|           +--- welcome.text.erb
|--- bin
|   |--- bundle
|   |--- importmap
|   |--- quality
|   |--- rails
|   |--- rake
|   |--- rspec
|   |--- rspec.cmd
|   |--- setup
|   +--- test_migrations
|--- config
|   |--- data
|   |   +--- br_locations.json
|   |--- environments
|   |   |--- development.rb
|   |   |--- development_cache.rb
|   |   |--- production.rb
|   |   |--- production.rb.backup
|   |   |--- production_cache.rb
|   |   |--- staging.rb
|   |   +--- test.rb
|   |--- initializers
|   |   |--- 00_redis_disable.rb
|   |   |--- action_mailer.rb
|   |   |--- active_admin.rb
|   |   |--- assets.rb
|   |   |--- bullet.rb
|   |   |--- content_security_policy.rb
|   |   |--- cors.rb
|   |   |--- curse_words.rb
|   |   |--- devise.rb
|   |   |--- disable_migration_check.rb
|   |   |--- filter_parameter_logging.rb
|   |   |--- health_check.rb
|   |   |--- inflections.rb
|   |   |--- kaminari.rb
|   |   |--- lograge.rb
|   |   |--- mail_config.rb
|   |   |--- new_framework_defaults_7_0.rb
|   |   |--- permissions_policy.rb
|   |   |--- query_optimization.rb
|   |   |--- rack_attack.rb
|   |   |--- rack_attack_redis.rb
|   |   |--- ransack.rb
|   |   |--- redis.rb
|   |   |--- redis_cache.rb
|   |   |--- rswag_api.rb
|   |   |--- rswag_ui.rb
|   |   |--- scout_apm.rb
|   |   |--- sentry.rb
|   |   |--- sidekiq.rb
|   |   +--- yabeda.rb
|   |--- locales
|   |   |--- devise.en.yml
|   |   |--- devise.pt-BR.yml
|   |   +--- en.yml
|   |--- application.rb
|   |--- application_job_adapter.rb
|   |--- boot.rb
|   |--- brakeman.ignore
|   |--- brakeman.yml
|   |--- cable.yml
|   |--- credentials.yml
|   |--- credentials.yml.enc.backup
|   |--- database.yml
|   |--- environment.rb
|   |--- importmap.rb
|   |--- master.key
|   |--- puma.rb
|   |--- routes.rb
|   |--- routes_sidekiq.rb
|   |--- scout_apm.yml
|   |--- sidekiq.yml
|   |--- sidekiq_schedule.yml
|   |--- storage.yml
|   +--- storage_s3.yml.example
|--- db
|   |--- data
|   |   +--- municipios.csv
|   |--- migrate
|   |   |--- 20230712221836_create_posts.rb
|   |   |--- 20230713193131_add_views_to_posts.rb
|   |   |--- 20230714162304_devise_create_users.rb
|   |   |--- 20230714202502_add_user_to_posts.rb
|   |   |--- 20230714213543_add_name_to_user.rb
|   |   |--- 20230714232351_add_views_to_user.rb
|   |   |--- 20230714232857_change_views_for_users.rb
|   |   |--- 20230716133433_create_comments.rb
|   |   |--- 20230716140302_create_active_storage_tables.active_storage.rb
|   |   |--- 20230716140303_create_action_text_tables.action_text.rb
|   |   |--- 20230815221100_add_service_name_to_active_storage_blobs.active_storage.rb
|   |   |--- 20230815221101_create_active_storage_variant_records.active_storage.rb
|   |   |--- 20230815221102_remove_not_null_on_active_storage_blobs_checksum.active_storage.rb
|   |   |--- 20231020123455_create_companies.rb
|   |   |--- 20231020123456_add_contact_fields_to_companies.rb
|   |   |--- 20231020123458_add_fields_to_companies.rb
|   |   |--- 20231020123459_add_missing_fields_to_companies.rb
|   |   |--- 20231020123460_add_ctas_and_social_proof_to_companies.rb
|   |   |--- 20240329223906_create_noticed_tables.noticed.rb
|   |   |--- 20240329223907_add_notifications_count_to_noticed_event.noticed.rb
|   |   |--- 20240508205056_devise_create_admin_users.rb
|   |   |--- 20240508205057_create_active_admin_comments.rb
|   |   |--- 20240508205200_add_published_at_to_posts.rb
|   |   |--- 20240601000000_add_description_to_companies.rb
|   |   |--- 20240610120000_create_banner_globals.rb
|   |   |--- 20250911061329_create_products.rb
|   |   |--- 20250911061352_create_categories.rb
|   |   |--- 20250911061444_create_leads.rb
|   |   |--- 20250911061506_create_reviews.rb
|   |   |--- 20250911061525_create_campaigns.rb
|   |   |--- 20250911061541_create_campaign_reviews.rb
|   |   |--- 20250911061557_create_articles.rb
|   |   |--- 20250911061612_create_contents.rb
|   |   |--- 20250911061709_create_feature_groups.rb
|   |   |--- 20250911061739_create_badges.rb
|   |   |--- 20250911061804_create_plans.rb
|   |   |--- 20250911061831_create_pricings.rb
|   |   |--- 20250911061853_create_product_accesses.rb
|   |   |--- 20250911061925_create_subscription_plans.rb
|   |   |--- 20250911061953_create_sponsored_plans.rb
|   |   |--- 20250911062030_create_forum_questions.rb
|   |   |--- 20250911062059_create_forum_answers.rb
|   |   |--- 20250911071840_add_fields_to_products.rb
|   |   |--- 20250911072250_create_join_table_products_categories.rb
|   |   |--- 20250911190138_create_join_table_companies_categories.rb
|   |   |--- 20250911200000_create_companies_categories_manually.rb
|   |   |--- 20250916012034_create_companies_v2.rb
|   |   |--- 20250917023128_create_banners.rb
|   |   |--- 20250918000000_add_location_to_companies.rb
|   |   +--- 20250918000001_add_state_and_city_to_companies.rb
|   |--- seeds
|   |   |--- categories_solar.rb
|   |   +--- companies_from_json.rb
|   |--- seed_data
|   |   |--- companies.json
|   |   +--- companies_dump.tsv
|   |--- development.sqlite3
|   |--- recover_from_dump.rb
|   |--- schema.rb
|   |--- seeds.rb
|   |--- seeds_category_banners.rb
|   |--- seeds_companies_dump.rb
|   |--- seeds_mobilidade_eletrica.rb
|   |--- SEED_MOBILIDADE_ELETRICA.md
|   +--- test.sqlite3
|--- docs
|   |--- analytics-report.md
|   |--- analytics-spec.md
|   |--- API_ANALYTICS.md
|   |--- authentication_flow.md
|   |--- context7_guide.md
|   |--- mcp_architecture.md
|   |--- QA_ANALYTICS.md
|   +--- shadcn_ui_guide.md
|--- lib
|   |--- assets
|   |   +--- .keep
|   |--- data
|   |   +--- companies_with_official_logos.json
|   |--- query_optimization
|   |   |--- counter_cache.rb
|   |   |--- indexes.rb
|   |   +--- scopes.rb
|   |--- scripts
|   |   |--- setup_whatsapp.rb
|   |   +--- verify_active_storage.rb
|   |--- tasks
|   |   |--- .keep
|   |   |--- admin_user.rake
|   |   |--- cache.rake
|   |   |--- coverage.rake
|   |   |--- db_seeds.rake
|   |   |--- import_companies.rake
|   |   |--- locations_from_csv.rake
|   |   |--- migrations.rake
|   |   |--- mobilidade_eletrica.rake
|   |   |--- query_optimization.rake
|   |   +--- security.rake
|   |--- block_tokens_in_url_middleware.rb
|   +--- idempotency_middleware.rb
|--- log
|   |--- .keep
|   |--- bullet.log
|   |--- development.log
|   +--- test.log
|--- public
|   |--- 404.html
|   |--- 422.html
|   |--- 500.html
|   |--- apple-touch-icon-precomposed.png
|   |--- apple-touch-icon.png
|   |--- favicon.ico
|   |--- metrics-dashboard.html
|   +--- robots.txt
|--- rubocop_backup
|   |--- 20250927_034336
|   |   |--- app
|   |   |   |--- admin
|   |   |   |   |--- admin_users.rb
|   |   |   |   |--- articles.rb
|   |   |   |   |--- badges.rb
|   |   |   |   |--- banners.rb
|   |   |   |   |--- banner_globals.rb
|   |   |   |   |--- campaigns.rb
|   |   |   |   |--- campaign_reviews.rb
|   |   |   |   |--- categories.rb
|   |   |   |   |--- companies.rb
|   |   |   |   |--- contents.rb
|   |   |   |   |--- dashboard.rb
|   |   |   |   |--- feature_groups.rb
|   |   |   |   |--- forum_answers.rb
|   |   |   |   |--- forum_questions.rb
|   |   |   |   |--- leads.rb
|   |   |   |   |--- plans.rb
|   |   |   |   |--- pricings.rb
|   |   |   |   |--- products.rb
|   |   |   |   |--- product_accesses.rb
|   |   |   |   |--- reviews.rb
|   |   |   |   |--- sponsored_plans.rb
|   |   |   |   |--- subscription_plans.rb
|   |   |   |   +--- users.rb
|   |   |   |--- channels
|   |   |   |   +--- application_cable
|   |   |   |       |--- channel.rb
|   |   |   |       +--- connection.rb
|   |   |   |--- controllers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- admin
|   |   |   |   |       |   +--- categories_controller.rb
|   |   |   |   |       |--- articles_controller.rb
|   |   |   |   |       |--- authentication_controller.rb
|   |   |   |   |       |--- badges_controller.rb
|   |   |   |   |       |--- banners_controller.rb
|   |   |   |   |       |--- banner_globals_controller.rb
|   |   |   |   |       |--- base_controller.rb
|   |   |   |   |       |--- campaigns_controller.rb
|   |   |   |   |       |--- campaign_reviews_controller.rb
|   |   |   |   |       |--- categories_controller.rb
|   |   |   |   |       |--- companies_controller.rb
|   |   |   |   |       |--- contents_controller.rb
|   |   |   |   |       |--- dashboard_controller.rb
|   |   |   |   |       |--- feature_groups_controller.rb
|   |   |   |   |       |--- forum_answers_controller.rb
|   |   |   |   |       |--- forum_questions_controller.rb
|   |   |   |   |       |--- leads_controller.rb
|   |   |   |   |       |--- plans_controller.rb
|   |   |   |   |       |--- pricings_controller.rb
|   |   |   |   |       |--- products_controller.rb
|   |   |   |   |       |--- product_accesss_controller.rb
|   |   |   |   |       |--- reviews_controller.rb
|   |   |   |   |       |--- search_controller.rb
|   |   |   |   |       |--- sponsored_plans_controller.rb
|   |   |   |   |       |--- subscription_plans_controller.rb
|   |   |   |   |       +--- users_controller.rb
|   |   |   |   |--- users
|   |   |   |   |   |--- confirmations_controller.rb
|   |   |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |   |   |   |--- passwords_controller.rb
|   |   |   |   |   |--- registrations_controller.rb
|   |   |   |   |   |--- sessions_controller.rb
|   |   |   |   |   +--- unlocks_controller.rb
|   |   |   |   |--- application_controller.rb
|   |   |   |   |--- corporate_controller.rb
|   |   |   |   |--- pages_controller.rb
|   |   |   |   +--- posts_controller.rb
|   |   |   |--- helpers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- articles_helper.rb
|   |   |   |   |       |--- badges_helper.rb
|   |   |   |   |       |--- banners_helper.rb
|   |   |   |   |       |--- campaigns_helper.rb
|   |   |   |   |       |--- campaign_reviews_helper.rb
|   |   |   |   |       |--- categorys_helper.rb
|   |   |   |   |       |--- companys_helper.rb
|   |   |   |   |       |--- contents_helper.rb
|   |   |   |   |       |--- feature_groups_helper.rb
|   |   |   |   |       |--- forum_answers_helper.rb
|   |   |   |   |       |--- forum_questions_helper.rb
|   |   |   |   |       |--- leads_helper.rb
|   |   |   |   |       |--- plans_helper.rb
|   |   |   |   |       |--- pricings_helper.rb
|   |   |   |   |       |--- products_helper.rb
|   |   |   |   |       |--- product_accesss_helper.rb
|   |   |   |   |       |--- reviews_helper.rb
|   |   |   |   |       |--- sponsored_plans_helper.rb
|   |   |   |   |       |--- subscription_plans_helper.rb
|   |   |   |   |       +--- users_helper.rb
|   |   |   |   |--- application_helper.rb
|   |   |   |   |--- comments_helper.rb
|   |   |   |   |--- pages_helper.rb
|   |   |   |   |--- posts_helper.rb
|   |   |   |   +--- users_helper.rb
|   |   |   |--- jobs
|   |   |   |   +--- application_job.rb
|   |   |   |--- mailers
|   |   |   |   +--- application_mailer.rb
|   |   |   |--- models
|   |   |   |   |--- admin_user.rb
|   |   |   |   |--- application_record.rb
|   |   |   |   |--- article.rb
|   |   |   |   |--- badge.rb
|   |   |   |   |--- banner.rb
|   |   |   |   |--- banner_global.rb
|   |   |   |   |--- campaign.rb
|   |   |   |   |--- campaign_review.rb
|   |   |   |   |--- category.rb
|   |   |   |   |--- company.rb
|   |   |   |   |--- content.rb
|   |   |   |   |--- feature_group.rb
|   |   |   |   |--- forum_answer.rb
|   |   |   |   |--- forum_question.rb
|   |   |   |   |--- lead.rb
|   |   |   |   |--- plan.rb
|   |   |   |   |--- post.rb
|   |   |   |   |--- pricing.rb
|   |   |   |   |--- product.rb
|   |   |   |   |--- product_access.rb
|   |   |   |   |--- review.rb
|   |   |   |   |--- sponsored_plan.rb
|   |   |   |   |--- subscription_plan.rb
|   |   |   |   +--- user.rb
|   |   |   |--- notifiers
|   |   |   |   |--- application_notifier.rb
|   |   |   |   +--- comment_notifier.rb
|   |   |   |--- serializers
|   |   |   |   |--- article_serializer.rb
|   |   |   |   |--- badge_serializer.rb
|   |   |   |   |--- campaign_review_serializer.rb
|   |   |   |   |--- campaign_serializer.rb
|   |   |   |   |--- category_serializer.rb
|   |   |   |   |--- company_serializer.rb
|   |   |   |   |--- content_serializer.rb
|   |   |   |   |--- feature_group_serializer.rb
|   |   |   |   |--- forum_answer_serializer.rb
|   |   |   |   |--- forum_question_serializer.rb
|   |   |   |   |--- lead_serializer.rb
|   |   |   |   |--- plan_serializer.rb
|   |   |   |   |--- pricing_serializer.rb
|   |   |   |   |--- product_access_serializer.rb
|   |   |   |   |--- product_serializer.rb
|   |   |   |   |--- review_serializer.rb
|   |   |   |   |--- sponsored_plan_serializer.rb
|   |   |   |   |--- subscription_plan_serializer.rb
|   |   |   |   +--- user_serializer.rb
|   |   |   |--- services
|   |   |   |   |--- company_cta_builder.rb
|   |   |   |   +--- search_service.rb
|   |   |   +--- validators
|   |   |       |--- phone_validator.rb
|   |   |       +--- url_validator.rb
|   |   |--- scripts
|   |   |   |--- clean_admin_data.rb
|   |   |   |--- create_related_products.rb
|   |   |   +--- populate_admin_data.rb
|   |   |--- test
|   |   |   |--- channels
|   |   |   |   +--- application_cable
|   |   |   |       +--- connection_test.rb
|   |   |   |--- controllers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- articles_controller_test.rb
|   |   |   |   |       |--- badges_controller_test.rb
|   |   |   |   |       |--- banners_controller_test.rb
|   |   |   |   |       |--- campaigns_controller_test.rb
|   |   |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |   |   |       |--- categorys_controller_test.rb
|   |   |   |   |       |--- companys_controller_test.rb
|   |   |   |   |       |--- contents_controller_test.rb
|   |   |   |   |       |--- feature_groups_controller_test.rb
|   |   |   |   |       |--- forum_answers_controller_test.rb
|   |   |   |   |       |--- forum_questions_controller_test.rb
|   |   |   |   |       |--- leads_controller_test.rb
|   |   |   |   |       |--- plans_controller_test.rb
|   |   |   |   |       |--- pricings_controller_test.rb
|   |   |   |   |       |--- products_controller_test.rb
|   |   |   |   |       |--- product_accesss_controller_test.rb
|   |   |   |   |       |--- reviews_controller_test.rb
|   |   |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |   |   |       |--- subscription_plans_controller_test.rb
|   |   |   |   |       +--- users_controller_test.rb
|   |   |   |   |--- comments_controller_test.rb
|   |   |   |   |--- pages_controller_test.rb
|   |   |   |   |--- posts_controller_test.rb
|   |   |   |   +--- users_controller_test.rb
|   |   |   |--- models
|   |   |   |   |--- admin_user_test.rb
|   |   |   |   |--- article_test.rb
|   |   |   |   |--- badge_test.rb
|   |   |   |   |--- banner_test.rb
|   |   |   |   |--- campaign_review_test.rb
|   |   |   |   |--- campaign_test.rb
|   |   |   |   |--- category_test.rb
|   |   |   |   |--- comment_test.rb
|   |   |   |   |--- company_test.rb
|   |   |   |   |--- content_test.rb
|   |   |   |   |--- feature_group_test.rb
|   |   |   |   |--- forum_answer_test.rb
|   |   |   |   |--- forum_question_test.rb
|   |   |   |   |--- lead_test.rb
|   |   |   |   |--- plan_test.rb
|   |   |   |   |--- post_test.rb
|   |   |   |   |--- pricing_test.rb
|   |   |   |   |--- product_access_test.rb
|   |   |   |   |--- product_test.rb
|   |   |   |   |--- review_test.rb
|   |   |   |   |--- sponsored_plan_test.rb
|   |   |   |   |--- subscription_plan_test.rb
|   |   |   |   +--- user_test.rb
|   |   |   |--- system
|   |   |   |   +--- posts_test.rb
|   |   |   |--- application_system_test_case.rb
|   |   |   +--- test_helper.rb
|   |   +--- fix_rubocop.rb
|   |--- 20250927_034912
|   |   |--- app
|   |   |   |--- admin
|   |   |   |   |--- admin_users.rb
|   |   |   |   |--- articles.rb
|   |   |   |   |--- badges.rb
|   |   |   |   |--- banners.rb
|   |   |   |   |--- banner_globals.rb
|   |   |   |   |--- campaigns.rb
|   |   |   |   |--- campaign_reviews.rb
|   |   |   |   |--- categories.rb
|   |   |   |   |--- companies.rb
|   |   |   |   |--- contents.rb
|   |   |   |   |--- dashboard.rb
|   |   |   |   |--- feature_groups.rb
|   |   |   |   |--- forum_answers.rb
|   |   |   |   |--- forum_questions.rb
|   |   |   |   |--- leads.rb
|   |   |   |   |--- plans.rb
|   |   |   |   |--- pricings.rb
|   |   |   |   |--- products.rb
|   |   |   |   |--- product_accesses.rb
|   |   |   |   |--- reviews.rb
|   |   |   |   |--- sponsored_plans.rb
|   |   |   |   |--- subscription_plans.rb
|   |   |   |   +--- users.rb
|   |   |   |--- channels
|   |   |   |   +--- application_cable
|   |   |   |       |--- channel.rb
|   |   |   |       +--- connection.rb
|   |   |   |--- controllers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- admin
|   |   |   |   |       |   +--- categories_controller.rb
|   |   |   |   |       |--- articles_controller.rb
|   |   |   |   |       |--- authentication_controller.rb
|   |   |   |   |       |--- badges_controller.rb
|   |   |   |   |       |--- banners_controller.rb
|   |   |   |   |       |--- banner_globals_controller.rb
|   |   |   |   |       |--- base_controller.rb
|   |   |   |   |       |--- campaigns_controller.rb
|   |   |   |   |       |--- campaign_reviews_controller.rb
|   |   |   |   |       |--- categories_controller.rb
|   |   |   |   |       |--- companies_controller.rb
|   |   |   |   |       |--- contents_controller.rb
|   |   |   |   |       |--- dashboard_controller.rb
|   |   |   |   |       |--- feature_groups_controller.rb
|   |   |   |   |       |--- forum_answers_controller.rb
|   |   |   |   |       |--- forum_questions_controller.rb
|   |   |   |   |       |--- leads_controller.rb
|   |   |   |   |       |--- plans_controller.rb
|   |   |   |   |       |--- pricings_controller.rb
|   |   |   |   |       |--- products_controller.rb
|   |   |   |   |       |--- product_accesss_controller.rb
|   |   |   |   |       |--- reviews_controller.rb
|   |   |   |   |       |--- search_controller.rb
|   |   |   |   |       |--- sponsored_plans_controller.rb
|   |   |   |   |       |--- subscription_plans_controller.rb
|   |   |   |   |       +--- users_controller.rb
|   |   |   |   |--- users
|   |   |   |   |   |--- confirmations_controller.rb
|   |   |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |   |   |   |--- passwords_controller.rb
|   |   |   |   |   |--- registrations_controller.rb
|   |   |   |   |   |--- sessions_controller.rb
|   |   |   |   |   +--- unlocks_controller.rb
|   |   |   |   |--- application_controller.rb
|   |   |   |   |--- corporate_controller.rb
|   |   |   |   |--- pages_controller.rb
|   |   |   |   +--- posts_controller.rb
|   |   |   |--- helpers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- articles_helper.rb
|   |   |   |   |       |--- badges_helper.rb
|   |   |   |   |       |--- banners_helper.rb
|   |   |   |   |       |--- campaigns_helper.rb
|   |   |   |   |       |--- campaign_reviews_helper.rb
|   |   |   |   |       |--- categorys_helper.rb
|   |   |   |   |       |--- companys_helper.rb
|   |   |   |   |       |--- contents_helper.rb
|   |   |   |   |       |--- feature_groups_helper.rb
|   |   |   |   |       |--- forum_answers_helper.rb
|   |   |   |   |       |--- forum_questions_helper.rb
|   |   |   |   |       |--- leads_helper.rb
|   |   |   |   |       |--- plans_helper.rb
|   |   |   |   |       |--- pricings_helper.rb
|   |   |   |   |       |--- products_helper.rb
|   |   |   |   |       |--- product_accesss_helper.rb
|   |   |   |   |       |--- reviews_helper.rb
|   |   |   |   |       |--- sponsored_plans_helper.rb
|   |   |   |   |       |--- subscription_plans_helper.rb
|   |   |   |   |       +--- users_helper.rb
|   |   |   |   |--- application_helper.rb
|   |   |   |   |--- comments_helper.rb
|   |   |   |   |--- pages_helper.rb
|   |   |   |   |--- posts_helper.rb
|   |   |   |   +--- users_helper.rb
|   |   |   |--- jobs
|   |   |   |   +--- application_job.rb
|   |   |   |--- mailers
|   |   |   |   +--- application_mailer.rb
|   |   |   |--- models
|   |   |   |   |--- admin_user.rb
|   |   |   |   |--- application_record.rb
|   |   |   |   |--- article.rb
|   |   |   |   |--- badge.rb
|   |   |   |   |--- banner.rb
|   |   |   |   |--- banner_global.rb
|   |   |   |   |--- campaign.rb
|   |   |   |   |--- campaign_review.rb
|   |   |   |   |--- category.rb
|   |   |   |   |--- company.rb
|   |   |   |   |--- content.rb
|   |   |   |   |--- feature_group.rb
|   |   |   |   |--- forum_answer.rb
|   |   |   |   |--- forum_question.rb
|   |   |   |   |--- lead.rb
|   |   |   |   |--- plan.rb
|   |   |   |   |--- post.rb
|   |   |   |   |--- pricing.rb
|   |   |   |   |--- product.rb
|   |   |   |   |--- product_access.rb
|   |   |   |   |--- review.rb
|   |   |   |   |--- sponsored_plan.rb
|   |   |   |   |--- subscription_plan.rb
|   |   |   |   +--- user.rb
|   |   |   |--- notifiers
|   |   |   |   |--- application_notifier.rb
|   |   |   |   +--- comment_notifier.rb
|   |   |   |--- serializers
|   |   |   |   |--- article_serializer.rb
|   |   |   |   |--- badge_serializer.rb
|   |   |   |   |--- campaign_review_serializer.rb
|   |   |   |   |--- campaign_serializer.rb
|   |   |   |   |--- category_serializer.rb
|   |   |   |   |--- company_serializer.rb
|   |   |   |   |--- content_serializer.rb
|   |   |   |   |--- feature_group_serializer.rb
|   |   |   |   |--- forum_answer_serializer.rb
|   |   |   |   |--- forum_question_serializer.rb
|   |   |   |   |--- lead_serializer.rb
|   |   |   |   |--- plan_serializer.rb
|   |   |   |   |--- pricing_serializer.rb
|   |   |   |   |--- product_access_serializer.rb
|   |   |   |   |--- product_serializer.rb
|   |   |   |   |--- review_serializer.rb
|   |   |   |   |--- sponsored_plan_serializer.rb
|   |   |   |   |--- subscription_plan_serializer.rb
|   |   |   |   +--- user_serializer.rb
|   |   |   |--- services
|   |   |   |   |--- company_cta_builder.rb
|   |   |   |   +--- search_service.rb
|   |   |   +--- validators
|   |   |       |--- phone_validator.rb
|   |   |       +--- url_validator.rb
|   |   |--- rubocop_backup
|   |   |   +--- 20250927_034336
|   |   |       |--- app
|   |   |       |   |--- admin
|   |   |       |   |   |--- admin_users.rb
|   |   |       |   |   |--- articles.rb
|   |   |       |   |   |--- badges.rb
|   |   |       |   |   |--- banners.rb
|   |   |       |   |   |--- banner_globals.rb
|   |   |       |   |   |--- campaigns.rb
|   |   |       |   |   |--- campaign_reviews.rb
|   |   |       |   |   |--- categories.rb
|   |   |       |   |   |--- companies.rb
|   |   |       |   |   |--- contents.rb
|   |   |       |   |   |--- dashboard.rb
|   |   |       |   |   |--- feature_groups.rb
|   |   |       |   |   |--- forum_answers.rb
|   |   |       |   |   |--- forum_questions.rb
|   |   |       |   |   |--- leads.rb
|   |   |       |   |   |--- plans.rb
|   |   |       |   |   |--- pricings.rb
|   |   |       |   |   |--- products.rb
|   |   |       |   |   |--- product_accesses.rb
|   |   |       |   |   |--- reviews.rb
|   |   |       |   |   |--- sponsored_plans.rb
|   |   |       |   |   |--- subscription_plans.rb
|   |   |       |   |   +--- users.rb
|   |   |       |   |--- channels
|   |   |       |   |   +--- application_cable
|   |   |       |   |       |--- channel.rb
|   |   |       |   |       +--- connection.rb
|   |   |       |   |--- controllers
|   |   |       |   |   |--- api
|   |   |       |   |   |   +--- v1
|   |   |       |   |   |       |--- admin
|   |   |       |   |   |       |   +--- categories_controller.rb
|   |   |       |   |   |       |--- articles_controller.rb
|   |   |       |   |   |       |--- authentication_controller.rb
|   |   |       |   |   |       |--- badges_controller.rb
|   |   |       |   |   |       |--- banners_controller.rb
|   |   |       |   |   |       |--- banner_globals_controller.rb
|   |   |       |   |   |       |--- base_controller.rb
|   |   |       |   |   |       |--- campaigns_controller.rb
|   |   |       |   |   |       |--- campaign_reviews_controller.rb
|   |   |       |   |   |       |--- categories_controller.rb
|   |   |       |   |   |       |--- companies_controller.rb
|   |   |       |   |   |       |--- contents_controller.rb
|   |   |       |   |   |       |--- dashboard_controller.rb
|   |   |       |   |   |       |--- feature_groups_controller.rb
|   |   |       |   |   |       |--- forum_answers_controller.rb
|   |   |       |   |   |       |--- forum_questions_controller.rb
|   |   |       |   |   |       |--- leads_controller.rb
|   |   |       |   |   |       |--- plans_controller.rb
|   |   |       |   |   |       |--- pricings_controller.rb
|   |   |       |   |   |       |--- products_controller.rb
|   |   |       |   |   |       |--- product_accesss_controller.rb
|   |   |       |   |   |       |--- reviews_controller.rb
|   |   |       |   |   |       |--- search_controller.rb
|   |   |       |   |   |       |--- sponsored_plans_controller.rb
|   |   |       |   |   |       |--- subscription_plans_controller.rb
|   |   |       |   |   |       +--- users_controller.rb
|   |   |       |   |   |--- users
|   |   |       |   |   |   |--- confirmations_controller.rb
|   |   |       |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |       |   |   |   |--- passwords_controller.rb
|   |   |       |   |   |   |--- registrations_controller.rb
|   |   |       |   |   |   |--- sessions_controller.rb
|   |   |       |   |   |   +--- unlocks_controller.rb
|   |   |       |   |   |--- application_controller.rb
|   |   |       |   |   |--- corporate_controller.rb
|   |   |       |   |   |--- pages_controller.rb
|   |   |       |   |   +--- posts_controller.rb
|   |   |       |   |--- helpers
|   |   |       |   |   |--- api
|   |   |       |   |   |   +--- v1
|   |   |       |   |   |       |--- articles_helper.rb
|   |   |       |   |   |       |--- badges_helper.rb
|   |   |       |   |   |       |--- banners_helper.rb
|   |   |       |   |   |       |--- campaigns_helper.rb
|   |   |       |   |   |       |--- campaign_reviews_helper.rb
|   |   |       |   |   |       |--- categorys_helper.rb
|   |   |       |   |   |       |--- companys_helper.rb
|   |   |       |   |   |       |--- contents_helper.rb
|   |   |       |   |   |       |--- feature_groups_helper.rb
|   |   |       |   |   |       |--- forum_answers_helper.rb
|   |   |       |   |   |       |--- forum_questions_helper.rb
|   |   |       |   |   |       |--- leads_helper.rb
|   |   |       |   |   |       |--- plans_helper.rb
|   |   |       |   |   |       |--- pricings_helper.rb
|   |   |       |   |   |       |--- products_helper.rb
|   |   |       |   |   |       |--- product_accesss_helper.rb
|   |   |       |   |   |       |--- reviews_helper.rb
|   |   |       |   |   |       |--- sponsored_plans_helper.rb
|   |   |       |   |   |       |--- subscription_plans_helper.rb
|   |   |       |   |   |       +--- users_helper.rb
|   |   |       |   |   |--- application_helper.rb
|   |   |       |   |   |--- comments_helper.rb
|   |   |       |   |   |--- pages_helper.rb
|   |   |       |   |   |--- posts_helper.rb
|   |   |       |   |   +--- users_helper.rb
|   |   |       |   |--- jobs
|   |   |       |   |   +--- application_job.rb
|   |   |       |   |--- mailers
|   |   |       |   |   +--- application_mailer.rb
|   |   |       |   |--- models
|   |   |       |   |   |--- admin_user.rb
|   |   |       |   |   |--- application_record.rb
|   |   |       |   |   |--- article.rb
|   |   |       |   |   |--- badge.rb
|   |   |       |   |   |--- banner.rb
|   |   |       |   |   |--- banner_global.rb
|   |   |       |   |   |--- campaign.rb
|   |   |       |   |   |--- campaign_review.rb
|   |   |       |   |   |--- category.rb
|   |   |       |   |   |--- company.rb
|   |   |       |   |   |--- content.rb
|   |   |       |   |   |--- feature_group.rb
|   |   |       |   |   |--- forum_answer.rb
|   |   |       |   |   |--- forum_question.rb
|   |   |       |   |   |--- lead.rb
|   |   |       |   |   |--- plan.rb
|   |   |       |   |   |--- post.rb
|   |   |       |   |   |--- pricing.rb
|   |   |       |   |   |--- product.rb
|   |   |       |   |   |--- product_access.rb
|   |   |       |   |   |--- review.rb
|   |   |       |   |   |--- sponsored_plan.rb
|   |   |       |   |   |--- subscription_plan.rb
|   |   |       |   |   +--- user.rb
|   |   |       |   |--- notifiers
|   |   |       |   |   |--- application_notifier.rb
|   |   |       |   |   +--- comment_notifier.rb
|   |   |       |   |--- serializers
|   |   |       |   |   |--- article_serializer.rb
|   |   |       |   |   |--- badge_serializer.rb
|   |   |       |   |   |--- campaign_review_serializer.rb
|   |   |       |   |   |--- campaign_serializer.rb
|   |   |       |   |   |--- category_serializer.rb
|   |   |       |   |   |--- company_serializer.rb
|   |   |       |   |   |--- content_serializer.rb
|   |   |       |   |   |--- feature_group_serializer.rb
|   |   |       |   |   |--- forum_answer_serializer.rb
|   |   |       |   |   |--- forum_question_serializer.rb
|   |   |       |   |   |--- lead_serializer.rb
|   |   |       |   |   |--- plan_serializer.rb
|   |   |       |   |   |--- pricing_serializer.rb
|   |   |       |   |   |--- product_access_serializer.rb
|   |   |       |   |   |--- product_serializer.rb
|   |   |       |   |   |--- review_serializer.rb
|   |   |       |   |   |--- sponsored_plan_serializer.rb
|   |   |       |   |   |--- subscription_plan_serializer.rb
|   |   |       |   |   +--- user_serializer.rb
|   |   |       |   |--- services
|   |   |       |   |   |--- company_cta_builder.rb
|   |   |       |   |   +--- search_service.rb
|   |   |       |   +--- validators
|   |   |       |       |--- phone_validator.rb
|   |   |       |       +--- url_validator.rb
|   |   |       |--- scripts
|   |   |       |   |--- clean_admin_data.rb
|   |   |       |   |--- create_related_products.rb
|   |   |       |   +--- populate_admin_data.rb
|   |   |       |--- test
|   |   |       |   |--- channels
|   |   |       |   |   +--- application_cable
|   |   |       |   |       +--- connection_test.rb
|   |   |       |   |--- controllers
|   |   |       |   |   |--- api
|   |   |       |   |   |   +--- v1
|   |   |       |   |   |       |--- articles_controller_test.rb
|   |   |       |   |   |       |--- badges_controller_test.rb
|   |   |       |   |   |       |--- banners_controller_test.rb
|   |   |       |   |   |       |--- campaigns_controller_test.rb
|   |   |       |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |       |   |   |       |--- categorys_controller_test.rb
|   |   |       |   |   |       |--- companys_controller_test.rb
|   |   |       |   |   |       |--- contents_controller_test.rb
|   |   |       |   |   |       |--- feature_groups_controller_test.rb
|   |   |       |   |   |       |--- forum_answers_controller_test.rb
|   |   |       |   |   |       |--- forum_questions_controller_test.rb
|   |   |       |   |   |       |--- leads_controller_test.rb
|   |   |       |   |   |       |--- plans_controller_test.rb
|   |   |       |   |   |       |--- pricings_controller_test.rb
|   |   |       |   |   |       |--- products_controller_test.rb
|   |   |       |   |   |       |--- product_accesss_controller_test.rb
|   |   |       |   |   |       |--- reviews_controller_test.rb
|   |   |       |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |       |   |   |       |--- subscription_plans_controller_test.rb
|   |   |       |   |   |       +--- users_controller_test.rb
|   |   |       |   |   |--- comments_controller_test.rb
|   |   |       |   |   |--- pages_controller_test.rb
|   |   |       |   |   |--- posts_controller_test.rb
|   |   |       |   |   +--- users_controller_test.rb
|   |   |       |   |--- models
|   |   |       |   |   |--- admin_user_test.rb
|   |   |       |   |   |--- article_test.rb
|   |   |       |   |   |--- badge_test.rb
|   |   |       |   |   |--- banner_test.rb
|   |   |       |   |   |--- campaign_review_test.rb
|   |   |       |   |   |--- campaign_test.rb
|   |   |       |   |   |--- category_test.rb
|   |   |       |   |   |--- comment_test.rb
|   |   |       |   |   |--- company_test.rb
|   |   |       |   |   |--- content_test.rb
|   |   |       |   |   |--- feature_group_test.rb
|   |   |       |   |   |--- forum_answer_test.rb
|   |   |       |   |   |--- forum_question_test.rb
|   |   |       |   |   |--- lead_test.rb
|   |   |       |   |   |--- plan_test.rb
|   |   |       |   |   |--- post_test.rb
|   |   |       |   |   |--- pricing_test.rb
|   |   |       |   |   |--- product_access_test.rb
|   |   |       |   |   |--- product_test.rb
|   |   |       |   |   |--- review_test.rb
|   |   |       |   |   |--- sponsored_plan_test.rb
|   |   |       |   |   |--- subscription_plan_test.rb
|   |   |       |   |   +--- user_test.rb
|   |   |       |   |--- system
|   |   |       |   |   +--- posts_test.rb
|   |   |       |   |--- application_system_test_case.rb
|   |   |       |   +--- test_helper.rb
|   |   |       +--- fix_rubocop.rb
|   |   |--- scripts
|   |   |   |--- clean_admin_data.rb
|   |   |   |--- create_related_products.rb
|   |   |   +--- populate_admin_data.rb
|   |   |--- test
|   |   |   |--- channels
|   |   |   |   +--- application_cable
|   |   |   |       +--- connection_test.rb
|   |   |   |--- controllers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- articles_controller_test.rb
|   |   |   |   |       |--- badges_controller_test.rb
|   |   |   |   |       |--- banners_controller_test.rb
|   |   |   |   |       |--- campaigns_controller_test.rb
|   |   |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |   |   |       |--- categorys_controller_test.rb
|   |   |   |   |       |--- companys_controller_test.rb
|   |   |   |   |       |--- contents_controller_test.rb
|   |   |   |   |       |--- feature_groups_controller_test.rb
|   |   |   |   |       |--- forum_answers_controller_test.rb
|   |   |   |   |       |--- forum_questions_controller_test.rb
|   |   |   |   |       |--- leads_controller_test.rb
|   |   |   |   |       |--- plans_controller_test.rb
|   |   |   |   |       |--- pricings_controller_test.rb
|   |   |   |   |       |--- products_controller_test.rb
|   |   |   |   |       |--- product_accesss_controller_test.rb
|   |   |   |   |       |--- reviews_controller_test.rb
|   |   |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |   |   |       |--- subscription_plans_controller_test.rb
|   |   |   |   |       +--- users_controller_test.rb
|   |   |   |   |--- comments_controller_test.rb
|   |   |   |   |--- pages_controller_test.rb
|   |   |   |   |--- posts_controller_test.rb
|   |   |   |   +--- users_controller_test.rb
|   |   |   |--- models
|   |   |   |   |--- admin_user_test.rb
|   |   |   |   |--- article_test.rb
|   |   |   |   |--- badge_test.rb
|   |   |   |   |--- banner_test.rb
|   |   |   |   |--- campaign_review_test.rb
|   |   |   |   |--- campaign_test.rb
|   |   |   |   |--- category_test.rb
|   |   |   |   |--- comment_test.rb
|   |   |   |   |--- company_test.rb
|   |   |   |   |--- content_test.rb
|   |   |   |   |--- feature_group_test.rb
|   |   |   |   |--- forum_answer_test.rb
|   |   |   |   |--- forum_question_test.rb
|   |   |   |   |--- lead_test.rb
|   |   |   |   |--- plan_test.rb
|   |   |   |   |--- post_test.rb
|   |   |   |   |--- pricing_test.rb
|   |   |   |   |--- product_access_test.rb
|   |   |   |   |--- product_test.rb
|   |   |   |   |--- review_test.rb
|   |   |   |   |--- sponsored_plan_test.rb
|   |   |   |   |--- subscription_plan_test.rb
|   |   |   |   +--- user_test.rb
|   |   |   |--- system
|   |   |   |   +--- posts_test.rb
|   |   |   |--- application_system_test_case.rb
|   |   |   +--- test_helper.rb
|   |   +--- fix_rubocop.rb
|   |--- 20250927_035248
|   |   |--- app
|   |   |   |--- admin
|   |   |   |   |--- admin_users.rb
|   |   |   |   |--- articles.rb
|   |   |   |   |--- badges.rb
|   |   |   |   |--- banners.rb
|   |   |   |   |--- banner_globals.rb
|   |   |   |   |--- campaigns.rb
|   |   |   |   |--- campaign_reviews.rb
|   |   |   |   |--- categories.rb
|   |   |   |   |--- companies.rb
|   |   |   |   |--- contents.rb
|   |   |   |   |--- dashboard.rb
|   |   |   |   |--- feature_groups.rb
|   |   |   |   |--- forum_answers.rb
|   |   |   |   |--- forum_questions.rb
|   |   |   |   |--- leads.rb
|   |   |   |   |--- plans.rb
|   |   |   |   |--- pricings.rb
|   |   |   |   |--- products.rb
|   |   |   |   |--- product_accesses.rb
|   |   |   |   |--- reviews.rb
|   |   |   |   |--- sponsored_plans.rb
|   |   |   |   |--- subscription_plans.rb
|   |   |   |   +--- users.rb
|   |   |   |--- channels
|   |   |   |   +--- application_cable
|   |   |   |       |--- channel.rb
|   |   |   |       +--- connection.rb
|   |   |   |--- controllers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- admin
|   |   |   |   |       |   +--- categories_controller.rb
|   |   |   |   |       |--- articles_controller.rb
|   |   |   |   |       |--- authentication_controller.rb
|   |   |   |   |       |--- badges_controller.rb
|   |   |   |   |       |--- banners_controller.rb
|   |   |   |   |       |--- banner_globals_controller.rb
|   |   |   |   |       |--- base_controller.rb
|   |   |   |   |       |--- campaigns_controller.rb
|   |   |   |   |       |--- campaign_reviews_controller.rb
|   |   |   |   |       |--- categories_controller.rb
|   |   |   |   |       |--- companies_controller.rb
|   |   |   |   |       |--- contents_controller.rb
|   |   |   |   |       |--- dashboard_controller.rb
|   |   |   |   |       |--- feature_groups_controller.rb
|   |   |   |   |       |--- forum_answers_controller.rb
|   |   |   |   |       |--- forum_questions_controller.rb
|   |   |   |   |       |--- leads_controller.rb
|   |   |   |   |       |--- plans_controller.rb
|   |   |   |   |       |--- pricings_controller.rb
|   |   |   |   |       |--- products_controller.rb
|   |   |   |   |       |--- product_accesss_controller.rb
|   |   |   |   |       |--- reviews_controller.rb
|   |   |   |   |       |--- search_controller.rb
|   |   |   |   |       |--- sponsored_plans_controller.rb
|   |   |   |   |       |--- subscription_plans_controller.rb
|   |   |   |   |       +--- users_controller.rb
|   |   |   |   |--- users
|   |   |   |   |   |--- confirmations_controller.rb
|   |   |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |   |   |   |--- passwords_controller.rb
|   |   |   |   |   |--- registrations_controller.rb
|   |   |   |   |   |--- sessions_controller.rb
|   |   |   |   |   +--- unlocks_controller.rb
|   |   |   |   |--- application_controller.rb
|   |   |   |   |--- corporate_controller.rb
|   |   |   |   |--- pages_controller.rb
|   |   |   |   +--- posts_controller.rb
|   |   |   |--- helpers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- articles_helper.rb
|   |   |   |   |       |--- badges_helper.rb
|   |   |   |   |       |--- banners_helper.rb
|   |   |   |   |       |--- campaigns_helper.rb
|   |   |   |   |       |--- campaign_reviews_helper.rb
|   |   |   |   |       |--- categorys_helper.rb
|   |   |   |   |       |--- companys_helper.rb
|   |   |   |   |       |--- contents_helper.rb
|   |   |   |   |       |--- feature_groups_helper.rb
|   |   |   |   |       |--- forum_answers_helper.rb
|   |   |   |   |       |--- forum_questions_helper.rb
|   |   |   |   |       |--- leads_helper.rb
|   |   |   |   |       |--- plans_helper.rb
|   |   |   |   |       |--- pricings_helper.rb
|   |   |   |   |       |--- products_helper.rb
|   |   |   |   |       |--- product_accesss_helper.rb
|   |   |   |   |       |--- reviews_helper.rb
|   |   |   |   |       |--- sponsored_plans_helper.rb
|   |   |   |   |       |--- subscription_plans_helper.rb
|   |   |   |   |       +--- users_helper.rb
|   |   |   |   |--- application_helper.rb
|   |   |   |   |--- comments_helper.rb
|   |   |   |   |--- pages_helper.rb
|   |   |   |   |--- posts_helper.rb
|   |   |   |   +--- users_helper.rb
|   |   |   |--- jobs
|   |   |   |   +--- application_job.rb
|   |   |   |--- mailers
|   |   |   |   +--- application_mailer.rb
|   |   |   |--- models
|   |   |   |   |--- admin_user.rb
|   |   |   |   |--- application_record.rb
|   |   |   |   |--- article.rb
|   |   |   |   |--- badge.rb
|   |   |   |   |--- banner.rb
|   |   |   |   |--- banner_global.rb
|   |   |   |   |--- campaign.rb
|   |   |   |   |--- campaign_review.rb
|   |   |   |   |--- category.rb
|   |   |   |   |--- company.rb
|   |   |   |   |--- content.rb
|   |   |   |   |--- feature_group.rb
|   |   |   |   |--- forum_answer.rb
|   |   |   |   |--- forum_question.rb
|   |   |   |   |--- lead.rb
|   |   |   |   |--- plan.rb
|   |   |   |   |--- post.rb
|   |   |   |   |--- pricing.rb
|   |   |   |   |--- product.rb
|   |   |   |   |--- product_access.rb
|   |   |   |   |--- review.rb
|   |   |   |   |--- sponsored_plan.rb
|   |   |   |   |--- subscription_plan.rb
|   |   |   |   +--- user.rb
|   |   |   |--- notifiers
|   |   |   |   |--- application_notifier.rb
|   |   |   |   +--- comment_notifier.rb
|   |   |   |--- serializers
|   |   |   |   |--- article_serializer.rb
|   |   |   |   |--- badge_serializer.rb
|   |   |   |   |--- campaign_review_serializer.rb
|   |   |   |   |--- campaign_serializer.rb
|   |   |   |   |--- category_serializer.rb
|   |   |   |   |--- company_serializer.rb
|   |   |   |   |--- content_serializer.rb
|   |   |   |   |--- feature_group_serializer.rb
|   |   |   |   |--- forum_answer_serializer.rb
|   |   |   |   |--- forum_question_serializer.rb
|   |   |   |   |--- lead_serializer.rb
|   |   |   |   |--- plan_serializer.rb
|   |   |   |   |--- pricing_serializer.rb
|   |   |   |   |--- product_access_serializer.rb
|   |   |   |   |--- product_serializer.rb
|   |   |   |   |--- review_serializer.rb
|   |   |   |   |--- sponsored_plan_serializer.rb
|   |   |   |   |--- subscription_plan_serializer.rb
|   |   |   |   +--- user_serializer.rb
|   |   |   |--- services
|   |   |   |   |--- company_cta_builder.rb
|   |   |   |   +--- search_service.rb
|   |   |   +--- validators
|   |   |       |--- phone_validator.rb
|   |   |       +--- url_validator.rb
|   |   |--- rubocop_backup
|   |   |   |--- 20250927_034336
|   |   |   |   |--- app
|   |   |   |   |   |--- admin
|   |   |   |   |   |   |--- admin_users.rb
|   |   |   |   |   |   |--- articles.rb
|   |   |   |   |   |   |--- badges.rb
|   |   |   |   |   |   |--- banners.rb
|   |   |   |   |   |   |--- banner_globals.rb
|   |   |   |   |   |   |--- campaigns.rb
|   |   |   |   |   |   |--- campaign_reviews.rb
|   |   |   |   |   |   |--- categories.rb
|   |   |   |   |   |   |--- companies.rb
|   |   |   |   |   |   |--- contents.rb
|   |   |   |   |   |   |--- dashboard.rb
|   |   |   |   |   |   |--- feature_groups.rb
|   |   |   |   |   |   |--- forum_answers.rb
|   |   |   |   |   |   |--- forum_questions.rb
|   |   |   |   |   |   |--- leads.rb
|   |   |   |   |   |   |--- plans.rb
|   |   |   |   |   |   |--- pricings.rb
|   |   |   |   |   |   |--- products.rb
|   |   |   |   |   |   |--- product_accesses.rb
|   |   |   |   |   |   |--- reviews.rb
|   |   |   |   |   |   |--- sponsored_plans.rb
|   |   |   |   |   |   |--- subscription_plans.rb
|   |   |   |   |   |   +--- users.rb
|   |   |   |   |   |--- channels
|   |   |   |   |   |   +--- application_cable
|   |   |   |   |   |       |--- channel.rb
|   |   |   |   |   |       +--- connection.rb
|   |   |   |   |   |--- controllers
|   |   |   |   |   |   |--- api
|   |   |   |   |   |   |   +--- v1
|   |   |   |   |   |   |       |--- admin
|   |   |   |   |   |   |       |   +--- categories_controller.rb
|   |   |   |   |   |   |       |--- articles_controller.rb
|   |   |   |   |   |   |       |--- authentication_controller.rb
|   |   |   |   |   |   |       |--- badges_controller.rb
|   |   |   |   |   |   |       |--- banners_controller.rb
|   |   |   |   |   |   |       |--- banner_globals_controller.rb
|   |   |   |   |   |   |       |--- base_controller.rb
|   |   |   |   |   |   |       |--- campaigns_controller.rb
|   |   |   |   |   |   |       |--- campaign_reviews_controller.rb
|   |   |   |   |   |   |       |--- categories_controller.rb
|   |   |   |   |   |   |       |--- companies_controller.rb
|   |   |   |   |   |   |       |--- contents_controller.rb
|   |   |   |   |   |   |       |--- dashboard_controller.rb
|   |   |   |   |   |   |       |--- feature_groups_controller.rb
|   |   |   |   |   |   |       |--- forum_answers_controller.rb
|   |   |   |   |   |   |       |--- forum_questions_controller.rb
|   |   |   |   |   |   |       |--- leads_controller.rb
|   |   |   |   |   |   |       |--- plans_controller.rb
|   |   |   |   |   |   |       |--- pricings_controller.rb
|   |   |   |   |   |   |       |--- products_controller.rb
|   |   |   |   |   |   |       |--- product_accesss_controller.rb
|   |   |   |   |   |   |       |--- reviews_controller.rb
|   |   |   |   |   |   |       |--- search_controller.rb
|   |   |   |   |   |   |       |--- sponsored_plans_controller.rb
|   |   |   |   |   |   |       |--- subscription_plans_controller.rb
|   |   |   |   |   |   |       +--- users_controller.rb
|   |   |   |   |   |   |--- users
|   |   |   |   |   |   |   |--- confirmations_controller.rb
|   |   |   |   |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |   |   |   |   |   |--- passwords_controller.rb
|   |   |   |   |   |   |   |--- registrations_controller.rb
|   |   |   |   |   |   |   |--- sessions_controller.rb
|   |   |   |   |   |   |   +--- unlocks_controller.rb
|   |   |   |   |   |   |--- application_controller.rb
|   |   |   |   |   |   |--- corporate_controller.rb
|   |   |   |   |   |   |--- pages_controller.rb
|   |   |   |   |   |   +--- posts_controller.rb
|   |   |   |   |   |--- helpers
|   |   |   |   |   |   |--- api
|   |   |   |   |   |   |   +--- v1
|   |   |   |   |   |   |       |--- articles_helper.rb
|   |   |   |   |   |   |       |--- badges_helper.rb
|   |   |   |   |   |   |       |--- banners_helper.rb
|   |   |   |   |   |   |       |--- campaigns_helper.rb
|   |   |   |   |   |   |       |--- campaign_reviews_helper.rb
|   |   |   |   |   |   |       |--- categorys_helper.rb
|   |   |   |   |   |   |       |--- companys_helper.rb
|   |   |   |   |   |   |       |--- contents_helper.rb
|   |   |   |   |   |   |       |--- feature_groups_helper.rb
|   |   |   |   |   |   |       |--- forum_answers_helper.rb
|   |   |   |   |   |   |       |--- forum_questions_helper.rb
|   |   |   |   |   |   |       |--- leads_helper.rb
|   |   |   |   |   |   |       |--- plans_helper.rb
|   |   |   |   |   |   |       |--- pricings_helper.rb
|   |   |   |   |   |   |       |--- products_helper.rb
|   |   |   |   |   |   |       |--- product_accesss_helper.rb
|   |   |   |   |   |   |       |--- reviews_helper.rb
|   |   |   |   |   |   |       |--- sponsored_plans_helper.rb
|   |   |   |   |   |   |       |--- subscription_plans_helper.rb
|   |   |   |   |   |   |       +--- users_helper.rb
|   |   |   |   |   |   |--- application_helper.rb
|   |   |   |   |   |   |--- comments_helper.rb
|   |   |   |   |   |   |--- pages_helper.rb
|   |   |   |   |   |   |--- posts_helper.rb
|   |   |   |   |   |   +--- users_helper.rb
|   |   |   |   |   |--- jobs
|   |   |   |   |   |   +--- application_job.rb
|   |   |   |   |   |--- mailers
|   |   |   |   |   |   +--- application_mailer.rb
|   |   |   |   |   |--- models
|   |   |   |   |   |   |--- admin_user.rb
|   |   |   |   |   |   |--- application_record.rb
|   |   |   |   |   |   |--- article.rb
|   |   |   |   |   |   |--- badge.rb
|   |   |   |   |   |   |--- banner.rb
|   |   |   |   |   |   |--- banner_global.rb
|   |   |   |   |   |   |--- campaign.rb
|   |   |   |   |   |   |--- campaign_review.rb
|   |   |   |   |   |   |--- category.rb
|   |   |   |   |   |   |--- company.rb
|   |   |   |   |   |   |--- content.rb
|   |   |   |   |   |   |--- feature_group.rb
|   |   |   |   |   |   |--- forum_answer.rb
|   |   |   |   |   |   |--- forum_question.rb
|   |   |   |   |   |   |--- lead.rb
|   |   |   |   |   |   |--- plan.rb
|   |   |   |   |   |   |--- post.rb
|   |   |   |   |   |   |--- pricing.rb
|   |   |   |   |   |   |--- product.rb
|   |   |   |   |   |   |--- product_access.rb
|   |   |   |   |   |   |--- review.rb
|   |   |   |   |   |   |--- sponsored_plan.rb
|   |   |   |   |   |   |--- subscription_plan.rb
|   |   |   |   |   |   +--- user.rb
|   |   |   |   |   |--- notifiers
|   |   |   |   |   |   |--- application_notifier.rb
|   |   |   |   |   |   +--- comment_notifier.rb
|   |   |   |   |   |--- serializers
|   |   |   |   |   |   |--- article_serializer.rb
|   |   |   |   |   |   |--- badge_serializer.rb
|   |   |   |   |   |   |--- campaign_review_serializer.rb
|   |   |   |   |   |   |--- campaign_serializer.rb
|   |   |   |   |   |   |--- category_serializer.rb
|   |   |   |   |   |   |--- company_serializer.rb
|   |   |   |   |   |   |--- content_serializer.rb
|   |   |   |   |   |   |--- feature_group_serializer.rb
|   |   |   |   |   |   |--- forum_answer_serializer.rb
|   |   |   |   |   |   |--- forum_question_serializer.rb
|   |   |   |   |   |   |--- lead_serializer.rb
|   |   |   |   |   |   |--- plan_serializer.rb
|   |   |   |   |   |   |--- pricing_serializer.rb
|   |   |   |   |   |   |--- product_access_serializer.rb
|   |   |   |   |   |   |--- product_serializer.rb
|   |   |   |   |   |   |--- review_serializer.rb
|   |   |   |   |   |   |--- sponsored_plan_serializer.rb
|   |   |   |   |   |   |--- subscription_plan_serializer.rb
|   |   |   |   |   |   +--- user_serializer.rb
|   |   |   |   |   |--- services
|   |   |   |   |   |   |--- company_cta_builder.rb
|   |   |   |   |   |   +--- search_service.rb
|   |   |   |   |   +--- validators
|   |   |   |   |       |--- phone_validator.rb
|   |   |   |   |       +--- url_validator.rb
|   |   |   |   |--- scripts
|   |   |   |   |   |--- clean_admin_data.rb
|   |   |   |   |   |--- create_related_products.rb
|   |   |   |   |   +--- populate_admin_data.rb
|   |   |   |   |--- test
|   |   |   |   |   |--- channels
|   |   |   |   |   |   +--- application_cable
|   |   |   |   |   |       +--- connection_test.rb
|   |   |   |   |   |--- controllers
|   |   |   |   |   |   |--- api
|   |   |   |   |   |   |   +--- v1
|   |   |   |   |   |   |       |--- articles_controller_test.rb
|   |   |   |   |   |   |       |--- badges_controller_test.rb
|   |   |   |   |   |   |       |--- banners_controller_test.rb
|   |   |   |   |   |   |       |--- campaigns_controller_test.rb
|   |   |   |   |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |   |   |   |   |       |--- categorys_controller_test.rb
|   |   |   |   |   |   |       |--- companys_controller_test.rb
|   |   |   |   |   |   |       |--- contents_controller_test.rb
|   |   |   |   |   |   |       |--- feature_groups_controller_test.rb
|   |   |   |   |   |   |       |--- forum_answers_controller_test.rb
|   |   |   |   |   |   |       |--- forum_questions_controller_test.rb
|   |   |   |   |   |   |       |--- leads_controller_test.rb
|   |   |   |   |   |   |       |--- plans_controller_test.rb
|   |   |   |   |   |   |       |--- pricings_controller_test.rb
|   |   |   |   |   |   |       |--- products_controller_test.rb
|   |   |   |   |   |   |       |--- product_accesss_controller_test.rb
|   |   |   |   |   |   |       |--- reviews_controller_test.rb
|   |   |   |   |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |   |   |   |   |       |--- subscription_plans_controller_test.rb
|   |   |   |   |   |   |       +--- users_controller_test.rb
|   |   |   |   |   |   |--- comments_controller_test.rb
|   |   |   |   |   |   |--- pages_controller_test.rb
|   |   |   |   |   |   |--- posts_controller_test.rb
|   |   |   |   |   |   +--- users_controller_test.rb
|   |   |   |   |   |--- models
|   |   |   |   |   |   |--- admin_user_test.rb
|   |   |   |   |   |   |--- article_test.rb
|   |   |   |   |   |   |--- badge_test.rb
|   |   |   |   |   |   |--- banner_test.rb
|   |   |   |   |   |   |--- campaign_review_test.rb
|   |   |   |   |   |   |--- campaign_test.rb
|   |   |   |   |   |   |--- category_test.rb
|   |   |   |   |   |   |--- comment_test.rb
|   |   |   |   |   |   |--- company_test.rb
|   |   |   |   |   |   |--- content_test.rb
|   |   |   |   |   |   |--- feature_group_test.rb
|   |   |   |   |   |   |--- forum_answer_test.rb
|   |   |   |   |   |   |--- forum_question_test.rb
|   |   |   |   |   |   |--- lead_test.rb
|   |   |   |   |   |   |--- plan_test.rb
|   |   |   |   |   |   |--- post_test.rb
|   |   |   |   |   |   |--- pricing_test.rb
|   |   |   |   |   |   |--- product_access_test.rb
|   |   |   |   |   |   |--- product_test.rb
|   |   |   |   |   |   |--- review_test.rb
|   |   |   |   |   |   |--- sponsored_plan_test.rb
|   |   |   |   |   |   |--- subscription_plan_test.rb
|   |   |   |   |   |   +--- user_test.rb
|   |   |   |   |   |--- system
|   |   |   |   |   |   +--- posts_test.rb
|   |   |   |   |   |--- application_system_test_case.rb
|   |   |   |   |   +--- test_helper.rb
|   |   |   |   +--- fix_rubocop.rb
|   |   |   +--- 20250927_034912
|   |   |       |--- app
|   |   |       |   |--- admin
|   |   |       |   |   |--- admin_users.rb
|   |   |       |   |   |--- articles.rb
|   |   |       |   |   |--- badges.rb
|   |   |       |   |   |--- banners.rb
|   |   |       |   |   |--- banner_globals.rb
|   |   |       |   |   |--- campaigns.rb
|   |   |       |   |   |--- campaign_reviews.rb
|   |   |       |   |   |--- categories.rb
|   |   |       |   |   |--- companies.rb
|   |   |       |   |   |--- contents.rb
|   |   |       |   |   |--- dashboard.rb
|   |   |       |   |   |--- feature_groups.rb
|   |   |       |   |   |--- forum_answers.rb
|   |   |       |   |   |--- forum_questions.rb
|   |   |       |   |   |--- leads.rb
|   |   |       |   |   |--- plans.rb
|   |   |       |   |   |--- pricings.rb
|   |   |       |   |   |--- products.rb
|   |   |       |   |   |--- product_accesses.rb
|   |   |       |   |   |--- reviews.rb
|   |   |       |   |   |--- sponsored_plans.rb
|   |   |       |   |   |--- subscription_plans.rb
|   |   |       |   |   +--- users.rb
|   |   |       |   |--- channels
|   |   |       |   |   +--- application_cable
|   |   |       |   |       |--- channel.rb
|   |   |       |   |       +--- connection.rb
|   |   |       |   |--- controllers
|   |   |       |   |   |--- api
|   |   |       |   |   |   +--- v1
|   |   |       |   |   |       |--- admin
|   |   |       |   |   |       |   +--- categories_controller.rb
|   |   |       |   |   |       |--- articles_controller.rb
|   |   |       |   |   |       |--- authentication_controller.rb
|   |   |       |   |   |       |--- badges_controller.rb
|   |   |       |   |   |       |--- banners_controller.rb
|   |   |       |   |   |       |--- banner_globals_controller.rb
|   |   |       |   |   |       |--- base_controller.rb
|   |   |       |   |   |       |--- campaigns_controller.rb
|   |   |       |   |   |       |--- campaign_reviews_controller.rb
|   |   |       |   |   |       |--- categories_controller.rb
|   |   |       |   |   |       |--- companies_controller.rb
|   |   |       |   |   |       |--- contents_controller.rb
|   |   |       |   |   |       |--- dashboard_controller.rb
|   |   |       |   |   |       |--- feature_groups_controller.rb
|   |   |       |   |   |       |--- forum_answers_controller.rb
|   |   |       |   |   |       |--- forum_questions_controller.rb
|   |   |       |   |   |       |--- leads_controller.rb
|   |   |       |   |   |       |--- plans_controller.rb
|   |   |       |   |   |       |--- pricings_controller.rb
|   |   |       |   |   |       |--- products_controller.rb
|   |   |       |   |   |       |--- product_accesss_controller.rb
|   |   |       |   |   |       |--- reviews_controller.rb
|   |   |       |   |   |       |--- search_controller.rb
|   |   |       |   |   |       |--- sponsored_plans_controller.rb
|   |   |       |   |   |       |--- subscription_plans_controller.rb
|   |   |       |   |   |       +--- users_controller.rb
|   |   |       |   |   |--- users
|   |   |       |   |   |   |--- confirmations_controller.rb
|   |   |       |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |       |   |   |   |--- passwords_controller.rb
|   |   |       |   |   |   |--- registrations_controller.rb
|   |   |       |   |   |   |--- sessions_controller.rb
|   |   |       |   |   |   +--- unlocks_controller.rb
|   |   |       |   |   |--- application_controller.rb
|   |   |       |   |   |--- corporate_controller.rb
|   |   |       |   |   |--- pages_controller.rb
|   |   |       |   |   +--- posts_controller.rb
|   |   |       |   |--- helpers
|   |   |       |   |   |--- api
|   |   |       |   |   |   +--- v1
|   |   |       |   |   |       |--- articles_helper.rb
|   |   |       |   |   |       |--- badges_helper.rb
|   |   |       |   |   |       |--- banners_helper.rb
|   |   |       |   |   |       |--- campaigns_helper.rb
|   |   |       |   |   |       |--- campaign_reviews_helper.rb
|   |   |       |   |   |       |--- categorys_helper.rb
|   |   |       |   |   |       |--- companys_helper.rb
|   |   |       |   |   |       |--- contents_helper.rb
|   |   |       |   |   |       |--- feature_groups_helper.rb
|   |   |       |   |   |       |--- forum_answers_helper.rb
|   |   |       |   |   |       |--- forum_questions_helper.rb
|   |   |       |   |   |       |--- leads_helper.rb
|   |   |       |   |   |       |--- plans_helper.rb
|   |   |       |   |   |       |--- pricings_helper.rb
|   |   |       |   |   |       |--- products_helper.rb
|   |   |       |   |   |       |--- product_accesss_helper.rb
|   |   |       |   |   |       |--- reviews_helper.rb
|   |   |       |   |   |       |--- sponsored_plans_helper.rb
|   |   |       |   |   |       |--- subscription_plans_helper.rb
|   |   |       |   |   |       +--- users_helper.rb
|   |   |       |   |   |--- application_helper.rb
|   |   |       |   |   |--- comments_helper.rb
|   |   |       |   |   |--- pages_helper.rb
|   |   |       |   |   |--- posts_helper.rb
|   |   |       |   |   +--- users_helper.rb
|   |   |       |   |--- jobs
|   |   |       |   |   +--- application_job.rb
|   |   |       |   |--- mailers
|   |   |       |   |   +--- application_mailer.rb
|   |   |       |   |--- models
|   |   |       |   |   |--- admin_user.rb
|   |   |       |   |   |--- application_record.rb
|   |   |       |   |   |--- article.rb
|   |   |       |   |   |--- badge.rb
|   |   |       |   |   |--- banner.rb
|   |   |       |   |   |--- banner_global.rb
|   |   |       |   |   |--- campaign.rb
|   |   |       |   |   |--- campaign_review.rb
|   |   |       |   |   |--- category.rb
|   |   |       |   |   |--- company.rb
|   |   |       |   |   |--- content.rb
|   |   |       |   |   |--- feature_group.rb
|   |   |       |   |   |--- forum_answer.rb
|   |   |       |   |   |--- forum_question.rb
|   |   |       |   |   |--- lead.rb
|   |   |       |   |   |--- plan.rb
|   |   |       |   |   |--- post.rb
|   |   |       |   |   |--- pricing.rb
|   |   |       |   |   |--- product.rb
|   |   |       |   |   |--- product_access.rb
|   |   |       |   |   |--- review.rb
|   |   |       |   |   |--- sponsored_plan.rb
|   |   |       |   |   |--- subscription_plan.rb
|   |   |       |   |   +--- user.rb
|   |   |       |   |--- notifiers
|   |   |       |   |   |--- application_notifier.rb
|   |   |       |   |   +--- comment_notifier.rb
|   |   |       |   |--- serializers
|   |   |       |   |   |--- article_serializer.rb
|   |   |       |   |   |--- badge_serializer.rb
|   |   |       |   |   |--- campaign_review_serializer.rb
|   |   |       |   |   |--- campaign_serializer.rb
|   |   |       |   |   |--- category_serializer.rb
|   |   |       |   |   |--- company_serializer.rb
|   |   |       |   |   |--- content_serializer.rb
|   |   |       |   |   |--- feature_group_serializer.rb
|   |   |       |   |   |--- forum_answer_serializer.rb
|   |   |       |   |   |--- forum_question_serializer.rb
|   |   |       |   |   |--- lead_serializer.rb
|   |   |       |   |   |--- plan_serializer.rb
|   |   |       |   |   |--- pricing_serializer.rb
|   |   |       |   |   |--- product_access_serializer.rb
|   |   |       |   |   |--- product_serializer.rb
|   |   |       |   |   |--- review_serializer.rb
|   |   |       |   |   |--- sponsored_plan_serializer.rb
|   |   |       |   |   |--- subscription_plan_serializer.rb
|   |   |       |   |   +--- user_serializer.rb
|   |   |       |   |--- services
|   |   |       |   |   |--- company_cta_builder.rb
|   |   |       |   |   +--- search_service.rb
|   |   |       |   +--- validators
|   |   |       |       |--- phone_validator.rb
|   |   |       |       +--- url_validator.rb
|   |   |       |--- rubocop_backup
|   |   |       |   +--- 20250927_034336
|   |   |       |       |--- app
|   |   |       |       |   |--- admin
|   |   |       |       |   |   |--- admin_users.rb
|   |   |       |       |   |   |--- articles.rb
|   |   |       |       |   |   |--- badges.rb
|   |   |       |       |   |   |--- banners.rb
|   |   |       |       |   |   |--- banner_globals.rb
|   |   |       |       |   |   |--- campaigns.rb
|   |   |       |       |   |   |--- campaign_reviews.rb
|   |   |       |       |   |   |--- categories.rb
|   |   |       |       |   |   |--- companies.rb
|   |   |       |       |   |   |--- contents.rb
|   |   |       |       |   |   |--- dashboard.rb
|   |   |       |       |   |   |--- feature_groups.rb
|   |   |       |       |   |   |--- forum_answers.rb
|   |   |       |       |   |   |--- forum_questions.rb
|   |   |       |       |   |   |--- leads.rb
|   |   |       |       |   |   |--- plans.rb
|   |   |       |       |   |   |--- pricings.rb
|   |   |       |       |   |   |--- products.rb
|   |   |       |       |   |   |--- product_accesses.rb
|   |   |       |       |   |   |--- reviews.rb
|   |   |       |       |   |   |--- sponsored_plans.rb
|   |   |       |       |   |   |--- subscription_plans.rb
|   |   |       |       |   |   +--- users.rb
|   |   |       |       |   |--- channels
|   |   |       |       |   |   +--- application_cable
|   |   |       |       |   |       |--- channel.rb
|   |   |       |       |   |       +--- connection.rb
|   |   |       |       |   |--- controllers
|   |   |       |       |   |   |--- api
|   |   |       |       |   |   |   +--- v1
|   |   |       |       |   |   |       |--- admin
|   |   |       |       |   |   |       |   +--- categories_controller.rb
|   |   |       |       |   |   |       |--- articles_controller.rb
|   |   |       |       |   |   |       |--- authentication_controller.rb
|   |   |       |       |   |   |       |--- badges_controller.rb
|   |   |       |       |   |   |       |--- banners_controller.rb
|   |   |       |       |   |   |       |--- banner_globals_controller.rb
|   |   |       |       |   |   |       |--- base_controller.rb
|   |   |       |       |   |   |       |--- campaigns_controller.rb
|   |   |       |       |   |   |       |--- campaign_reviews_controller.rb
|   |   |       |       |   |   |       |--- categories_controller.rb
|   |   |       |       |   |   |       |--- companies_controller.rb
|   |   |       |       |   |   |       |--- contents_controller.rb
|   |   |       |       |   |   |       |--- dashboard_controller.rb
|   |   |       |       |   |   |       |--- feature_groups_controller.rb
|   |   |       |       |   |   |       |--- forum_answers_controller.rb
|   |   |       |       |   |   |       |--- forum_questions_controller.rb
|   |   |       |       |   |   |       |--- leads_controller.rb
|   |   |       |       |   |   |       |--- plans_controller.rb
|   |   |       |       |   |   |       |--- pricings_controller.rb
|   |   |       |       |   |   |       |--- products_controller.rb
|   |   |       |       |   |   |       |--- product_accesss_controller.rb
|   |   |       |       |   |   |       |--- reviews_controller.rb
|   |   |       |       |   |   |       |--- search_controller.rb
|   |   |       |       |   |   |       |--- sponsored_plans_controller.rb
|   |   |       |       |   |   |       |--- subscription_plans_controller.rb
|   |   |       |       |   |   |       +--- users_controller.rb
|   |   |       |       |   |   |--- users
|   |   |       |       |   |   |   |--- confirmations_controller.rb
|   |   |       |       |   |   |   |--- omniauth_callbacks_controller.rb
|   |   |       |       |   |   |   |--- passwords_controller.rb
|   |   |       |       |   |   |   |--- registrations_controller.rb
|   |   |       |       |   |   |   |--- sessions_controller.rb
|   |   |       |       |   |   |   +--- unlocks_controller.rb
|   |   |       |       |   |   |--- application_controller.rb
|   |   |       |       |   |   |--- corporate_controller.rb
|   |   |       |       |   |   |--- pages_controller.rb
|   |   |       |       |   |   +--- posts_controller.rb
|   |   |       |       |   |--- helpers
|   |   |       |       |   |   |--- api
|   |   |       |       |   |   |   +--- v1
|   |   |       |       |   |   |       |--- articles_helper.rb
|   |   |       |       |   |   |       |--- badges_helper.rb
|   |   |       |       |   |   |       |--- banners_helper.rb
|   |   |       |       |   |   |       |--- campaigns_helper.rb
|   |   |       |       |   |   |       |--- campaign_reviews_helper.rb
|   |   |       |       |   |   |       |--- categorys_helper.rb
|   |   |       |       |   |   |       |--- companys_helper.rb
|   |   |       |       |   |   |       |--- contents_helper.rb
|   |   |       |       |   |   |       |--- feature_groups_helper.rb
|   |   |       |       |   |   |       |--- forum_answers_helper.rb
|   |   |       |       |   |   |       |--- forum_questions_helper.rb
|   |   |       |       |   |   |       |--- leads_helper.rb
|   |   |       |       |   |   |       |--- plans_helper.rb
|   |   |       |       |   |   |       |--- pricings_helper.rb
|   |   |       |       |   |   |       |--- products_helper.rb
|   |   |       |       |   |   |       |--- product_accesss_helper.rb
|   |   |       |       |   |   |       |--- reviews_helper.rb
|   |   |       |       |   |   |       |--- sponsored_plans_helper.rb
|   |   |       |       |   |   |       |--- subscription_plans_helper.rb
|   |   |       |       |   |   |       +--- users_helper.rb
|   |   |       |       |   |   |--- application_helper.rb
|   |   |       |       |   |   |--- comments_helper.rb
|   |   |       |       |   |   |--- pages_helper.rb
|   |   |       |       |   |   |--- posts_helper.rb
|   |   |       |       |   |   +--- users_helper.rb
|   |   |       |       |   |--- jobs
|   |   |       |       |   |   +--- application_job.rb
|   |   |       |       |   |--- mailers
|   |   |       |       |   |   +--- application_mailer.rb
|   |   |       |       |   |--- models
|   |   |       |       |   |   |--- admin_user.rb
|   |   |       |       |   |   |--- application_record.rb
|   |   |       |       |   |   |--- article.rb
|   |   |       |       |   |   |--- badge.rb
|   |   |       |       |   |   |--- banner.rb
|   |   |       |       |   |   |--- banner_global.rb
|   |   |       |       |   |   |--- campaign.rb
|   |   |       |       |   |   |--- campaign_review.rb
|   |   |       |       |   |   |--- category.rb
|   |   |       |       |   |   |--- company.rb
|   |   |       |       |   |   |--- content.rb
|   |   |       |       |   |   |--- feature_group.rb
|   |   |       |       |   |   |--- forum_answer.rb
|   |   |       |       |   |   |--- forum_question.rb
|   |   |       |       |   |   |--- lead.rb
|   |   |       |       |   |   |--- plan.rb
|   |   |       |       |   |   |--- post.rb
|   |   |       |       |   |   |--- pricing.rb
|   |   |       |       |   |   |--- product.rb
|   |   |       |       |   |   |--- product_access.rb
|   |   |       |       |   |   |--- review.rb
|   |   |       |       |   |   |--- sponsored_plan.rb
|   |   |       |       |   |   |--- subscription_plan.rb
|   |   |       |       |   |   +--- user.rb
|   |   |       |       |   |--- notifiers
|   |   |       |       |   |   |--- application_notifier.rb
|   |   |       |       |   |   +--- comment_notifier.rb
|   |   |       |       |   |--- serializers
|   |   |       |       |   |   |--- article_serializer.rb
|   |   |       |       |   |   |--- badge_serializer.rb
|   |   |       |       |   |   |--- campaign_review_serializer.rb
|   |   |       |       |   |   |--- campaign_serializer.rb
|   |   |       |       |   |   |--- category_serializer.rb
|   |   |       |       |   |   |--- company_serializer.rb
|   |   |       |       |   |   |--- content_serializer.rb
|   |   |       |       |   |   |--- feature_group_serializer.rb
|   |   |       |       |   |   |--- forum_answer_serializer.rb
|   |   |       |       |   |   |--- forum_question_serializer.rb
|   |   |       |       |   |   |--- lead_serializer.rb
|   |   |       |       |   |   |--- plan_serializer.rb
|   |   |       |       |   |   |--- pricing_serializer.rb
|   |   |       |       |   |   |--- product_access_serializer.rb
|   |   |       |       |   |   |--- product_serializer.rb
|   |   |       |       |   |   |--- review_serializer.rb
|   |   |       |       |   |   |--- sponsored_plan_serializer.rb
|   |   |       |       |   |   |--- subscription_plan_serializer.rb
|   |   |       |       |   |   +--- user_serializer.rb
|   |   |       |       |   |--- services
|   |   |       |       |   |   |--- company_cta_builder.rb
|   |   |       |       |   |   +--- search_service.rb
|   |   |       |       |   +--- validators
|   |   |       |       |       |--- phone_validator.rb
|   |   |       |       |       +--- url_validator.rb
|   |   |       |       |--- scripts
|   |   |       |       |   |--- clean_admin_data.rb
|   |   |       |       |   |--- create_related_products.rb
|   |   |       |       |   +--- populate_admin_data.rb
|   |   |       |       |--- test
|   |   |       |       |   |--- channels
|   |   |       |       |   |   +--- application_cable
|   |   |       |       |   |       +--- connection_test.rb
|   |   |       |       |   |--- controllers
|   |   |       |       |   |   |--- api
|   |   |       |       |   |   |   +--- v1
|   |   |       |       |   |   |       |--- articles_controller_test.rb
|   |   |       |       |   |   |       |--- badges_controller_test.rb
|   |   |       |       |   |   |       |--- banners_controller_test.rb
|   |   |       |       |   |   |       |--- campaigns_controller_test.rb
|   |   |       |       |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |       |       |   |   |       |--- categorys_controller_test.rb
|   |   |       |       |   |   |       |--- companys_controller_test.rb
|   |   |       |       |   |   |       |--- contents_controller_test.rb
|   |   |       |       |   |   |       |--- feature_groups_controller_test.rb
|   |   |       |       |   |   |       |--- forum_answers_controller_test.rb
|   |   |       |       |   |   |       |--- forum_questions_controller_test.rb
|   |   |       |       |   |   |       |--- leads_controller_test.rb
|   |   |       |       |   |   |       |--- plans_controller_test.rb
|   |   |       |       |   |   |       |--- pricings_controller_test.rb
|   |   |       |       |   |   |       |--- products_controller_test.rb
|   |   |       |       |   |   |       |--- product_accesss_controller_test.rb
|   |   |       |       |   |   |       |--- reviews_controller_test.rb
|   |   |       |       |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |       |       |   |   |       |--- subscription_plans_controller_test.rb
|   |   |       |       |   |   |       +--- users_controller_test.rb
|   |   |       |       |   |   |--- comments_controller_test.rb
|   |   |       |       |   |   |--- pages_controller_test.rb
|   |   |       |       |   |   |--- posts_controller_test.rb
|   |   |       |       |   |   +--- users_controller_test.rb
|   |   |       |       |   |--- models
|   |   |       |       |   |   |--- admin_user_test.rb
|   |   |       |       |   |   |--- article_test.rb
|   |   |       |       |   |   |--- badge_test.rb
|   |   |       |       |   |   |--- banner_test.rb
|   |   |       |       |   |   |--- campaign_review_test.rb
|   |   |       |       |   |   |--- campaign_test.rb
|   |   |       |       |   |   |--- category_test.rb
|   |   |       |       |   |   |--- comment_test.rb
|   |   |       |       |   |   |--- company_test.rb
|   |   |       |       |   |   |--- content_test.rb
|   |   |       |       |   |   |--- feature_group_test.rb
|   |   |       |       |   |   |--- forum_answer_test.rb
|   |   |       |       |   |   |--- forum_question_test.rb
|   |   |       |       |   |   |--- lead_test.rb
|   |   |       |       |   |   |--- plan_test.rb
|   |   |       |       |   |   |--- post_test.rb
|   |   |       |       |   |   |--- pricing_test.rb
|   |   |       |       |   |   |--- product_access_test.rb
|   |   |       |       |   |   |--- product_test.rb
|   |   |       |       |   |   |--- review_test.rb
|   |   |       |       |   |   |--- sponsored_plan_test.rb
|   |   |       |       |   |   |--- subscription_plan_test.rb
|   |   |       |       |   |   +--- user_test.rb
|   |   |       |       |   |--- system
|   |   |       |       |   |   +--- posts_test.rb
|   |   |       |       |   |--- application_system_test_case.rb
|   |   |       |       |   +--- test_helper.rb
|   |   |       |       +--- fix_rubocop.rb
|   |   |       |--- scripts
|   |   |       |   |--- clean_admin_data.rb
|   |   |       |   |--- create_related_products.rb
|   |   |       |   +--- populate_admin_data.rb
|   |   |       |--- test
|   |   |       |   |--- channels
|   |   |       |   |   +--- application_cable
|   |   |       |   |       +--- connection_test.rb
|   |   |       |   |--- controllers
|   |   |       |   |   |--- api
|   |   |       |   |   |   +--- v1
|   |   |       |   |   |       |--- articles_controller_test.rb
|   |   |       |   |   |       |--- badges_controller_test.rb
|   |   |       |   |   |       |--- banners_controller_test.rb
|   |   |       |   |   |       |--- campaigns_controller_test.rb
|   |   |       |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |       |   |   |       |--- categorys_controller_test.rb
|   |   |       |   |   |       |--- companys_controller_test.rb
|   |   |       |   |   |       |--- contents_controller_test.rb
|   |   |       |   |   |       |--- feature_groups_controller_test.rb
|   |   |       |   |   |       |--- forum_answers_controller_test.rb
|   |   |       |   |   |       |--- forum_questions_controller_test.rb
|   |   |       |   |   |       |--- leads_controller_test.rb
|   |   |       |   |   |       |--- plans_controller_test.rb
|   |   |       |   |   |       |--- pricings_controller_test.rb
|   |   |       |   |   |       |--- products_controller_test.rb
|   |   |       |   |   |       |--- product_accesss_controller_test.rb
|   |   |       |   |   |       |--- reviews_controller_test.rb
|   |   |       |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |       |   |   |       |--- subscription_plans_controller_test.rb
|   |   |       |   |   |       +--- users_controller_test.rb
|   |   |       |   |   |--- comments_controller_test.rb
|   |   |       |   |   |--- pages_controller_test.rb
|   |   |       |   |   |--- posts_controller_test.rb
|   |   |       |   |   +--- users_controller_test.rb
|   |   |       |   |--- models
|   |   |       |   |   |--- admin_user_test.rb
|   |   |       |   |   |--- article_test.rb
|   |   |       |   |   |--- badge_test.rb
|   |   |       |   |   |--- banner_test.rb
|   |   |       |   |   |--- campaign_review_test.rb
|   |   |       |   |   |--- campaign_test.rb
|   |   |       |   |   |--- category_test.rb
|   |   |       |   |   |--- comment_test.rb
|   |   |       |   |   |--- company_test.rb
|   |   |       |   |   |--- content_test.rb
|   |   |       |   |   |--- feature_group_test.rb
|   |   |       |   |   |--- forum_answer_test.rb
|   |   |       |   |   |--- forum_question_test.rb
|   |   |       |   |   |--- lead_test.rb
|   |   |       |   |   |--- plan_test.rb
|   |   |       |   |   |--- post_test.rb
|   |   |       |   |   |--- pricing_test.rb
|   |   |       |   |   |--- product_access_test.rb
|   |   |       |   |   |--- product_test.rb
|   |   |       |   |   |--- review_test.rb
|   |   |       |   |   |--- sponsored_plan_test.rb
|   |   |       |   |   |--- subscription_plan_test.rb
|   |   |       |   |   +--- user_test.rb
|   |   |       |   |--- system
|   |   |       |   |   +--- posts_test.rb
|   |   |       |   |--- application_system_test_case.rb
|   |   |       |   +--- test_helper.rb
|   |   |       +--- fix_rubocop.rb
|   |   |--- scripts
|   |   |   |--- clean_admin_data.rb
|   |   |   |--- create_related_products.rb
|   |   |   +--- populate_admin_data.rb
|   |   |--- test
|   |   |   |--- channels
|   |   |   |   +--- application_cable
|   |   |   |       +--- connection_test.rb
|   |   |   |--- controllers
|   |   |   |   |--- api
|   |   |   |   |   +--- v1
|   |   |   |   |       |--- articles_controller_test.rb
|   |   |   |   |       |--- badges_controller_test.rb
|   |   |   |   |       |--- banners_controller_test.rb
|   |   |   |   |       |--- campaigns_controller_test.rb
|   |   |   |   |       |--- campaign_reviews_controller_test.rb
|   |   |   |   |       |--- categorys_controller_test.rb
|   |   |   |   |       |--- companys_controller_test.rb
|   |   |   |   |       |--- contents_controller_test.rb
|   |   |   |   |       |--- feature_groups_controller_test.rb
|   |   |   |   |       |--- forum_answers_controller_test.rb
|   |   |   |   |       |--- forum_questions_controller_test.rb
|   |   |   |   |       |--- leads_controller_test.rb
|   |   |   |   |       |--- plans_controller_test.rb
|   |   |   |   |       |--- pricings_controller_test.rb
|   |   |   |   |       |--- products_controller_test.rb
|   |   |   |   |       |--- product_accesss_controller_test.rb
|   |   |   |   |       |--- reviews_controller_test.rb
|   |   |   |   |       |--- sponsored_plans_controller_test.rb
|   |   |   |   |       |--- subscription_plans_controller_test.rb
|   |   |   |   |       +--- users_controller_test.rb
|   |   |   |   |--- comments_controller_test.rb
|   |   |   |   |--- pages_controller_test.rb
|   |   |   |   |--- posts_controller_test.rb
|   |   |   |   +--- users_controller_test.rb
|   |   |   |--- models
|   |   |   |   |--- admin_user_test.rb
|   |   |   |   |--- article_test.rb
|   |   |   |   |--- badge_test.rb
|   |   |   |   |--- banner_test.rb
|   |   |   |   |--- campaign_review_test.rb
|   |   |   |   |--- campaign_test.rb
|   |   |   |   |--- category_test.rb
|   |   |   |   |--- comment_test.rb
|   |   |   |   |--- company_test.rb
|   |   |   |   |--- content_test.rb
|   |   |   |   |--- feature_group_test.rb
|   |   |   |   |--- forum_answer_test.rb
|   |   |   |   |--- forum_question_test.rb
|   |   |   |   |--- lead_test.rb
|   |   |   |   |--- plan_test.rb
|   |   |   |   |--- post_test.rb
|   |   |   |   |--- pricing_test.rb
|   |   |   |   |--- product_access_test.rb
|   |   |   |   |--- product_test.rb
|   |   |   |   |--- review_test.rb
|   |   |   |   |--- sponsored_plan_test.rb
|   |   |   |   |--- subscription_plan_test.rb
|   |   |   |   +--- user_test.rb
|   |   |   |--- system
|   |   |   |   +--- posts_test.rb
|   |   |   |--- application_system_test_case.rb
|   |   |   +--- test_helper.rb
|   |   +--- fix_rubocop.rb
|   +--- 20250927_035757
|       |--- app
|       |   |--- admin
|       |   |   |--- admin_users.rb
|       |   |   |--- articles.rb
|       |   |   |--- badges.rb
|       |   |   |--- banners.rb
|       |   |   |--- banner_globals.rb
|       |   |   |--- campaigns.rb
|       |   |   |--- campaign_reviews.rb
|       |   |   |--- categories.rb
|       |   |   |--- companies.rb
|       |   |   |--- contents.rb
|       |   |   |--- dashboard.rb
|       |   |   |--- feature_groups.rb
|       |   |   |--- forum_answers.rb
|       |   |   |--- forum_questions.rb
|       |   |   |--- leads.rb
|       |   |   |--- plans.rb
|       |   |   |--- pricings.rb
|       |   |   |--- products.rb
|       |   |   |--- product_accesses.rb
|       |   |   |--- reviews.rb
|       |   |   |--- sponsored_plans.rb
|       |   |   |--- subscription_plans.rb
|       |   |   +--- users.rb
|       |   |--- channels
|       |   |   +--- application_cable
|       |   |       |--- channel.rb
|       |   |       +--- connection.rb
|       |   |--- controllers
|       |   |   |--- api
|       |   |   |   +--- v1
|       |   |   |       |--- admin
|       |   |   |       |   +--- categories_controller.rb
|       |   |   |       |--- articles_controller.rb
|       |   |   |       |--- authentication_controller.rb
|       |   |   |       |--- badges_controller.rb
|       |   |   |       |--- banners_controller.rb
|       |   |   |       |--- banner_globals_controller.rb
|       |   |   |       |--- base_controller.rb
|       |   |   |       |--- campaigns_controller.rb
|       |   |   |       |--- campaign_reviews_controller.rb
|       |   |   |       |--- categories_controller.rb
|       |   |   |       |--- companies_controller.rb
|       |   |   |       |--- contents_controller.rb
|       |   |   |       |--- dashboard_controller.rb
|       |   |   |       |--- feature_groups_controller.rb
|       |   |   |       |--- forum_answers_controller.rb
|       |   |   |       |--- forum_questions_controller.rb
|       |   |   |       |--- leads_controller.rb
|       |   |   |       |--- plans_controller.rb
|       |   |   |       |--- pricings_controller.rb
|       |   |   |       |--- products_controller.rb
|       |   |   |       |--- product_accesss_controller.rb
|       |   |   |       |--- reviews_controller.rb
|       |   |   |       |--- search_controller.rb
|       |   |   |       |--- sponsored_plans_controller.rb
|       |   |   |       |--- subscription_plans_controller.rb
|       |   |   |       +--- users_controller.rb
|       |   |   |--- users
|       |   |   |   |--- confirmations_controller.rb
|       |   |   |   |--- omniauth_callbacks_controller.rb
|       |   |   |   |--- passwords_controller.rb
|       |   |   |   |--- registrations_controller.rb
|       |   |   |   |--- sessions_controller.rb
|       |   |   |   +--- unlocks_controller.rb
|       |   |   |--- application_controller.rb
|       |   |   |--- corporate_controller.rb
|       |   |   |--- pages_controller.rb
|       |   |   +--- posts_controller.rb
|       |   |--- helpers
|       |   |   |--- api
|       |   |   |   +--- v1
|       |   |   |       |--- articles_helper.rb
|       |   |   |       |--- badges_helper.rb
|       |   |   |       |--- banners_helper.rb
|       |   |   |       |--- campaigns_helper.rb
|       |   |   |       |--- campaign_reviews_helper.rb
|       |   |   |       |--- categorys_helper.rb
|       |   |   |       |--- companys_helper.rb
|       |   |   |       |--- contents_helper.rb
|       |   |   |       |--- feature_groups_helper.rb
|       |   |   |       |--- forum_answers_helper.rb
|       |   |   |       |--- forum_questions_helper.rb
|       |   |   |       |--- leads_helper.rb
|       |   |   |       |--- plans_helper.rb
|       |   |   |       |--- pricings_helper.rb
|       |   |   |       |--- products_helper.rb
|       |   |   |       |--- product_accesss_helper.rb
|       |   |   |       |--- reviews_helper.rb
|       |   |   |       |--- sponsored_plans_helper.rb
|       |   |   |       |--- subscription_plans_helper.rb
|       |   |   |       +--- users_helper.rb
|       |   |   |--- application_helper.rb
|       |   |   |--- comments_helper.rb
|       |   |   |--- pages_helper.rb
|       |   |   |--- posts_helper.rb
|       |   |   +--- users_helper.rb
|       |   |--- jobs
|       |   |   +--- application_job.rb
|       |   |--- mailers
|       |   |   +--- application_mailer.rb
|       |   |--- models
|       |   |   |--- admin_user.rb
|       |   |   |--- application_record.rb
|       |   |   |--- article.rb
|       |   |   |--- badge.rb
|       |   |   |--- banner.rb
|       |   |   |--- banner_global.rb
|       |   |   |--- campaign.rb
|       |   |   |--- campaign_review.rb
|       |   |   |--- category.rb
|       |   |   |--- company.rb
|       |   |   |--- content.rb
|       |   |   |--- feature_group.rb
|       |   |   |--- forum_answer.rb
|       |   |   |--- forum_question.rb
|       |   |   |--- lead.rb
|       |   |   |--- plan.rb
|       |   |   |--- post.rb
|       |   |   |--- pricing.rb
|       |   |   |--- product.rb
|       |   |   |--- product_access.rb
|       |   |   |--- review.rb
|       |   |   |--- sponsored_plan.rb
|       |   |   |--- subscription_plan.rb
|       |   |   +--- user.rb
|       |   |--- notifiers
|       |   |   |--- application_notifier.rb
|       |   |   +--- comment_notifier.rb
|       |   |--- serializers
|       |   |   |--- article_serializer.rb
|       |   |   |--- badge_serializer.rb
|       |   |   |--- campaign_review_serializer.rb
|       |   |   |--- campaign_serializer.rb
|       |   |   |--- category_serializer.rb
|       |   |   |--- company_serializer.rb
|       |   |   |--- content_serializer.rb
|       |   |   |--- feature_group_serializer.rb
|       |   |   |--- forum_answer_serializer.rb
|       |   |   |--- forum_question_serializer.rb
|       |   |   |--- lead_serializer.rb
|       |   |   |--- plan_serializer.rb
|       |   |   |--- pricing_serializer.rb
|       |   |   |--- product_access_serializer.rb
|       |   |   |--- product_serializer.rb
|       |   |   |--- review_serializer.rb
|       |   |   |--- sponsored_plan_serializer.rb
|       |   |   |--- subscription_plan_serializer.rb
|       |   |   +--- user_serializer.rb
|       |   |--- services
|       |   |   |--- company_cta_builder.rb
|       |   |   +--- search_service.rb
|       |   +--- validators
|       |       |--- phone_validator.rb
|       |       +--- url_validator.rb
|       |--- rubocop_backup
|       |   |--- 20250927_034336
|       |   |   |--- app
|       |   |   |   |--- admin
|       |   |   |   |   |--- admin_users.rb
|       |   |   |   |   |--- articles.rb
|       |   |   |   |   |--- badges.rb
|       |   |   |   |   |--- banners.rb
|       |   |   |   |   |--- banner_globals.rb
|       |   |   |   |   |--- campaigns.rb
|       |   |   |   |   |--- campaign_reviews.rb
|       |   |   |   |   |--- categories.rb
|       |   |   |   |   |--- companies.rb
|       |   |   |   |   |--- contents.rb
|       |   |   |   |   |--- dashboard.rb
|       |   |   |   |   |--- feature_groups.rb
|       |   |   |   |   |--- forum_answers.rb
|       |   |   |   |   |--- forum_questions.rb
|       |   |   |   |   |--- leads.rb
|       |   |   |   |   |--- plans.rb
|       |   |   |   |   |--- pricings.rb
|       |   |   |   |   |--- products.rb
|       |   |   |   |   |--- product_accesses.rb
|       |   |   |   |   |--- reviews.rb
|       |   |   |   |   |--- sponsored_plans.rb
|       |   |   |   |   |--- subscription_plans.rb
|       |   |   |   |   +--- users.rb
|       |   |   |   |--- channels
|       |   |   |   |   +--- application_cable
|       |   |   |   |       |--- channel.rb
|       |   |   |   |       +--- connection.rb
|       |   |   |   |--- controllers
|       |   |   |   |   |--- api
|       |   |   |   |   |   +--- v1
|       |   |   |   |   |       |--- admin
|       |   |   |   |   |       |   +--- categories_controller.rb
|       |   |   |   |   |       |--- articles_controller.rb
|       |   |   |   |   |       |--- authentication_controller.rb
|       |   |   |   |   |       |--- badges_controller.rb
|       |   |   |   |   |       |--- banners_controller.rb
|       |   |   |   |   |       |--- banner_globals_controller.rb
|       |   |   |   |   |       |--- base_controller.rb
|       |   |   |   |   |       |--- campaigns_controller.rb
|       |   |   |   |   |       |--- campaign_reviews_controller.rb
|       |   |   |   |   |       |--- categories_controller.rb
|       |   |   |   |   |       |--- companies_controller.rb
|       |   |   |   |   |       |--- contents_controller.rb
|       |   |   |   |   |       |--- dashboard_controller.rb
|       |   |   |   |   |       |--- feature_groups_controller.rb
|       |   |   |   |   |       |--- forum_answers_controller.rb
|       |   |   |   |   |       |--- forum_questions_controller.rb
|       |   |   |   |   |       |--- leads_controller.rb
|       |   |   |   |   |       |--- plans_controller.rb
|       |   |   |   |   |       |--- pricings_controller.rb
|       |   |   |   |   |       |--- products_controller.rb
|       |   |   |   |   |       |--- product_accesss_controller.rb
|       |   |   |   |   |       |--- reviews_controller.rb
|       |   |   |   |   |       |--- search_controller.rb
|       |   |   |   |   |       |--- sponsored_plans_controller.rb
|       |   |   |   |   |       |--- subscription_plans_controller.rb
|       |   |   |   |   |       +--- users_controller.rb
|       |   |   |   |   |--- users
|       |   |   |   |   |   |--- confirmations_controller.rb
|       |   |   |   |   |   |--- omniauth_callbacks_controller.rb
|       |   |   |   |   |   |--- passwords_controller.rb
|       |   |   |   |   |   |--- registrations_controller.rb
|       |   |   |   |   |   |--- sessions_controller.rb
|       |   |   |   |   |   +--- unlocks_controller.rb
|       |   |   |   |   |--- application_controller.rb
|       |   |   |   |   |--- corporate_controller.rb
|       |   |   |   |   |--- pages_controller.rb
|       |   |   |   |   +--- posts_controller.rb
|       |   |   |   |--- helpers
|       |   |   |   |   |--- api
|       |   |   |   |   |   +--- v1
|       |   |   |   |   |       |--- articles_helper.rb
|       |   |   |   |   |       |--- badges_helper.rb
|       |   |   |   |   |       |--- banners_helper.rb
|       |   |   |   |   |       |--- campaigns_helper.rb
|       |   |   |   |   |       |--- campaign_reviews_helper.rb
|       |   |   |   |   |       |--- categorys_helper.rb
|       |   |   |   |   |       |--- companys_helper.rb
|       |   |   |   |   |       |--- contents_helper.rb
|       |   |   |   |   |       |--- feature_groups_helper.rb
|       |   |   |   |   |       |--- forum_answers_helper.rb
|       |   |   |   |   |       |--- forum_questions_helper.rb
|       |   |   |   |   |       |--- leads_helper.rb
|       |   |   |   |   |       |--- plans_helper.rb
|       |   |   |   |   |       |--- pricings_helper.rb
|       |   |   |   |   |       |--- products_helper.rb
|       |   |   |   |   |       |--- product_accesss_helper.rb
|       |   |   |   |   |       |--- reviews_helper.rb
|       |   |   |   |   |       |--- sponsored_plans_helper.rb
|       |   |   |   |   |       |--- subscription_plans_helper.rb
|       |   |   |   |   |       +--- users_helper.rb
|       |   |   |   |   |--- application_helper.rb
|       |   |   |   |   |--- comments_helper.rb
|       |   |   |   |   |--- pages_helper.rb
|       |   |   |   |   |--- posts_helper.rb
|       |   |   |   |   +--- users_helper.rb
|       |   |   |   |--- jobs
|       |   |   |   |   +--- application_job.rb
|       |   |   |   |--- mailers
|       |   |   |   |   +--- application_mailer.rb
|       |   |   |   |--- models
|       |   |   |   |   |--- admin_user.rb
|       |   |   |   |   |--- application_record.rb
|       |   |   |   |   |--- article.rb
|       |   |   |   |   |--- badge.rb
|       |   |   |   |   |--- banner.rb
|       |   |   |   |   |--- banner_global.rb
|       |   |   |   |   |--- campaign.rb
|       |   |   |   |   |--- campaign_review.rb
|       |   |   |   |   |--- category.rb
|       |   |   |   |   |--- company.rb
|       |   |   |   |   |--- content.rb
|       |   |   |   |   |--- feature_group.rb
|       |   |   |   |   |--- forum_answer.rb
|       |   |   |   |   |--- forum_question.rb
|       |   |   |   |   |--- lead.rb
|       |   |   |   |   |--- plan.rb
|       |   |   |   |   |--- post.rb
|       |   |   |   |   |--- pricing.rb
|       |   |   |   |   |--- product.rb
|       |   |   |   |   |--- product_access.rb
|       |   |   |   |   |--- review.rb
|       |   |   |   |   |--- sponsored_plan.rb
|       |   |   |   |   |--- subscription_plan.rb
|       |   |   |   |   +--- user.rb
|       |   |   |   |--- notifiers
|       |   |   |   |   |--- application_notifier.rb
|       |   |   |   |   +--- comment_notifier.rb
|       |   |   |   |--- serializers
|       |   |   |   |   |--- article_serializer.rb
|       |   |   |   |   |--- badge_serializer.rb
|       |   |   |   |   |--- campaign_review_serializer.rb
|       |   |   |   |   |--- campaign_serializer.rb
|       |   |   |   |   |--- category_serializer.rb
|       |   |   |   |   |--- company_serializer.rb
|       |   |   |   |   |--- content_serializer.rb
|       |   |   |   |   |--- feature_group_serializer.rb
|       |   |   |   |   |--- forum_answer_serializer.rb
|       |   |   |   |   |--- forum_question_serializer.rb
|       |   |   |   |   |--- lead_serializer.rb
|       |   |   |   |   |--- plan_serializer.rb
|       |   |   |   |   |--- pricing_serializer.rb
|       |   |   |   |   |--- product_access_serializer.rb
|       |   |   |   |   |--- product_serializer.rb
|       |   |   |   |   |--- review_serializer.rb
|       |   |   |   |   |--- sponsored_plan_serializer.rb
|       |   |   |   |   |--- subscription_plan_serializer.rb
|       |   |   |   |   +--- user_serializer.rb
|       |   |   |   |--- services
|       |   |   |   |   |--- company_cta_builder.rb
|       |   |   |   |   +--- search_service.rb
|       |   |   |   +--- validators
|       |   |   |       |--- phone_validator.rb
|       |   |   |       +--- url_validator.rb
|       |   |   |--- scripts
|       |   |   |   |--- clean_admin_data.rb
|       |   |   |   |--- create_related_products.rb
|       |   |   |   +--- populate_admin_data.rb
|       |   |   |--- test
|       |   |   |   |--- channels
|       |   |   |   |   +--- application_cable
|       |   |   |   |       +--- connection_test.rb
|       |   |   |   |--- controllers
|       |   |   |   |   |--- api
|       |   |   |   |   |   +--- v1
|       |   |   |   |   |       |--- articles_controller_test.rb
|       |   |   |   |   |       |--- badges_controller_test.rb
|       |   |   |   |   |       |--- banners_controller_test.rb
|       |   |   |   |   |       |--- campaigns_controller_test.rb
|       |   |   |   |   |       |--- campaign_reviews_controller_test.rb
|       |   |   |   |   |       |--- categorys_controller_test.rb
|       |   |   |   |   |       |--- companys_controller_test.rb
|       |   |   |   |   |       |--- contents_controller_test.rb
|       |   |   |   |   |       |--- feature_groups_controller_test.rb
|       |   |   |   |   |       |--- forum_answers_controller_test.rb
|       |   |   |   |   |       |--- forum_questions_controller_test.rb
|       |   |   |   |   |       |--- leads_controller_test.rb
|       |   |   |   |   |       |--- plans_controller_test.rb
|       |   |   |   |   |       |--- pricings_controller_test.rb
|       |   |   |   |   |       |--- products_controller_test.rb
|       |   |   |   |   |       |--- product_accesss_controller_test.rb
|       |   |   |   |   |       |--- reviews_controller_test.rb
|       |   |   |   |   |       |--- sponsored_plans_controller_test.rb
|       |   |   |   |   |       |--- subscription_plans_controller_test.rb
|       |   |   |   |   |       +--- users_controller_test.rb
|       |   |   |   |   |--- comments_controller_test.rb
|       |   |   |   |   |--- pages_controller_test.rb
|       |   |   |   |   |--- posts_controller_test.rb
|       |   |   |   |   +--- users_controller_test.rb
|       |   |   |   |--- models
|       |   |   |   |   |--- admin_user_test.rb
|       |   |   |   |   |--- article_test.rb
|       |   |   |   |   |--- badge_test.rb
|       |   |   |   |   |--- banner_test.rb
|       |   |   |   |   |--- campaign_review_test.rb
|       |   |   |   |   |--- campaign_test.rb
|       |   |   |   |   |--- category_test.rb
|       |   |   |   |   |--- comment_test.rb
|       |   |   |   |   |--- company_test.rb
|       |   |   |   |   |--- content_test.rb
|       |   |   |   |   |--- feature_group_test.rb
|       |   |   |   |   |--- forum_answer_test.rb
|       |   |   |   |   |--- forum_question_test.rb
|       |   |   |   |   |--- lead_test.rb
|       |   |   |   |   |--- plan_test.rb
|       |   |   |   |   |--- post_test.rb
|       |   |   |   |   |--- pricing_test.rb
|       |   |   |   |   |--- product_access_test.rb
|       |   |   |   |   |--- product_test.rb
|       |   |   |   |   |--- review_test.rb
|       |   |   |   |   |--- sponsored_plan_test.rb
|       |   |   |   |   |--- subscription_plan_test.rb
|       |   |   |   |   +--- user_test.rb
|       |   |   |   |--- system
|       |   |   |   |   +--- posts_test.rb
|       |   |   |   |--- application_system_test_case.rb
|       |   |   |   +--- test_helper.rb
|       |   |   +--- fix_rubocop.rb
|       |   |--- 20250927_034912
|       |   |   |--- app
|       |   |   |   |--- admin
|       |   |   |   |   |--- admin_users.rb
|       |   |   |   |   |--- articles.rb
|       |   |   |   |   |--- badges.rb
|       |   |   |   |   |--- banners.rb
|       |   |   |   |   |--- banner_globals.rb
|       |   |   |   |   |--- campaigns.rb
|       |   |   |   |   |--- campaign_reviews.rb
|       |   |   |   |   |--- categories.rb
|       |   |   |   |   |--- companies.rb
|       |   |   |   |   |--- contents.rb
|       |   |   |   |   |--- dashboard.rb
|       |   |   |   |   |--- feature_groups.rb
|       |   |   |   |   |--- forum_answers.rb
|       |   |   |   |   |--- forum_questions.rb
|       |   |   |   |   |--- leads.rb
|       |   |   |   |   |--- plans.rb
|       |   |   |   |   |--- pricings.rb
|       |   |   |   |   |--- products.rb
|       |   |   |   |   |--- product_accesses.rb
|       |   |   |   |   |--- reviews.rb
|       |   |   |   |   |--- sponsored_plans.rb
|       |   |   |   |   |--- subscription_plans.rb
|       |   |   |   |   +--- users.rb
|       |   |   |   |--- channels
|       |   |   |   |   +--- application_cable
|       |   |   |   |       |--- channel.rb
|       |   |   |   |       +--- connection.rb
|       |   |   |   |--- controllers
|       |   |   |   |   |--- api
|       |   |   |   |   |   +--- v1
|       |   |   |   |   |       |--- admin
|       |   |   |   |   |       |   +--- categories_controller.rb
|       |   |   |   |   |       |--- articles_controller.rb
|       |   |   |   |   |       |--- authentication_controller.rb
|       |   |   |   |   |       |--- badges_controller.rb
|       |   |   |   |   |       |--- banners_controller.rb
|       |   |   |   |   |       |--- banner_globals_controller.rb
|       |   |   |   |   |       |--- base_controller.rb
|       |   |   |   |   |       |--- campaigns_controller.rb
|       |   |   |   |   |       |--- campaign_reviews_controller.rb
|       |   |   |   |   |       |--- categories_controller.rb
|       |   |   |   |   |       |--- companies_controller.rb
|       |   |   |   |   |       |--- contents_controller.rb
|       |   |   |   |   |       |--- dashboard_controller.rb
|       |   |   |   |   |       |--- feature_groups_controller.rb
|       |   |   |   |   |       |--- forum_answers_controller.rb
|       |   |   |   |   |       |--- forum_questions_controller.rb
|       |   |   |   |   |       |--- leads_controller.rb
|       |   |   |   |   |       |--- plans_controller.rb
|       |   |   |   |   |       |--- pricings_controller.rb
|       |   |   |   |   |       |--- products_controller.rb
|       |   |   |   |   |       |--- product_accesss_controller.rb
|       |   |   |   |   |       |--- reviews_controller.rb
|       |   |   |   |   |       |--- search_controller.rb
|       |   |   |   |   |       |--- sponsored_plans_controller.rb
|       |   |   |   |   |       |--- subscription_plans_controller.rb
|       |   |   |   |   |       +--- users_controller.rb
|       |   |   |   |   |--- users
|       |   |   |   |   |   |--- confirmations_controller.rb
|       |   |   |   |   |   |--- omniauth_callbacks_controller.rb
|       |   |   |   |   |   |--- passwords_controller.rb
|       |   |   |   |   |   |--- registrations_controller.rb
|       |   |   |   |   |   |--- sessions_controller.rb
|       |   |   |   |   |   +--- unlocks_controller.rb
|       |   |   |   |   |--- application_controller.rb
|       |   |   |   |   |--- corporate_controller.rb
|       |   |   |   |   |--- pages_controller.rb
|       |   |   |   |   +--- posts_controller.rb
|       |   |   |   |--- helpers
|       |   |   |   |   |--- api
|       |   |   |   |   |   +--- v1
|       |   |   |   |   |       |--- articles_helper.rb
|       |   |   |   |   |       |--- badges_helper.rb
|       |   |   |   |   |       |--- banners_helper.rb
|       |   |   |   |   |       |--- campaigns_helper.rb
|       |   |   |   |   |       |--- campaign_reviews_helper.rb
|       |   |   |   |   |       |--- categorys_helper.rb
|       |   |   |   |   |       |--- companys_helper.rb
|       |   |   |   |   |       |--- contents_helper.rb
|       |   |   |   |   |       |--- feature_groups_helper.rb
|       |   |   |   |   |       |--- forum_answers_helper.rb
|       |   |   |   |   |       |--- forum_questions_helper.rb
|       |   |   |   |   |       |--- leads_helper.rb
|       |   |   |   |   |       |--- plans_helper.rb
|       |   |   |   |   |       |--- pricings_helper.rb
|       |   |   |   |   |       |--- products_helper.rb
|       |   |   |   |   |       |--- product_accesss_helper.rb
|       |   |   |   |   |       |--- reviews_helper.rb
|       |   |   |   |   |       |--- sponsored_plans_helper.rb
|       |   |   |   |   |       |--- subscription_plans_helper.rb
|       |   |   |   |   |       +--- users_helper.rb
|       |   |   |   |   |--- application_helper.rb
|       |   |   |   |   |--- comments_helper.rb
|       |   |   |   |   |--- pages_helper.rb
|       |   |   |   |   |--- posts_helper.rb
|       |   |   |   |   +--- users_helper.rb
|       |   |   |   |--- jobs
|       |   |   |   |   +--- application_job.rb
|       |   |   |   |--- mailers
|       |   |   |   |   +--- application_mailer.rb
|       |   |   |   |--- models
|       |   |   |   |   |--- admin_user.rb
|       |   |   |   |   |--- application_record.rb
|       |   |   |   |   |--- article.rb
|       |   |   |   |   |--- badge.rb
|       |   |   |   |   |--- banner.rb
|       |   |   |   |   |--- banner_global.rb
|       |   |   |   |   |--- campaign.rb
|       |   |   |   |   |--- campaign_review.rb
|       |   |   |   |   |--- category.rb
|       |   |   |   |   |--- company.rb
|       |   |   |   |   |--- content.rb
|       |   |   |   |   |--- feature_group.rb
|       |   |   |   |   |--- forum_answer.rb
|       |   |   |   |   |--- forum_question.rb
|       |   |   |   |   |--- lead.rb
|       |   |   |   |   |--- plan.rb
|       |   |   |   |   |--- post.rb
|       |   |   |   |   |--- pricing.rb
|       |   |   |   |   |--- product.rb
|       |   |   |   |   |--- product_access.rb
|       |   |   |   |   |--- review.rb
|       |   |   |   |   |--- sponsored_plan.rb
|       |   |   |   |   |--- subscription_plan.rb
|       |   |   |   |   +--- user.rb
|       |   |   |   |--- notifiers
|       |   |   |   |   |--- application_notifier.rb
|       |   |   |   |   +--- comment_notifier.rb
|       |   |   |   |--- serializers
|       |   |   |   |   |--- article_serializer.rb
|       |   |   |   |   |--- badge_serializer.rb
|       |   |   |   |   |--- campaign_review_serializer.rb
|       |   |   |   |   |--- campaign_serializer.rb
|       |   |   |   |   |--- category_serializer.rb
|       |   |   |   |   |--- company_serializer.rb
|       |   |   |   |   |--- content_serializer.rb
|       |   |   |   |   |--- feature_group_serializer.rb
|       |   |   |   |   |--- forum_answer_serializer.rb
|       |   |   |   |   |--- forum_question_serializer.rb
|       |   |   |   |   |--- lead_serializer.rb
|       |   |   |   |   |--- plan_serializer.rb
|       |   |   |   |   |--- pricing_serializer.rb
|       |   |   |   |   |--- product_access_serializer.rb
|       |   |   |   |   |--- product_serializer.rb
|       |   |   |   |   |--- review_serializer.rb
|       |   |   |   |   |--- sponsored_plan_serializer.rb
|       |   |   |   |   |--- subscription_plan_serializer.rb
|       |   |   |   |   +--- user_serializer.rb
|       |   |   |   |--- services
|       |   |   |   |   |--- company_cta_builder.rb
|       |   |   |   |   +--- search_service.rb
|       |   |   |   +--- validators
|       |   |   |       |--- phone_validator.rb
|       |   |   |       +--- url_validator.rb
|       |   |   |--- rubocop_backup
|       |   |   |   +--- 20250927_034336
|       |   |   |       |--- app
|       |   |   |       |   |--- admin
|       |   |   |       |   |   |--- admin_users.rb
|       |   |   |       |   |   |--- articles.rb
|       |   |   |       |   |   |--- badges.rb
|       |   |   |       |   |   |--- banners.rb
|       |   |   |       |   |   |--- banner_globals.rb
|       |   |   |       |   |   |--- campaigns.rb
|       |   |   |       |   |   |--- campaign_reviews.rb
|       |   |   |       |   |   |--- categories.rb
|       |   |   |       |   |   |--- companies.rb
|       |   |   |       |   |   |--- contents.rb
|       |   |   |       |   |   |--- dashboard.rb
|       |   |   |       |   |   |--- feature_groups.rb
|       |   |   |       |   |   |--- forum_answers.rb
|       |   |   |       |   |   |--- forum_questions.rb
|       |   |   |       |   |   |--- leads.rb
|       |   |   |       |   |   |--- plans.rb
|       |   |   |       |   |   |--- pricings.rb
|       |   |   |       |   |   |--- products.rb
|       |   |   |       |   |   |--- product_accesses.rb
|       |   |   |       |   |   |--- reviews.rb
|       |   |   |       |   |   |--- sponsored_plans.rb
|       |   |   |       |   |   |--- subscription_plans.rb
|       |   |   |       |   |   +--- users.rb
|       |   |   |       |   |--- channels
|       |   |   |       |   |   +--- application_cable
|       |   |   |       |   |       |--- channel.rb
|       |   |   |       |   |       +--- connection.rb
|       |   |   |       |   |--- controllers
|       |   |   |       |   |   |--- api
|       |   |   |       |   |   |   +--- v1
|       |   |   |       |   |   |       |--- admin
|       |   |   |       |   |   |       |   +--- categories_controller.rb
|       |   |   |       |   |   |       |--- articles_controller.rb
|       |   |   |       |   |   |       |--- authentication_controller.rb
|       |   |   |       |   |   |       |--- badges_controller.rb
|       |   |   |       |   |   |       |--- banners_controller.rb
|       |   |   |       |   |   |       |--- banner_globals_controller.rb
|       |   |   |       |   |   |       |--- base_controller.rb
|       |   |   |       |   |   |       |--- campaigns_controller.rb
|       |   |   |       |   |   |       |--- campaign_reviews_controller.rb
|       |   |   |       |   |   |       |--- categories_controller.rb
|       |   |   |       |   |   |       |--- companies_controller.rb
|       |   |   |       |   |   |       |--- contents_controller.rb
|       |   |   |       |   |   |       |--- dashboard_controller.rb
|       |   |   |       |   |   |       |--- feature_groups_controller.rb
|       |   |   |       |   |   |       |--- forum_answers_controller.rb
|       |   |   |       |   |   |       |--- forum_questions_controller.rb
|       |   |   |       |   |   |       |--- leads_controller.rb
|       |   |   |       |   |   |       |--- plans_controller.rb
|       |   |   |       |   |   |       |--- pricings_controller.rb
|       |   |   |       |   |   |       |--- products_controller.rb
|       |   |   |       |   |   |       |--- product_accesss_controller.rb
|       |   |   |       |   |   |       |--- reviews_controller.rb
|       |   |   |       |   |   |       |--- search_controller.rb
|       |   |   |       |   |   |       |--- sponsored_plans_controller.rb
|       |   |   |       |   |   |       |--- subscription_plans_controller.rb
|       |   |   |       |   |   |       +--- users_controller.rb
|       |   |   |       |   |   |--- users
|       |   |   |       |   |   |   |--- confirmations_controller.rb
|       |   |   |       |   |   |   |--- omniauth_callbacks_controller.rb
|       |   |   |       |   |   |   |--- passwords_controller.rb
|       |   |   |       |   |   |   |--- registrations_controller.rb
|       |   |   |       |   |   |   |--- sessions_controller.rb
|       |   |   |       |   |   |   +--- unlocks_controller.rb
|       |   |   |       |   |   |--- application_controller.rb
|       |   |   |       |   |   |--- corporate_controller.rb
|       |   |   |       |   |   |--- pages_controller.rb
|       |   |   |       |   |   +--- posts_controller.rb
|       |   |   |       |   |--- helpers
|       |   |   |       |   |   |--- api
|       |   |   |       |   |   |   +--- v1
|       |   |   |       |   |   |       |--- articles_helper.rb
|       |   |   |       |   |   |       |--- badges_helper.rb
|       |   |   |       |   |   |       |--- banners_helper.rb
|       |   |   |       |   |   |       |--- campaigns_helper.rb
|       |   |   |       |   |   |       |--- campaign_reviews_helper.rb
|       |   |   |       |   |   |       |--- categorys_helper.rb
|       |   |   |       |   |   |       |--- companys_helper.rb
|       |   |   |       |   |   |       |--- contents_helper.rb
|       |   |   |       |   |   |       |--- feature_groups_helper.rb
|       |   |   |       |   |   |       |--- forum_answers_helper.rb
|       |   |   |       |   |   |       |--- forum_questions_helper.rb
|       |   |   |       |   |   |       |--- leads_helper.rb
|       |   |   |       |   |   |       |--- plans_helper.rb
|       |   |   |       |   |   |       |--- pricings_helper.rb
|       |   |   |       |   |   |       |--- products_helper.rb
|       |   |   |       |   |   |       |--- product_accesss_helper.rb
|       |   |   |       |   |   |       |--- reviews_helper.rb
|       |   |   |       |   |   |       |--- sponsored_plans_helper.rb
|       |   |   |       |   |   |       |--- subscription_plans_helper.rb
|       |   |   |       |   |   |       +--- users_helper.rb
|       |   |   |       |   |   |--- application_helper.rb
|       |   |   |       |   |   |--- comments_helper.rb
|       |   |   |       |   |   |--- pages_helper.rb
|       |   |   |       |   |   |--- posts_helper.rb
|       |   |   |       |   |   +--- users_helper.rb
|       |   |   |       |   |--- jobs
|       |   |   |       |   |   +--- application_job.rb
|       |   |   |       |   |--- mailers
|       |   |   |       |   |   +--- application_mailer.rb
|       |   |   |       |   |--- models
|       |   |   |       |   |   |--- admin_user.rb
|       |   |   |       |   |   |--- application_record.rb
|       |   |   |       |   |   |--- article.rb
|       |   |   |       |   |   |--- badge.rb
|       |   |   |       |   |   |--- banner.rb
|       |   |   |       |   |   |--- banner_global.rb
|       |   |   |       |   |   |--- campaign.rb
|       |   |   |       |   |   |--- campaign_review.rb
|       |   |   |       |   |   |--- category.rb
|       |   |   |       |   |   |--- company.rb
|       |   |   |       |   |   |--- content.rb
|       |   |   |       |   |   |--- feature_group.rb
|       |   |   |       |   |   |--- forum_answer.rb
|       |   |   |       |   |   |--- forum_question.rb
|       |   |   |       |   |   |--- lead.rb
|       |   |   |       |   |   |--- plan.rb
|       |   |   |       |   |   |--- post.rb
|       |   |   |       |   |   |--- pricing.rb
|       |   |   |       |   |   |--- product.rb
|       |   |   |       |   |   |--- product_access.rb
|       |   |   |       |   |   |--- review.rb
|       |   |   |       |   |   |--- sponsored_plan.rb
|       |   |   |       |   |   |--- subscription_plan.rb
|       |   |   |       |   |   +--- user.rb
|       |   |   |       |   |--- notifiers
|       |   |   |       |   |   |--- application_notifier.rb
|       |   |   |       |   |   +--- comment_notifier.rb
|       |   |   |       |   |--- serializers
|       |   |   |       |   |   |--- article_serializer.rb
|       |   |   |       |   |   |--- badge_serializer.rb
|       |   |   |       |   |   |--- campaign_review_serializer.rb
|       |   |   |       |   |   |--- campaign_serializer.rb
|       |   |   |       |   |   |--- category_serializer.rb
|       |   |   |       |   |   |--- company_serializer.rb
|       |   |   |       |   |   |--- content_serializer.rb
|       |   |   |       |   |   |--- feature_group_serializer.rb
|       |   |   |       |   |   |--- forum_answer_serializer.rb
|       |   |   |       |   |   |--- forum_question_serializer.rb
|       |   |   |       |   |   |--- lead_serializer.rb
|       |   |   |       |   |   |--- plan_serializer.rb
|       |   |   |       |   |   |--- pricing_serializer.rb
|       |   |   |       |   |   |--- product_access_serializer.rb
|       |   |   |       |   |   |--- product_serializer.rb
|       |   |   |       |   |   |--- review_serializer.rb
|       |   |   |       |   |   |--- sponsored_plan_serializer.rb
|       |   |   |       |   |   |--- subscription_plan_serializer.rb
|       |   |   |       |   |   +--- user_serializer.rb
|       |   |   |       |   |--- services
|       |   |   |       |   |   |--- company_cta_builder.rb
|       |   |   |       |   |   +--- search_service.rb
|       |   |   |       |   +--- validators
|       |   |   |       |       |--- phone_validator.rb
|       |   |   |       |       +--- url_validator.rb
|       |   |   |       |--- scripts
|       |   |   |       |   |--- clean_admin_data.rb
|       |   |   |       |   |--- create_related_products.rb
|       |   |   |       |   +--- populate_admin_data.rb
|       |   |   |       |--- test
|       |   |   |       |   |--- channels
|       |   |   |       |   |   +--- application_cable
|       |   |   |       |   |       +--- connection_test.rb
|       |   |   |       |   |--- controllers
|       |   |   |       |   |   |--- api
|       |   |   |       |   |   |   +--- v1
|       |   |   |       |   |   |       |--- articles_controller_test.rb
|       |   |   |       |   |   |       |--- badges_controller_test.rb
|       |   |   |       |   |   |       |--- banners_controller_test.rb
|       |   |   |       |   |   |       |--- campaigns_controller_test.rb
|       |   |   |       |   |   |       |--- campaign_reviews_controller_test.rb
|       |   |   |       |   |   |       |--- categorys_controller_test.rb
|       |   |   |       |   |   |       |--- companys_controller_test.rb
|       |   |   |       |   |   |       |--- contents_controller_test.rb
|       |   |   |       |   |   |       |--- feature_groups_controller_test.rb
|       |   |   |       |   |   |       |--- forum_answers_controller_test.rb
|       |   |   |       |   |   |       |--- forum_questions_controller_test.rb
|       |   |   |       |   |   |       |--- leads_controller_test.rb
|       |   |   |       |   |   |       |--- plans_controller_test.rb
|       |   |   |       |   |   |       |--- pricings_controller_test.rb
|       |   |   |       |   |   |       |--- products_controller_test.rb
|       |   |   |       |   |   |       |--- product_accesss_controller_test.rb
|       |   |   |       |   |   |       |--- reviews_controller_test.rb
|       |   |   |       |   |   |       |--- sponsored_plans_controller_test.rb
|       |   |   |       |   |   |       |--- subscription_plans_controller_test.rb
|       |   |   |       |   |   |       +--- users_controller_test.rb
|       |   |   |       |   |   |--- comments_controller_test.rb
|       |   |   |       |   |   |--- pages_controller_test.rb
|       |   |   |       |   |   |--- posts_controller_test.rb
|       |   |   |       |   |   +--- users_controller_test.rb
|       |   |   |       |   |--- models
|       |   |   |       |   |   |--- admin_user_test.rb
|       |   |   |       |   |   |--- article_test.rb
|       |   |   |       |   |   |--- badge_test.rb
|       |   |   |       |   |   |--- banner_test.rb
|       |   |   |       |   |   |--- campaign_review_test.rb
|       |   |   |       |   |   |--- campaign_test.rb
|       |   |   |       |   |   |--- category_test.rb
|       |   |   |       |   |   |--- comment_test.rb
|       |   |   |       |   |   |--- company_test.rb
|       |   |   |       |   |   |--- content_test.rb
|       |   |   |       |   |   |--- feature_group_test.rb
|       |   |   |       |   |   |--- forum_answer_test.rb
|       |   |   |       |   |   |--- forum_question_test.rb
|       |   |   |       |   |   |--- lead_test.rb
|       |   |   |       |   |   |--- plan_test.rb
|       |   |   |       |   |   |--- post_test.rb
|       |   |   |       |   |   |--- pricing_test.rb
|       |   |   |       |   |   |--- product_access_test.rb
|       |   |   |       |   |   |--- product_test.rb
|       |   |   |       |   |   |--- review_test.rb
|       |   |   |       |   |   |--- sponsored_plan_test.rb
|       |   |   |       |   |   |--- subscription_plan_test.rb
|       |   |   |       |   |   +--- user_test.rb
|       |   |   |       |   |--- system
|       |   |   |       |   |   +--- posts_test.rb
|       |   |   |       |   |--- application_system_test_case.rb
|       |   |   |       |   +--- test_helper.rb
|       |   |   |       +--- fix_rubocop.rb
|       |   |   |--- scripts
|       |   |   |   |--- clean_admin_data.rb
|       |   |   |   |--- create_related_products.rb
|       |   |   |   +--- populate_admin_data.rb
|       |   |   |--- test
|       |   |   |   |--- channels
|       |   |   |   |   +--- application_cable
|       |   |   |   |       +--- connection_test.rb
|       |   |   |   |--- controllers
|       |   |   |   |   |--- api
|       |   |   |   |   |   +--- v1
|       |   |   |   |   |       |--- articles_controller_test.rb
|       |   |   |   |   |       |--- badges_controller_test.rb
|       |   |   |   |   |       |--- banners_controller_test.rb
|       |   |   |   |   |       |--- campaigns_controller_test.rb
|       |   |   |   |   |       |--- campaign_reviews_controller_test.rb
|       |   |   |   |   |       |--- categorys_controller_test.rb
|       |   |   |   |   |       |--- companys_controller_test.rb
|       |   |   |   |   |       |--- contents_controller_test.rb
|       |   |   |   |   |       |--- feature_groups_controller_test.rb
|       |   |   |   |   |       |--- forum_answers_controller_test.rb
|       |   |   |   |   |       |--- forum_questions_controller_test.rb
|       |   |   |   |   |       |--- leads_controller_test.rb
|       |   |   |   |   |       |--- plans_controller_test.rb
|       |   |   |   |   |       |--- pricings_controller_test.rb
|       |   |   |   |   |       |--- products_controller_test.rb
|       |   |   |   |   |       |--- product_accesss_controller_test.rb
|       |   |   |   |   |       |--- reviews_controller_test.rb
|       |   |   |   |   |       |--- sponsored_plans_controller_test.rb
|       |   |   |   |   |       |--- subscription_plans_controller_test.rb
|       |   |   |   |   |       +--- users_controller_test.rb
|       |   |   |   |   |--- comments_controller_test.rb
|       |   |   |   |   |--- pages_controller_test.rb
|       |   |   |   |   |--- posts_controller_test.rb
|       |   |   |   |   +--- users_controller_test.rb
|       |   |   |   |--- models
|       |   |   |   |   |--- admin_user_test.rb
|       |   |   |   |   |--- article_test.rb
|       |   |   |   |   |--- badge_test.rb
|       |   |   |   |   |--- banner_test.rb
|       |   |   |   |   |--- campaign_review_test.rb
|       |   |   |   |   |--- campaign_test.rb
|       |   |   |   |   |--- category_test.rb
|       |   |   |   |   |--- comment_test.rb
|       |   |   |   |   |--- company_test.rb
|       |   |   |   |   |--- content_test.rb
|       |   |   |   |   |--- feature_group_test.rb
|       |   |   |   |   |--- forum_answer_test.rb
|       |   |   |   |   |--- forum_question_test.rb
|       |   |   |   |   |--- lead_test.rb
|       |   |   |   |   |--- plan_test.rb
|       |   |   |   |   |--- post_test.rb
|       |   |   |   |   |--- pricing_test.rb
|       |   |   |   |   |--- product_access_test.rb
|       |   |   |   |   |--- product_test.rb
|       |   |   |   |   |--- review_test.rb
|       |   |   |   |   |--- sponsored_plan_test.rb
|       |   |   |   |   |--- subscription_plan_test.rb
|       |   |   |   |   +--- user_test.rb
|       |   |   |   |--- system
|       |   |   |   |   +--- posts_test.rb
|       |   |   |   |--- application_system_test_case.rb
|       |   |   |   +--- test_helper.rb
|       |   |   +--- fix_rubocop.rb
|       |   +--- 20250927_035248
|       |       |--- app
|       |       |   |--- admin
|       |       |   |   |--- admin_users.rb
|       |       |   |   |--- articles.rb
|       |       |   |   |--- badges.rb
|       |       |   |   |--- banners.rb
|       |       |   |   |--- banner_globals.rb
|       |       |   |   |--- campaigns.rb
|       |       |   |   |--- campaign_reviews.rb
|       |       |   |   |--- categories.rb
|       |       |   |   |--- companies.rb
|       |       |   |   |--- contents.rb
|       |       |   |   |--- dashboard.rb
|       |       |   |   |--- feature_groups.rb
|       |       |   |   |--- forum_answers.rb
|       |       |   |   |--- forum_questions.rb
|       |       |   |   |--- leads.rb
|       |       |   |   |--- plans.rb
|       |       |   |   |--- pricings.rb
|       |       |   |   |--- products.rb
|       |       |   |   |--- product_accesses.rb
|       |       |   |   |--- reviews.rb
|       |       |   |   |--- sponsored_plans.rb
|       |       |   |   |--- subscription_plans.rb
|       |       |   |   +--- users.rb
|       |       |   |--- channels
|       |       |   |   +--- application_cable
|       |       |   |       |--- channel.rb
|       |       |   |       +--- connection.rb
|       |       |   |--- controllers
|       |       |   |   |--- api
|       |       |   |   |   +--- v1
|       |       |   |   |       |--- admin
|       |       |   |   |       |   +--- categories_controller.rb
|       |       |   |   |       |--- articles_controller.rb
|       |       |   |   |       |--- authentication_controller.rb
|       |       |   |   |       |--- badges_controller.rb
|       |       |   |   |       |--- banners_controller.rb
|       |       |   |   |       |--- banner_globals_controller.rb
|       |       |   |   |       |--- base_controller.rb
|       |       |   |   |       |--- campaigns_controller.rb
|       |       |   |   |       |--- campaign_reviews_controller.rb
|       |       |   |   |       |--- categories_controller.rb
|       |       |   |   |       |--- companies_controller.rb
|       |       |   |   |       |--- contents_controller.rb
|       |       |   |   |       |--- dashboard_controller.rb
|       |       |   |   |       |--- feature_groups_controller.rb
|       |       |   |   |       |--- forum_answers_controller.rb
|       |       |   |   |       |--- forum_questions_controller.rb
|       |       |   |   |       |--- leads_controller.rb
|       |       |   |   |       |--- plans_controller.rb
|       |       |   |   |       |--- pricings_controller.rb
|       |       |   |   |       |--- products_controller.rb
|       |       |   |   |       |--- product_accesss_controller.rb
|       |       |   |   |       |--- reviews_controller.rb
|       |       |   |   |       |--- search_controller.rb
|       |       |   |   |       |--- sponsored_plans_controller.rb
|       |       |   |   |       |--- subscription_plans_controller.rb
|       |       |   |   |       +--- users_controller.rb
|       |       |   |   |--- users
|       |       |   |   |   |--- confirmations_controller.rb
|       |       |   |   |   |--- omniauth_callbacks_controller.rb
|       |       |   |   |   |--- passwords_controller.rb
|       |       |   |   |   |--- registrations_controller.rb
|       |       |   |   |   |--- sessions_controller.rb
|       |       |   |   |   +--- unlocks_controller.rb
|       |       |   |   |--- application_controller.rb
|       |       |   |   |--- corporate_controller.rb
|       |       |   |   |--- pages_controller.rb
|       |       |   |   +--- posts_controller.rb
|       |       |   |--- helpers
|       |       |   |   |--- api
|       |       |   |   |   +--- v1
|       |       |   |   |       |--- articles_helper.rb
|       |       |   |   |       |--- badges_helper.rb
|       |       |   |   |       |--- banners_helper.rb
|       |       |   |   |       |--- campaigns_helper.rb
|       |       |   |   |       |--- campaign_reviews_helper.rb
|       |       |   |   |       |--- categorys_helper.rb
|       |       |   |   |       |--- companys_helper.rb
|       |       |   |   |       |--- contents_helper.rb
|       |       |   |   |       |--- feature_groups_helper.rb
|       |       |   |   |       |--- forum_answers_helper.rb
|       |       |   |   |       |--- forum_questions_helper.rb
|       |       |   |   |       |--- leads_helper.rb
|       |       |   |   |       |--- plans_helper.rb
|       |       |   |   |       |--- pricings_helper.rb
|       |       |   |   |       |--- products_helper.rb
|       |       |   |   |       |--- product_accesss_helper.rb
|       |       |   |   |       |--- reviews_helper.rb
|       |       |   |   |       |--- sponsored_plans_helper.rb
|       |       |   |   |       |--- subscription_plans_helper.rb
|       |       |   |   |       +--- users_helper.rb
|       |       |   |   |--- application_helper.rb
|       |       |   |   |--- comments_helper.rb
|       |       |   |   |--- pages_helper.rb
|       |       |   |   |--- posts_helper.rb
|       |       |   |   +--- users_helper.rb
|       |       |   |--- jobs
|       |       |   |   +--- application_job.rb
|       |       |   |--- mailers
|       |       |   |   +--- application_mailer.rb
|       |       |   |--- models
|       |       |   |   |--- admin_user.rb
|       |       |   |   |--- application_record.rb
|       |       |   |   |--- article.rb
|       |       |   |   |--- badge.rb
|       |       |   |   |--- banner.rb
|       |       |   |   |--- banner_global.rb
|       |       |   |   |--- campaign.rb
|       |       |   |   |--- campaign_review.rb
|       |       |   |   |--- category.rb
|       |       |   |   |--- company.rb
|       |       |   |   |--- content.rb
|       |       |   |   |--- feature_group.rb
|       |       |   |   |--- forum_answer.rb
|       |       |   |   |--- forum_question.rb
|       |       |   |   |--- lead.rb
|       |       |   |   |--- plan.rb
|       |       |   |   |--- post.rb
|       |       |   |   |--- pricing.rb
|       |       |   |   |--- product.rb
|       |       |   |   |--- product_access.rb
|       |       |   |   |--- review.rb
|       |       |   |   |--- sponsored_plan.rb
|       |       |   |   |--- subscription_plan.rb
|       |       |   |   +--- user.rb
|       |       |   |--- notifiers
|       |       |   |   |--- application_notifier.rb
|       |       |   |   +--- comment_notifier.rb
|       |       |   |--- serializers
|       |       |   |   |--- article_serializer.rb
|       |       |   |   |--- badge_serializer.rb
|       |       |   |   |--- campaign_review_serializer.rb
|       |       |   |   |--- campaign_serializer.rb
|       |       |   |   |--- category_serializer.rb
|       |       |   |   |--- company_serializer.rb
|       |       |   |   |--- content_serializer.rb
|       |       |   |   |--- feature_group_serializer.rb
|       |       |   |   |--- forum_answer_serializer.rb
|       |       |   |   |--- forum_question_serializer.rb
|       |       |   |   |--- lead_serializer.rb
|       |       |   |   |--- plan_serializer.rb
|       |       |   |   |--- pricing_serializer.rb
|       |       |   |   |--- product_access_serializer.rb
|       |       |   |   |--- product_serializer.rb
|       |       |   |   |--- review_serializer.rb
|       |       |   |   |--- sponsored_plan_serializer.rb
|       |       |   |   |--- subscription_plan_serializer.rb
|       |       |   |   +--- user_serializer.rb
|       |       |   |--- services
|       |       |   |   |--- company_cta_builder.rb
|       |       |   |   +--- search_service.rb
|       |       |   +--- validators
|       |       |       |--- phone_validator.rb
|       |       |       +--- url_validator.rb
|       |       |--- rubocop_backup
|       |       |   |--- 20250927_034336
|       |       |   |   |--- app
|       |       |   |   |   |--- admin
|       |       |   |   |   |   |--- admin_users.rb
|       |       |   |   |   |   |--- articles.rb
|       |       |   |   |   |   |--- badges.rb
|       |       |   |   |   |   |--- banners.rb
|       |       |   |   |   |   |--- banner_globals.rb
|       |       |   |   |   |   |--- campaigns.rb
|       |       |   |   |   |   |--- campaign_reviews.rb
|       |       |   |   |   |   |--- categories.rb
|       |       |   |   |   |   |--- companies.rb
|       |       |   |   |   |   |--- contents.rb
|       |       |   |   |   |   |--- dashboard.rb
|       |       |   |   |   |   |--- feature_groups.rb
|       |       |   |   |   |   |--- forum_answers.rb
|       |       |   |   |   |   |--- forum_questions.rb
|       |       |   |   |   |   |--- leads.rb
|       |       |   |   |   |   |--- plans.rb
|       |       |   |   |   |   |--- pricings.rb
|       |       |   |   |   |   |--- products.rb
|       |       |   |   |   |   |--- product_accesses.rb
|       |       |   |   |   |   |--- reviews.rb
|       |       |   |   |   |   |--- sponsored_plans.rb
|       |       |   |   |   |   |--- subscription_plans.rb
|       |       |   |   |   |   +--- users.rb
|       |       |   |   |   |--- channels
|       |       |   |   |   |   +--- application_cable
|       |       |   |   |   |       |--- channel.rb
|       |       |   |   |   |       +--- connection.rb
|       |       |   |   |   |--- controllers
|       |       |   |   |   |   |--- api
|       |       |   |   |   |   |   +--- v1
|       |       |   |   |   |   |       |--- admin
|       |       |   |   |   |   |       |   +--- categories_controller.rb
|       |       |   |   |   |   |       |--- articles_controller.rb
|       |       |   |   |   |   |       |--- authentication_controller.rb
|       |       |   |   |   |   |       |--- badges_controller.rb
|       |       |   |   |   |   |       |--- banners_controller.rb
|       |       |   |   |   |   |       |--- banner_globals_controller.rb
|       |       |   |   |   |   |       |--- base_controller.rb
|       |       |   |   |   |   |       |--- campaigns_controller.rb
|       |       |   |   |   |   |       |--- campaign_reviews_controller.rb
|       |       |   |   |   |   |       |--- categories_controller.rb
|       |       |   |   |   |   |       |--- companies_controller.rb
|       |       |   |   |   |   |       |--- contents_controller.rb
|       |       |   |   |   |   |       |--- dashboard_controller.rb
|       |       |   |   |   |   |       |--- feature_groups_controller.rb
|       |       |   |   |   |   |       |--- forum_answers_controller.rb
|       |       |   |   |   |   |       |--- forum_questions_controller.rb
|       |       |   |   |   |   |       |--- leads_controller.rb
|       |       |   |   |   |   |       |--- plans_controller.rb
|       |       |   |   |   |   |       |--- pricings_controller.rb
|       |       |   |   |   |   |       |--- products_controller.rb
|       |       |   |   |   |   |       |--- product_accesss_controller.rb
|       |       |   |   |   |   |       |--- reviews_controller.rb
|       |       |   |   |   |   |       |--- search_controller.rb
|       |       |   |   |   |   |       |--- sponsored_plans_controller.rb
|       |       |   |   |   |   |       |--- subscription_plans_controller.rb
|       |       |   |   |   |   |       +--- users_controller.rb
|       |       |   |   |   |   |--- users
|       |       |   |   |   |   |   |--- confirmations_controller.rb
|       |       |   |   |   |   |   |--- omniauth_callbacks_controller.rb
|       |       |   |   |   |   |   |--- passwords_controller.rb
|       |       |   |   |   |   |   |--- registrations_controller.rb
|       |       |   |   |   |   |   |--- sessions_controller.rb
|       |       |   |   |   |   |   +--- unlocks_controller.rb
|       |       |   |   |   |   |--- application_controller.rb
|       |       |   |   |   |   |--- corporate_controller.rb
|       |       |   |   |   |   |--- pages_controller.rb
|       |       |   |   |   |   +--- posts_controller.rb
|       |       |   |   |   |--- helpers
|       |       |   |   |   |   |--- api
|       |       |   |   |   |   |   +--- v1
|       |       |   |   |   |   |       |--- articles_helper.rb
|       |       |   |   |   |   |       |--- badges_helper.rb
|       |       |   |   |   |   |       |--- banners_helper.rb
|       |       |   |   |   |   |       |--- campaigns_helper.rb
|       |       |   |   |   |   |       |--- campaign_reviews_helper.rb
|       |       |   |   |   |   |       |--- categorys_helper.rb
|       |       |   |   |   |   |       |--- companys_helper.rb
|       |       |   |   |   |   |       |--- contents_helper.rb
|       |       |   |   |   |   |       |--- feature_groups_helper.rb
|       |       |   |   |   |   |       |--- forum_answers_helper.rb
|       |       |   |   |   |   |       |--- forum_questions_helper.rb
|       |       |   |   |   |   |       |--- leads_helper.rb
|       |       |   |   |   |   |       |--- plans_helper.rb
|       |       |   |   |   |   |       |--- pricings_helper.rb
|       |       |   |   |   |   |       |--- products_helper.rb
|       |       |   |   |   |   |       |--- product_accesss_helper.rb
|       |       |   |   |   |   |       |--- reviews_helper.rb
|       |       |   |   |   |   |       |--- sponsored_plans_helper.rb
|       |       |   |   |   |   |       |--- subscription_plans_helper.rb
|       |       |   |   |   |   |       +--- users_helper.rb
|       |       |   |   |   |   |--- application_helper.rb
|       |       |   |   |   |   |--- comments_helper.rb
|       |       |   |   |   |   |--- pages_helper.rb
|       |       |   |   |   |   |--- posts_helper.rb
|       |       |   |   |   |   +--- users_helper.rb
|       |       |   |   |   |--- jobs
|       |       |   |   |   |   +--- application_job.rb
|       |       |   |   |   |--- mailers
|       |       |   |   |   |   +--- application_mailer.rb
|       |       |   |   |   |--- models
|       |       |   |   |   |   |--- admin_user.rb
|       |       |   |   |   |   |--- application_record.rb
|       |       |   |   |   |   |--- article.rb
|       |       |   |   |   |   |--- badge.rb
|       |       |   |   |   |   |--- banner.rb
|       |       |   |   |   |   |--- banner_global.rb
|       |       |   |   |   |   |--- campaign.rb
|       |       |   |   |   |   |--- campaign_review.rb
|       |       |   |   |   |   |--- category.rb
|       |       |   |   |   |   |--- company.rb
|       |       |   |   |   |   |--- content.rb
|       |       |   |   |   |   |--- feature_group.rb
|       |       |   |   |   |   |--- forum_answer.rb
|       |       |   |   |   |   |--- forum_question.rb
|       |       |   |   |   |   |--- lead.rb
|       |       |   |   |   |   |--- plan.rb
|       |       |   |   |   |   |--- post.rb
|       |       |   |   |   |   |--- pricing.rb
|       |       |   |   |   |   |--- product.rb
|       |       |   |   |   |   |--- product_access.rb
|       |       |   |   |   |   |--- review.rb
|       |       |   |   |   |   |--- sponsored_plan.rb
|       |       |   |   |   |   |--- subscription_plan.rb
|       |       |   |   |   |   +--- user.rb
|       |       |   |   |   |--- notifiers
|       |       |   |   |   |   |--- application_notifier.rb
|       |       |   |   |   |   +--- comment_notifier.rb
|       |       |   |   |   |--- serializers
|       |       |   |   |   |   |--- article_serializer.rb
|       |       |   |   |   |   |--- badge_serializer.rb
|       |       |   |   |   |   |--- campaign_review_serializer.rb
|       |       |   |   |   |   |--- campaign_serializer.rb
|       |       |   |   |   |   |--- category_serializer.rb
|       |       |   |   |   |   |--- company_serializer.rb
|       |       |   |   |   |   |--- content_serializer.rb
|       |       |   |   |   |   |--- feature_group_serializer.rb
|       |       |   |   |   |   |--- forum_answer_serializer.rb
|       |       |   |   |   |   |--- forum_question_serializer.rb
|       |       |   |   |   |   |--- lead_serializer.rb
|       |       |   |   |   |   |--- plan_serializer.rb
|       |       |   |   |   |   |--- pricing_serializer.rb
|       |       |   |   |   |   |--- product_access_serializer.rb
|       |       |   |   |   |   |--- product_serializer.rb
|       |       |   |   |   |   |--- review_serializer.rb
|       |       |   |   |   |   |--- sponsored_plan_serializer.rb
|       |       |   |   |   |   |--- subscription_plan_serializer.rb
|       |       |   |   |   |   +--- user_serializer.rb
|       |       |   |   |   |--- services
|       |       |   |   |   |   |--- company_cta_builder.rb
|       |       |   |   |   |   +--- search_service.rb
|       |       |   |   |   +--- validators
|       |       |   |   |       |--- phone_validator.rb
|       |       |   |   |       +--- url_validator.rb
|       |       |   |   |--- scripts
|       |       |   |   |   |--- clean_admin_data.rb
|       |       |   |   |   |--- create_related_products.rb
|       |       |   |   |   +--- populate_admin_data.rb
|       |       |   |   |--- test
|       |       |   |   |   |--- channels
|       |       |   |   |   |   +--- application_cable
|       |       |   |   |   |       +--- connection_test.rb
|       |       |   |   |   |--- controllers
|       |       |   |   |   |   |--- api
|       |       |   |   |   |   |   +--- v1
|       |       |   |   |   |   |       |--- articles_controller_test.rb
|       |       |   |   |   |   |       |--- badges_controller_test.rb
|       |       |   |   |   |   |       |--- banners_controller_test.rb
|       |       |   |   |   |   |       |--- campaigns_controller_test.rb
|       |       |   |   |   |   |       |--- campaign_reviews_controller_test.rb
|       |       |   |   |   |   |       |--- categorys_controller_test.rb
|       |       |   |   |   |   |       |--- companys_controller_test.rb
|       |       |   |   |   |   |       |--- contents_controller_test.rb
|       |       |   |   |   |   |       |--- feature_groups_controller_test.rb
|       |       |   |   |   |   |       |--- forum_answers_controller_test.rb
|       |       |   |   |   |   |       |--- forum_questions_controller_test.rb
|       |       |   |   |   |   |       |--- leads_controller_test.rb
|       |       |   |   |   |   |       |--- plans_controller_test.rb
|       |       |   |   |   |   |       |--- pricings_controller_test.rb
|       |       |   |   |   |   |       |--- products_controller_test.rb
|       |       |   |   |   |   |       |--- product_accesss_controller_test.rb
|       |       |   |   |   |   |       |--- reviews_controller_test.rb
|       |       |   |   |   |   |       |--- sponsored_plans_controller_test.rb
|       |       |   |   |   |   |       |--- subscription_plans_controller_test.rb
|       |       |   |   |   |   |       +--- users_controller_test.rb
|       |       |   |   |   |   |--- comments_controller_test.rb
|       |       |   |   |   |   |--- pages_controller_test.rb
|       |       |   |   |   |   |--- posts_controller_test.rb
|       |       |   |   |   |   +--- users_controller_test.rb
|       |       |   |   |   |--- models
|       |       |   |   |   |   |--- admin_user_test.rb
|       |       |   |   |   |   |--- article_test.rb
|       |       |   |   |   |   |--- badge_test.rb
|       |       |   |   |   |   |--- banner_test.rb
|       |       |   |   |   |   |--- campaign_review_test.rb
|       |       |   |   |   |   |--- campaign_test.rb
|       |       |   |   |   |   |--- category_test.rb
|       |       |   |   |   |   |--- comment_test.rb
|       |       |   |   |   |   |--- company_test.rb
|       |       |   |   |   |   |--- content_test.rb
|       |       |   |   |   |   |--- feature_group_test.rb
|       |       |   |   |   |   |--- forum_answer_test.rb
|       |       |   |   |   |   |--- forum_question_test.rb
|       |       |   |   |   |   |--- lead_test.rb
|       |       |   |   |   |   |--- plan_test.rb
|       |       |   |   |   |   |--- post_test.rb
|       |       |   |   |   |   |--- pricing_test.rb
|       |       |   |   |   |   |--- product_access_test.rb
|       |       |   |   |   |   |--- product_test.rb
|       |       |   |   |   |   |--- review_test.rb
|       |       |   |   |   |   |--- sponsored_plan_test.rb
|       |       |   |   |   |   |--- subscription_plan_test.rb
|       |       |   |   |   |   +--- user_test.rb
|       |       |   |   |   |--- system
|       |       |   |   |   |   +--- posts_test.rb
|       |       |   |   |   |--- application_system_test_case.rb
|       |       |   |   |   +--- test_helper.rb
|       |       |   |   +--- fix_rubocop.rb
|       |       |   +--- 20250927_034912
|       |       |       |--- app
|       |       |       |   |--- admin
|       |       |       |   |   |--- admin_users.rb
|       |       |       |   |   |--- articles.rb
|       |       |       |   |   |--- badges.rb
|       |       |       |   |   |--- banners.rb
|       |       |       |   |   |--- banner_globals.rb
|       |       |       |   |   |--- campaigns.rb
|       |       |       |   |   |--- campaign_reviews.rb
|       |       |       |   |   |--- categories.rb
|       |       |       |   |   |--- companies.rb
|       |       |       |   |   |--- contents.rb
|       |       |       |   |   |--- dashboard.rb
|       |       |       |   |   |--- feature_groups.rb
|       |       |       |   |   |--- forum_answers.rb
|       |       |       |   |   |--- forum_questions.rb
|       |       |       |   |   |--- leads.rb
|       |       |       |   |   |--- plans.rb
|       |       |       |   |   |--- pricings.rb
|       |       |       |   |   |--- products.rb
|       |       |       |   |   |--- product_accesses.rb
|       |       |       |   |   |--- reviews.rb
|       |       |       |   |   |--- sponsored_plans.rb
|       |       |       |   |   |--- subscription_plans.rb
|       |       |       |   |   +--- users.rb
|       |       |       |   |--- channels
|       |       |       |   |   +--- application_cable
|       |       |       |   |       |--- channel.rb
|       |       |       |   |       +--- connection.rb
|       |       |       |   |--- controllers
|       |       |       |   |   |--- api
|       |       |       |   |   |   +--- v1
|       |       |       |   |   |       |--- admin
|       |       |       |   |   |       |   +--- categories_controller.rb
|       |       |       |   |   |       |--- articles_controller.rb
|       |       |       |   |   |       |--- authentication_controller.rb
|       |       |       |   |   |       |--- badges_controller.rb
|       |       |       |   |   |       |--- banners_controller.rb
|       |       |       |   |   |       |--- banner_globals_controller.rb
|       |       |       |   |   |       |--- base_controller.rb
|       |       |       |   |   |       |--- campaigns_controller.rb
|       |       |       |   |   |       |--- campaign_reviews_controller.rb
|       |       |       |   |   |       |--- categories_controller.rb
|       |       |       |   |   |       |--- companies_controller.rb
|       |       |       |   |   |       |--- contents_controller.rb
|       |       |       |   |   |       |--- dashboard_controller.rb
|       |       |       |   |   |       |--- feature_groups_controller.rb
|       |       |       |   |   |       |--- forum_answers_controller.rb
|       |       |       |   |   |       |--- forum_questions_controller.rb
|       |       |       |   |   |       |--- leads_controller.rb
|       |       |       |   |   |       |--- plans_controller.rb
|       |       |       |   |   |       |--- pricings_controller.rb
|       |       |       |   |   |       |--- products_controller.rb
|       |       |       |   |   |       |--- product_accesss_controller.rb
|       |       |       |   |   |       |--- reviews_controller.rb
|       |       |       |   |   |       |--- search_controller.rb
|       |       |       |   |   |       |--- sponsored_plans_controller.rb
|       |       |       |   |   |       |--- subscription_plans_controller.rb
|       |       |       |   |   |       +--- users_controller.rb
|       |       |       |   |   |--- users
|       |       |       |   |   |   |--- confirmations_controller.rb
|       |       |       |   |   |   |--- omniauth_callbacks_controller.rb
|       |       |       |   |   |   |--- passwords_controller.rb
|       |       |       |   |   |   |--- registrations_controller.rb
|       |       |       |   |   |   |--- sessions_controller.rb
|       |       |       |   |   |   +--- unlocks_controller.rb
|       |       |       |   |   |--- application_controller.rb
|       |       |       |   |   |--- corporate_controller.rb
|       |       |       |   |   |--- pages_controller.rb
|       |       |       |   |   +--- posts_controller.rb
|       |       |       |   |--- helpers
|       |       |       |   |   |--- api
|       |       |       |   |   |   +--- v1
|       |       |       |   |   |       |--- articles_helper.rb
|       |       |       |   |   |       |--- badges_helper.rb
|       |       |       |   |   |       |--- banners_helper.rb
|       |       |       |   |   |       |--- campaigns_helper.rb
|       |       |       |   |   |       |--- campaign_reviews_helper.rb
|       |       |       |   |   |       |--- categorys_helper.rb
|       |       |       |   |   |       |--- companys_helper.rb
|       |       |       |   |   |       |--- contents_helper.rb
|       |       |       |   |   |       |--- feature_groups_helper.rb
|       |       |       |   |   |       |--- forum_answers_helper.rb
|       |       |       |   |   |       |--- forum_questions_helper.rb
|       |       |       |   |   |       |--- leads_helper.rb
|       |       |       |   |   |       |--- plans_helper.rb
|       |       |       |   |   |       |--- pricings_helper.rb
|       |       |       |   |   |       |--- products_helper.rb
|       |       |       |   |   |       |--- product_accesss_helper.rb
|       |       |       |   |   |       |--- reviews_helper.rb
|       |       |       |   |   |       |--- sponsored_plans_helper.rb
|       |       |       |   |   |       |--- subscription_plans_helper.rb
|       |       |       |   |   |       +--- users_helper.rb
|       |       |       |   |   |--- application_helper.rb
|       |       |       |   |   |--- comments_helper.rb
|       |       |       |   |   |--- pages_helper.rb
|       |       |       |   |   |--- posts_helper.rb
|       |       |       |   |   +--- users_helper.rb
|       |       |       |   |--- jobs
|       |       |       |   |   +--- application_job.rb
|       |       |       |   |--- mailers
|       |       |       |   |   +--- application_mailer.rb
|       |       |       |   |--- models
|       |       |       |   |   |--- admin_user.rb
|       |       |       |   |   |--- application_record.rb
|       |       |       |   |   |--- article.rb
|       |       |       |   |   |--- badge.rb
|       |       |       |   |   |--- banner.rb
|       |       |       |   |   |--- banner_global.rb
|       |       |       |   |   |--- campaign.rb
|       |       |       |   |   |--- campaign_review.rb
|       |       |       |   |   |--- category.rb
|       |       |       |   |   |--- company.rb
|       |       |       |   |   |--- content.rb
|       |       |       |   |   |--- feature_group.rb
|       |       |       |   |   |--- forum_answer.rb
|       |       |       |   |   |--- forum_question.rb
|       |       |       |   |   |--- lead.rb
|       |       |       |   |   |--- plan.rb
|       |       |       |   |   |--- post.rb
|       |       |       |   |   |--- pricing.rb
|       |       |       |   |   |--- product.rb
|       |       |       |   |   |--- product_access.rb
|       |       |       |   |   |--- review.rb
|       |       |       |   |   |--- sponsored_plan.rb
|       |       |       |   |   |--- subscription_plan.rb
|       |       |       |   |   +--- user.rb
|       |       |       |   |--- notifiers
|       |       |       |   |   |--- application_notifier.rb
|       |       |       |   |   +--- comment_notifier.rb
|       |       |       |   |--- serializers
|       |       |       |   |   |--- article_serializer.rb
|       |       |       |   |   |--- badge_serializer.rb
|       |       |       |   |   |--- campaign_review_serializer.rb
|       |       |       |   |   |--- campaign_serializer.rb
|       |       |       |   |   |--- category_serializer.rb
|       |       |       |   |   |--- company_serializer.rb
|       |       |       |   |   |--- content_serializer.rb
|       |       |       |   |   |--- feature_group_serializer.rb
|       |       |       |   |   |--- forum_answer_serializer.rb
|       |       |       |   |   |--- forum_question_serializer.rb
|       |       |       |   |   |--- lead_serializer.rb
|       |       |       |   |   |--- plan_serializer.rb
|       |       |       |   |   |--- pricing_serializer.rb
|       |       |       |   |   |--- product_access_serializer.rb
|       |       |       |   |   |--- product_serializer.rb
|       |       |       |   |   |--- review_serializer.rb
|       |       |       |   |   |--- sponsored_plan_serializer.rb
|       |       |       |   |   |--- subscription_plan_serializer.rb
|       |       |       |   |   +--- user_serializer.rb
|       |       |       |   |--- services
|       |       |       |   |   |--- company_cta_builder.rb
|       |       |       |   |   +--- search_service.rb
|       |       |       |   +--- validators
|       |       |       |       |--- phone_validator.rb
|       |       |       |       +--- url_validator.rb
|       |       |       |--- rubocop_backup
|       |       |       |   +--- 20250927_034336
|       |       |       |       |--- app
|       |       |       |       |   |--- admin
|       |       |       |       |   |   |--- admin_users.rb
|       |       |       |       |   |   |--- articles.rb
|       |       |       |       |   |   |--- badges.rb
|       |       |       |       |   |   |--- banners.rb
|       |       |       |       |   |   |--- banner_globals.rb
|       |       |       |       |   |   |--- campaigns.rb
|       |       |       |       |   |   |--- campaign_reviews.rb
|       |       |       |       |   |   |--- categories.rb
|       |       |       |       |   |   |--- companies.rb
|       |       |       |       |   |   |--- contents.rb
|       |       |       |       |   |   |--- dashboard.rb
|       |       |       |       |   |   |--- feature_groups.rb
|       |       |       |       |   |   |--- forum_answers.rb
|       |       |       |       |   |   |--- forum_questions.rb
|       |       |       |       |   |   |--- leads.rb
|       |       |       |       |   |   |--- plans.rb
|       |       |       |       |   |   |--- pricings.rb
|       |       |       |       |   |   |--- products.rb
|       |       |       |       |   |   |--- product_accesses.rb
|       |       |       |       |   |   |--- reviews.rb
|       |       |       |       |   |   |--- sponsored_plans.rb
|       |       |       |       |   |   |--- subscription_plans.rb
|       |       |       |       |   |   +--- users.rb
|       |       |       |       |   |--- channels
|       |       |       |       |   |   +--- application_cable
|       |       |       |       |   |       |--- channel.rb
|       |       |       |       |   |       +--- connection.rb
|       |       |       |       |   |--- controllers
|       |       |       |       |   |   |--- api
|       |       |       |       |   |   |   +--- v1
|       |       |       |       |   |   |       |--- admin
|       |       |       |       |   |   |       |   +--- categories_controller.rb
|       |       |       |       |   |   |       |--- articles_controller.rb
|       |       |       |       |   |   |       |--- authentication_controller.rb
|       |       |       |       |   |   |       |--- badges_controller.rb
|       |       |       |       |   |   |       |--- banners_controller.rb
|       |       |       |       |   |   |       |--- banner_globals_controller.rb
|       |       |       |       |   |   |       |--- base_controller.rb
|       |       |       |       |   |   |       |--- campaigns_controller.rb
|       |       |       |       |   |   |       |--- campaign_reviews_controller.rb
|       |       |       |       |   |   |       |--- categories_controller.rb
|       |       |       |       |   |   |       |--- companies_controller.rb
|       |       |       |       |   |   |       |--- contents_controller.rb
|       |       |       |       |   |   |       |--- dashboard_controller.rb
|       |       |       |       |   |   |       |--- feature_groups_controller.rb
|       |       |       |       |   |   |       |--- forum_answers_controller.rb
|       |       |       |       |   |   |       |--- forum_questions_controller.rb
|       |       |       |       |   |   |       |--- leads_controller.rb
|       |       |       |       |   |   |       |--- plans_controller.rb
|       |       |       |       |   |   |       |--- pricings_controller.rb
|       |       |       |       |   |   |       |--- products_controller.rb
|       |       |       |       |   |   |       |--- product_accesss_controller.rb
|       |       |       |       |   |   |       |--- reviews_controller.rb
|       |       |       |       |   |   |       |--- search_controller.rb
|       |       |       |       |   |   |       |--- sponsored_plans_controller.rb
|       |       |       |       |   |   |       |--- subscription_plans_controller.rb
|       |       |       |       |   |   |       +--- users_controller.rb
|       |       |       |       |   |   |--- users
|       |       |       |       |   |   |   |--- confirmations_controller.rb
|       |       |       |       |   |   |   |--- omniauth_callbacks_controller.rb
|       |       |       |       |   |   |   |--- passwords_controller.rb
|       |       |       |       |   |   |   |--- registrations_controller.rb
|       |       |       |       |   |   |   |--- sessions_controller.rb
|       |       |       |       |   |   |   +--- unlocks_controller.rb
|       |       |       |       |   |   |--- application_controller.rb
|       |       |       |       |   |   |--- corporate_controller.rb
|       |       |       |       |   |   |--- pages_controller.rb
|       |       |       |       |   |   +--- posts_controller.rb
|       |       |       |       |   |--- helpers
|       |       |       |       |   |   |--- api
|       |       |       |       |   |   |   +--- v1
|       |       |       |       |   |   |       |--- articles_helper.rb
|       |       |       |       |   |   |       |--- badges_helper.rb
|       |       |       |       |   |   |       |--- banners_helper.rb
|       |       |       |       |   |   |       |--- campaigns_helper.rb
|       |       |       |       |   |   |       |--- campaign_reviews_helper.rb
|       |       |       |       |   |   |       |--- categorys_helper.rb
|       |       |       |       |   |   |       |--- companys_helper.rb
|       |       |       |       |   |   |       |--- contents_helper.rb
|       |       |       |       |   |   |       |--- feature_groups_helper.rb
|       |       |       |       |   |   |       |--- forum_answers_helper.rb
|       |       |       |       |   |   |       |--- forum_questions_helper.rb
|       |       |       |       |   |   |       |--- leads_helper.rb
|       |       |       |       |   |   |       |--- plans_helper.rb
|       |       |       |       |   |   |       |--- pricings_helper.rb
|       |       |       |       |   |   |       |--- products_helper.rb
|       |       |       |       |   |   |       |--- product_accesss_helper.rb
|       |       |       |       |   |   |       |--- reviews_helper.rb
|       |       |       |       |   |   |       |--- sponsored_plans_helper.rb
|       |       |       |       |   |   |       |--- subscription_plans_helper.rb
|       |       |       |       |   |   |       +--- users_helper.rb
|       |       |       |       |   |   |--- application_helper.rb
|       |       |       |       |   |   |--- comments_helper.rb
|       |       |       |       |   |   |--- pages_helper.rb
|       |       |       |       |   |   |--- posts_helper.rb
|       |       |       |       |   |   +--- users_helper.rb
|       |       |       |       |   |--- jobs
|       |       |       |       |   |   +--- application_job.rb
|       |       |       |       |   |--- mailers
|       |       |       |       |   |   +--- application_mailer.rb
|       |       |       |       |   |--- models
|       |       |       |       |   |   |--- admin_user.rb
|       |       |       |       |   |   |--- application_record.rb
|       |       |       |       |   |   |--- article.rb
|       |       |       |       |   |   |--- badge.rb
|       |       |       |       |   |   |--- banner.rb
|       |       |       |       |   |   |--- banner_global.rb
|       |       |       |       |   |   |--- campaign.rb
|       |       |       |       |   |   |--- campaign_review.rb
|       |       |       |       |   |   |--- category.rb
|       |       |       |       |   |   |--- company.rb
|       |       |       |       |   |   |--- content.rb
|       |       |       |       |   |   |--- feature_group.rb
|       |       |       |       |   |   |--- forum_answer.rb
|       |       |       |       |   |   |--- forum_question.rb
|       |       |       |       |   |   |--- lead.rb
|       |       |       |       |   |   |--- plan.rb
|       |       |       |       |   |   |--- post.rb
|       |       |       |       |   |   |--- pricing.rb
|       |       |       |       |   |   |--- product.rb
|       |       |       |       |   |   |--- product_access.rb
|       |       |       |       |   |   |--- review.rb
|       |       |       |       |   |   |--- sponsored_plan.rb
|       |       |       |       |   |   |--- subscription_plan.rb
|       |       |       |       |   |   +--- user.rb
|       |       |       |       |   |--- notifiers
|       |       |       |       |   |   |--- application_notifier.rb
|       |       |       |       |   |   +--- comment_notifier.rb
|       |       |       |       |   |--- serializers
|       |       |       |       |   |   |--- article_serializer.rb
|       |       |       |       |   |   |--- badge_serializer.rb
|       |       |       |       |   |   |--- campaign_review_serializer.rb
|       |       |       |       |   |   |--- campaign_serializer.rb
|       |       |       |       |   |   |--- category_serializer.rb
|       |       |       |       |   |   |--- company_serializer.rb
|       |       |       |       |   |   |--- content_serializer.rb
|       |       |       |       |   |   |--- feature_group_serializer.rb
|       |       |       |       |   |   |--- forum_answer_serializer.rb
|       |       |       |       |   |   |--- forum_question_serializer.rb
|       |       |       |       |   |   |--- lead_serializer.rb
|       |       |       |       |   |   |--- plan_serializer.rb
|       |       |       |       |   |   |--- pricing_serializer.rb
|       |       |       |       |   |   |--- product_access_serializer.rb
|       |       |       |       |   |   |--- product_serializer.rb
|       |       |       |       |   |   |--- review_serializer.rb
|       |       |       |       |   |   |--- sponsored_plan_serializer.rb
|       |       |       |       |   |   |--- subscription_plan_serializer.rb
|       |       |       |       |   |   +--- user_serializer.rb
|       |       |       |       |   |--- services
|       |       |       |       |   |   |--- company_cta_builder.rb
|       |       |       |       |   |   +--- search_service.rb
|       |       |       |       |   +--- validators
|       |       |       |       |       |--- phone_validator.rb
|       |       |       |       |       +--- url_validator.rb
|       |       |       |       |--- scripts
|       |       |       |       |   |--- clean_admin_data.rb
|       |       |       |       |   |--- create_related_products.rb
|       |       |       |       |   +--- populate_admin_data.rb
|       |       |       |       |--- test
|       |       |       |       |   |--- channels
|       |       |       |       |   |   +--- application_cable
|       |       |       |       |   |       +--- connection_test.rb
|       |       |       |       |   |--- controllers
|       |       |       |       |   |   |--- api
|       |       |       |       |   |   |   +--- v1
|       |       |       |       |   |   |       |--- articles_controller_test.rb
|       |       |       |       |   |   |       |--- badges_controller_test.rb
|       |       |       |       |   |   |       |--- banners_controller_test.rb
|       |       |       |       |   |   |       |--- campaigns_controller_test.rb
|       |       |       |       |   |   |       |--- campaign_reviews_controller_test.rb
|       |       |       |       |   |   |       |--- categorys_controller_test.rb
|       |       |       |       |   |   |       |--- companys_controller_test.rb
|       |       |       |       |   |   |       |--- contents_controller_test.rb
|       |       |       |       |   |   |       |--- feature_groups_controller_test.rb
|       |       |       |       |   |   |       |--- forum_answers_controller_test.rb
|       |       |       |       |   |   |       |--- forum_questions_controller_test.rb
|       |       |       |       |   |   |       |--- leads_controller_test.rb
|       |       |       |       |   |   |       |--- plans_controller_test.rb
|       |       |       |       |   |   |       |--- pricings_controller_test.rb
|       |       |       |       |   |   |       |--- products_controller_test.rb
|       |       |       |       |   |   |       |--- product_accesss_controller_test.rb
|       |       |       |       |   |   |       |--- reviews_controller_test.rb
|       |       |       |       |   |   |       |--- sponsored_plans_controller_test.rb
|       |       |       |       |   |   |       |--- subscription_plans_controller_test.rb
|       |       |       |       |   |   |       +--- users_controller_test.rb
|       |       |       |       |   |   |--- comments_controller_test.rb
|       |       |       |       |   |   |--- pages_controller_test.rb
|       |       |       |       |   |   |--- posts_controller_test.rb
|       |       |       |       |   |   +--- users_controller_test.rb
|       |       |       |       |   |--- models
|       |       |       |       |   |   |--- admin_user_test.rb
|       |       |       |       |   |   |--- article_test.rb
|       |       |       |       |   |   |--- badge_test.rb
|       |       |       |       |   |   |--- banner_test.rb
|       |       |       |       |   |   |--- campaign_review_test.rb
|       |       |       |       |   |   |--- campaign_test.rb
|       |       |       |       |   |   |--- category_test.rb
|       |       |       |       |   |   |--- comment_test.rb
|       |       |       |       |   |   |--- company_test.rb
|       |       |       |       |   |   |--- content_test.rb
|       |       |       |       |   |   |--- feature_group_test.rb
|       |       |       |       |   |   |--- forum_answer_test.rb
|       |       |       |       |   |   |--- forum_question_test.rb
|       |       |       |       |   |   |--- lead_test.rb
|       |       |       |       |   |   |--- plan_test.rb
|       |       |       |       |   |   |--- post_test.rb
|       |       |       |       |   |   |--- pricing_test.rb
|       |       |       |       |   |   |--- product_access_test.rb
|       |       |       |       |   |   |--- product_test.rb
|       |       |       |       |   |   |--- review_test.rb
|       |       |       |       |   |   |--- sponsored_plan_test.rb
|       |       |       |       |   |   |--- subscription_plan_test.rb
|       |       |       |       |   |   +--- user_test.rb
|       |       |       |       |   |--- system
|       |       |       |       |   |   +--- posts_test.rb
|       |       |       |       |   |--- application_system_test_case.rb
|       |       |       |       |   +--- test_helper.rb
|       |       |       |       +--- fix_rubocop.rb
|       |       |       |--- scripts
|       |       |       |   |--- clean_admin_data.rb
|       |       |       |   |--- create_related_products.rb
|       |       |       |   +--- populate_admin_data.rb
|       |       |       |--- test
|       |       |       |   |--- channels
|       |       |       |   |   +--- application_cable
|       |       |       |   |       +--- connection_test.rb
|       |       |       |   |--- controllers
|       |       |       |   |   |--- api
|       |       |       |   |   |   +--- v1
|       |       |       |   |   |       |--- articles_controller_test.rb
|       |       |       |   |   |       |--- badges_controller_test.rb
|       |       |       |   |   |       |--- banners_controller_test.rb
|       |       |       |   |   |       |--- campaigns_controller_test.rb
|       |       |       |   |   |       |--- campaign_reviews_controller_test.rb
|       |       |       |   |   |       |--- categorys_controller_test.rb
|       |       |       |   |   |       |--- companys_controller_test.rb
|       |       |       |   |   |       |--- contents_controller_test.rb
|       |       |       |   |   |       |--- feature_groups_controller_test.rb
|       |       |       |   |   |       |--- forum_answers_controller_test.rb
|       |       |       |   |   |       |--- forum_questions_controller_test.rb
|       |       |       |   |   |       |--- leads_controller_test.rb
|       |       |       |   |   |       |--- plans_controller_test.rb
|       |       |       |   |   |       |--- pricings_controller_test.rb
|       |       |       |   |   |       |--- products_controller_test.rb
|       |       |       |   |   |       |--- product_accesss_controller_test.rb
|       |       |       |   |   |       |--- reviews_controller_test.rb
|       |       |       |   |   |       |--- sponsored_plans_controller_test.rb
|       |       |       |   |   |       |--- subscription_plans_controller_test.rb
|       |       |       |   |   |       +--- users_controller_test.rb
|       |       |       |   |   |--- comments_controller_test.rb
|       |       |       |   |   |--- pages_controller_test.rb
|       |       |       |   |   |--- posts_controller_test.rb
|       |       |       |   |   +--- users_controller_test.rb
|       |       |       |   |--- models
|       |       |       |   |   |--- admin_user_test.rb
|       |       |       |   |   |--- article_test.rb
|       |       |       |   |   |--- badge_test.rb
|       |       |       |   |   |--- banner_test.rb
|       |       |       |   |   |--- campaign_review_test.rb
|       |       |       |   |   |--- campaign_test.rb
|       |       |       |   |   |--- category_test.rb
|       |       |       |   |   |--- comment_test.rb
|       |       |       |   |   |--- company_test.rb
|       |       |       |   |   |--- content_test.rb
|       |       |       |   |   |--- feature_group_test.rb
|       |       |       |   |   |--- forum_answer_test.rb
|       |       |       |   |   |--- forum_question_test.rb
|       |       |       |   |   |--- lead_test.rb
|       |       |       |   |   |--- plan_test.rb
|       |       |       |   |   |--- post_test.rb
|       |       |       |   |   |--- pricing_test.rb
|       |       |       |   |   |--- product_access_test.rb
|       |       |       |   |   |--- product_test.rb
|       |       |       |   |   |--- review_test.rb
|       |       |       |   |   |--- sponsored_plan_test.rb
|       |       |       |   |   |--- subscription_plan_test.rb
|       |       |       |   |   +--- user_test.rb
|       |       |       |   |--- system
|       |       |       |   |   +--- posts_test.rb
|       |       |       |   |--- application_system_test_case.rb
|       |       |       |   +--- test_helper.rb
|       |       |       +--- fix_rubocop.rb
|       |       |--- scripts
|       |       |   |--- clean_admin_data.rb
|       |       |   |--- create_related_products.rb
|       |       |   +--- populate_admin_data.rb
|       |       |--- test
|       |       |   |--- channels
|       |       |   |   +--- application_cable
|       |       |   |       +--- connection_test.rb
|       |       |   |--- controllers
|       |       |   |   |--- api
|       |       |   |   |   +--- v1
|       |       |   |   |       |--- articles_controller_test.rb
|       |       |   |   |       |--- badges_controller_test.rb
|       |       |   |   |       |--- banners_controller_test.rb
|       |       |   |   |       |--- campaigns_controller_test.rb
|       |       |   |   |       |--- campaign_reviews_controller_test.rb
|       |       |   |   |       |--- categorys_controller_test.rb
|       |       |   |   |       |--- companys_controller_test.rb
|       |       |   |   |       |--- contents_controller_test.rb
|       |       |   |   |       |--- feature_groups_controller_test.rb
|       |       |   |   |       |--- forum_answers_controller_test.rb
|       |       |   |   |       |--- forum_questions_controller_test.rb
|       |       |   |   |       |--- leads_controller_test.rb
|       |       |   |   |       |--- plans_controller_test.rb
|       |       |   |   |       |--- pricings_controller_test.rb
|       |       |   |   |       |--- products_controller_test.rb
|       |       |   |   |       |--- product_accesss_controller_test.rb
|       |       |   |   |       |--- reviews_controller_test.rb
|       |       |   |   |       |--- sponsored_plans_controller_test.rb
|       |       |   |   |       |--- subscription_plans_controller_test.rb
|       |       |   |   |       +--- users_controller_test.rb
|       |       |   |   |--- comments_controller_test.rb
|       |       |   |   |--- pages_controller_test.rb
|       |       |   |   |--- posts_controller_test.rb
|       |       |   |   +--- users_controller_test.rb
|       |       |   |--- models
|       |       |   |   |--- admin_user_test.rb
|       |       |   |   |--- article_test.rb
|       |       |   |   |--- badge_test.rb
|       |       |   |   |--- banner_test.rb
|       |       |   |   |--- campaign_review_test.rb
|       |       |   |   |--- campaign_test.rb
|       |       |   |   |--- category_test.rb
|       |       |   |   |--- comment_test.rb
|       |       |   |   |--- company_test.rb
|       |       |   |   |--- content_test.rb
|       |       |   |   |--- feature_group_test.rb
|       |       |   |   |--- forum_answer_test.rb
|       |       |   |   |--- forum_question_test.rb
|       |       |   |   |--- lead_test.rb
|       |       |   |   |--- plan_test.rb
|       |       |   |   |--- post_test.rb
|       |       |   |   |--- pricing_test.rb
|       |       |   |   |--- product_access_test.rb
|       |       |   |   |--- product_test.rb
|       |       |   |   |--- review_test.rb
|       |       |   |   |--- sponsored_plan_test.rb
|       |       |   |   |--- subscription_plan_test.rb
|       |       |   |   +--- user_test.rb
|       |       |   |--- system
|       |       |   |   +--- posts_test.rb
|       |       |   |--- application_system_test_case.rb
|       |       |   +--- test_helper.rb
|       |       +--- fix_rubocop.rb
|       |--- scripts
|       |   |--- clean_admin_data.rb
|       |   |--- create_related_products.rb
|       |   +--- populate_admin_data.rb
|       |--- test
|       |   |--- channels
|       |   |   +--- application_cable
|       |   |       +--- connection_test.rb
|       |   |--- controllers
|       |   |   |--- api
|       |   |   |   +--- v1
|       |   |   |       |--- articles_controller_test.rb
|       |   |   |       |--- badges_controller_test.rb
|       |   |   |       |--- banners_controller_test.rb
|       |   |   |       |--- campaigns_controller_test.rb
|       |   |   |       |--- campaign_reviews_controller_test.rb
|       |   |   |       |--- categorys_controller_test.rb
|       |   |   |       |--- companys_controller_test.rb
|       |   |   |       |--- contents_controller_test.rb
|       |   |   |       |--- feature_groups_controller_test.rb
|       |   |   |       |--- forum_answers_controller_test.rb
|       |   |   |       |--- forum_questions_controller_test.rb
|       |   |   |       |--- leads_controller_test.rb
|       |   |   |       |--- plans_controller_test.rb
|       |   |   |       |--- pricings_controller_test.rb
|       |   |   |       |--- products_controller_test.rb
|       |   |   |       |--- product_accesss_controller_test.rb
|       |   |   |       |--- reviews_controller_test.rb
|       |   |   |       |--- sponsored_plans_controller_test.rb
|       |   |   |       |--- subscription_plans_controller_test.rb
|       |   |   |       +--- users_controller_test.rb
|       |   |   |--- comments_controller_test.rb
|       |   |   |--- pages_controller_test.rb
|       |   |   |--- posts_controller_test.rb
|       |   |   +--- users_controller_test.rb
|       |   |--- models
|       |   |   |--- admin_user_test.rb
|       |   |   |--- article_test.rb
|       |   |   |--- badge_test.rb
|       |   |   |--- banner_test.rb
|       |   |   |--- campaign_review_test.rb
|       |   |   |--- campaign_test.rb
|       |   |   |--- category_test.rb
|       |   |   |--- comment_test.rb
|       |   |   |--- company_test.rb
|       |   |   |--- content_test.rb
|       |   |   |--- feature_group_test.rb
|       |   |   |--- forum_answer_test.rb
|       |   |   |--- forum_question_test.rb
|       |   |   |--- lead_test.rb
|       |   |   |--- plan_test.rb
|       |   |   |--- post_test.rb
|       |   |   |--- pricing_test.rb
|       |   |   |--- product_access_test.rb
|       |   |   |--- product_test.rb
|       |   |   |--- review_test.rb
|       |   |   |--- sponsored_plan_test.rb
|       |   |   |--- subscription_plan_test.rb
|       |   |   +--- user_test.rb
|       |   |--- system
|       |   |   +--- posts_test.rb
|       |   |--- application_system_test_case.rb
|       |   +--- test_helper.rb
|       +--- fix_rubocop.rb
|--- scripts
|   |--- .rclone.conf.example
|   |--- activestorage_backup.sh
|   |--- check_staging_health.ps1
|   |--- check_staging_health.sh
|   |--- README_ACTIVESTORAGE_BACKUP.md
|   +--- setup_rclone.sh
|--- spec
|   |--- factories
|   |   |--- banners.rb
|   |   +--- main_factories.rb
|   |--- features
|   |   +--- authentication_spec.rb
|   |--- mailers
|   |   |--- company_access_mailer_spec.rb
|   |   +--- review_mailer_spec.rb
|   |--- models
|   |   |--- banner_spec.rb
|   |   |--- category_spec.rb
|   |   |--- company_access_request_spec.rb
|   |   |--- company_button_spec.rb
|   |   |--- company_media_spec.rb
|   |   |--- company_spec.rb
|   |   |--- faq_spec.rb
|   |   |--- financing_option_spec.rb
|   |   +--- lead_otp_spec.rb
|   |--- performance
|   |   +--- financing_simulate_load_spec.rb
|   |--- requests
|   |   |--- api
|   |   |   +--- v1
|   |   |       |--- company
|   |   |       |   +--- members_spec.rb
|   |   |       |--- analytics_conversions_spec.rb
|   |   |       |--- auth_errors_spec.rb
|   |   |       |--- auth_logout_spec.rb
|   |   |       |--- banners_category_targeting_spec.rb
|   |   |       |--- banners_spec.rb
|   |   |       |--- categories_cards_view_spec.rb
|   |   |       |--- companies_cities_spec.rb
|   |   |       |--- companies_mine_spec.rb
|   |   |       |--- company_access_spec.rb
|   |   |       |--- company_analytics_spec.rb
|   |   |       |--- faqs_spec.rb
|   |   |       |--- health_spec.rb
|   |   |       |--- leads_access_spec.rb
|   |   |       +--- leads_wizard_spec.rb
|   |   |--- admin_companies_edit_spec.rb
|   |   |--- admin_companies_import_spec.rb
|   |   |--- admin_companies_location_selector_spec.rb
|   |   |--- admin_company_access_requests_spec.rb
|   |   |--- admin_dashboard_spec.rb
|   |   |--- admin_products_spec.rb
|   |   |--- authentication_flow_spec.rb
|   |   +--- financing_proposals_spec.rb
|   |--- services
|   |   |--- company_dashboard
|   |   |   +--- stats_service_spec.rb
|   |   |--- jwt_blacklist_service_spec.rb
|   |   +--- lead_distribution_service_spec.rb
|   |--- rails_helper.rb
|   |--- spec_helper.rb
|   +--- swagger_helper.rb
|--- storage
|   |--- 00
|   |   +--- h4
|   |       +--- 00h41g8jo4zfk9zqb77klh5ogev6
|   |--- 01
|   |   +--- e6
|   |       +--- 01e6mecfbvtnilco7opkkv8ac8dl
|   |--- 04
|   |   +--- 0g
|   |       +--- 040gtvtjk8h2zlcmb0eeg5zm6vt6
|   |--- 0d
|   |   +--- qe
|   |       +--- 0dqeon8jmxwhxke8jax8zit2eojn
|   |--- 0j
|   |   +--- 98
|   |       +--- 0j98984lw8jif40u01u3406iq2ag
|   |--- 0v
|   |   +--- me
|   |       +--- 0vmev65fvw6bhu0pyc05jls35nfz
|   |--- 12
|   |   +--- dz
|   |       +--- 12dzh8ayn3j14s51h4qm8bl5d3eg
|   |--- 15
|   |   |--- 1f
|   |   |   +--- 151ffjekufdgyq90wb0uyi43wq5q
|   |   +--- 9w
|   |       +--- 159w1gmmv7r52sdi8zmxl8cwop5m
|   |--- 29
|   |   +--- qw
|   |       +--- 29qwpodd76oxbpeu1mw7koadeggv
|   |--- 2b
|   |   +--- v0
|   |       +--- 2bv0lp2buh2m92vwoikjxjxankjr
|   |--- 2o
|   |   +--- dm
|   |       +--- 2odm34ddmqa99tklm65rv4e3p8rw
|   |--- 2s
|   |   +--- x8
|   |       +--- 2sx8h32y050yqx31atcv3zfc2okc
|   |--- 2w
|   |   +--- cq
|   |       +--- 2wcqcept34fpbdj1e7lessuq4wk0
|   |--- 3d
|   |   +--- po
|   |       +--- 3dpo92epszyenxavfmakz3x6qdxw
|   |--- 3n
|   |   +--- zb
|   |       +--- 3nzbgwrt51pmnsar4eocpjaykapb
|   |--- 3o
|   |   +--- 6j
|   |       +--- 3o6jynq0votntrj1akp2sax3c1x8
|   |--- 3v
|   |   +--- gi
|   |       +--- 3vgi9fuaxdkj70ydjdimcg7atkvr
|   |--- 49
|   |   |--- e5
|   |   +--- ir
|   |       +--- 49irkyw150bxlnmzdb6ojxiicvy3
|   |--- 4l
|   |   +--- ox
|   |       +--- 4loxraczfrb98n9u4lg0yqvi0nfc
|   |--- 4q
|   |   +--- pg
|   |       +--- 4qpg1saegupfq8r2hqtmv8epxuxn
|   |--- 4v
|   |   +--- x6
|   |       +--- 4vx6vweb7a1ovkedslinkgbmnto4
|   |--- 4w
|   |   +--- 8n
|   |       +--- 4w8n2owmy1o03gbl9fzkipxn47xy
|   |--- 55
|   |   +--- 3x
|   |       +--- 553x5mg1e5wn3ejwxy3psw81humt
|   |--- 5v
|   |   +--- nv
|   |       +--- 5vnv56a2onauuw0x1x8cmr2bmqfx
|   |--- 5w
|   |   +--- 4z
|   |--- 66
|   |   +--- cr
|   |       +--- 66cr3hboyykkfkir3ojbf5ln337y
|   |--- 67
|   |   +--- 15
|   |       +--- 67156fl7ozaowoxo8rlxafu37x35
|   |--- 6s
|   |   +--- a5
|   |       +--- 6sa59n33357z2e7ojfhuh1gd0g80
|   |--- 6w
|   |   +--- qf
|   |       +--- 6wqf7i9q0wjq5mipvmw6nilqv53w
|   |--- 75
|   |   +--- 5d
|   |       +--- 755dnph70oqdq43oe9vhdfcz5vy2
|   |--- 7e
|   |   +--- 39
|   |       +--- 7e39ti0n8tqbfpu43nmuew6lzl9a
|   |--- 7y
|   |   +--- ri
|   |       +--- 7yriicd84l5bror4gb45pev85yle
|   |--- 86
|   |   +--- k2
|   |--- 8c
|   |   +--- va
|   |       +--- 8cvaf580gezrspe5fpwggwkri5jk
|   |--- 8g
|   |   +--- xj
|   |       +--- 8gxji1opreho9cm1ceh8wmhjv3w2
|   |--- 8h
|   |   +--- cw
|   |       +--- 8hcwgvlhhfh96g9thnsehaqeipyv
|   |--- 8o
|   |   +--- 6m
|   |       +--- 8o6mf4rv43l7kpcbeqe7ybs7bz73
|   |--- 8w
|   |   +--- uw
|   |       +--- 8wuwsboo0e95fo6g8y4h7hrlca83
|   |--- 98
|   |   +--- if
|   |       +--- 98if5tu5c2g1n3anoztnk7atk4e0
|   |--- 9q
|   |   +--- s8
|   |--- az
|   |   +--- m5
|   |       +--- azm5z9z4fua02250x335j9lsqtrh
|   |--- bj
|   |   +--- z9
|   |       +--- bjz99q97jl32h0tjrgg419z216q5
|   |--- bl
|   |   +--- 3w
|   |       +--- bl3wcnp4gs44yylwc8ex9fllqyli
|   |--- bu
|   |   +--- f0
|   |       +--- buf0tl4uj8kjw590jkh6lx4c7c1i
|   |--- ch
|   |   +--- ex
|   |       +--- chexb3sxvl83al3eh1g1vdksyzg1
|   |--- ci
|   |   +--- 87
|   |       +--- ci871iakivfjm9ujriyw63pl9v7e
|   |--- ck
|   |   +--- vs
|   |       +--- ckvs9ryv61iebw074aqg4gu0jgd4
|   |--- cs
|   |   +--- s3
|   |       +--- css3vht6ln2v9xwmohcqed3o7xx5
|   |--- cu
|   |   +--- am
|   |       +--- cuamqk06mtz3h4goegieuq8oge3q
|   +--- d1
|       +--- 30
|           +--- d130h2ycafydtd7o32o7wwxbwnjh
|--- test
|   |--- channels
|   |   +--- application_cable
|   |       +--- connection_test.rb
|   |--- controllers
|   |   |--- api
|   |   |   +--- v1
|   |   |       |--- analytics_controller_test.rb
|   |   |       |--- articles_controller_test.rb
|   |   |       |--- auth_controller_test.rb
|   |   |       |--- badges_controller_test.rb
|   |   |       |--- banners_controller_test.rb
|   |   |       |--- banner_globals_controller_test.rb
|   |   |       |--- banner_offers_controller_test.rb
|   |   |       |--- campaigns_controller_test.rb
|   |   |       |--- campaign_reviews_controller_test.rb
|   |   |       |--- categorys_controller_test.rb
|   |   |       |--- classification_test.rb
|   |   |       |--- companys_controller_test.rb
|   |   |       |--- company_dashboard_controller_test.rb
|   |   |       |--- contents_controller_test.rb
|   |   |       |--- dashboard_controller_test.rb
|   |   |       |--- feature_groups_controller_test.rb
|   |   |       |--- forum_answers_controller_test.rb
|   |   |       |--- forum_questions_controller_test.rb
|   |   |       |--- leads_controller_test.rb
|   |   |       |--- payments_webhooks_controller_test.rb
|   |   |       |--- plans_controller_test.rb
|   |   |       |--- pricings_controller_test.rb
|   |   |       |--- products_controller_test.rb
|   |   |       |--- product_accesss_controller_test.rb
|   |   |       |--- reviews_controller_test.rb
|   |   |       |--- search_controller_test.rb
|   |   |       |--- sponsored_plans_controller_test.rb
|   |   |       |--- subscription_plans_controller_test.rb
|   |   |       +--- users_controller_test.rb
|   |   |--- concerns
|   |   |   +--- paginatable_test.rb
|   |   |--- .keep
|   |   |--- comments_controller_test.rb
|   |   |--- content_feed_controller_test.rb
|   |   |--- health_controller_test.rb
|   |   |--- pages_controller_test.rb
|   |   |--- posts_controller_test.rb
|   |   +--- users_controller_test.rb
|   |--- fixtures
|   |   |--- action_text
|   |   |   +--- rich_texts.yml
|   |   |--- files
|   |   |   +--- .keep
|   |   |--- admin_users.yml
|   |   |--- articles.yml
|   |   |--- badges.yml
|   |   |--- banners.yml
|   |   |--- campaigns.yml
|   |   |--- campaign_reviews.yml
|   |   |--- categories.yml
|   |   |--- comments.yml
|   |   |--- companies.yml
|   |   |--- contents.yml
|   |   |--- downloadables.yml
|   |   |--- feature_groups.yml
|   |   |--- financing_configurations.yml
|   |   |--- forum_answers.yml
|   |   |--- forum_questions.yml
|   |   |--- leads.yml
|   |   |--- plans.yml
|   |   |--- posts.yml
|   |   |--- pricings.yml
|   |   |--- products.yml
|   |   |--- product_accesses.yml
|   |   |--- reviews.yml
|   |   |--- sponsored_plans.yml
|   |   |--- subscription_plans.yml
|   |   +--- users.yml
|   |--- helpers
|   |   +--- .keep
|   |--- integration
|   |   |--- .keep
|   |   |--- admin_financing_test.rb
|   |   |--- api_authentication_test.rb
|   |   |--- api_error_handling_test.rb
|   |   |--- api_pagination_test.rb
|   |   |--- company_members_controller_test.rb
|   |   |--- cors_test.rb
|   |   |--- pending_changes_controller_test.rb
|   |   +--- rack_attack_test.rb
|   |--- jobs
|   |   +--- welcome_email_job_test.rb
|   |--- mailers
|   |   +--- .keep
|   |--- models
|   |   |--- .keep
|   |   |--- admin_user_test.rb
|   |   |--- article_test.rb
|   |   |--- badge_test.rb
|   |   |--- banner_test.rb
|   |   |--- campaign_review_test.rb
|   |   |--- campaign_test.rb
|   |   |--- category_test.rb
|   |   |--- comment_test.rb
|   |   |--- company_test.rb
|   |   |--- content_test.rb
|   |   |--- downloadable_test.rb
|   |   |--- feature_group_test.rb
|   |   |--- financing_configuration_test.rb
|   |   |--- forum_answer_test.rb
|   |   |--- forum_question_test.rb
|   |   |--- lead_test.rb
|   |   |--- plan_test.rb
|   |   |--- post_test.rb
|   |   |--- pricing_test.rb
|   |   |--- product_access_test.rb
|   |   |--- product_status_transition_test.rb
|   |   |--- product_test.rb
|   |   |--- review_test.rb
|   |   |--- sponsored_plan_test.rb
|   |   |--- subscription_plan_test.rb
|   |   +--- user_test.rb
|   |--- serializers
|   |   +--- company_serializer_test.rb
|   |--- services
|   |   |--- company_cta_builder_test.rb
|   |   |--- content_feed_service_test.rb
|   |   |--- email_service_test.rb
|   |   |--- notification_service_test.rb
|   |   +--- search_service_test.rb
|   |--- system
|   |   |--- .keep
|   |   +--- posts_test.rb
|   |--- application_system_test_case.rb
|   |--- README.md
|   +--- test_helper.rb
|--- tmp
|   |--- cache
|   |   |--- assets
|   |   |   +--- sprockets
|   |   |       +--- v4.0.0
|   |   |           |--- -5
|   |   |           |   +--- -5sD_iKt0buoysZ7hh4tShGZZrSG80JJ0EVNaGdmhEY.cache
|   |   |           |--- -f
|   |   |           |   +--- -fPOqlDcdKBFb6akLowNLRKvi0KsOYJ0l2KKGd290aQ.cache
|   |   |           |--- -o
|   |   |           |   +--- -o5Ai7p8lUd33GM6NdGgueMyQqW8oLlzpObPv5rlqi8.cache
|   |   |           |--- -q
|   |   |           |   |--- -Qg-EMxo-89aYh9OzbyKSPLKh5Xf9uygM32Rp8OdTCE.cache
|   |   |           |   +--- -qo1jyh5Ixfhgq1ZtHaNai2ylQvx_9m8COqpwk_ui0Y.cache
|   |   |           |--- -S
|   |   |           |   +--- -SE3ms12rWV8UDT8d0KqOgsN7hb1f09VhXkXSO-utXI.cache
|   |   |           |--- -V
|   |   |           |   +--- -VESp5F_pJUiZu8zLlza5A_cMLuISG0B41PG--8pQS8.cache
|   |   |           |--- -x
|   |   |           |   +--- -xMOwNRl96QVl2aoDOY4H7x42_WK3c3YYTF30x7mhvM.cache
|   |   |           |--- 0-
|   |   |           |   +--- 0-mfszKb9hM_frsU5bCgL58lYiOvkldqCjt_bIIajKs.cache
|   |   |           |--- 02
|   |   |           |   +--- 02_4DnqDjPj8pHCnsMD9SN88G82g9LNVdn_C16EWLfg.cache
|   |   |           |--- 06
|   |   |           |   +--- 065LN-IbQ6bZfsNHBiwUxsBLDkrQ4ul-g-cyGnc99x0.cache
|   |   |           |--- 0M
|   |   |           |   +--- 0MOMSue9thlS55h73L78iFx7v6GsUFu76qHPug9Z4hs.cache
|   |   |           |--- 0n
|   |   |           |   +--- 0nhWTscq7ptyoNsLX4SarfOUNYvUzG_-e4xW5v57hCY.cache
|   |   |           |--- 0X
|   |   |           |   +--- 0XzJKsmyTqrS2fEYIqdpeE3q46AqsTCHTyYxooUBuYU.cache
|   |   |           |--- 0y
|   |   |           |   +--- 0yazDw7FHCWdaAup7tMRgyRcLjj80cgut-ED17_HJ78.cache
|   |   |           |--- 1a
|   |   |           |   +--- 1ag_m5juUPK8-JsadySEegpkQBOa0GIMvcgvMV93mk8.cache
|   |   |           |--- 1n
|   |   |           |   +--- 1nucSSQe1SS6O2tGgGcfu0oXPadNwgXMkCQbx_9GMJg.cache
|   |   |           |--- 1u
|   |   |           |   +--- 1uy2CFNGEK_s3Z9N7IOVEbhwogERvnRzJRM6NHrgCZI.cache
|   |   |           |--- 1v
|   |   |           |   +--- 1vb0Z7mzV9waHLfgpIpu0AJGR5gyP42Vne6im0vVUfA.cache
|   |   |           |--- 1X
|   |   |           |   +--- 1X8pC66yxCMhqO6e7vcilqwuFDUEwLwRMIsZGq0ACT8.cache
|   |   |           |--- 1Y
|   |   |           |   +--- 1Yg-ch6X5MUijKEScDq-pQmxkdc1AgpijtCHHTsGKnU.cache
|   |   |           |--- 1Z
|   |   |           |   +--- 1ZEFVzS03GUgNA13bsfs_hms30EtcH6mB6aJ4PgRPGE.cache
|   |   |           |--- 2h
|   |   |           |   +--- 2hcGguCfpLxMr8dF0VbeboYVCRSVM-2-2ElmrT95uzQ.cache
|   |   |           |--- 2K
|   |   |           |   +--- 2Kqqs5CDZKeqQ8Zi3OcRThACYBsE09CB_YbQaG96080.cache
|   |   |           |--- 2V
|   |   |           |   +--- 2VIYHBtxVV2MBMfmhYAlG_YT2qG0-gJ-CJAkuZPuF9M.cache
|   |   |           |--- 2x
|   |   |           |   +--- 2xGNktMX3GCkm974xg5gGwpZ2Rlm-akWyz_NeeIQ5Lg.cache
|   |   |           |--- 30
|   |   |           |   |--- 30fJ8xKz9B-gxvl61rFCcc1Erf9kHf2AWXzm_LV4rcA.cache
|   |   |           |   +--- 30T1BVseFd9Ap29SDAszKTvMo_I4p8G-2DmgDqq2RDQ.cache
|   |   |           |--- 3a
|   |   |           |   |--- 3APgdGmKfNvawbVwSVcx6Ym_ObiuCp5TFXuT5Bmyfgw.cache
|   |   |           |   +--- 3azXyOXhvbMgqPjbXhxGu_BvwYQ9iejHdy8j1NPTFqw.cache
|   |   |           |--- 3H
|   |   |           |   +--- 3HYkuHdhwKm-lXXofEAcDhe3MmOH_C2SELUGc01oarc.cache
|   |   |           |--- 3Q
|   |   |           |   +--- 3QQKGSbsvFk-qkWhV7Z45wKxg39SijtC7ICQZ_7I0r4.cache
|   |   |           |--- 3S
|   |   |           |   +--- 3SWijOCDI56WCU3RR2zqSEHH_GB5g0euNiENicZi008.cache
|   |   |           |--- 40
|   |   |           |   +--- 40i_BteXhDmbugmy5AAopcTqdgzOyfnA7vSDMRkjzOU.cache
|   |   |           |--- 4B
|   |   |           |   +--- 4BdP_EsPoqi8ZlOrusdaIKi_My0cfygogp46Mac63OA.cache
|   |   |           |--- 4d
|   |   |           |   +--- 4d3l8quuSloWh_wMFzXpD_3igd7J6gSosB-ExJ1Hx64.cache
|   |   |           |--- 4F
|   |   |           |   +--- 4FxWOh3TplKNJlbt1hYvEmX076TXF2qAaBTo93OHGGk.cache
|   |   |           |--- 4O
|   |   |           |   +--- 4OEjOPVVI5TWRifeClfF-XTSD0QUrRMXzqD49xto-Hg.cache
|   |   |           |--- 4t
|   |   |           |   +--- 4t5Jl7UGBfxs1yWPDZ2wXhk_HeNep-KjkM-OqJKmQKA.cache
|   |   |           |--- 58
|   |   |           |   +--- 58hJd3stx6L6bnbJfa_KXMxWosBTlYTmUvcpi82IlqE.cache
|   |   |           |--- 5i
|   |   |           |   +--- 5iNVSGCJs5h9ULoRq-SG19DKnGUYlanzLUd1LLnDKsI.cache
|   |   |           |--- 5J
|   |   |           |   +--- 5JVDdqQitl-DcrHZ9WyvmWKXgFoBVMD2MEd63uCe1Ak.cache
|   |   |           |--- 5l
|   |   |           |   +--- 5lXAsCbgaYtIgqqHf5PeLzU05uDGqv1BWaanQv3f4tQ.cache
|   |   |           |--- 5m
|   |   |           |   +--- 5mKYwdmWwkoewycQid_KeuH3c8YsWkAe3NDeXro5WSk.cache
|   |   |           |--- 5t
|   |   |           |   +--- 5teENXP0pE29waiI-aONAwnNq-6JHVZ4d4uM26ZGrjo.cache
|   |   |           |--- 6d
|   |   |           |   +--- 6d02S-cbvW7JFFhtS_vIjz42jKUhd3l59LFelJzQO3A.cache
|   |   |           |--- 6f
|   |   |           |   +--- 6fCbX9phaWrTkMmosu9vt5P6DsPBuKSu2nS3Ul3QBEo.cache
|   |   |           |--- 6i
|   |   |           |   |--- 6I4lndgeVh10-lT21_dTgG-s9BPYWIEjiit_vOd9JPo.cache
|   |   |           |   +--- 6iL2L8GyhG4NMWBVdNlfvbb-wC_DmsJ4tRA28Zm_0nU.cache
|   |   |           |--- 6O
|   |   |           |   +--- 6OOR3lmKfLHUIiTf56e7aUOlEnyS5dsd-9bcM9bmni8.cache
|   |   |           |--- 6r
|   |   |           |   +--- 6rA4Q8v1gnsvwRIcS6HFm1AcY_sUbkn68HO-xOT39ks.cache
|   |   |           |--- 6s
|   |   |           |   +--- 6sRu-nPjM65vznrJAvGukU5hmVOfBvWXsYBCeSLmtRQ.cache
|   |   |           |--- 6u
|   |   |           |   +--- 6ubWPQ5ECjvbNq9N4wSTF9JFcVnL4l_11k4IzwVjTcM.cache
|   |   |           +--- 7-
|   |   |               +--- 7-3nah_SiOcEXed5FlNqOV-zi6Hu3uo_BVAp7T20qaY.cache
|   |   +--- bootsnap
|   |       |--- compile-cache-iseq
|   |       |   |--- 00
|   |       |   |   |--- 0827eea6a9bf7f
|   |       |   |   |--- 0db9d0cdb5ec7d
|   |       |   |   |--- 1c0120ee6a861e
|   |       |   |   |--- 268f7e4e3cbf8c
|   |       |   |   |--- 2ab93ea62b96a7
|   |       |   |   |--- 303de96f13088d
|   |       |   |   |--- 4e6432fbe7c965
|   |       |   |   |--- 52ebf40665b6b9
|   |       |   |   |--- 566f43281cdfb7
|   |       |   |   |--- 5e6513679b7e14
|   |       |   |   |--- 640eb4e18db2eb
|   |       |   |   |--- 69602772b33e95
|   |       |   |   |--- 7b2d966af06eb2
|   |       |   |   |--- 7f6bfba80c3c42
|   |       |   |   |--- ae9ec87dde3912
|   |       |   |   |--- c72a315dc3da0b
|   |       |   |   |--- c8a5fcb5e26f47
|   |       |   |   |--- c928ba06df1bfa
|   |       |   |   |--- d2ca76fc94fa66
|   |       |   |   |--- d443fbac611ec9
|   |       |   |   |--- e4cf6a88388c32
|   |       |   |   |--- e7b939c91ec161
|   |       |   |   |--- e874becbeefa64
|   |       |   |   |--- e90bfc51d67aa8
|   |       |   |   |--- f0182bd05b1bfd
|   |       |   |   |--- f9a24018dde315
|   |       |   |   +--- fa79644117957e
|   |       |   |--- 01
|   |       |   |   |--- 01e2e04595dd2d
|   |       |   |   |--- 03d3acc6a2f6d0
|   |       |   |   |--- 041de015a434ce
|   |       |   |   |--- 08b0f0092f0b5b
|   |       |   |   |--- 0a6e963978e8a1
|   |       |   |   |--- 1f237b6bef3cad
|   |       |   |   |--- 24d5539c8981b1
|   |       |   |   |--- 281555a82fad14
|   |       |   |   |--- 2821c0e5a6e57b
|   |       |   |   |--- 288d0204ef4ee7
|   |       |   |   |--- 2c1105a0e52c75
|   |       |   |   |--- 2fb4c1a37f7ac3
|   |       |   |   |--- 2fb9a743fdeea3
|   |       |   |   |--- 3467481bb727b3
|   |       |   |   |--- 4496eef32b60ee
|   |       |   |   |--- 4e5cb1cd3f7aa0
|   |       |   |   |--- 4ef11678dfaf31
|   |       |   |   |--- 542cc1b679c919
|   |       |   |   |--- 578e0ba73f8a6c
|   |       |   |   |--- 5b5ee021432e61
|   |       |   |   |--- 5e1ff894eb15d6
|   |       |   |   |--- 775e045115aa76
|   |       |   |   |--- 797b5bc449fcc2
|   |       |   |   |--- 7a17fa69ca4e8f
|   |       |   |   |--- 7c7a9cf9edf76e
|   |       |   |   |--- 8aea50eba2b8cd
|   |       |   |   |--- 9b2e6717e58692
|   |       |   |   |--- a074c317dae4e9
|   |       |   |   |--- abc44bb59ec1a9
|   |       |   |   |--- b2bbf20cbd9bf3
|   |       |   |   |--- c3607e0e29c564
|   |       |   |   |--- d5bfb89ab74ada
|   |       |   |   |--- f0bdb574e79e25
|   |       |   |   +--- f4f0ceae08e6c3
|   |       |   |--- 02
|   |       |   |   |--- 051bca212065d4
|   |       |   |   |--- 0ea388ea0f56c5
|   |       |   |   |--- 214cd97d5fd799
|   |       |   |   |--- 318149c3fead46
|   |       |   |   |--- 31836a232217b5
|   |       |   |   |--- 32157e26ce8939
|   |       |   |   |--- 4c780d610eef9b
|   |       |   |   |--- 645a733d0d9922
|   |       |   |   |--- 6c3703c3877dc4
|   |       |   |   |--- 7280c4d51459fd
|   |       |   |   |--- 737b792166b56e
|   |       |   |   |--- 763b004afeb2ef
|   |       |   |   |--- 7714150ce0fe07
|   |       |   |   |--- 77af07c4ac8ed6
|   |       |   |   |--- 94f8b54f3f3ee4
|   |       |   |   |--- 9de6bcbe6a97d7
|   |       |   |   |--- a94feb0617b23b
|   |       |   |   |--- ae134404bc78b4
|   |       |   |   |--- b64b757893ee76
|   |       |   |   |--- b84e5f6b98e10f
|   |       |   |   |--- ecc58f88b7e5fb
|   |       |   |   |--- f59415b4a75d35
|   |       |   |   +--- fae94448cea525
|   |       |   |--- 03
|   |       |   |   |--- 0c3a7efe90b227
|   |       |   |   |--- 15d983c3614da7
|   |       |   |   |--- 22cd297a5ba6e4
|   |       |   |   |--- 35c3c779984e9e
|   |       |   |   |--- 3c663aba9bf36c
|   |       |   |   |--- 3cbaa7a65a424e
|   |       |   |   |--- 50e96d4e93ad51
|   |       |   |   |--- 53d2bd1d6712fa
|   |       |   |   |--- 60fe6d2c417fef
|   |       |   |   |--- 6883de2878c617
|   |       |   |   |--- 7356a619394c58
|   |       |   |   |--- 79481084f393de
|   |       |   |   |--- 83ab1c7ce09369
|   |       |   |   |--- 9928815e4ec07f
|   |       |   |   |--- a81e748fa1366a
|   |       |   |   |--- c9450e403d20d6
|   |       |   |   |--- dec35576ae3ed9
|   |       |   |   |--- e029eca5af807f
|   |       |   |   |--- e6f5b7e9c55d32
|   |       |   |   |--- f16a496166bfd6
|   |       |   |   |--- f18d161257015f
|   |       |   |   +--- f8223d0b78029b
|   |       |   |--- 04
|   |       |   |   |--- 0cec8fdd83f780
|   |       |   |   |--- 1b93b426852d18
|   |       |   |   |--- 1e538855436676
|   |       |   |   |--- 28c169614ea638
|   |       |   |   |--- 37688ee61bdb58
|   |       |   |   |--- 386874daba4abf
|   |       |   |   |--- 3b9477cfa60b99
|   |       |   |   |--- 532641babcba31
|   |       |   |   |--- 54494dcf811a02
|   |       |   |   |--- 5cefa3c2cc2746
|   |       |   |   |--- 630922183bbe23
|   |       |   |   |--- 642b1600b244db
|   |       |   |   |--- 6ab1b5135d413d
|   |       |   |   |--- 89ef1f72858e28
|   |       |   |   |--- a95b0608387274
|   |       |   |   |--- ab7947b4c7ad6c
|   |       |   |   |--- ada65d87829959
|   |       |   |   |--- b2e0c386388c24
|   |       |   |   |--- b90fe3cbbd6065
|   |       |   |   |--- bb3b5c88813d57
|   |       |   |   |--- c22ccfa1e3b3c5
|   |       |   |   |--- e4fbab71b0ee8b
|   |       |   |   |--- e65450960cd923
|   |       |   |   |--- ed490bb5d53361
|   |       |   |   |--- ef7d733d4aface
|   |       |   |   |--- f52f1c05c3bbfd
|   |       |   |   +--- fbc8c56ab5b987
|   |       |   |--- 05
|   |       |   |   |--- 0170284bb31f08
|   |       |   |   |--- 3217cd0cdfccb5
|   |       |   |   |--- 49d32bc23da67d
|   |       |   |   |--- 4d2cd5613553c7
|   |       |   |   |--- 6f830b0db243ab
|   |       |   |   |--- 83af41fb2de5ac
|   |       |   |   |--- 97778168c20213
|   |       |   |   |--- acc35d885e5f7b
|   |       |   |   |--- b1abdf74ae4f4d
|   |       |   |   |--- b6067e8d923843
|   |       |   |   |--- bdd437671759f5
|   |       |   |   |--- be86cd41396f00
|   |       |   |   |--- c1eeda38aa40ce
|   |       |   |   |--- c44fefab2e4a32
|   |       |   |   |--- c7e17e5876f68f
|   |       |   |   |--- cd103cbe23fe19
|   |       |   |   +--- d294acda346d12
|   |       |   |--- 06
|   |       |   |   |--- 010b7c787e1a9b
|   |       |   |   |--- 0cb8a5306040eb
|   |       |   |   |--- 0d4d01693b20a6
|   |       |   |   |--- 189d1cda536353
|   |       |   |   |--- 1bc4ea431edec6
|   |       |   |   |--- 295898a5a244f0
|   |       |   |   |--- 2e97f4c5cfa7fe
|   |       |   |   |--- 36bb55da2bad07
|   |       |   |   |--- 4c1ccbf6f7fefb
|   |       |   |   |--- 53180bdff9d3df
|   |       |   |   |--- 696f6c7d453c4e
|   |       |   |   |--- 76706d208801fa
|   |       |   |   |--- 805bda9158faa0
|   |       |   |   |--- 82d90f0b1b83f7
|   |       |   |   |--- 86c7f6743bfc39
|   |       |   |   |--- 926b0aa747a40d
|   |       |   |   |--- 98a4a13e51eeb2
|   |       |   |   |--- 9923720a5361e5
|   |       |   |   |--- a6c2b221cd7483
|   |       |   |   |--- add07d1d5a4ccf
|   |       |   |   |--- b06b4ba4dc41d5
|   |       |   |   |--- b6e9671e01ed2c
|   |       |   |   |--- c0730ff2f6ec26
|   |       |   |   |--- e31dc22feb291e
|   |       |   |   |--- e55f4e43938f22
|   |       |   |   |--- f664305f4cc940
|   |       |   |   |--- f6c4d4992714b4
|   |       |   |   |--- f99366f3713be0
|   |       |   |   +--- fb0568d0aac48b
|   |       |   |--- 07
|   |       |   |   |--- 095d48cb171a75
|   |       |   |   |--- 1addaf0cb7b939
|   |       |   |   |--- 1c3989061fd233
|   |       |   |   |--- 1eb39afe62742e
|   |       |   |   |--- 2c559c57f77dd9
|   |       |   |   |--- 34478e438e6ed4
|   |       |   |   |--- 467ad3635ef6d3
|   |       |   |   |--- 4d2cfad231bfa2
|   |       |   |   |--- 4f2d3871cbcd51
|   |       |   |   |--- 586d1fe749272c
|   |       |   |   |--- 60ffc945239d74
|   |       |   |   |--- 6c990d2c8355a3
|   |       |   |   |--- 791a5d2d0c0eed
|   |       |   |   |--- 79343db532cbb3
|   |       |   |   |--- 8c4962f1026e2c
|   |       |   |   |--- b77a4543e4b96e
|   |       |   |   |--- b8007466a9dc13
|   |       |   |   |--- ba9fe1977e6dd3
|   |       |   |   +--- e4c032a98a13ec
|   |       |   |--- 08
|   |       |   |   |--- 014223799bf43a
|   |       |   |   |--- 035422559d40b8
|   |       |   |   |--- 122eb0b2c10cf8
|   |       |   |   |--- 1546ff254a38df
|   |       |   |   |--- 1f8a658887f11d
|   |       |   |   |--- 276bba6dbde24e
|   |       |   |   |--- 32ef7b15edb0ad
|   |       |   |   |--- 488c1cceb04d99
|   |       |   |   |--- 529894781543e4
|   |       |   |   |--- 553e304218a8c8
|   |       |   |   |--- 554674646de5ba
|   |       |   |   |--- 57102d95b13a9d
|   |       |   |   |--- 582829524ebf9c
|   |       |   |   |--- 6627b4d13cbaf6
|   |       |   |   |--- 66c0fd757d7ccc
|   |       |   |   |--- 6d92a041045e29
|   |       |   |   |--- 6e8131c5c63a11
|   |       |   |   |--- 7a91b0ecb7b6de
|   |       |   |   |--- 7d4b9d7b0e47d6
|   |       |   |   |--- 8256afdfc12d5f
|   |       |   |   |--- 89aa91d308a346
|   |       |   |   |--- 8a0da8fa1c2db5
|   |       |   |   |--- 9a1236a75c855d
|   |       |   |   |--- a7011d1859dedb
|   |       |   |   |--- b9f26bb58d108a
|   |       |   |   |--- bf8af91d3de9e7
|   |       |   |   |--- bfe5e6f092f6cd
|   |       |   |   |--- c9ed2ea71bb80f
|   |       |   |   |--- ca3fac6a81794f
|   |       |   |   |--- cc2da8e6b153b7
|   |       |   |   |--- d57e5ad44f354b
|   |       |   |   |--- de861ab7127e4e
|   |       |   |   |--- e4c8b4fc7728cb
|   |       |   |   |--- e9b188f77e220c
|   |       |   |   +--- f5a87f66374b77
|   |       |   |--- 09
|   |       |   |   |--- 002f33250c5a2b
|   |       |   |   |--- 0fae7a00c4ff15
|   |       |   |   |--- 1c84c603fb76cc
|   |       |   |   |--- 1ff5d39d56cc52
|   |       |   |   |--- 247af1c81a4384
|   |       |   |   |--- 2e310ce05ec21d
|   |       |   |   |--- 2e6861d74a958c
|   |       |   |   |--- 32b7f60b413330
|   |       |   |   |--- 33ae2a388ace13
|   |       |   |   |--- 3512d50d3f6896
|   |       |   |   |--- 357dddc4dfa6de
|   |       |   |   |--- 3f419ebec71d13
|   |       |   |   |--- 534efcf6ed558b
|   |       |   |   |--- 7a6766843e8501
|   |       |   |   |--- 88d9f9dc321646
|   |       |   |   |--- 8ab3e27b14857a
|   |       |   |   |--- 969c45f51f32e7
|   |       |   |   |--- a56ee83ee30f5d
|   |       |   |   |--- a9e349dd72814b
|   |       |   |   |--- e01ea77c405a67
|   |       |   |   |--- e8fb508eebf204
|   |       |   |   |--- e99d0eb5220639
|   |       |   |   +--- eb9b57fa2b6687
|   |       |   |--- 0a
|   |       |   |   |--- 02cc9eb8add8b0
|   |       |   |   |--- 080fd38d8b795c
|   |       |   |   |--- 12582af5469aaf
|   |       |   |   |--- 179f855e94671e
|   |       |   |   |--- 1f6474ffa7d401
|   |       |   |   |--- 25cc9898350b93
|   |       |   |   |--- 2ffda1db69ea3a
|   |       |   |   |--- 53e90032e61c4a
|   |       |   |   |--- 60a4bca4d617f8
|   |       |   |   |--- 68ce3d85b9d520
|   |       |   |   |--- 6b433cfe1f21b5
|   |       |   |   |--- 74751ff92beb83
|   |       |   |   |--- 7a67e699079dd0
|   |       |   |   |--- 89c707f82d6800
|   |       |   |   |--- aef08ca1907f28
|   |       |   |   |--- bb8c9f16b4b64b
|   |       |   |   |--- c1ecc60f7ee881
|   |       |   |   |--- cc4c76948af9dc
|   |       |   |   |--- d2a12cfba550b6
|   |       |   |   |--- dc8d731acde149
|   |       |   |   |--- e2aa549d53c67f
|   |       |   |   |--- ef2d58940debe7
|   |       |   |   |--- eff62d6898929c
|   |       |   |   +--- fcb687d0dc969a
|   |       |   |--- 0b
|   |       |   |   |--- 02c6b7758b6e89
|   |       |   |   |--- 185a41552c4eda
|   |       |   |   |--- 1edd6dd4658b34
|   |       |   |   |--- 22b8c403bad1ab
|   |       |   |   |--- 26b3fa12aea478
|   |       |   |   |--- 304d60f50321e2
|   |       |   |   |--- 4f9f3ca6897bd5
|   |       |   |   |--- 5063d00d6991d6
|   |       |   |   |--- 52cb489f57de73
|   |       |   |   |--- 64388054f12fdb
|   |       |   |   |--- 69ef1260c6f56d
|   |       |   |   |--- 7495f526d7be22
|   |       |   |   |--- 84f6368435525b
|   |       |   |   |--- 858953fe9d3011
|   |       |   |   |--- 9887df7b77cf69
|   |       |   |   |--- a98cdce8ed626c
|   |       |   |   |--- ac17dfa1cee7d4
|   |       |   |   |--- b71a59f7637796
|   |       |   |   |--- c84a9ad3226093
|   |       |   |   |--- ce8337cfd66331
|   |       |   |   |--- e9cd7c23a85f06
|   |       |   |   +--- ee42861b5daf8b
|   |       |   |--- 0c
|   |       |   |   |--- 03e91675a219d5
|   |       |   |   |--- 0b52aab164eee7
|   |       |   |   |--- 28d1240e2e593c
|   |       |   |   |--- 43d4db190a6736
|   |       |   |   |--- 5339bc2507152b
|   |       |   |   |--- 55d6c249a17336
|   |       |   |   |--- 6284d1f398a6eb
|   |       |   |   |--- 6afa8e97c66dd3
|   |       |   |   |--- 71a20fb1ed0cc7
|   |       |   |   |--- 71e8894e68c276
|   |       |   |   |--- 742611fbf04964
|   |       |   |   |--- 894767b01d1671
|   |       |   |   |--- 9828c07b6d84db
|   |       |   |   |--- 9d4560d8417251
|   |       |   |   |--- d00fc77110f32c
|   |       |   |   |--- d6bb2ab179c922
|   |       |   |   |--- de9ababc1c03e4
|   |       |   |   |--- f0f1497ce47ee4
|   |       |   |   |--- f55ad2447d6d97
|   |       |   |   +--- fbd1f142979a1a
|   |       |   |--- 0d
|   |       |   |   |--- 058383441e8d13
|   |       |   |   |--- 063c613fdc39b2
|   |       |   |   |--- 06e1cc3f17eee3
|   |       |   |   |--- 0753a44f7cff55
|   |       |   |   |--- 10aff89e8e5d5c
|   |       |   |   |--- 216cf55d9bc2e3
|   |       |   |   |--- 25ed4554a25868
|   |       |   |   |--- 26f45f9a96368e
|   |       |   |   |--- 39459d64314028
|   |       |   |   |--- 4164adad3ea044
|   |       |   |   |--- 427c39f63aa3c4
|   |       |   |   |--- 44fe21b36c9a4a
|   |       |   |   |--- 4980e0f4d3372e
|   |       |   |   |--- 5814f045c25d14
|   |       |   |   |--- 5cec13681ba9b3
|   |       |   |   |--- 696ecb024eb3e4
|   |       |   |   |--- 6c0cb6d8845907
|   |       |   |   |--- 6ff3faacf64750
|   |       |   |   |--- 80b9654845e665
|   |       |   |   |--- 868ff6f2188fb5
|   |       |   |   |--- 8d73cc23ec7340
|   |       |   |   |--- 8de98bcf65c9a1
|   |       |   |   |--- 932153a81b8b1f
|   |       |   |   |--- 95a07ae61d0b3d
|   |       |   |   |--- b7f7eefd7e21f8
|   |       |   |   |--- ba09d799ab5df0
|   |       |   |   |--- bc9a82530e0d8a
|   |       |   |   |--- bf9f944b660dc7
|   |       |   |   |--- ce677074a2907a
|   |       |   |   |--- cf6ef2b54df741
|   |       |   |   |--- d927bcb78ae5f4
|   |       |   |   +--- fc27caaaa19399
|   |       |   |--- 0e
|   |       |   |   |--- 077f79da9eac3e
|   |       |   |   |--- 12c25b37706d39
|   |       |   |   |--- 228c545c5d082a
|   |       |   |   |--- 334fc134e1fe59
|   |       |   |   |--- 3488a795f2b274
|   |       |   |   |--- 34a540d205a123
|   |       |   |   |--- 39a994f853f95e
|   |       |   |   |--- 48a097464ab72a
|   |       |   |   |--- 50bda41b48e7e3
|   |       |   |   |--- 53353fb3e494a7
|   |       |   |   |--- 5551aca67e4a4f
|   |       |   |   |--- 5fdf186306dd49
|   |       |   |   |--- 674d059c23c3bb
|   |       |   |   |--- 7d8d66f3726c24
|   |       |   |   |--- 8621b3a90518fd
|   |       |   |   |--- 8a73a4ae34cbf4
|   |       |   |   |--- 8cac913764598a
|   |       |   |   |--- a9276ab8136e11
|   |       |   |   |--- ac9fcfef08121a
|   |       |   |   |--- b05174877262f6
|   |       |   |   |--- b2c68464ded2b6
|   |       |   |   |--- b6cc5bd05e0835
|   |       |   |   |--- de2971f22a18dd
|   |       |   |   |--- e0981004a79abf
|   |       |   |   |--- e11f6c032a2269
|   |       |   |   +--- f5f03d282a0111
|   |       |   |--- 0f
|   |       |   |   |--- 01ee11ee94af9e
|   |       |   |   |--- 052d1842c0a7ef
|   |       |   |   |--- 0d0f8d6a437995
|   |       |   |   |--- 129aeaf703fad9
|   |       |   |   |--- 13a53e2d813448
|   |       |   |   |--- 19cbfc4e257d3b
|   |       |   |   |--- 1b7457fe85df37
|   |       |   |   |--- 3c6aa2b6dd7c92
|   |       |   |   |--- 4ce242cf939a62
|   |       |   |   |--- 5110deeab44412
|   |       |   |   |--- 5624bed9832617
|   |       |   |   |--- 573b9901c9cc86
|   |       |   |   |--- 57627b58f0f2c4
|   |       |   |   |--- 6194730e8a72f8
|   |       |   |   |--- 784cee62d2e2a2
|   |       |   |   |--- a5b02e8ace332b
|   |       |   |   |--- aa16c05dceb090
|   |       |   |   |--- aad47bde0c49ee
|   |       |   |   |--- b30db177ce0192
|   |       |   |   |--- ce011b7a896cc7
|   |       |   |   +--- f4507c29b1cc2f
|   |       |   |--- 10
|   |       |   |   |--- 0103cab10e5c4f
|   |       |   |   |--- 163500fdc78c89
|   |       |   |   |--- 1ca0bd7a95e7ee
|   |       |   |   |--- 207dc77532e033
|   |       |   |   |--- 20a927593830c6
|   |       |   |   |--- 2657760776d405
|   |       |   |   |--- 2c3325becdce9d
|   |       |   |   |--- 3003cf393e9452
|   |       |   |   |--- 33cf16033b3c1b
|   |       |   |   |--- 36fb62461dc788
|   |       |   |   |--- 412936619441df
|   |       |   |   |--- 42171d587b639e
|   |       |   |   |--- 5197447537f1f9
|   |       |   |   |--- 56772887f49270
|   |       |   |   |--- 598e7f112a3a71
|   |       |   |   |--- 66f0eaa2e51811
|   |       |   |   |--- 78ca19c032ae8e
|   |       |   |   |--- 8c598d47f07eda
|   |       |   |   |--- 915e4f62804ad1
|   |       |   |   |--- 93c122e3a6da9f
|   |       |   |   |--- 96289b9a3b6c34
|   |       |   |   |--- 9671ff71decc2d
|   |       |   |   |--- 99525b2de8e8bf
|   |       |   |   |--- 9c9177a7b34184
|   |       |   |   |--- a86579abf471a9
|   |       |   |   |--- aa2f948feaac06
|   |       |   |   |--- bf1fa241264088
|   |       |   |   |--- c66d0dfd9fb393
|   |       |   |   |--- cac48727e49069
|   |       |   |   |--- d706210f95c4ba
|   |       |   |   |--- e400ae95bbca03
|   |       |   |   |--- e64742b3f7ff8f
|   |       |   |   |--- eacf46d0f317af
|   |       |   |   |--- f9caae4a35931a
|   |       |   |   |--- f9f18008164559
|   |       |   |   +--- fec0a394f10b2e
|   |       |   |--- 11
|   |       |   |   |--- 054d80ceac9d86
|   |       |   |   |--- 078217c4c6248c
|   |       |   |   |--- 09212017b99637
|   |       |   |   |--- 0a4eb213fcffb9
|   |       |   |   |--- 0c0bf46198ec42
|   |       |   |   |--- 0c2d6b9dad2143
|   |       |   |   |--- 3030f023f83f1c
|   |       |   |   |--- 341f670f485980
|   |       |   |   |--- 37378ca105088f
|   |       |   |   |--- 394c0c195266c5
|   |       |   |   |--- 3c0cbcc74842cf
|   |       |   |   |--- 4585be474f61ab
|   |       |   |   |--- 5041070f22430b
|   |       |   |   |--- 55865ccb2ffd3c
|   |       |   |   |--- 55bdd72dd7f3c5
|   |       |   |   |--- 57de22607a52ad
|   |       |   |   |--- 65b052b8e6cb9e
|   |       |   |   |--- 78773d5d54877f
|   |       |   |   |--- 7b62833d7ffa12
|   |       |   |   |--- 8e564dd4bea14a
|   |       |   |   |--- 8eedf82a1de644
|   |       |   |   |--- 9b76290f544751
|   |       |   |   |--- a40e222f45b596
|   |       |   |   |--- a6cd067ad9615d
|   |       |   |   |--- bcea2009904f8e
|   |       |   |   |--- c4080ef8a46383
|   |       |   |   |--- cc2fb587c4f13b
|   |       |   |   |--- dc1c460ccd3ecc
|   |       |   |   |--- ddf9d203b7f130
|   |       |   |   |--- e44788c3db0b78
|   |       |   |   |--- eef1bd9b4774e7
|   |       |   |   |--- ef71694e4fb102
|   |       |   |   +--- f9d122c8abd991
|   |       |   |--- 12
|   |       |   |   |--- 0bf36f150bd4f9
|   |       |   |   |--- 11246156305a7a
|   |       |   |   |--- 124e77d4e4c1b0
|   |       |   |   |--- 227a2601ddfe90
|   |       |   |   |--- 393f101c873d3e
|   |       |   |   |--- 3b9d8dcaadd949
|   |       |   |   |--- 4b3963c3879c7c
|   |       |   |   |--- 4d503a08e7aed3
|   |       |   |   |--- 586dc5b46cc7bb
|   |       |   |   |--- 649a99e7128dc6
|   |       |   |   |--- 6888e2acb2549c
|   |       |   |   |--- 767eebae05cf49
|   |       |   |   |--- 788fb3bf401901
|   |       |   |   |--- 7a0ef906908540
|   |       |   |   |--- 80c6090043f88a
|   |       |   |   |--- 80ed94fe9e7c5d
|   |       |   |   |--- 9003140b6f14c6
|   |       |   |   |--- 90d517b1d8c8c1
|   |       |   |   |--- b8b4a5049b51cd
|   |       |   |   |--- b8fb2bfcc7694c
|   |       |   |   |--- ca187119e91cfc
|   |       |   |   |--- d3028c4a7ab524
|   |       |   |   |--- d6b7d323cc1d8a
|   |       |   |   |--- ee5147929cea2b
|   |       |   |   +--- f18318b806f754
|   |       |   |--- 13
|   |       |   |   |--- 079483b6ac5b46
|   |       |   |   |--- 0e8dc4af26c27b
|   |       |   |   |--- 0f58f01ede4ae7
|   |       |   |   |--- 1816792dc7dc4b
|   |       |   |   |--- 1f71bb812feb61
|   |       |   |   |--- 21569abebade34
|   |       |   |   |--- 27bcf2f9d5b475
|   |       |   |   |--- 3dcfbcb010bb33
|   |       |   |   |--- 419ccfb4575b12
|   |       |   |   |--- 4623aef9a73736
|   |       |   |   |--- 52e56b41b2551d
|   |       |   |   |--- 575267d2791d2a
|   |       |   |   |--- 5f3c84971ea43e
|   |       |   |   |--- 5fa12b7fa5c8fc
|   |       |   |   |--- 65f7d584e976bf
|   |       |   |   |--- 6854ef0c4ea982
|   |       |   |   |--- 7501b8c0eaf9b1
|   |       |   |   |--- 7fdc45c7c1bc94
|   |       |   |   |--- 870fb4c291b6d7
|   |       |   |   |--- 93a231c5cea6d8
|   |       |   |   |--- 9692319e8befdd
|   |       |   |   |--- b1961c1b45ef60
|   |       |   |   |--- ce527dc7254b46
|   |       |   |   +--- e6049607dbaf4f
|   |       |   |--- 14
|   |       |   |   |--- 0ac682bb6531a0
|   |       |   |   |--- 0f53aaa68cae28
|   |       |   |   |--- 20b47df9d38f0a
|   |       |   |   |--- 2ef55c44d33889
|   |       |   |   |--- 47ed1408937bb6
|   |       |   |   |--- 4d512fd9dbf64d
|   |       |   |   |--- 5199b9f9a641fd
|   |       |   |   |--- 5b1739a3a03fdd
|   |       |   |   |--- 73324be40fc3e3
|   |       |   |   |--- 753ce4eff5e929
|   |       |   |   |--- 7618a471f6d46d
|   |       |   |   |--- 795b2aac9e923d
|   |       |   |   |--- 7e451f682147b9
|   |       |   |   |--- 7fdab4076eaac3
|   |       |   |   |--- 8984f6bf29012d
|   |       |   |   |--- 8dd3fdef72607f
|   |       |   |   |--- 930a803bf276d8
|   |       |   |   |--- 9f05e81ee95ae0
|   |       |   |   |--- a0a4d20955ff62
|   |       |   |   |--- a7e48a19c5234d
|   |       |   |   |--- b8d27ff1aa16b5
|   |       |   |   |--- c55bc0f4315b4d
|   |       |   |   |--- c979170d569fb8
|   |       |   |   |--- d4350c797513b6
|   |       |   |   |--- dd71aafe55cbc4
|   |       |   |   |--- e8aed4e77f8405
|   |       |   |   +--- f94a0f31e51be4
|   |       |   |--- 15
|   |       |   |   |--- 22a74084b7e46d
|   |       |   |   |--- 2422f8ab26f2de
|   |       |   |   |--- 37aab1919fa700
|   |       |   |   |--- 4fcec50385f6d7
|   |       |   |   |--- 5fedf72016d970
|   |       |   |   |--- 7abcc599de339d
|   |       |   |   |--- 7afb3337d49fe8
|   |       |   |   |--- 8590d457fc370b
|   |       |   |   |--- 8720bbb6cc5340
|   |       |   |   |--- 8f73578aecb068
|   |       |   |   |--- 934b153594ed94
|   |       |   |   |--- 99fa64c7156689
|   |       |   |   |--- 9c7248df97d6e9
|   |       |   |   |--- a27efe820a5315
|   |       |   |   |--- bb37b0cef542f7
|   |       |   |   |--- bf9aa6038021f0
|   |       |   |   +--- f02c9e116ab75c
|   |       |   |--- 16
|   |       |   |   |--- 0e09163e83e8b3
|   |       |   |   |--- 11a7fdaeadc29e
|   |       |   |   |--- 1cb9b6ad4213c6
|   |       |   |   |--- 1f4302e38764ba
|   |       |   |   |--- 2125ea23678227
|   |       |   |   |--- 24d1ad5b532a37
|   |       |   |   |--- 353e4c56600757
|   |       |   |   |--- 3c51d784641407
|   |       |   |   |--- 52dc33d4283a40
|   |       |   |   |--- 59546f348e335c
|   |       |   |   |--- 72d0e2b56661ff
|   |       |   |   |--- 7355e2ae91d7f4
|   |       |   |   |--- 7bea59934c30e0
|   |       |   |   |--- 8835b13d6558c4
|   |       |   |   |--- 89b14ac05707a4
|   |       |   |   |--- 8a08b84d6032a8
|   |       |   |   |--- 95eeea1a52d2ae
|   |       |   |   |--- 9636c1873e8195
|   |       |   |   |--- 9e6f0577766725
|   |       |   |   |--- a6803e3eeea982
|   |       |   |   |--- b81a03a98b1649
|   |       |   |   |--- bd62813589a8a4
|   |       |   |   |--- be412a0cb04fa0
|   |       |   |   |--- e98cb1d2f8e66d
|   |       |   |   |--- f22b24d360af5e
|   |       |   |   |--- f8282e6106c72e
|   |       |   |   +--- ffc847e54fbe02
|   |       |   |--- 17
|   |       |   |   |--- 029a6cc972fdad
|   |       |   |   |--- 056c1c9f5cd170
|   |       |   |   |--- 0b84977e79b140
|   |       |   |   |--- 185915bcd4832a
|   |       |   |   |--- 4866e463b21100
|   |       |   |   |--- 4e709cc8afe800
|   |       |   |   |--- 529fd363ae6c57
|   |       |   |   |--- 532e77a699fab7
|   |       |   |   |--- 542d1282aca68f
|   |       |   |   |--- 64a2d868703c6e
|   |       |   |   |--- 68a6397ec6b393
|   |       |   |   |--- 6b5cae5d78b394
|   |       |   |   |--- 7d15b40d8d29b0
|   |       |   |   |--- 88e5085fd65cb1
|   |       |   |   |--- 905a96386557e8
|   |       |   |   |--- a3f4d16bb73f98
|   |       |   |   |--- a6291fce99d46f
|   |       |   |   |--- af1026f52b05fd
|   |       |   |   |--- b41f72d25aa9ba
|   |       |   |   |--- db35058fd6904f
|   |       |   |   |--- f395966a1445a1
|   |       |   |   +--- f4e255045e6acf
|   |       |   |--- 18
|   |       |   |   |--- 02d5c711325201
|   |       |   |   |--- 06216d3e8995f1
|   |       |   |   |--- 1cdb3791229b7a
|   |       |   |   |--- 2d509599363950
|   |       |   |   |--- 34bd50e9d83f24
|   |       |   |   |--- 34ea6d5c4ed6d0
|   |       |   |   |--- 4028160bed6d4a
|   |       |   |   |--- 4df35d098a8a96
|   |       |   |   |--- 4f17aa6693749b
|   |       |   |   |--- 5326067d64a591
|   |       |   |   |--- 54ed4a35656824
|   |       |   |   |--- 554488b8c47d1f
|   |       |   |   |--- 58bdf100b8eeeb
|   |       |   |   |--- 5a40b6ea047183
|   |       |   |   |--- 5c96851b6cf363
|   |       |   |   |--- 621af9e5991026
|   |       |   |   |--- 886dc55ec9dc83
|   |       |   |   |--- 9c50c60695c8a7
|   |       |   |   |--- a2485fc8792cb9
|   |       |   |   |--- a45a05025d77fa
|   |       |   |   |--- a5c7b04986aa87
|   |       |   |   |--- ae0e3e889795d5
|   |       |   |   |--- af19ad2b7ce967
|   |       |   |   |--- b0d76236b49a48
|   |       |   |   |--- b51556815b6b8a
|   |       |   |   |--- ba54db14651628
|   |       |   |   |--- bd6e347f0b8a38
|   |       |   |   |--- c6e60f1486dd6e
|   |       |   |   |--- c875a5f583f317
|   |       |   |   |--- ca3204f4e491e1
|   |       |   |   |--- dba0417f6ecfac
|   |       |   |   |--- dd0bf8211dfaaa
|   |       |   |   +--- f9fe8582650f43
|   |       |   |--- 19
|   |       |   |   |--- 0f81c5ccae8ff8
|   |       |   |   |--- 1261630f8d230c
|   |       |   |   |--- 162bb397385b05
|   |       |   |   |--- 238616bb62ff6e
|   |       |   |   |--- 25ccdef7874508
|   |       |   |   |--- 3be4c11d8e1655
|   |       |   |   |--- 3cbf1d8601c5ad
|   |       |   |   |--- 7bbf3673ca8416
|   |       |   |   |--- 8ac4e722a0bf8c
|   |       |   |   |--- 90f3faade3e9ee
|   |       |   |   |--- 93fbb85e04c2f2
|   |       |   |   |--- ca12ab48aa2775
|   |       |   |   |--- cd50ca53e40f35
|   |       |   |   |--- d3fb8166412435
|   |       |   |   |--- e4d088b1147c8c
|   |       |   |   |--- f0f5c91d27c1b1
|   |       |   |   +--- fffc9f5d809828
|   |       |   |--- 1a
|   |       |   |   |--- 06ba5b8fcf3c19
|   |       |   |   |--- 16451631a7aa30
|   |       |   |   |--- 17970094fd0cdb
|   |       |   |   |--- 1e60e9b0a2fce5
|   |       |   |   |--- 297b13603e87fd
|   |       |   |   |--- 29ebfb683b59b4
|   |       |   |   |--- 4bea05c07397d8
|   |       |   |   |--- 5943a79240229f
|   |       |   |   |--- 637a08aeb11bfe
|   |       |   |   |--- 6982fb952b2ce4
|   |       |   |   |--- 69a5e38cb49f47
|   |       |   |   |--- 7872f73908b7c2
|   |       |   |   |--- 87353dac4b366a
|   |       |   |   |--- 8fda60a0d83e2a
|   |       |   |   |--- 978936b8257a17
|   |       |   |   |--- a080441bf00b7b
|   |       |   |   |--- bdcac88f3dfc7c
|   |       |   |   |--- cb5a51af5ae31a
|   |       |   |   |--- d5fd3adbd3b13f
|   |       |   |   |--- f58e2bc2e4e875
|   |       |   |   |--- f598c621989814
|   |       |   |   +--- f62bfa714fb91a
|   |       |   |--- 1b
|   |       |   |   |--- 0b8c057865f503
|   |       |   |   |--- 0cd46fd37291f7
|   |       |   |   |--- 121cc6c131df9c
|   |       |   |   |--- 1b218c41d7ecb9
|   |       |   |   |--- 1b390a09c1e9bd
|   |       |   |   |--- 2bdff2fca6d556
|   |       |   |   |--- 332fc39ff456af
|   |       |   |   |--- 381f1ef994673c
|   |       |   |   |--- 422d2613572adc
|   |       |   |   |--- 42e31da99ae6ca
|   |       |   |   |--- 450813eb935599
|   |       |   |   |--- 498983542a618c
|   |       |   |   |--- 5093f70deb04c8
|   |       |   |   |--- 54645ec10f25bb
|   |       |   |   |--- 59e0537e20453c
|   |       |   |   |--- 62a2b5f7e64144
|   |       |   |   |--- 649e1df5b4af13
|   |       |   |   |--- 8a0997facd1034
|   |       |   |   |--- 980ce4440fedcc
|   |       |   |   |--- 9817c8e1cb0c11
|   |       |   |   |--- af33508e293a07
|   |       |   |   |--- c64cdde6b5d045
|   |       |   |   |--- cd93f25fec5b0b
|   |       |   |   |--- d233baaa56151c
|   |       |   |   |--- dfd68d0d7ef541
|   |       |   |   |--- e13c7dfeadadfe
|   |       |   |   +--- ff734af7333f08
|   |       |   |--- 1c
|   |       |   |   |--- 049fb2968453d8
|   |       |   |   |--- 0b990513ff30d4
|   |       |   |   |--- 0de4e22a94cbc1
|   |       |   |   |--- 263cbd3712c96b
|   |       |   |   |--- 312df3e5a4826e
|   |       |   |   |--- 3f701766e6a826
|   |       |   |   |--- 4ba5c0320bc243
|   |       |   |   |--- 611a3b5f8067df
|   |       |   |   |--- 6359411ef2f270
|   |       |   |   |--- 63d5f9e52a72cc
|   |       |   |   |--- 913a941062032a
|   |       |   |   |--- a0cfb8934253c9
|   |       |   |   |--- a2c5062baefebf
|   |       |   |   |--- afa39e2d8d85c2
|   |       |   |   |--- c7b8bfc052a0e6
|   |       |   |   |--- c9bf3d4af0178b
|   |       |   |   |--- dbbf607be4d031
|   |       |   |   |--- e92138e0411b84
|   |       |   |   |--- f0123035928e9c
|   |       |   |   |--- f16b6d62d0e1a6
|   |       |   |   |--- fc6148132233bc
|   |       |   |   +--- ff4dfe68ae786f
|   |       |   |--- 1d
|   |       |   |   |--- 0ab74bbfc530e8
|   |       |   |   |--- 125e889223ad4f
|   |       |   |   |--- 2d4837439031e4
|   |       |   |   |--- 2d4ce747438ba0
|   |       |   |   |--- 368d5b4d1aa134
|   |       |   |   |--- 3d75a0567bf008
|   |       |   |   |--- 52ce24544e9304
|   |       |   |   |--- 54d06e48d02c2d
|   |       |   |   |--- 577f2e9530150e
|   |       |   |   |--- 60430bb3682c91
|   |       |   |   |--- 608211853bf34a
|   |       |   |   |--- 60fe78e634ef37
|   |       |   |   |--- 6343b5bfdfe24e
|   |       |   |   |--- 6fd57c1d02d296
|   |       |   |   |--- 71150c2ff09ac4
|   |       |   |   |--- 9688ef96f411ad
|   |       |   |   |--- 99dad385e1649e
|   |       |   |   |--- c56684218d6167
|   |       |   |   |--- c809b567b05b8a
|   |       |   |   |--- e7499037aaf7ae
|   |       |   |   |--- f161a8fe962c96
|   |       |   |   |--- f416c4f9dba2b9
|   |       |   |   |--- f92d7e90558939
|   |       |   |   |--- fac27a9ff8e23a
|   |       |   |   +--- ff040c28125ab2
|   |       |   |--- 1e
|   |       |   |   |--- 07fd7c1a31a013
|   |       |   |   |--- 0858f395738298
|   |       |   |   |--- 085bd7145e861c
|   |       |   |   |--- 0e729e8c1127c0
|   |       |   |   |--- 1fd3d2fda48e5e
|   |       |   |   |--- 22dc8ab0126dd5
|   |       |   |   |--- 28d99ef5d31c13
|   |       |   |   |--- 31f1f15b0ecd2a
|   |       |   |   |--- 491935ddeefd72
|   |       |   |   |--- 574c0c63e39236
|   |       |   |   |--- 5775df073e6f1a
|   |       |   |   |--- 619eec9976d8bf
|   |       |   |   |--- 756c1d564f749f
|   |       |   |   |--- 76ce26265dbc8b
|   |       |   |   |--- 7a27be8b1dbceb
|   |       |   |   |--- 82d0539caf81bc
|   |       |   |   |--- 87750b127d167c
|   |       |   |   |--- 980e1a12540f16
|   |       |   |   |--- b2374c37fbf0a6
|   |       |   |   |--- b31c35a6d505e3
|   |       |   |   |--- b77be5081a545a
|   |       |   |   |--- bddfe76d250e88
|   |       |   |   |--- caff7bdaa5035d
|   |       |   |   |--- ce09095b5f822c
|   |       |   |   |--- ce9d9c1f159d87
|   |       |   |   |--- d53580d5af0fbe
|   |       |   |   |--- dd30d93cc03cc0
|   |       |   |   +--- f0f1bb1a10b65d
|   |       |   |--- 1f
|   |       |   |   |--- 05c136c756edac
|   |       |   |   |--- 09020d152b82f8
|   |       |   |   |--- 28dd786add35ee
|   |       |   |   |--- 2904f1147a3915
|   |       |   |   |--- 2f3cee38d154c2
|   |       |   |   |--- 3b657570b0807d
|   |       |   |   |--- 411a84164a1b07
|   |       |   |   |--- 457d4d65438eac
|   |       |   |   |--- 49b1885806f63d
|   |       |   |   |--- 4dabe137847c9c
|   |       |   |   |--- 4f5bdf274f0646
|   |       |   |   |--- 51200636290072
|   |       |   |   |--- 530b3efee627e8
|   |       |   |   |--- 5bdd8ff1b5936e
|   |       |   |   |--- 72bd05f1c1edb7
|   |       |   |   |--- 76d9fcc440aaea
|   |       |   |   |--- 7769f473427b4f
|   |       |   |   |--- 7d218b9d1eaa71
|   |       |   |   |--- 868caed99cc826
|   |       |   |   |--- 930059928b2a83
|   |       |   |   |--- 9e929b57e5b34a
|   |       |   |   |--- 9ef5db21f084ef
|   |       |   |   |--- b42da9f4acab13
|   |       |   |   |--- b6ec99063cc503
|   |       |   |   |--- c8bf1febec6b14
|   |       |   |   |--- d80b8217682552
|   |       |   |   |--- ea5e2744e0d81b
|   |       |   |   |--- ebeaeb2eae8652
|   |       |   |   |--- f144d9284fade5
|   |       |   |   |--- f175058bb8b644
|   |       |   |   |--- f5e990f45873a7
|   |       |   |   +--- f6c830dfd30a02
|   |       |   |--- 20
|   |       |   |   |--- 092a3be47c6785
|   |       |   |   |--- 0a10af7f50a0d8
|   |       |   |   |--- 205f1f1b99643c
|   |       |   |   |--- 29420da58cf96c
|   |       |   |   |--- 3f994780aef9d4
|   |       |   |   |--- 5dc2ad2b564e36
|   |       |   |   |--- 64808c988e61b6
|   |       |   |   |--- 6dfda5694a5730
|   |       |   |   |--- 755f9ce7225d68
|   |       |   |   |--- 85469275ab0acc
|   |       |   |   |--- a71137439346cf
|   |       |   |   |--- b13f66f3f8e2c3
|   |       |   |   |--- b83e65ad120d54
|   |       |   |   |--- b93c4c63043054
|   |       |   |   |--- c2ed0d7a452145
|   |       |   |   |--- cd73c7006e3c02
|   |       |   |   |--- d2cf01f7c59129
|   |       |   |   |--- d49bae33dc4128
|   |       |   |   |--- dc8657925c104b
|   |       |   |   |--- e82a71a953d56d
|   |       |   |   |--- e88b775fabc0ab
|   |       |   |   |--- e998cecf2d493d
|   |       |   |   +--- ef6acd05a931b6
|   |       |   |--- 21
|   |       |   |   |--- 172da314c3aeed
|   |       |   |   |--- 2bb360dedf96f5
|   |       |   |   |--- 3a14f305216ada
|   |       |   |   |--- 3bcd7954d16bee
|   |       |   |   |--- 3cbb7a0da030a2
|   |       |   |   |--- 4197c22c2f96b2
|   |       |   |   |--- 59478411c0d135
|   |       |   |   |--- 617076ea0c6dfe
|   |       |   |   |--- 62d70cfec29b6b
|   |       |   |   |--- 7145b888b5e7fc
|   |       |   |   |--- 760e862a5dd54d
|   |       |   |   |--- 84236d753be308
|   |       |   |   |--- 8784238377a8fe
|   |       |   |   |--- 97117bfbf8e275
|   |       |   |   |--- a574e7ce251ace
|   |       |   |   |--- abe7412605c275
|   |       |   |   |--- ac8c737479dcfb
|   |       |   |   |--- b567dc91a87a01
|   |       |   |   |--- c880469189aa01
|   |       |   |   |--- d371eaa74f7359
|   |       |   |   |--- d38d31572042d4
|   |       |   |   |--- d9682198531f37
|   |       |   |   |--- e2384e74616398
|   |       |   |   |--- ec92b1f351e70f
|   |       |   |   |--- eed0bbbcafc314
|   |       |   |   |--- f22b42fbeaa708
|   |       |   |   |--- f71008da2853ba
|   |       |   |   |--- fc42010fcfce50
|   |       |   |   +--- ff8d573341afe9
|   |       |   |--- 22
|   |       |   |   |--- 0fd91925d7d799
|   |       |   |   |--- 12dd4f2a72b7e1
|   |       |   |   |--- 1e403a2a4084bc
|   |       |   |   |--- 3d5414d70cb9dc
|   |       |   |   |--- 571014921b94a5
|   |       |   |   |--- 5c718e540408f8
|   |       |   |   |--- 6531bc0f6886bd
|   |       |   |   |--- 6d7b3eda1512db
|   |       |   |   |--- 6e66b99324f2bb
|   |       |   |   |--- 72d0d18c1e12c2
|   |       |   |   |--- 800acca68322e1
|   |       |   |   |--- 87f9126318caeb
|   |       |   |   |--- 9004a53ecfc2d4
|   |       |   |   |--- 91ced707e36ca3
|   |       |   |   |--- 9eb5920465d734
|   |       |   |   |--- a36e6328db6c07
|   |       |   |   |--- a70d3cf7465494
|   |       |   |   |--- b7128a2698698d
|   |       |   |   |--- b8393aa507ef8b
|   |       |   |   |--- cc20ac55518e0b
|   |       |   |   |--- d175666acf9545
|   |       |   |   |--- d607366c7c54d9
|   |       |   |   |--- e73abdc5c27dbd
|   |       |   |   |--- edee5e28b39169
|   |       |   |   |--- f1dd5f857968aa
|   |       |   |   |--- fd855796b88222
|   |       |   |   |--- fe91ae2803be8f
|   |       |   |   +--- fefd72fa20f834
|   |       |   |--- 23
|   |       |   |   |--- 001df03e0267fa
|   |       |   |   |--- 03e1a5cc5c059c
|   |       |   |   |--- 0674890a258664
|   |       |   |   |--- 2ce1ae487064f4
|   |       |   |   |--- 2e7a27d2933365
|   |       |   |   |--- 3358d9b877a334
|   |       |   |   |--- 3f84169dcdc3d9
|   |       |   |   |--- 42e70791b8c6f3
|   |       |   |   |--- 490b357a3c5a27
|   |       |   |   |--- 524df54c6188f2
|   |       |   |   |--- 5441aa71780416
|   |       |   |   |--- 628a0c903de033
|   |       |   |   |--- 63b596060af4c6
|   |       |   |   |--- 6af4bdd6d2a264
|   |       |   |   |--- 7521257a06376c
|   |       |   |   |--- 881acdaaff117c
|   |       |   |   |--- 8d53bd1e1d0879
|   |       |   |   |--- 8d8f103d36afff
|   |       |   |   |--- 8f3d4fcf87e592
|   |       |   |   |--- 9062455f766145
|   |       |   |   |--- 9b0f2f1e086232
|   |       |   |   |--- 9ba3a0652d0576
|   |       |   |   |--- a7adcb433c5cf3
|   |       |   |   |--- b1f5a404ab3522
|   |       |   |   |--- b797866a36ef72
|   |       |   |   |--- b80ba29631ef74
|   |       |   |   |--- d0409a21b441a2
|   |       |   |   |--- d2f6a968bcded5
|   |       |   |   |--- dcaa05f367888f
|   |       |   |   |--- e5274b3394e491
|   |       |   |   |--- f13bc4ce786d42
|   |       |   |   |--- f2962ae117d477
|   |       |   |   |--- f444c7714489c9
|   |       |   |   +--- f55ca6a9121ef4
|   |       |   |--- 24
|   |       |   |   |--- 112c93a9bbf3e8
|   |       |   |   |--- 31aa15f5703437
|   |       |   |   |--- 3dc9981423e2d3
|   |       |   |   |--- 44d88cb118c45d
|   |       |   |   |--- 47fcfc20db3a2a
|   |       |   |   |--- 49f06c2ff775d9
|   |       |   |   |--- 4b2ead437facde
|   |       |   |   |--- 4e1c27b78709ae
|   |       |   |   |--- 6411934d0947a9
|   |       |   |   |--- 6519fd192b1232
|   |       |   |   |--- 6bb7855ff2c806
|   |       |   |   |--- 7047be5e2c8007
|   |       |   |   |--- 71522e1b918b94
|   |       |   |   |--- 72ba77dbae5928
|   |       |   |   |--- 86d49409e3db68
|   |       |   |   |--- 95fa9ea67e9ad9
|   |       |   |   |--- 9b368c8d3b79b8
|   |       |   |   |--- b0a243c40affe9
|   |       |   |   |--- c2378f755ecbad
|   |       |   |   |--- ce4888df7faeba
|   |       |   |   |--- dae39fa4f57660
|   |       |   |   |--- e8f109ef68c56c
|   |       |   |   |--- ea9762e9501072
|   |       |   |   +--- f560e5f4ecd6d0
|   |       |   |--- 25
|   |       |   |   |--- 02123fc82d5ba7
|   |       |   |   |--- 0b608ed4fd9e26
|   |       |   |   |--- 1864895a2d163b
|   |       |   |   |--- 254d586bad60c9
|   |       |   |   |--- 26aadf5efbb9bf
|   |       |   |   |--- 2bfdeda5ff5249
|   |       |   |   |--- 432c47ac45877c
|   |       |   |   |--- 48f8b9d8b89d84
|   |       |   |   |--- 520fd4595eea02
|   |       |   |   |--- 55d0cd0605610f
|   |       |   |   |--- 5833ba76e14951
|   |       |   |   |--- 5bb40fd1cedb2d
|   |       |   |   |--- 623871da6d9a5e
|   |       |   |   |--- 6334c5b1906d3b
|   |       |   |   |--- 684fe68327032b
|   |       |   |   |--- 6b30c1b501e940
|   |       |   |   |--- 6e3250a714127b
|   |       |   |   |--- 87401561bf331f
|   |       |   |   |--- 88036b846b9d5a
|   |       |   |   |--- 898c194f07e132
|   |       |   |   |--- 89b5ac5a9709ba
|   |       |   |   |--- 9951a387edfb88
|   |       |   |   |--- a063519e56038f
|   |       |   |   |--- a2e983bf765625
|   |       |   |   |--- a8acbcd4b3afa6
|   |       |   |   |--- ac3244c0a0d57d
|   |       |   |   |--- bb82de238d2bc7
|   |       |   |   |--- c6fc41aaba56eb
|   |       |   |   |--- c8601dde389e07
|   |       |   |   |--- ca32922636b9e0
|   |       |   |   |--- db917de24a7217
|   |       |   |   |--- e22e23e28f3eeb
|   |       |   |   |--- e699ec9345b172
|   |       |   |   |--- f149763d429a22
|   |       |   |   |--- f595e336863f56
|   |       |   |   |--- f676c92906801f
|   |       |   |   |--- fef2d3dc1a8636
|   |       |   |   +--- ff1c031332d7a5
|   |       |   |--- 26
|   |       |   |   |--- 05fabed8383147
|   |       |   |   |--- 0e5b49c681ade6
|   |       |   |   |--- 2b12b62b68bf21
|   |       |   |   |--- 387f14121453a7
|   |       |   |   |--- 3bf94d229c6680
|   |       |   |   |--- 403884ac9f0f2c
|   |       |   |   |--- 40943e4d5bf661
|   |       |   |   |--- 4b0efa2a224dc9
|   |       |   |   |--- 546bf208817661
|   |       |   |   |--- 5e92d1871bf158
|   |       |   |   |--- 6060c284d1e99a
|   |       |   |   |--- 662093c3edf0e8
|   |       |   |   |--- 729e7947f2592f
|   |       |   |   |--- 7fec5f89754620
|   |       |   |   |--- 80ff45c850505d
|   |       |   |   |--- 859b3e67aef9dc
|   |       |   |   |--- 88eb41c2368f6f
|   |       |   |   |--- 922fda22320ea7
|   |       |   |   |--- a52162980195f8
|   |       |   |   |--- a82a509ea981a7
|   |       |   |   |--- b4c563884ca922
|   |       |   |   |--- b5b85e3172de8b
|   |       |   |   |--- bb5c5fc9b7367f
|   |       |   |   |--- c6e87bebcdab10
|   |       |   |   |--- c9e3598f5a9d1e
|   |       |   |   |--- d5844ab95c1a6b
|   |       |   |   |--- f41eeea59bbd2b
|   |       |   |   |--- f482d05266f74d
|   |       |   |   |--- f6287f4ae45f7b
|   |       |   |   +--- ff09946c76f311
|   |       |   |--- 27
|   |       |   |   |--- 02579a63368ada
|   |       |   |   |--- 05ddcb8684f655
|   |       |   |   |--- 0ccd11003eff3a
|   |       |   |   |--- 1ba6d2c54f57c0
|   |       |   |   |--- 2060fe8b154357
|   |       |   |   |--- 2ca297ff92531c
|   |       |   |   |--- 2f4a846e1757f7
|   |       |   |   |--- 328964a2b53b2f
|   |       |   |   |--- 33938a1ccbe428
|   |       |   |   |--- 42e28e3435919b
|   |       |   |   |--- 46f2585999dd04
|   |       |   |   |--- 62096291fb0b24
|   |       |   |   |--- 68593a0ee7a956
|   |       |   |   |--- 6b02fb8bc364e1
|   |       |   |   |--- 784b0263d21e8d
|   |       |   |   |--- 93c01cadf6478b
|   |       |   |   |--- 9b361b73af8ea8
|   |       |   |   |--- 9efc53640f1e4e
|   |       |   |   |--- a848c4727b5d69
|   |       |   |   |--- adb8cf7cd433b2
|   |       |   |   |--- aeb7f85ea7cfc0
|   |       |   |   |--- b543a5ec83d560
|   |       |   |   |--- c65b4198d879ad
|   |       |   |   |--- cd9bc113086aa7
|   |       |   |   |--- d15084405b72ce
|   |       |   |   |--- edb149fca4d474
|   |       |   |   |--- efdefc45d0a529
|   |       |   |   +--- fff6e416897bcc
|   |       |   |--- 28
|   |       |   |   |--- 1487f18389240d
|   |       |   |   |--- 31255434d82e9e
|   |       |   |   |--- 342aca9ad983c1
|   |       |   |   |--- 34770335573156
|   |       |   |   |--- 3ddeb4df7f2f47
|   |       |   |   |--- 4fc660c10d5a2c
|   |       |   |   |--- 54eac67a82202e
|   |       |   |   |--- 76deddf61c5f69
|   |       |   |   |--- 7e05ca83651add
|   |       |   |   |--- 934069b96df019
|   |       |   |   |--- a1f820b6be96b2
|   |       |   |   |--- a3182ca94325d2
|   |       |   |   |--- a7abeebcc2ca67
|   |       |   |   |--- b183de81e13cdd
|   |       |   |   |--- b49cda7f4a1aca
|   |       |   |   |--- b55f7849be345f
|   |       |   |   |--- c9412715e71799
|   |       |   |   |--- cef4e6a835ceae
|   |       |   |   |--- d543f6e53b1e8b
|   |       |   |   +--- dd61b11d32c955
|   |       |   |--- 29
|   |       |   |   |--- 031f330cdda876
|   |       |   |   |--- 08de9bbfc805c8
|   |       |   |   |--- 15f302d0a886a2
|   |       |   |   |--- 396759b9ddf13e
|   |       |   |   |--- 3ccbbc5f203aba
|   |       |   |   |--- 4a4aa3d4a00b9f
|   |       |   |   |--- 4da6248c391548
|   |       |   |   |--- 55968f0089ecf2
|   |       |   |   |--- 5736076a9e99d2
|   |       |   |   |--- 5920c2d0f051ba
|   |       |   |   |--- 5ab62039c9a1ac
|   |       |   |   |--- 5fa8c8979c1edb
|   |       |   |   |--- 6249b2ca316d1a
|   |       |   |   |--- 6724468c22215f
|   |       |   |   |--- 68ece2acb8ba9a
|   |       |   |   |--- 6971825d3868aa
|   |       |   |   |--- 6f7ac8939a21ee
|   |       |   |   |--- 8278ac4afb3378
|   |       |   |   |--- 86a9f8807f8b8a
|   |       |   |   |--- 8a3b4e7adf11de
|   |       |   |   |--- 93c1bad821ef8a
|   |       |   |   |--- 93f6b5efb784e0
|   |       |   |   |--- a22edeaeddc0c7
|   |       |   |   |--- b93fb9cd3f4abc
|   |       |   |   |--- bba2f429b2203d
|   |       |   |   |--- bbaf7286e5e7e0
|   |       |   |   |--- bd94d64e6d4bb7
|   |       |   |   |--- bf242823b88e2d
|   |       |   |   |--- d5266093473b67
|   |       |   |   |--- d64e361f3f3e09
|   |       |   |   |--- d7ee6b8b26089e
|   |       |   |   |--- dee805853f8fc4
|   |       |   |   |--- e3e7be29220e4c
|   |       |   |   +--- ea14ddbf244291
|   |       |   |--- 2a
|   |       |   |   |--- 05cde280aa98ea
|   |       |   |   |--- 1a82ce2dbf173a
|   |       |   |   |--- 1abb60bcac2ed9
|   |       |   |   |--- 1f60f2a50e0112
|   |       |   |   |--- 2878ccf9316120
|   |       |   |   |--- 2cc10dd1bf9091
|   |       |   |   |--- 343ddc6f6186a5
|   |       |   |   |--- 4c46fa3aa4ea05
|   |       |   |   |--- 616cb7e2e8237a
|   |       |   |   |--- 741ce32dea0755
|   |       |   |   |--- 803aa75fb32104
|   |       |   |   |--- 868376f9f651a5
|   |       |   |   |--- 8ca96cccd6ca94
|   |       |   |   |--- 8f72e17618f631
|   |       |   |   |--- 9cf27d7f9adbc7
|   |       |   |   |--- bca89ccac96ee4
|   |       |   |   |--- c9a1efa80a3398
|   |       |   |   |--- d9b57555a03059
|   |       |   |   |--- e108e2aa2bc6f7
|   |       |   |   |--- e1d7d16443343d
|   |       |   |   +--- e95271d4e01a27
|   |       |   |--- 2b
|   |       |   |   |--- 010a19e0a94ef5
|   |       |   |   |--- 12b74689b91917
|   |       |   |   |--- 2123b54dcd81b6
|   |       |   |   |--- 219dd89b733d5d
|   |       |   |   |--- 234b831342c1e6
|   |       |   |   |--- 26165777116dea
|   |       |   |   |--- 2a24723f7556c3
|   |       |   |   |--- 32d1ea554c9669
|   |       |   |   |--- 3835f3c4b3eb18
|   |       |   |   |--- 4aea89b0c9237a
|   |       |   |   |--- 57b644b973d68e
|   |       |   |   |--- 5a1c778c7bc34f
|   |       |   |   |--- 5cf1943b36a182
|   |       |   |   |--- 5d3c775321e547
|   |       |   |   |--- 5f7a0bc95f650f
|   |       |   |   |--- 6285b71b91d78a
|   |       |   |   |--- 6321c5286bab45
|   |       |   |   |--- 6a07c09f197fba
|   |       |   |   |--- 6a8ebd2a28566c
|   |       |   |   |--- 6d1bfdf633fccf
|   |       |   |   |--- 6de0232f505342
|   |       |   |   |--- 86aaabf222b869
|   |       |   |   |--- 95370dcab419dd
|   |       |   |   |--- 979b9d4da7cc64
|   |       |   |   |--- a48fc8a7e81b58
|   |       |   |   |--- a52bb40a235fe4
|   |       |   |   |--- aac43bda76ced6
|   |       |   |   |--- b2dcd45c767849
|   |       |   |   |--- b49080fb19355d
|   |       |   |   |--- bc5c9cc2874423
|   |       |   |   |--- c29a39326947c7
|   |       |   |   |--- c3ba3a75299598
|   |       |   |   |--- cc3bf244c9cb2f
|   |       |   |   |--- e66381f025a0d2
|   |       |   |   |--- e777f62bb1cc70
|   |       |   |   |--- e7aa778f85f958
|   |       |   |   |--- eba02a479621b5
|   |       |   |   +--- f8d4d106897b4f
|   |       |   |--- 2c
|   |       |   |   |--- 0497165f1dfee8
|   |       |   |   |--- 07f0363ad8ea5f
|   |       |   |   |--- 24838ae10abce7
|   |       |   |   |--- 26f911733ce510
|   |       |   |   |--- 3671e685331e08
|   |       |   |   |--- 4038b7009cd4aa
|   |       |   |   |--- 434399af10a8a4
|   |       |   |   |--- 44aa48f484f48b
|   |       |   |   |--- 515d66dbdab7fc
|   |       |   |   |--- 635127bd057fbb
|   |       |   |   |--- 74effa1365b4c8
|   |       |   |   |--- 859137b0ec98e0
|   |       |   |   |--- 8db78b777ad14e
|   |       |   |   |--- 8fd8522f71acbe
|   |       |   |   |--- 90c71d8a22ad61
|   |       |   |   |--- 91aa9fff797053
|   |       |   |   |--- 977efefc72dcc2
|   |       |   |   |--- aadcb81a342bd2
|   |       |   |   |--- b16bb6a2e1b2b0
|   |       |   |   |--- c7a30b3b495094
|   |       |   |   |--- c81f3e079dc3c5
|   |       |   |   |--- d7a388a35425cf
|   |       |   |   |--- e394c78cc794d8
|   |       |   |   |--- e537f870a1f1fc
|   |       |   |   +--- fa2665dbcbb6b9
|   |       |   |--- 2d
|   |       |   |   |--- 0af41e8a591dcd
|   |       |   |   |--- 129453cfa507fa
|   |       |   |   |--- 325b8baf972a13
|   |       |   |   |--- 3880c81b535269
|   |       |   |   |--- 3bb94a0ccdbceb
|   |       |   |   |--- 4377ef09c70476
|   |       |   |   |--- 4784dd80e69498
|   |       |   |   |--- 4e238b12d48d37
|   |       |   |   |--- 614e5f1be163b5
|   |       |   |   |--- 814c9e0c67bcfb
|   |       |   |   |--- 96d1293d325a84
|   |       |   |   |--- a3b26e86a2c759
|   |       |   |   |--- a541d897fbbf15
|   |       |   |   |--- ac5065409e48da
|   |       |   |   |--- b30ccc788e9939
|   |       |   |   |--- c7c6ffe228779e
|   |       |   |   |--- cf3891dbde37f0
|   |       |   |   |--- cfe0a512b11925
|   |       |   |   |--- dfb41292947474
|   |       |   |   |--- f4007315093d2a
|   |       |   |   |--- fafcae3c2bad5f
|   |       |   |   +--- fb6d0e26c513e1
|   |       |   |--- 2e
|   |       |   |   |--- 00f3996ed834ed
|   |       |   |   |--- 0f473fca84fc7e
|   |       |   |   |--- 3307f0861436d8
|   |       |   |   |--- 4479e643e07202
|   |       |   |   |--- 5d9c3114586f02
|   |       |   |   |--- 6031f089db8022
|   |       |   |   |--- 84b34ffbe63ec7
|   |       |   |   |--- 99ebcb1ad7422a
|   |       |   |   |--- b0691e548ef81c
|   |       |   |   |--- bdbf8fd1c8b7de
|   |       |   |   |--- bffcbf26ddf53d
|   |       |   |   |--- d0bce76d8745b7
|   |       |   |   |--- e338a4f2f7de1e
|   |       |   |   |--- e7084556ea7440
|   |       |   |   |--- f3c650b5071619
|   |       |   |   +--- f6fcc9786632ef
|   |       |   |--- 2f
|   |       |   |   |--- 139fb29233d5e6
|   |       |   |   |--- 1483726f461568
|   |       |   |   |--- 24128c326f486c
|   |       |   |   |--- 2b3614022e2a50
|   |       |   |   |--- 35800cfa557e43
|   |       |   |   |--- 3ac9572bc1badb
|   |       |   |   |--- 3d2986500f9995
|   |       |   |   |--- 44e3a9d3676647
|   |       |   |   |--- 44f602ecf82a8c
|   |       |   |   |--- 5654e0a9e79de6
|   |       |   |   |--- 618802676536c8
|   |       |   |   |--- 660d19014a40c3
|   |       |   |   |--- 762c3567998884
|   |       |   |   |--- 7a5e2368be0ab8
|   |       |   |   |--- 7f58e3a9374c2f
|   |       |   |   |--- 8598e1df456d36
|   |       |   |   |--- 8dccd71d443c83
|   |       |   |   |--- a22978811610e6
|   |       |   |   |--- a3331142263b8e
|   |       |   |   |--- a8a0a763f82953
|   |       |   |   |--- aea3cf6c9cd123
|   |       |   |   |--- b6ad80d0a4eeec
|   |       |   |   |--- c13cbd40e6c54c
|   |       |   |   |--- cc0c431dccf913
|   |       |   |   |--- d2a94d7b3550ef
|   |       |   |   |--- e264334852e2ed
|   |       |   |   |--- e926620277bfae
|   |       |   |   |--- f1e36f9962972f
|   |       |   |   |--- f68aa58a310ab7
|   |       |   |   +--- fb42c03693b691
|   |       |   |--- 30
|   |       |   |   |--- 00231b1311b7dd
|   |       |   |   |--- 0bade988e786e2
|   |       |   |   |--- 0c9467bd2f174f
|   |       |   |   |--- 23bb8340f636ab
|   |       |   |   |--- 31173b8ce8690a
|   |       |   |   |--- 3901612b9ebdf1
|   |       |   |   |--- 43857bd035cd98
|   |       |   |   |--- 4596fd5b703d15
|   |       |   |   |--- 54a7e5b749367d
|   |       |   |   |--- 84d4b3d9d04ad5
|   |       |   |   |--- 85ff907d721bc7
|   |       |   |   |--- 98d557d4b345c4
|   |       |   |   |--- 9a0fd9c645ef64
|   |       |   |   |--- 9f0a53eddad1b4
|   |       |   |   |--- ac433809a8eb36
|   |       |   |   |--- c7bb4d46678ba6
|   |       |   |   |--- d14edfb5da5b45
|   |       |   |   |--- d8136d71fe291b
|   |       |   |   |--- e4d98da9fc75c3
|   |       |   |   |--- e59bdb854aec90
|   |       |   |   |--- f001ecb13bf8cd
|   |       |   |   |--- f25c574c473806
|   |       |   |   |--- f35bc240023bb3
|   |       |   |   +--- fa9e1590a8ffb1
|   |       |   +--- 31
|   |       |       |--- 036e90ce9d31ff
|   |       |       |--- 1b98a50bc48206
|   |       |       |--- 221624b3f7d5e5
|   |       |       |--- 23a6d1092f189b
|   |       |       |--- 2577235995f110
|   |       |       |--- 273a26d7854b7b
|   |       |       |--- 31ed039d9777c2
|   |       |       |--- 35ddcb3d4a6637
|   |       |       |--- 42dc9f32b4adea
|   |       |       |--- 4b6d30381f1631
|   |       |       |--- 4dd59e2570cbdb
|   |       |       |--- 6b8b2189e79397
|   |       |       |--- 89ebb47441c07e
|   |       |       |--- 8c86e2b90f2c57
|   |       |       |--- 8cbd401d781121
|   |       |       |--- b6ca041987b42b
|   |       |       |--- c4137d689596bb
|   |       |       |--- cdb893ad228488
|   |       |       |--- d35ccb7a378104
|   |       |       |--- de6e09de40c2eb
|   |       |       |--- ebbd39c3cfa1bf
|   |       |       +--- edf042c5672e09
|   |       |--- compile-cache-yaml
|   |       |   |--- 01
|   |       |   |   +--- 75e9ecdd1037ab
|   |       |   |--- 03
|   |       |   |   +--- 9aa3c028b3bdd0
|   |       |   |--- 04
|   |       |   |   +--- 58123749cf3c5f
|   |       |   |--- 05
|   |       |   |   +--- a877dab1ca3168
|   |       |   |--- 06
|   |       |   |   +--- 4cf40ff9db3987
|   |       |   |--- 07
|   |       |   |   +--- c321539fc35582
|   |       |   |--- 08
|   |       |   |   |--- 1c80e29b211f30
|   |       |   |   |--- 3620e208a33048
|   |       |   |   |--- 94450d15502d15
|   |       |   |   |--- eb103d6ff4c4fc
|   |       |   |   +--- f942d580d96d05
|   |       |   |--- 09
|   |       |   |   |--- ac0901ab6987cf
|   |       |   |   +--- ca87c259ea40d2
|   |       |   |--- 0c
|   |       |   |   |--- cb1f8ff47bac1c
|   |       |   |   +--- dbaa7f3b7cf5e7
|   |       |   |--- 0d
|   |       |   |   |--- 33c765227cd3aa
|   |       |   |   |--- 399b9e72d5de17
|   |       |   |   |--- 8fe23d92ea0742
|   |       |   |   +--- d73902418675d5
|   |       |   |--- 0e
|   |       |   |   +--- 5d7c8826323846
|   |       |   |--- 10
|   |       |   |   |--- 22abad2f5f3853
|   |       |   |   +--- b5439a8ec2709d
|   |       |   |--- 11
|   |       |   |   +--- 6947656f0810d2
|   |       |   |--- 12
|   |       |   |   |--- e38248b9a4ec0e
|   |       |   |   +--- f5da9b9e7e288f
|   |       |   |--- 13
|   |       |   |   |--- 12be8df70644c8
|   |       |   |   +--- f3ceb547532898
|   |       |   |--- 14
|   |       |   |   |--- 2e7e237be85ad3
|   |       |   |   |--- 7d5f880d110a10
|   |       |   |   +--- e3a9bddb6e2036
|   |       |   |--- 15
|   |       |   |   |--- 13c897bd7464d3
|   |       |   |   +--- 3f3703a03150e6
|   |       |   |--- 17
|   |       |   |   |--- 6908f507b8fdb9
|   |       |   |   +--- c564105077bb94
|   |       |   |--- 18
|   |       |   |   |--- 21e90d3b4322d4
|   |       |   |   +--- 78eb99e8fb47bd
|   |       |   |--- 1b
|   |       |   |   |--- b35e57ed9df77b
|   |       |   |   |--- d4461c602fd6db
|   |       |   |   +--- f89f1f329ab0ad
|   |       |   |--- 1c
|   |       |   |   |--- 28b89f38c7b330
|   |       |   |   |--- b0ffcd539e9727
|   |       |   |   +--- dc220a75a77371
|   |       |   |--- 1e
|   |       |   |   +--- fe7c4fee4c5b69
|   |       |   |--- 1f
|   |       |   |   |--- 9aff74d3951ccc
|   |       |   |   +--- cabce34d35569a
|   |       |   |--- 21
|   |       |   |   |--- a548812194d9dc
|   |       |   |   +--- c001e49b8e4af2
|   |       |   |--- 22
|   |       |   |   +--- ce677e9f5c54fe
|   |       |   |--- 25
|   |       |   |   |--- 2b2b794fddbde0
|   |       |   |   |--- 4857ada092080e
|   |       |   |   +--- faeb3e48208a25
|   |       |   |--- 26
|   |       |   |   +--- 263a7dab33fabd
|   |       |   |--- 28
|   |       |   |   +--- 2bcbdca5f210af
|   |       |   |--- 2a
|   |       |   |   |--- 9c212f6353b06c
|   |       |   |   |--- b6a5a095d92f36
|   |       |   |   |--- cd1d405afafdec
|   |       |   |   +--- d2458c2caa32b1
|   |       |   |--- 2b
|   |       |   |   |--- 2ee690bf913563
|   |       |   |   |--- 93aee7882aa516
|   |       |   |   +--- c8859a38ebfa99
|   |       |   |--- 2c
|   |       |   |   |--- 1e7f515a7537c2
|   |       |   |   |--- 569cddd3515c9d
|   |       |   |   +--- eb2a633d95c6a9
|   |       |   |--- 2d
|   |       |   |   +--- 7ff842e76edd77
|   |       |   |--- 2e
|   |       |   |   |--- 4af674e117c37d
|   |       |   |   +--- e0d103c3aabfe8
|   |       |   |--- 2f
|   |       |   |   |--- 71fee916b3e261
|   |       |   |   +--- b45d69667c7993
|   |       |   |--- 31
|   |       |   |   |--- 69520991de8c04
|   |       |   |   +--- ed156448cb934c
|   |       |   |--- 33
|   |       |   |   |--- 1c3635031e138d
|   |       |   |   |--- 3560dd3ebc9ccd
|   |       |   |   |--- 79e96d3a2cc18c
|   |       |   |   |--- 87b97efe1449f4
|   |       |   |   |--- a24492f8fdd236
|   |       |   |   +--- e6b28115971d76
|   |       |   |--- 35
|   |       |   |   |--- 0f552d87399d3b
|   |       |   |   |--- 3e2b3735771088
|   |       |   |   +--- 947613601a042e
|   |       |   |--- 36
|   |       |   |   |--- 4c3742af1b6051
|   |       |   |   |--- b8c5a5b4442959
|   |       |   |   +--- c2c4758872ac27
|   |       |   |--- 37
|   |       |   |   |--- 51a958bd398029
|   |       |   |   |--- e9817cd39348d8
|   |       |   |   +--- fc92eed7d8af94
|   |       |   |--- 38
|   |       |   |   +--- dd71c83cea61b3
|   |       |   |--- 39
|   |       |   |   +--- 51968864653aae
|   |       |   |--- 3a
|   |       |   |   |--- 3c454cb477f1f3
|   |       |   |   |--- 5a3b494c3cda57
|   |       |   |   +--- e2202849b6f2f1
|   |       |   |--- 3b
|   |       |   |   |--- 0d5347cc2fc95c
|   |       |   |   |--- 65afa66fdb4861
|   |       |   |   +--- ea47043aea9434
|   |       |   |--- 3c
|   |       |   |   |--- 2044688ef9e0ab
|   |       |   |   |--- 8b3ade38d20313
|   |       |   |   +--- b233adac7995a6
|   |       |   |--- 3d
|   |       |   |   |--- 38896c2c87ec0e
|   |       |   |   +--- 8c665a104ee67b
|   |       |   |--- 3e
|   |       |   |   |--- 4fd90f8a7d3867
|   |       |   |   |--- 9a26390b1acedf
|   |       |   |   +--- e178fcdf7b0e32
|   |       |   |--- 3f
|   |       |   |   |--- ce00517b0f6235
|   |       |   |   +--- f3e2c74ca6d03c
|   |       |   |--- 43
|   |       |   |   +--- 00529e6f607737
|   |       |   |--- 44
|   |       |   |   |--- 24008ed65e4a26
|   |       |   |   |--- 25c6757d4506b7
|   |       |   |   +--- e442ea59946407
|   |       |   +--- 45
|   |       |       |--- 3640ad5166ea24
|   |       |       |--- 7382b8b1317c10
|   |       |       |--- 81f7e136b5996a
|   |       |       +--- 979be0112621a8
|   |       |--- load-path-cache
|   |       |--- load-path-cache.17176.13163.tmp
|   |       |--- load-path-cache.17176.80526.tmp
|   |       |--- load-path-cache.17176.95251.tmp
|   |       |--- load-path-cache.31120.11102.tmp
|   |       |--- load-path-cache.31120.30739.tmp
|   |       |--- load-path-cache.31120.32891.tmp
|   |       |--- load-path-cache.31120.40690.tmp
|   |       |--- load-path-cache.32292.29266.tmp
|   |       |--- load-path-cache.32292.35650.tmp
|   |       |--- load-path-cache.32292.82617.tmp
|   |       |--- load-path-cache.32292.94475.tmp
|   |       |--- load-path-cache.32292.98496.tmp
|   |       +--- load-path-cache.33184.20658.tmp
|   |--- pids
|   |--- sockets
|   |--- clear_caches.rb
|   |--- debug_company_validity.rb
|   |--- debug_company_validity_v2.rb
|   |--- development_secret.txt
|   |--- fix_and_assign_company.rb
|   |--- query_category_companies.rb
|   |--- restart.txt
|   |--- scout_202601151213_20340.data
|   |--- scout_202601151214_20340.data
|   |--- scout_202601151215_20340.data
|   |--- scout_202601151216_20340.data
|   |--- scout_202601151217_20340.data
|   |--- scout_202601151218_20340.data
|   |--- scout_202601151219_20340.data
|   |--- scout_202601151220_20340.data
|   |--- scout_202601151221_20340.data
|   |--- scout_202601151222_20340.data
|   |--- scout_202601151223_20340.data
|   |--- scout_202601151224_20340.data
|   |--- scout_202601151225_20340.data
|   |--- scout_202601151226_20340.data
|   |--- scout_202601151227_20340.data
|   |--- scout_202601151228_20340.data
|   |--- scout_202601151229_20340.data
|   |--- scout_202601151230_20340.data
|   |--- scout_202601151231_20340.data
|   |--- scout_202601151232_20340.data
|   |--- scout_202601151233_20340.data
|   |--- scout_202601151234_20340.data
|   |--- scout_202601151235_20340.data
|   |--- scout_202601151236_20340.data
|   |--- scout_202601151237_20340.data
|   |--- scout_202601151238_20340.data
|   |--- scout_202601151239_20340.data
|   |--- scout_202601151240_20340.data
|   |--- scout_202601151241_20340.data
|   |--- scout_202601151245_13944.data
|   |--- scout_202601151246_13944.data
|   |--- scout_202601151247_13944.data
|   |--- scout_202601151248_13944.data
|   |--- scout_202601151249_13944.data
|   |--- scout_202601151250_13944.data
|   |--- scout_202601151251_13944.data
|   |--- scout_202601151252_13944.data
|   |--- scout_202601151253_13944.data
|   |--- scout_202601151254_13944.data
|   +--- scout_202601151255_13944.data
|--- vendor
|   |--- javascript
|   |   +--- .keep
|   +--- .keep
|--- .actrc
|--- .bulletignore
|--- .dockerignore
|--- .env.development
|--- .env.development.backup.20260128_ 42351
|--- .env.development.example
|--- .env.production.example
|--- .env.secrets.example
|--- .env.staging.example
|--- .gitattributes
|--- .gitignore
|--- .rspec
|--- .rubocop.yml
|--- .ruby-version
|--- add_role_to_users.bat
|--- ANALYTICS_ENDPOINTS_IMPLEMENTATION.rb
|--- boot_check.txt
|--- check_active_storage.rb
|--- check_admin_user.rb
|--- check_and_create_banners.rb
|--- check_company.rb
|--- check_company_images.bat
|--- check_env.rb
|--- check_lead_schema.rb
|--- CLASSIFICATION_FEATURE.md
|--- COMO_INICIAR_AGORA.txt
|--- companies.json
|--- config.ru
|--- create_company_user.rb
|--- create_financing_test_data.rb
|--- create_test_banners.rb
|--- create_test_data.rb
|--- create_user_script.rb
+--- create_voltbras_company.rb

```

---

## ðŸ“¦ DependÃªncias e ConfiguraÃ§Ãµes

### Frontend - package.json
```json
{
  "name": "nextjs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "clean:next": "node -e \"require('fs').rmSync('.next', { recursive: true, force: true });\"",
    "dev:clean": "npm run clean:next && next dev",
    "build": "next build",
    "build:clean": "npm run clean:next && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "cross-env NODE_ENV=development jest",
    "test:watch": "cross-env NODE_ENV=development jest --watch",
    "test:coverage": "cross-env NODE_ENV=development jest --coverage",
    "test:ci": "cross-env NODE_ENV=development jest --ci --coverage --maxWorkers=2"
  },
  "dependencies": {
    "@heroicons/react": "^2.2.0",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@rails/actioncable": "^7.1.0",
    "@sentry/nextjs": "^8.0.0",
    "@tanstack/react-query": "^5.90.12",
    "@tanstack/react-table": "^8.21.3",
    "@types/node": "20.6.2",
    "@types/react": "18.2.22",
    "@types/react-dom": "18.2.7",
    "autoprefixer": "10.4.15",
    "axios": "^1.12.2",
    "better-auth": "^1.4.12",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-autoplay": "^8.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^12.26.1",
    "html-to-image": "^1.11.13",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.446.0",
    "mixpanel-browser": "^2.74.0",
    "next": "^14.2.34",
    "next-themes": "^0.3.0",
    "postcss": "8.4.30",
    "prop-types": "^15.8.1",
    "react": "^18.2.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.63.0",
    "react-resizable-panels": "^2.1.3",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss": "3.3.3",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "5.2.2",
    "vaul": "^0.9.9",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/config-array": "^0.21.0",
    "@eslint/object-schema": "^2.1.6",
    "@playwright/test": "^1.53.2",
    "@tanstack/react-query-devtools": "^5.91.1",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/lodash": "^4.17.20",
    "@types/mixpanel-browser": "^2.60.0",
    "@types/testing-library__jest-dom": "^5.14.9",
    "cross-env": "^7.0.3",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.33",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0"
  }
}

```

### Backend - Gemfile
```ruby
source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '~> 3.2'

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem 'rails', '~> 7.0.8'
gem 'logger'

# The original asset pipeline for Rails [https://github.com/rails/sprockets-rails]
gem 'sprockets-rails'

# Use the Puma web server [https://github.com/puma/puma]
gem 'puma', '~> 5.0'

# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
gem 'importmap-rails'

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem 'turbo-rails'

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem 'stimulus-rails'

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem 'jbuilder'

# TASK-021: Pagination
gem 'kaminari'

# TASK-008: Structured logging
gem 'lograge'
gem 'amazing_print' # Better console output

# Use Redis adapter to run Action Cable in production
# TASK-014: Redis for caching, sessions, and background jobs
gem 'redis', '~> 5.0'
# gem 'redis-namespace' # Removed: Not compatible with Sidekiq 7+
# gem 'hiredis' # Removed: C-based Redis client causes issues on Windows; Redis 5+ uses pure Ruby fallback automatically

# TASK-017: Background job processing
gem 'sidekiq', '~> 7.0'
gem 'sidekiq-scheduler' # Cron-like job scheduler

# Use Kredis to get higher-level data types in Redis [https://github.com/rails/kredis]
# gem "kredis"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
gem "bcrypt", "~> 3.1.20"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: %i[mingw mswin x64_mingw jruby]

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', require: false

# Use Sass to process CSS
# gem "sassc-rails"

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem 'devise'
gem 'devise-two-factor', '~> 5.0'
gem 'rqrcode', '~> 2.2'
gem 'omniauth-google-oauth2'
gem 'omniauth-linkedin-oauth2', '~> 1.0'
gem 'omniauth-rails_csrf_protection' # CSRF protection for OmniAuth
gem 'image_processing', '~> 1.2'

# Active Storage S3 support (DigitalOcean Spaces)
gem 'aws-sdk-s3', '~> 1.0', require: false

# Analytics
gem 'mixpanel-ruby', '~> 2.3'

group :development, :test do
  # Use sqlite3 as the database for Active Record
  gem 'sqlite3', '~> 1.4'
  gem 'rspec-rails', '~> 6.0'
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem 'debug', platforms: %i[mri mingw x64_mingw]
  
  # TASK-022: API Documentation
  gem 'rswag-api'
  gem 'rswag-ui'
  gem 'rswag-specs'
end

gem 'pg' # Make sure this line exists

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem 'web-console'

  # Add speed badges [https://github.com/MiniProfiler/rack-mini-profiler]
  # gem "rack-mini-profiler"

  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  # gem "spring"

  # Ruby static code analyzer and formatter
  gem 'rubocop', require: false
  
  # TASK-002: Security scanning tools
  gem 'brakeman', require: false
  # gem 'bundler-audit', require: false
  
  # TASK-020: N+1 query detection
  gem 'bullet'
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem 'capybara'
  gem 'selenium-webdriver'
  gem 'webdrivers'
  
  # TASK-012: Test coverage reporting
  gem 'simplecov', require: false
  gem 'simplecov-console', require: false
  
  # TASK-023: Testing Factories
  gem 'factory_bot_rails'
end

gem 'activeadmin', '~> 3.2.0'
gem 'activeadmin_quill_editor'
gem 'active_model_serializers', '~> 0.10.15'
gem 'dotenv-rails', '~> 3.1'
gem 'faker', '~> 3.5'
gem 'jwt', '~> 3.1'
gem 'noticed', '= 2.2'
gem 'pg_search', '~> 2.3'
gem 'sassc'

# Resolve dependency conflict between selenium-webdriver (< 3.0) and caxlsx (>= 2.4)
gem 'rubyzip', '>= 2.4', '< 3.0'

# Add this line to your Gemfile
gem 'rack-cors', require: 'rack/cors'

# Rate limiting protection
gem 'rack-attack'

# TASK-009: Metrics and Observability
gem 'yabeda-rails'
gem 'yabeda-prometheus'
gem 'yabeda-puma-plugin'
gem 'yabeda-sidekiq'

# TASK-006: Error tracking with Sentry
gem 'sentry-ruby'
gem 'sentry-rails'
gem 'sentry-sidekiq'

# TASK-007: APM with Scout
gem 'scout_apm'
gem 'rackup', '~> 1.0'
gem 'rack-session', '~> 1.0'

gem "paper_trail", "~> 16.0"

# Slug management
gem 'friendly_id', '~> 5.5'

# Authorization
gem 'pundit'

# Excel Export
gem 'caxlsx'
# gem 'activeadmin_caxlsx'

gem "cpf_cnpj", "~> 1.0"

```

---

## (Config) Arquivos de ConfiguraÃ§Ã£o

### Frontend .env.example
[OK] **Encontrado:** `C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\.env.example`

### Next.js Config
[OK] **Encontrado:** `C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\next.config.js`

### Database Config
[OK] **Encontrado:** `C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\config\database.yml`

---

## (Info) RecomendaÃ§Ãµes e ObservaÃ§Ãµes

[OK] **Estrutura do projeto parece estar correta!**

